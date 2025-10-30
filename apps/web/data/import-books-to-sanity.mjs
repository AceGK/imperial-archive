#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sanityClient from "@sanity/client";

/** -------- CLI -------- */
const [, , inputPathArg, ...rest] = process.argv;
if (!inputPathArg) {
  console.error("Usage: SANITY_... node import-books-to-sanity.mjs <path-to-40k-books.json> [--dry] [--series] [--batch 25] [--create-missing]");
  process.exit(1);
}
let DRY = false;
let DO_SERIES = true;
let BATCH_SIZE = 25;
let CREATE_MISSING = false; // default: link-only; do not create refs
for (let i = 0; i < rest.length; i++) {
  const t = rest[i];
  if (t === "--dry") DRY = true;
  else if (t === "--series") DO_SERIES = true;
  else if (t === "--no-series") DO_SERIES = false;
  else if (t === "--batch") BATCH_SIZE = Math.max(1, Number(rest[++i]) || BATCH_SIZE);
  else if (t === "--create-missing") CREATE_MISSING = true;
}

/** -------- Sanity client -------- */
/* ⚠️ Consider moving secrets to env vars and revoking any hardcoded token. */
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

/** -------- utils -------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slugify = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

const toSanityDate = (x) => {
  if (!x) return undefined;
  const s = String(x).trim();
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3] === "00" ? "01" : m[3]}`;
  return undefined;
};
const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const unique = (a) => Array.from(new Set(a.filter(Boolean)));
const keyFor = (obj) => crypto.createHash("md5").update(JSON.stringify(obj)).digest("hex").slice(0, 12);

/** Give every array item a unique _key (stable-ish for re-runs). */
function withKeys(items, seed) {
  return (items || []).map((it, i) => {
    if (it && typeof it === "object" && it._key) return it;
    return { ...(it || {}), _key: keyFor({ seed, i, it }) };
  });
}

/** -------- reporting (missing refs) -------- */
const missingReport = {
  authors: new Set(),
  eras: new Set(),
  factions: new Set(),
  series: new Set(),
};
function noteMissing(kind, name) {
  missingReport[kind]?.add(String(name));
}

/** -------- find-or-create helpers (create optional) -------- */
async function findDocByTitleOrSlug(type, title) {
  const s = slugify(title);
  const query = `*[_type == $type && (slug.current == $slug || title == $title)][0]{_id}`;
  return client.fetch(query, { type, slug: s, title });
}
async function upsertDocByTitle(type, title) {
  const s = slugify(title);
  const id = `${type}.${s}`;
  const doc = { _id: id, _type: type, title, slug: { _type: "slug", current: s } };
  if (DRY) return { _id: id, _type: type };
  await client.transaction().createIfNotExists(doc).commit();
  return { _id: id, _type: type };
}

/** If CREATE_MISSING=false, only link existing; otherwise create when absent. */
async function resolveRef(type, name, missingKind) {
  if (!name) return undefined;
  const found = await findDocByTitleOrSlug(type, name);
  if (found?._id) return { _type: "reference", _ref: found._id };
  if (CREATE_MISSING) {
    const created = await upsertDocByTitle(type, name);
    return { _type: "reference", _ref: created._id };
  }
  noteMissing(missingKind, name);
  return undefined;
}
async function resolveRefs(type, names, missingKind) {
  const out = [];
  for (const n of unique(arr(names))) {
    const ref = await resolveRef(type, n, missingKind);
    if (ref) out.push(ref);
  }
  return out;
}

/** -------- domain resolvers -------- */
const resolveAuthors = (names = []) => resolveRefs("author40k", names, "authors");
const resolveEra = (name) => resolveRef("era40k", name, "eras");
const resolveFactions = (names = []) => resolveRefs("faction40k", names, "factions");

/** For series we need ids & numbers for optional membership update */
async function resolveSeriesReturnIds(seriesArr = []) {
  const out = [];
  for (const s of arr(seriesArr)) {
    if (!s?.name) continue;
    const found = await findDocByTitleOrSlug("series40k", s.name);
    if (found?._id) out.push({ seriesId: found._id, number: s.number ?? undefined, name: s.name });
    else if (CREATE_MISSING) {
      const created = await upsertDocByTitle("series40k", s.name);
      out.push({ seriesId: created._id, number: s.number ?? undefined, name: s.name });
    } else {
      noteMissing("series", s.name);
    }
  }
  return out;
}

/** -------- series updater -------- */
async function addBookToSeriesItems(seriesId, bookRefId, number) {
  if (!seriesId) return;
  const series = await client.getDocument(seriesId);
  if (!series) return;
  const items = Array.isArray(series?.items) ? [...series.items] : [];
  const already = items.find((it) => it?.work?._ref === bookRefId);
  if (already) {
    if (typeof number === "number" && already.number !== number && !DRY) {
      already.number = number;
      await client.patch(seriesId).set({ items }).commit();
    }
    return;
  }
  const newItem = { _key: keyFor({ bookRefId, number }), work: { _type: "reference", _ref: bookRefId } };
  if (typeof number === "number") newItem.number = number;
  if (!DRY) await client.patch(seriesId).set({ items: [...items, newItem] }).commit();
}

/** -------- main import -------- */
async function main() {
  const inputPath = path.resolve(process.cwd(), inputPathArg);
  const raw = await fs.readFile(inputPath, "utf8");
  const data = JSON.parse(raw);
  const books = Array.isArray(data) ? data : Array.isArray(data?.books) ? data.books : null;
  if (!Array.isArray(books)) {
    console.error("Expected an array or an object with a 'books' array.");
    process.exit(1);
  }

  console.log(`Found ${books.length} book(s). Starting import…${DRY ? " (dry run)" : ""}`);
  console.log(`Create missing refs: ${CREATE_MISSING ? "YES" : "NO (link-only)"}`);

  const ops = [];

  for (const src of books) {
    const title = src.title?.trim();
    if (!title) continue;
    const slugStr = (src.slug || "").replace(/^\//, "") || slugify(title);

    // Resolve refs (may be empty/undefined if not found and not creating)
    const authorsRefs  = await resolveAuthors(src.author || src.authors || []);
    const eraRef       = await resolveEra(src.era);
    const factionRefs  = await resolveFactions(src.factions || []);

    // Coerce arrays to the shapes your schema expects
    const editions = arr(src.editions)
      .map((e) => ({ _type: "edition", isbn: e?.isbn ? String(e.isbn).trim() : "", ...(e?.note ? { note: String(e.note) } : {}) }))
      .filter((e) => e.isbn);

    const links = arr(src.links)
      .map((l) => ({ _type: "bookLink", type: String(l?.type || "").trim(), url: String(l?.url || "").trim() }))
      .filter((l) => l.url);

    // ➜ Add _key to all arrays written to Sanity
    const authorsKeyed  = withKeys(authorsRefs,  `authors-${title}-${src.id ?? ""}`);
    const factionsKeyed = withKeys(factionRefs,  `factions-${title}-${src.id ?? ""}`);
    const linksKeyed    = withKeys(links,        `links-${title}-${src.id ?? ""}`);
    const editionsKeyed = withKeys(editions,     `editions-${title}-${src.id ?? ""}`);

    const publicationDate = toSanityDate(src.publication_date || src.publicationDate);
    const pageCount =
      typeof src.page_count === "number" ? src.page_count : typeof src.pageCount === "number" ? src.pageCount : undefined;

    const bookId = `book40k.${slugify(`${title}-${src.id ?? ""}`)}`;
    const bookDoc = {
      _id: bookId,
      _type: "book40k",
      title,
      slug: { _type: "slug", current: slugStr },
      authors: authorsKeyed,                 // ← has _key
      format: (src.format || "novel").toLowerCase(),
      era: eraRef,                           // ref or undefined
      factions: factionsKeyed,               // ← has _key
      links: linksKeyed,                     // ← has _key
      description: src.description || "",
      story: src.story || "",
      publicationDate,
      pageCount,
      editions: editionsKeyed,               // ← has _key
    };

    if (DRY) {
      console.log(`[dry] upsert`, bookDoc._id, `(${title})`);
    } else {
      ops.push({ createIfNotExists: { ...bookDoc } });
      ops.push({ patch: { id: bookDoc._id, set: bookDoc } });
    }

    if (DO_SERIES && Array.isArray(src.series) && src.series.length) {
      const seriesInfo = await resolveSeriesReturnIds(src.series);
      for (const s of seriesInfo) {
        if (DRY) console.log(`[dry] add to series`, s.name, `→`, bookDoc._id, s.number ?? "");
        else ops.push({ _postSeries: { seriesId: s.seriesId, bookRefId: bookDoc._id, number: s.number } });
      }
    }
  }

  if (!DRY) {
    let buffer = [];
    const postSeries = [];
    for (const op of ops) {
      if (op._postSeries) postSeries.push(op._postSeries);
      else {
        buffer.push(op);
        if (buffer.length >= BATCH_SIZE) {
          await client.transaction(buffer).commit();
          buffer = [];
          await sleep(150);
        }
      }
    }
    if (buffer.length) {
      await client.transaction(buffer).commit();
      await sleep(150);
    }
    for (const s of postSeries) {
      await addBookToSeriesItems(s.seriesId, s.bookRefId, s.number);
      await sleep(75);
    }
  }

  // Missing refs report
  const outMissing = {
    authors: Array.from(missingReport.authors).sort(),
    eras: Array.from(missingReport.eras).sort(),
    factions: Array.from(missingReport.factions).sort(),
    series: Array.from(missingReport.series).sort(),
  };
  const reportPath = inputPath.replace(/\.json$/i, `.missing-refs.json`);
  await fs.writeFile(reportPath, JSON.stringify(outMissing, null, 2), "utf8");
  console.log(`Missing refs report → ${reportPath}`);

  console.log(`Done. ${DRY ? "(dry run; no writes performed)" : "All documents upserted."}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
