#!/usr/bin/env node
/**
 * fetch-and-attach-covers-lexicanum.mjs
 *
 * For each `book40k` WITHOUT an image:
 *   - Use the Lexicanum MediaWiki API to locate the best cover image
 *     (pageimages original → exact filename guess → page images scanning)
 *   - Upload the image to Sanity with filename "<book-slug>.jpg"
 *   - Set book.image {asset ref, alt, credit}
 *
 * CLI
 * ----
 *   --dry               : log only, no writes
 *   --limit N           : only process first N books
 *   --concurrency N     : parallelism (default 4)
 *   --only-with-lex     : only process books that have a lexicanum link
 *
 * Env (required)
 * --------------
 *   SANITY_PROJECT_ID, SANITY_DATASET, SANITY_TOKEN
 *
 * Notes
 * -----
 * - Strictly Lexicanum. No Open Library here.
 * - Follows redirects and tries exact file guesses like "File:Title.jpg" which fixes cases like Titanicus.
 */

import os from "node:os";
import crypto from "node:crypto";
import sanityClient from "@sanity/client";

// ---------- CLI ----------
const [, , ...argv] = process.argv;
let DRY = false;
let LIMIT = null;
let CONCURRENCY = 4;
let ONLY_WITH_LEX = false;

for (let i = 0; i < argv.length; i++) {
  const t = argv[i];
  if (t === "--dry") DRY = true;
  else if (t === "--limit") LIMIT = Math.max(1, Number(argv[++i]));
  else if (t === "--concurrency") CONCURRENCY = Math.max(1, Number(argv[++i]));
  else if (t === "--only-with-lex") ONLY_WITH_LEX = true;
}

// ---------- Sanity ----------
const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET = "production";
const TOKEN = process.env.SANITY_TOKEN;
if (!PROJECT_ID || !TOKEN) {
  console.error("Missing SANITY_PROJECT_ID or SANITY_TOKEN.");
  process.exit(1);
}

const client = sanityClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2025-01-01",
  token: TOKEN,
  useCdn: false,
});

// ---------- Helpers ----------
const UA = `ImperialArchiveCovers/2.0 (${os.platform()} ${os.release()})`;
const LEX_API = "https://wh40k.lexicanum.com/mediawiki/api.php";
const IMG_EXT = /\.(jpg|jpeg|png|gif|webp|tif|tiff)$/i;
const ACCEPT_WIDTH_MIN = 500;   // lower than before to catch slightly smaller originals
const PORTRAIT_MIN_AR = 1.05;   // gentle portrait bias

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const keyFor = (obj) => crypto.createHash("md5").update(JSON.stringify(obj)).digest("hex").slice(0, 12);
const withKeys = (arr = [], seed) => arr.map((x, i) => (x?._key ? x : { ...(x || {}), _key: keyFor({ seed, i, x }) }));

function slugify(s = "") {
  return String(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}
function safeSlugFromBook(book) {
  const raw = (book.slug?.current || book.slug || book.title || "").toString().replace(/^\//, "");
  return raw ? slugify(raw) : slugify(book.title || "");
}
function pickAlt(title) {
  return `${title} cover`;
}
function stripHtml(s = "") {
  return String(s).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
function hasLexLink(book) {
  return Array.isArray(book.links)
    ? book.links.some((l) => l?.type === "lexicanum" && /lexicanum\.com\/wiki\//i.test(l?.url || ""))
    : false;
}
function getLexUrlFromBook(book) {
  const links = Array.isArray(book.links) ? book.links : [];
  const lexLinks = links
    .filter((l) => l?.type === "lexicanum" && /lexicanum\.com\/wiki\//i.test(l?.url || ""))
    .map((l) => l.url);
  return lexLinks[0] || null;
}
function titleFromLexUrl(u) {
  try {
    const url = new URL(u);
    const seg = url.pathname.split("/wiki/")[1];
    return seg ? decodeURIComponent(seg) : null;
  } catch { return null; }
}
function baseTitleFromPageTitle(pageTitle = "") {
  // Remove parenthetical suffix like "(Novel)" → "Titanicus"
  return String(pageTitle).replace(/_/g, " ").replace(/\s*\([^)]*\)\s*$/, "").trim();
}
async function fetchJSON(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// ---------- MediaWiki calls ----------
async function mwPageImagesOriginal(pageTitle) {
  const url = `${LEX_API}?action=query&format=json&formatversion=2&redirects=1&prop=pageimages&piprop=original|name&titles=${encodeURIComponent(
    pageTitle
  )}`;
  const data = await fetchJSON(url);
  const page = data?.query?.pages?.[0];
  if (!page?.original?.source) return null;

  // Try to get extmetadata via imageinfo for the pageimage if present
  const pageimageName = page?.pageimage ? (page.pageimage.startsWith("File:") ? page.pageimage : `File:${page.pageimage}`) : null;
  let artist = "";
  let license = "";
  if (pageimageName) {
    const ii = await mwImageInfo([pageimageName]);
    const meta = ii.find((x) => x.title === pageimageName);
    if (meta) {
      artist = meta.artist || "";
      license = meta.license || "";
    }
  }
  return {
    url: page.original.source,
    width: page.original.width || 0,
    height: page.original.height || 0,
    mime: "image/jpeg",
    artist,
    license,
  };
}

async function mwListPageImages(pageTitle) {
  const url = `${LEX_API}?action=query&format=json&formatversion=2&redirects=1&prop=images|pageimages&piprop=name&titles=${encodeURIComponent(
    pageTitle
  )}`;
  const data = await fetchJSON(url);
  const page = data?.query?.pages?.[0];
  const imgs = Array.isArray(page?.images) ? page.images.map((i) => i?.title).filter(Boolean) : [];
  const pi = page?.pageimage ? (page.pageimage.startsWith("File:") ? page.pageimage : `File:${page.pageimage}`) : null;
  const set = new Set(imgs.concat(pi ? [pi] : []));
  return Array.from(set).filter((f) => IMG_EXT.test(f || ""));
}

async function mwSearchFileByTitleGuesses(guesses = []) {
  // Turn raw guesses (e.g., "Titanicus.jpg") into File: titles and query with imageinfo
  const titles = guesses
    .map((g) => (g.startsWith("File:") ? g : `File:${g}`))
    .filter((t) => IMG_EXT.test(t));
  if (!titles.length) return [];
  return mwImageInfo(titles);
}

async function mwImageInfo(fileTitles = []) {
  if (!fileTitles.length) return [];
  const CHUNK = 25;
  const out = [];
  for (let i = 0; i < fileTitles.length; i += CHUNK) {
    const chunk = fileTitles.slice(i, i + CHUNK);
    const url = `${LEX_API}?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url|size|mime|extmetadata&titles=${encodeURIComponent(
      chunk.join("|")
    )}`;
    const data = await fetchJSON(url);
    const pages = data?.query?.pages || [];
    for (const p of pages) {
      const ii = p?.imageinfo?.[0];
      if (!ii?.url) continue;
      const em = ii.extmetadata || {};
      out.push({
        title: p?.title,
        url: ii.url,
        width: ii.width || 0,
        height: ii.height || 0,
        mime: ii.mime || "image/jpeg",
        artist: (em.Artist && stripHtml(em.Artist.value)) || "",
        license: em.LicenseShortName?.value || em.License?.value || "",
      });
    }
  }
  return out;
}

// ---------- Candidate selection ----------
function scoreCandidate(info, baseTitle) {
  const fname = (info.title || "").replace(/^File:/i, "");
  const titleLower = baseTitle.toLowerCase();
  const nameLower = fname.toLowerCase();

  let s = 0;

  // strong boosts
  if (nameLower === `${titleLower}.jpg` || nameLower === `${titleLower}.png`) s += 50; // exact match
  if (/cover/.test(nameLower)) s += 15;

  // portrait preference
  const ar = (info.height || 0) / Math.max(1, info.width || 1);
  if (ar >= PORTRAIT_MIN_AR) s += 10;

  // decent resolution
  if (info.width >= ACCEPT_WIDTH_MIN) s += 5;

  // weaker boosts for partial name matches
  if (nameLower.includes(titleLower)) s += 6;

  // slight bumps if common book-ish words appear
  if (/\b(novel|novella|anthology|omnibus)\b/i.test(nameLower)) s += 3;

  // penalties for obvious non-covers
  const deny = /(icon|logo|banner|symbol|aquila|map|seal|stamp|glyph|insignia|scroll|placeholder|avatar|emoji|button|codex)/i;
  if (deny.test(nameLower)) s -= 100;

  return s;
}

function buildCredit(info) {
  const bits = [];
  if (info?.artist) bits.push(`Artist: ${info.artist}`);
  if (info?.license) bits.push(`License: ${info.license}`);
  bits.push("Source: Lexicanum");
  return bits.join("; ");
}

// Core resolver for one lex page title
async function resolveCoverFromLexPageTitle(pageTitle, bookTitle) {
  const baseTitle = baseTitleFromPageTitle(pageTitle);

  // 1) Try pageimages original (fast path)
  const orig = await mwPageImagesOriginal(pageTitle).catch(() => null);
  if (orig?.url && orig.width >= 1) {
    return {
      url: orig.url,
      width: orig.width,
      height: orig.height,
      mime: orig.mime || "image/jpeg",
      credit: buildCredit(orig),
    };
  }

  // 2) Try exact filename guesses first (fixes cases like Titanicus.jpg)
  const guesses = [
    `${baseTitle}.jpg`,
    `${baseTitle}.png`,
    `${baseTitle.replace(/\s+/g, "_")}.jpg`,
    `${baseTitle.replace(/\s+/g, "_")}.png`,
  ];
  const exacts = await mwSearchFileByTitleGuesses(guesses);
  const exactPick = exacts
    .filter((x) => x.width >= 1)
    .sort((a, b) => scoreCandidate(b, baseTitle) - scoreCandidate(a, baseTitle))[0];
  if (exacts.length && exactPick) {
    return {
      url: exactPick.url,
      width: exactPick.width,
      height: exactPick.height,
      mime: exactPick.mime || "image/jpeg",
      credit: buildCredit(exactPick),
    };
  }

  // 3) List all images on the page → fetch imageinfo → score
  const files = await mwListPageImages(pageTitle);
  if (!files.length) return null;

  const infos = await mwImageInfo(files);
  const scored = infos
    .filter((x) => x.width >= 1)
    .map((x) => ({ x, score: scoreCandidate(x, baseTitle) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.x || null;
  if (!best) return null;

  return {
    url: best.url,
    width: best.width,
    height: best.height,
    mime: best.mime || "image/jpeg",
    credit: buildCredit(best),
  };
}

// Master resolver for a book
async function resolveCoverForBook(book) {
  // Prefer lex link from your data
  const link = getLexUrlFromBook(book);
  const candidates = [];

  if (link) {
    const page = titleFromLexUrl(link);
    if (page) candidates.push(page);
  }

  // Also consider common format suffixes if the main page didn’t work
  const t = (book.title || "").trim();
  const suffixes = ["", " (Novel)", " (Novella)", " (Anthology)", " (Omnibus)", " (Short Story)", " (Audio Drama)"];
  for (const s of suffixes) {
    const pt = `${t}${s}`.replace(/\s/g, "_");
    if (!candidates.includes(pt)) candidates.push(pt);
  }

  // Try each candidate until one yields an image
  for (const pageTitle of candidates) {
    const hit = await resolveCoverFromLexPageTitle(pageTitle, t);
    if (hit?.url) return hit;
  }
  return null;
}

// ---------- Sanity ops ----------
async function uploadImage(buffer, filename, contentType) {
  return client.assets.upload("image", buffer, { filename, contentType });
}
async function patchBookWithImage(book, assetDoc, alt, credit) {
  const patch = {
    image: {
      _type: "image",
      asset: { _type: "reference", _ref: assetDoc._id },
      alt,
      credit,
    },
  };
  if (DRY) {
    console.log(`[dry] patch ${book._id} (with asset)`);
    return;
  }
  await client.patch(book._id).set(patch).commit();
}

// ---------- main ----------
async function main() {
  // Only books without an image (safe)
  let q = `*[_type == "book40k" && !defined(image.asset)]{
    _id, title, slug, format, links
  }`;

  if (ONLY_WITH_LEX) {
    q = `*[_type == "book40k" && !defined(image.asset) && links[ type == "lexicanum" && url match "*lexicanum.com/wiki/*" ] ]{
      _id, title, slug, format, links
    }`;
  }

  const books = await client.fetch(q);
  const list = LIMIT ? books.slice(0, LIMIT) : books;

  console.log(`Books missing image: ${books.length} (processing ${list.length})`);

  let idx = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, list.length) }).map(async () => {
    while (true) {
      const i = idx++;
      if (i >= list.length) return;
      const book = list[i];

      try {
        if (ONLY_WITH_LEX && !hasLexLink(book)) {
          console.log(`[skip] no lex link: ${book.title}`);
          continue;
        }

        const found = await resolveCoverForBook(book);
        if (!found?.url) {
          console.log(`[-] No image found: ${book.title}`);
          continue;
        }

        // Fetch the binary
        const res = await fetch(found.url, { headers: { "User-Agent": UA } });
        if (!res.ok) {
          console.log(`[-] Download failed (${res.status}): ${book.title}`);
          continue;
        }
        const buffer = Buffer.from(await res.arrayBuffer());

        const filename = `${safeSlugFromBook(book)}.jpg`;
        if (DRY) {
          console.log(`[dry] would upload ${filename} ← ${found.url}`);
        } else {
          const asset = await uploadImage(buffer, filename, found.mime || "image/jpeg");
          await patchBookWithImage(book, asset, pickAlt(book.title), found.credit || "Source: Lexicanum");
          console.log(`[+] Uploaded: ${book.title} → ${filename}`);
        }

        await sleep(100);
      } catch (e) {
        console.warn(`Error on "${book.title}": ${e.message}`);
        await sleep(200);
      }
    }
  });

  await Promise.all(workers);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
