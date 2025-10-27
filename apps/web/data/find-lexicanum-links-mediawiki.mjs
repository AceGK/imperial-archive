#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Find missing Lexicanum links using the MediaWiki Action API (no API keys).
 * Accept only URLs like:
 *   https://wh40k.lexicanum.com/wiki/Title_(Novel|Novella|Anthology|Omnibus|Short_Story|Audio_Drama|Graphic_Novel)
 *
 * Usage (from apps\web\data):
 *   node .\find-lexicanum-links-mediawiki.mjs --in .\40k-books.json --out .\40k-books.with-lex.json --cache .\lexi-cache.json
 *
 * Optional flags:
 *   --start N --limit N
 *   --rate-ms 2500        # delay between lookups
 *   --timeout-ms 15000     # per-request timeout
 *   --retries 3            # network retries
 *   --disable-search       # skip API search; try direct title_(Type) only
 *   --dry                  # don’t write output
 */

import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg, i, arr) => {
    if (!arg.startsWith("--")) return [arg, true];
    const k = arg.slice(2);
    const v = arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true;
    return [k, v];
  })
);

const inputPath   = args.in;
const outputPath  = args.out;
const startIdx    = Number.isFinite(Number(args.start)) ? Number(args.start) : 0;
const limit       = args.limit === true ? Infinity : Number(args.limit ?? Infinity);
const rateMs      = Number.isFinite(Number(args["rate-ms"])) ? Number(args["rate-ms"]) : 2500;
const timeoutMs   = Number.isFinite(Number(args["timeout-ms"])) ? Number(args["timeout-ms"]) : 15000;
const retries     = Number.isFinite(Number(args["retries"])) ? Number(args["retries"]) : 3;
const disableSearch = Boolean(args["disable-search"]);
const dryRun      = Boolean(args.dry);
const cachePath   = args.cache && args.cache !== true ? String(args.cache) : null;

if (!inputPath || !outputPath) {
  console.error("Usage: node find-lexicanum-links-mediawiki.mjs --in <input.json> --out <output.json> [--cache file] [--start N] [--limit N] [--rate-ms N] [--timeout-ms N] [--retries N] [--disable-search] [--dry]");
  process.exit(1);
}

const UA = "Mozilla/5.0 (compatible; LexiMWBot/1.0; +https://example.invalid/info)";
const MW_API = "https://wh40k.lexicanum.com/mediawiki/api.php";
const ALLOWED_TYPES = new Set([
  "Novel","Novella","Anthology","Omnibus","Short_Story","Audio_Drama","Graphic_Novel",
]);

function norm(s){ return (s ?? "").toString().trim(); }
function arr(x){ return Array.isArray(x) ? x : x ? [x] : []; }
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

function ensureLinks(rec){
  if (!Array.isArray(rec.links)) rec.links = [];
  rec.links = rec.links
    .filter((l)=>l && typeof l === "object" && l.url)
    .map((l)=>({ type: l.type ? String(l.type).trim() : undefined, url: String(l.url).trim() }));
}
function isProperLexUrl(url){
  const m = /^https?:\/\/wh40k\.lexicanum\.com\/wiki\/.+\(([^)]+)\)$/i.exec(url || "");
  return !!(m && ALLOWED_TYPES.has(m[1]));
}
function hasProperLexicanumLink(rec){
  const links = Array.isArray(rec.links) ? rec.links : [];
  return links.some((l)=>isProperLexUrl(l.url));
}
function addLexLink(rec, url){
  ensureLinks(rec);
  if (!rec.links.some((l)=>l.url === url)) rec.links.push({ type: "lexicanum", url });
}
function slugifyForWiki(title){
  return norm(title).replace(/\s+/g, "_").replace(/[–—]/g, "-").replace(/%/g, "%25");
}

// Simple JSON cache (title -> url or "__MISS__")
let CACHE = {};
if (cachePath && fs.existsSync(cachePath)) {
  try { CACHE = JSON.parse(fs.readFileSync(cachePath, "utf-8")); } catch {}
}
function cacheGet(t){ return CACHE[t]; }
function cacheSet(t,v){ CACHE[t]=v; }
function cacheSave(){ if (cachePath) fs.writeFileSync(cachePath, JSON.stringify(CACHE, null, 2), "utf-8"); }

