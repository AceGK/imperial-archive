import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

/** ---------- Zod Schemas (tolerant to legacy-ish data) ---------- */

/** Raw series entry as it might appear in JSON (number could be string/null/etc.) */
const SeriesEntryRawZ = z.object({
  name: z.string(),
  number: z.union([z.number(), z.string(), z.null(), z.undefined()]).optional().nullable(),
});

/** Normalize any series-like input into Array<{name:string; number:number|null}> */
const SeriesZ = z
  .union([
    z.array(SeriesEntryRawZ),
    z.array(z.string()),
    SeriesEntryRawZ,
    z.string(),
    z.null(),
    z.undefined(),
  ])
  .transform((val): Array<{ name: string; number: number | null }> => {
    const toNum = (v: unknown): number | null => {
      if (v === undefined || v === null || v === "") return null;
      if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : null;
      if (typeof v === "string") {
        const n = parseInt(v.replace(/[^\d-]/g, ""), 10);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };

    if (!val) return [];
    if (Array.isArray(val)) {
      if (val.length === 0) return [];
      if (typeof val[0] === "string") {
        return (val as string[]).map((s) => ({ name: s, number: null }));
      }
      return (val as Array<z.infer<typeof SeriesEntryRawZ>>).map((e) => ({
        name: e.name,
        number: toNum(e.number),
      }));
    }
    if (typeof val === "string") return [{ name: val, number: null }];

    const e = val as z.infer<typeof SeriesEntryRawZ>;
    return [{ name: e.name, number: toNum(e.number) }];
  });

const EditionZ = z.object({
  isbn: z.string(),
  note: z.string().optional().nullable(),
});

const LinkZ = z.object({
  type: z.string(),
  url: z.string().url(),
});

const FormatZ = z.preprocess((v) => {
  if (Array.isArray(v)) v = v[0];
  if (typeof v !== "string") return v;

  const raw = v.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const map: Record<string, string> = {
    shortstory: "short_story",
    short_story: "short_story",
    audio: "audio_drama",
    audio_drama: "audio_drama",
    anthology: "anthology",
    omnibus: "omnibus",
    graphic_novel: "graphic_novel",
    novel: "novel",
    novella: "novella",
    other: "other",
  };
  return map[raw] ?? raw;
}, z.union([
  z.literal("novel"),
  z.literal("novella"),
  z.literal("short_story"),
  z.literal("audio_drama"),
  z.literal("anthology"),
  z.literal("audio_anthology"),
  z.literal("omnibus"),
  z.literal("graphic_novel"),
  z.literal("other"),
]).optional().nullable());

const BookInputZ = z
  .object({
    id: z.number(),
    title: z.string(),
    slug: z.string(),

    // tolerate author/authors
    author: z.array(z.string()).or(z.string().transform((s) => [s])).optional(),
    authors: z.array(z.string()).or(z.string().transform((s) => [s])).optional(),

    tags: z.array(z.string()).or(z.string().transform((s) => [s])).optional(),

    release_date: z.string().optional().nullable(),
    publication_date: z.string().optional().nullable(),

    series: SeriesZ,
    series_number: z.preprocess((v) => {
      if (v === undefined || v === null || v === "") return null;
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const n = parseInt(v.replace(/[^\d-]/g, ""), 10);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    }, z.number().optional().nullable()),

    era: z.string().optional().nullable(),

    links: z.array(LinkZ).optional().nullable(),
    description: z.string().optional().nullable(),
    story: z.string().optional().nullable(),

    format: FormatZ,

    editions: z.array(EditionZ).optional().nullable(),
    isbn: z.string().optional().nullable(),

    page_count: z.preprocess((v) => {
      if (v === undefined || v === null || v === "") return null;
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const n = parseInt(v.replace(/[^\d-]/g, ""), 10);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    }, z.number().int().gte(1).optional().nullable()),

    factions: z.array(z.string()).optional().nullable(),
    editor: z.array(z.string()).optional().nullable(),
  })
  .passthrough();

export type RawBook = z.infer<typeof BookInputZ>;

/** ---------- Normalized Runtime Types ---------- */

export interface SeriesMembership {
  name: string;
  number: number | null;
}
export interface Edition {
  isbn: string;
  note?: string | null;
}
export interface Link {
  type: string;
  url: string;
}
export interface Book {
  id: number;
  title: string;
  slug: string;
  author: string[];
  releaseDate?: string;
  year?: string;
  series: SeriesMembership[];
  era?: string | null;
  links: Link[];
  description?: string | null;
  story?: string | null;
  format?: BookFormat | null;
  editions: Edition[];
  page_count?: number | null;
  factions: string[];
  editor?: string[];
}

export type BookFormat =
  | "novel"
  | "novella"
  | "short_story"
  | "audio_drama"
  | "anthology"
  | "audio_anthology"
  | "omnibus"
  | "graphic_novel"
  | "other";

/** ---------- IO ---------- */

const DATA_FILE = path.join(process.cwd(), "data", "40k-books.json");

/** ---------- Helpers ---------- */

const stripLeadingSlash = (s: string) => s.replace(/^\/+/, "");
const norm = (s: string) => s.trim().toLowerCase();

function bestReleaseDate(b: RawBook): string | undefined {
  const d = b.release_date ?? b.publication_date ?? undefined;
  return d && d.trim() ? d.trim() : undefined;
}

function bestYear(b: RawBook): string | undefined {
  const d = bestReleaseDate(b);
  return d && /^\d{4}/.test(d) ? d.slice(0, 4) : undefined;
}

function normalizeEditions(b: RawBook): Edition[] {
  if (Array.isArray(b.editions) && b.editions.length > 0) {
    return b.editions
      .filter((e): e is Edition => !!e?.isbn)
      .map((e) => ({ isbn: e.isbn, note: e.note ?? null }));
  }
  if (b.isbn && b.isbn.trim()) return [{ isbn: b.isbn.trim(), note: null }];
  return [];
}

function normalizeLinks(b: RawBook): Link[] {
  if (!b.links) return [];
  return b.links.filter((l): l is Link => !!l?.url && !!l?.type);
}

function normalizeFactions(b: RawBook): string[] {
  const src = Array.isArray(b.factions) ? b.factions : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of src) {
    const n = (f ?? "").trim();
    if (!n) continue;
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

function normalizeBook(input: unknown): Book {
  const p = BookInputZ.parse(input);

  // Merge author/authors, preferring `author` if present & non-empty
  const authorArr: string[] =
    p.author && p.author.length > 0 ? p.author : (p.authors ?? []);

  const series: SeriesMembership[] = (p.series as Array<{ name: string; number: number | null }>).map(
    (s: { name: string; number: number | null }) => ({
      name: s.name,
      number: s.number ?? null,
    })
  );

  return {
    id: p.id,
    title: p.title,
    slug: stripLeadingSlash(p.slug),
    author: authorArr,

    releaseDate: bestReleaseDate(p),
    year: bestYear(p),

    series,
    era: p.era ?? null,
    links: normalizeLinks(p),
    description: p.description ?? null,
    story: p.story ?? null,

    format: p.format ?? null,
    editions: normalizeEditions(p),
    page_count: typeof p.page_count === "number" ? p.page_count : null,

    factions: normalizeFactions(p),

    editor: Array.isArray(p.editor) ? p.editor : [],
  };
}

/** ---------- Caches & Indexes ---------- */

let _all: Book[] | null = null;
const _bySlug = new Map<string, Book>();
const _byAuthor = new Map<string, Book[]>();
const _byTag = new Map<string, Book[]>();
const _byYear = new Map<string, Book[]>();
const _bySeries = new Map<string, Book[]>();
const _byFaction = new Map<string, Book[]>();
const _byEra = new Map<string, Book[]>();
const _byFormat = new Map<string, Book[]>();

function pushMapArray<K, V>(map: Map<K, V[]>, key: K, v: V) {
  const arr = map.get(key) ?? [];
  arr.push(v);
  map.set(key, arr);
}

function indexAll(books: Book[]) {
  _bySlug.clear();
  _byAuthor.clear();
  _byTag.clear();
  _byYear.clear();
  _bySeries.clear();
  _byFaction.clear();
  _byEra.clear();
  _byFormat.clear();

  for (const b of books) {
    _bySlug.set(b.slug, b);
    b.author.forEach((a: string) => pushMapArray(_byAuthor, norm(a), b));
    if (b.year) pushMapArray(_byYear, b.year, b);
    b.series.forEach((s: SeriesMembership) => pushMapArray(_bySeries, norm(s.name), b));
    b.factions.forEach((f: string) => pushMapArray(_byFaction, norm(f), b));
    if (b.era) pushMapArray(_byEra, norm(b.era), b);
    if (b.format) pushMapArray(_byFormat, b.format, b);
  }
}

/** ---------- Public API ---------- */

export function getAllBooks(): Book[] {
  if (_all) return _all;
  const rawArr = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as unknown[];
  const parsed = rawArr.map((x: unknown) => normalizeBook(x));
  _all = parsed;
  indexAll(parsed);
  return _all;
}

export function getBookBySlug(slug: string): Book | null {
  getAllBooks();
  return _bySlug.get(stripLeadingSlash(slug)) ?? null;
}

export function getBooksByAuthor(author: string): Book[] {
  getAllBooks();
  return _byAuthor.get(norm(author)) ?? [];
}

export function getBooksByYear(year: string): Book[] {
  getAllBooks();
  return _byYear.get(year) ?? [];
}

export function getBooksBySeries(seriesName: string): Book[] {
  getAllBooks();
  return _bySeries.get(norm(seriesName)) ?? [];
}

export function getBooksByEra(era: string): Book[] {
  getAllBooks();
  return _byEra.get(norm(era)) ?? [];
}

export function getBooksByFormat(format: BookFormat): Book[] {
  getAllBooks();
  return _byFormat.get(format) ?? [];
}

/** New: by faction */
export function getBooksByFaction(faction: string): Book[] {
  getAllBooks();
  return _byFaction.get(norm(faction)) ?? [];
}

/** Back-compat alias so existing imports keep working */
export function getBooksByCollection(collection: string): Book[] {
  return getBooksByFaction(collection);
}

type SortKey = "title_asc" | "date_desc" | "series_then_number";

export function searchBooks(params: {
  q?: string;
  author?: string;
  tag?: string;
  year?: string;
  series?: string;
  // preferred param
  faction?: string;
  // (optional) legacy alias still accepted
  collection?: string;
  era?: string;
  format?: BookFormat;
  sort?: SortKey;
} = {}): Book[] {
  const { q, author, tag, year, series, collection, faction, era, format, sort } = params;

  let list = getAllBooks();

  // Seed by strongest constraint
  if (author) list = getBooksByAuthor(author);
  else if (series) list = getBooksBySeries(series);
  else if (faction ?? collection) list = getBooksByFaction((faction ?? collection)!);
  else if (era) list = getBooksByEra(era);
  else if (format) list = getBooksByFormat(format);

  // Apply remaining filters (all normalized)
  if (author) list = list.filter((b) => b.author.map(norm).includes(norm(author)));
  if (series) list = list.filter((b) => b.series.some((s) => norm(s.name) === norm(series)));
  if (faction ?? collection) {
    const f = norm(faction ?? collection!);
    list = list.filter((b) => b.factions.map(norm).includes(f));
  }
  if (era) list = list.filter((b) => norm(b.era ?? "") === norm(era));
  if (format) list = list.filter((b) => b.format === format);
  if (year) list = list.filter((b) => b.year === year);

  if (q) {
    const needle = norm(q);
    list = list.filter((b) => {
      const inTitle = norm(b.title).includes(needle);
      const inAuthors = b.author.some((a) => norm(a).includes(needle));
      const inEra = norm(b.era ?? "").includes(needle);
      const inFactions = b.factions.some((f) => norm(f).includes(needle));
      const inSeries = b.series.some((s) => norm(s.name).includes(needle));
      return inTitle || inAuthors || inEra || inFactions || inSeries;
    });
  }

  // Sorting
  if (sort === "title_asc") {
    list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "date_desc") {
    list = [...list].sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""));
  } else if (sort === "series_then_number") {
    list = [...list].sort((a, b) => {
      const sA = (a.series[0]?.name || "").toLowerCase();
      const sB = (b.series[0]?.name || "").toLowerCase();
      if (sA !== sB) return sA.localeCompare(sB);
      const nA = a.series[0]?.number ?? Number.POSITIVE_INFINITY;
      const nB = b.series[0]?.number ?? Number.POSITIVE_INFINITY;
      return (nA as number) - (nB as number);
    });
  }

  return list;
}
