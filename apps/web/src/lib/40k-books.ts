// /src/lib/40k-books.ts
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

/** ---------- Zod Schemas (tolerant to legacy data) ---------- */

const SeriesEntryZ = z.object({
  name: z.string(),
  number: z.number().optional().nullable(),
});

// Accept: array of objects (new), single object, single string, or null/undefined.
const SeriesZ = z
  .union([
    z.array(SeriesEntryZ),
    SeriesEntryZ,
    z.string(),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return [{ name: val, number: null }];
    return [val]; // single object
  });

const EditionZ = z.object({
  isbn: z.string(),
  note: z.string().optional().nullable(),
});

const LinkZ = z.object({
  type: z.string(),
  url: z.string().url(),
});

// Legacy-friendly: accept array or single string for author/tags
const BookZ = z
  .object({
    id: z.number(),
    title: z.string(),
    slug: z.string(),

    author: z
      .array(z.string())
      .or(z.string().transform((s) => [s])),

    tags: z
      .array(z.string())
      .or(z.string().transform((s) => [s]))
      .optional(),

    // dates
    release_date: z.string().optional().nullable(),
    publication_date: z.string().optional().nullable(),

    // NEW series structure (with legacy fallbacks)
    series: SeriesZ, // normalizes to array of {name, number?}

    // legacy single series_number kept only if old data present
    series_number: z.number().optional().nullable(),

    era: z.string().optional().nullable(),

    // links (array of {type,url})
    links: z.array(LinkZ).optional().nullable(),

    // copy
    description: z.string().optional().nullable(),
    story: z.string().optional().nullable(),

    // NEW: format
    format: z
      .union([
        z.literal("novel"),
        z.literal("novella"),
        z.literal("short_story"),
        z.literal("audio_drama"),
        z.literal("anthology"),
        z.literal("audio_anthology"),
        z.literal("omnibus"),
        z.literal("graphic_novel"),
        z.literal("other"),
      ])
      .optional()
      .nullable(),

    // editions replaces isbn/isbn_all
    editions: z.array(EditionZ).optional().nullable(),

    // legacy fields we will ignore (but allow if present)
    isbn: z.string().optional().nullable(),
    page_count: z.number().optional().nullable(),
    collections: z.array(z.string()).optional().nullable(),
    editor: z.array(z.string()).optional().nullable(),
  })
  .passthrough();

export type RawBook = z.infer<typeof BookZ>;

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
  slug: string; // normalized, no leading slash
  author: string[];
  // tags: string[];

  releaseDate?: string;
  year?: string;

  // multiple series memberships supported
  series: SeriesMembership[];

  era?: string | null;

  // normalized links
  links: Link[];

  description?: string | null;
  story?: string | null;

  format?: BookFormat | null;
  editions: Edition[];

  page_count?: number | null;

  collections: string[];

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

function bestReleaseDate(b: RawBook): string | undefined {
  const d = b.release_date ?? b.publication_date ?? undefined;
  return typeof d === "string" && d.trim() ? d.trim() : undefined;
}

function bestYear(b: RawBook): string | undefined {
  const date = bestReleaseDate(b);
  return date && /^\d{4}/.test(date) ? date.slice(0, 4) : undefined;
}

function normalizeEditions(b: RawBook): Edition[] {
  if (Array.isArray(b.editions) && b.editions.length > 0) {
    // ensure structure is clean strings/nulls
    return b.editions
      .filter((e): e is Edition => !!e && typeof e.isbn === "string")
      .map((e) => ({ isbn: e.isbn, note: e.note ?? null }));
  }
  // Legacy single ISBN fallback
  if (b.isbn && typeof b.isbn === "string" && b.isbn.trim()) {
    return [{ isbn: b.isbn.trim(), note: null }];
  }
  return [];
}

function normalizeLinks(b: RawBook): Link[] {
  if (!b.links) return [];
  return (b.links || []).filter((l): l is Link => !!l && !!l.url && !!l.type);
}

function normalizeBook(b: RawBook): Book {
  // BookZ already normalized series (array form)
  const parsed = BookZ.parse(b);

  const seriesFromLegacy =
    parsed.series.length === 0 && parsed.series_number && parsed.series_number >= 0 && parsed.series_number !== null
      ? [{ name: parsed.series?.[0]?.name ?? "", number: parsed.series_number ?? null }].filter(
          (x) => x.name
        )
      : [];

  const series: SeriesMembership[] =
    parsed.series.length > 0
      ? parsed.series.map((s) => ({
          name: s.name,
          number: s.number ?? null,
        }))
      : seriesFromLegacy;

  return {
    id: parsed.id,
    title: parsed.title,
    slug: stripLeadingSlash(parsed.slug),
    author: Array.isArray(parsed.author) ? parsed.author : [parsed.author],
    // tags: Array.isArray(parsed.tags ?? []) ? (parsed.tags as string[]) : [],

    releaseDate: bestReleaseDate(parsed),
    year: bestYear(parsed),

    series,

    era: parsed.era ?? null,

    links: normalizeLinks(parsed),

    description: parsed.description ?? null,
    story: parsed.story ?? null,

    format: parsed.format ?? null,
    editions: normalizeEditions(parsed),

    page_count: typeof parsed.page_count === "number" ? parsed.page_count : null,

    collections: Array.isArray(parsed.collections) ? parsed.collections : [],

    editor: Array.isArray(parsed.editor) ? parsed.editor : [],
  };
}

/** ---------- Caches & Indexes ---------- */

let _all: Book[] | null = null;

const _bySlug = new Map<string, Book>();
const _byAuthor = new Map<string, Book[]>();
const _byTag = new Map<string, Book[]>();
const _byYear = new Map<string, Book[]>();
const _bySeries = new Map<string, Book[]>(); // now supports multi-series memberships
const _byCollection = new Map<string, Book[]>();
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
  _byCollection.clear();
  _byEra.clear();
  _byFormat.clear();

  for (const b of books) {
    _bySlug.set(b.slug, b);

    b.author.forEach((a) => pushMapArray(_byAuthor, a.toLowerCase(), b));
    // b.tags.forEach((t) => pushMapArray(_byTag, t.toLowerCase(), b));
    if (b.year) pushMapArray(_byYear, b.year, b);

    // Index ALL series memberships
    b.series.forEach((s) => {
      if (s?.name) pushMapArray(_bySeries, s.name.toLowerCase(), b);
    });

    b.collections.forEach((c) => pushMapArray(_byCollection, c.toLowerCase(), b));
    if (b.era) pushMapArray(_byEra, b.era.toLowerCase(), b);
    if (b.format) pushMapArray(_byFormat, b.format, b);
  }

  const sortByTitle = (x: Book, y: Book) => x.title.localeCompare(y.title);
  [_byAuthor, _byTag, _byYear, _bySeries, _byCollection, _byEra, _byFormat].forEach((m) =>
    m.forEach((arr) => arr.sort(sortByTitle))
  );
}

/** ---------- Public API ---------- */

export function getAllBooks(): Book[] {
  if (_all) return _all;

  const rawText = fs.readFileSync(DATA_FILE, "utf-8");
  const rawArr = JSON.parse(rawText) as unknown[];

  const parsed: Book[] = rawArr.map((x) => normalizeBook(x as any));
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
  return _byAuthor.get(author.toLowerCase()) ?? [];
}

export function getBooksByTag(tag: string): Book[] {
  getAllBooks();
  return _byTag.get(tag.toLowerCase()) ?? [];
}

export function getBooksByYear(year: string): Book[] {
  getAllBooks();
  return _byYear.get(year) ?? [];
}

export function getBooksBySeries(seriesName: string): Book[] {
  getAllBooks();
  return _bySeries.get(seriesName.toLowerCase()) ?? [];
}

export function getBooksByCollection(collection: string): Book[] {
  getAllBooks();
  return _byCollection.get(collection.toLowerCase()) ?? [];
}

export function getBooksByEra(era: string): Book[] {
  getAllBooks();
  return _byEra.get(era.toLowerCase()) ?? [];
}

export function getBooksByFormat(format: BookFormat): Book[] {
  getAllBooks();
  return _byFormat.get(format) ?? [];
}

type SortKey = "title_asc" | "date_desc" | "series_then_number";

export function searchBooks(params: {
  q?: string;
  author?: string;
  tag?: string;
  year?: string;
  series?: string;
  collection?: string;
  era?: string;
  format?: BookFormat;
  sort?: SortKey;
} = {}): Book[] {
  const { q, author, tag, year, series, collection, era, format, sort } = params;
  let list = getAllBooks();

  // Pre-filter using indexes (choose the first available constraint to seed the list)
  if (author) list = getBooksByAuthor(author);
  else if (series) list = getBooksBySeries(series);
  else if (collection) list = getBooksByCollection(collection);
  else if (era) list = getBooksByEra(era);
  else if (format) list = getBooksByFormat(format);

  // Apply remaining filters
  if (author) list = list.filter((b) => b.author.map((a) => a.toLowerCase()).includes(author.toLowerCase()));
  if (series) list = list.filter((b) => b.series.some((s) => s.name.toLowerCase() === series.toLowerCase()));
  if (collection) list = list.filter((b) => b.collections.map((c) => c.toLowerCase()).includes(collection.toLowerCase()));
  if (era) list = list.filter((b) => (b.era ?? "").toLowerCase() === era.toLowerCase());
  if (format) list = list.filter((b) => b.format === format);
  // if (tag) list = list.filter((b) => b.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()));
  if (year) list = list.filter((b) => b.year === year);

  if (q) {
    const needle = q.toLowerCase();
    list = list.filter((b) => {
      const inTitle = b.title.toLowerCase().includes(needle);
      const inAuthors = b.author.some((a) => a.toLowerCase().includes(needle));
      // const inTags = b.tags.some((t) => t.toLowerCase().includes(needle));
      const inEra = (b.era ?? "").toLowerCase().includes(needle);
      const inCollections = b.collections.some((c) => c.toLowerCase().includes(needle));
      const inSeries = b.series.some((s) => s.name.toLowerCase().includes(needle));
      return inTitle || inAuthors || inEra || inCollections || inSeries;
    });
  }

  // Sorting
  if (sort === "title_asc") {
    list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "date_desc") {
    list = [...list].sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""));
  } else if (sort === "series_then_number") {
    // Sort by first series name then its number; fall back gracefully
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