// fetch with timeout + retries
async function fetchWithTimeout(url, init={}, attempt=0){
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), timeoutMs);
  try{
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, ...(init.headers||{}) },
      redirect: "follow",
      signal: controller.signal
    });
    return res;
  } catch (e){
    if (attempt < retries){
      const backoff = Math.min(1000 * Math.pow(2, attempt), 8000) + Math.floor(Math.random()*250);
      await sleep(backoff);
      return fetchWithTimeout(url, init, attempt+1);
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}

// MediaWiki: check a specific title exists; return canonical url or null
async function mwGetCanonicalUrl(title){
  const u = new URL(MW_API);
  u.searchParams.set("action","query");
  u.searchParams.set("prop","info");
  u.searchParams.set("inprop","url");
  u.searchParams.set("redirects","1");
  u.searchParams.set("format","json");
  u.searchParams.set("titles", title);

  const res = await fetchWithTimeout(u.toString(), { method:"GET" });
  if (!res.ok) return null;
  const data = await res.json().catch(()=>null);
  if (!data || !data.query || !data.query.pages) return null;
  const pages = Object.values(data.query.pages);
  if (!pages.length) return null;
  const p = pages[0];
  if (p.missing === "" || p.invalid === "") return null;
  const url = p.canonicalurl || p.fullurl;
  return isProperLexUrl(url) ? url : null;
}

// MediaWiki search (no key): use "search" list, then filter to allowed suffix
async function mwSearchOne(title, author){
  const q1 = `"${title}"`;
  for (const query of [q1, author ? `${q1} ${author}` : null, title].filter(Boolean)){
    const u = new URL(MW_API);
    u.searchParams.set("action","query");
    u.searchParams.set("list","search");
    u.searchParams.set("srsearch", query);
    u.searchParams.set("srlimit","10");
    u.searchParams.set("format","json");

    const res = await fetchWithTimeout(u.toString(), { method:"GET" });
    if (!res.ok) continue;
    const data = await res.json().catch(()=>null);
    const hits = data?.query?.search || [];
    for (const h of hits){
      const m = /\(([^)]+)\)$/.exec(h.title);
      if (!m || !ALLOWED_TYPES.has(m[1])) continue;
      // Resolve canonical URL for the hit (respects redirects/norm)
      const url = await mwGetCanonicalUrl(h.title);
      if (url) return url;
      await sleep(150);
    }
    await sleep(300);
  }
  return null;
}

async function tryDirectLexCandidates(title){
  const core = slugifyForWiki(title);
  const bases = [core];
  if (title.includes(":")){
    const first = slugifyForWiki(title.split(":")[0]);
    if (first && first !== core) bases.push(first);
  }
  for (const b of bases){
    for (const typ of ALLOWED_TYPES){
      const pageTitle = `${b}_(${typ})`.replace(/%25/g, "%"); // MW expects raw % in titles
      const url = await mwGetCanonicalUrl(pageTitle);
      if (url) return url;
      await sleep(150);
    }
  }
  return null;
}

async function main(){
  const raw = fs.readFileSync(path.resolve(process.cwd(), inputPath), "utf-8");
  const books = JSON.parse(raw);

  const end = Math.min(books.length, startIdx + (Number.isFinite(limit) ? limit : books.length));
  let attempted = 0, added = 0, skipped = 0;

  for (let i=startIdx; i<end; i++){
    const rec = books[i];
    ensureLinks(rec);
    const title = norm(rec.title);
    const authors = arr(rec.author).map(norm).filter(Boolean);
    if (!title) continue;

    if (hasProperLexicanumLink(rec)) { skipped++; continue; }

    const cached = cacheGet(title);
    if (typeof cached === "string"){ addLexLink(rec, cached); added++; console.log(`[CACHE HIT] ${title} -> ${cached}`); continue; }
    if (cached === "__MISS__"){ console.log(`[CACHE MISS] ${title}`); continue; }

    attempted++;

    // 1) Direct title_(Type) via MW API
    let url = await tryDirectLexCandidates(title);

    // 2) MW search fallback (still no key)
    if (!url && !disableSearch){
      await sleep(rateMs);
      url = await mwSearchOne(title, authors[0] || "");
    }

    if (url){
      addLexLink(rec, url);
      cacheSet(title, url);
      added++;
      console.log(`[+LEX] ${title} -> ${url}`);
    } else {
      cacheSet(title, "__MISS__");
      console.log(`[MISS] ${title}`);
    }

    cacheSave();
    await sleep(rateMs);
  }

  console.log(`\nProcessed ${end - startIdx} records.`);
  console.log(`Already had proper link: ${skipped}`);
  console.log(`Attempted: ${attempted}`);
  console.log(`Added: ${added}`);

  if (!dryRun){
    fs.writeFileSync(path.resolve(process.cwd(), outputPath), JSON.stringify(books, null, 2), "utf-8");
    console.log(`\nWrote: ${path.resolve(process.cwd(), outputPath)}`);
  } else {
    console.log(`\nDry run only.`);
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });
