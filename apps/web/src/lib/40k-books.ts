import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

/** ---------- Zod Schemas (tolerant to legacy data) ---------- */

const SeriesEntryZ = z.object({
  name: z.string(),
  number: z.number().optional().nullable(),
});

const SeriesZ = z
  .union([
    z.array(SeriesEntryZ),
    z.array(z.string()),
    SeriesEntryZ,
    z.string(),
    z.null(),
    z.undefined(),
  ])
  .transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) {
      if (val.length === 0) return [];
      if (typeof val[0] === "string") {
        return (val as string[]).map((s) => ({ name: s, number: null }));
      }
      return val as Array<{ name: string; number?: number | null }>;
    }
    if (typeof val === "string") return [{ name: val, number: null }];
    return [val as { name: string; number?: number | null }];
  })
  .pipe(z.array(SeriesEntryZ)); // ensure TS sees a clean array of SeriesEntryZ

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

const BookZ = z
  .object({
    id: z.number(),
    title: z.string(),
    slug: z.string(),

    author: z.array(z.string()).or(z.string().transform((s) => [s])),

    tags: z.array(z.string()).or(z.string().transform((s) => [s])).optional(),

    // dates
    release_date: z.string().optional().nullable(),
    publication_date: z.string().optional().nullable(),

    // series (tolerant input, normalized to array)
    series: SeriesZ,
    series_number: z.number().optional().nullable(), // legacy (not used, but allowed)

    era: z.string().optional().nullable(),

    links: z.array(LinkZ).optional().nullable(),

    description: z.string().optional().nullable(),
    story: z.string().optional().nullable(),

    format: FormatZ,

    editions: z.array(EditionZ).optional().nullable(),

    // legacy/optional
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

function normalizeBook(b: RawBook): Book {
  const p = BookZ.parse(b);

  const series: SeriesMembership[] = p.series.map((s) => ({
    name: s.name,
    number: s.number ?? null,
  }));

  return {
    id: p.id,
    title: p.title,
    slug: stripLeadingSlash(p.slug),
    author: p.author,

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
    collections: Array.isArray(p.collections) ? p.collections : [],
    editor: Array.isArray(p.editor) ? p.editor : [],
  };
}

/** ---------- Caches & Indexes ---------- */

let _all: Book[] | null = null;
const _bySlug = new Map<string, Book>();
const _byAuthor = new Map<string, Book[]>();
const _byTag = new Map<string, Book[]>(); // present for future tag support
const _byYear = new Map<string, Book[]>();
const _bySeries = new Map<string, Book[]>();
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
    if (b.year) pushMapArray(_byYear, b.year, b);
    b.series.forEach((s) => pushMapArray(_bySeries, s.name.toLowerCase(), b));
    b.collections.forEach((c) => pushMapArray(_byCollection, c.toLowerCase(), b));
    if (b.era) pushMapArray(_byEra, b.era.toLowerCase(), b);
    if (b.format) pushMapArray(_byFormat, b.format, b);
  }

  // You can add sorted views here if you need consistently sorted results from maps
}

/** ---------- Public API ---------- */

export function getAllBooks(): Book[] {
  if (_all) return _all;
  const rawArr = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as unknown[];
  const parsed = rawArr.map((x) => normalizeBook(x as any));
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

export function getBooksByYear(year: string): Book[] {
  getAllBooks();
  return _byYear.get(year) ?? [];
}

export function getBooksBySeries(seriesName: string): Book[] {
  getAllBooks();
  return _bySeries.get(seriesName.toLowerCase()) ?? [];
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

  // Seed list via indexed lookups (pick one strongest constraint)
  if (author) list = getBooksByAuthor(author);
  else if (series) list = getBooksBySeries(series);
  else if (collection) list = getAllBooks().filter((b) =>
    b.collections.map((c) => c.toLowerCase()).includes(collection!.toLowerCase())
  );
  else if (era) list = getBooksByEra(era);
  else if (format) list = getBooksByFormat(format);

  // Apply remaining filters
  if (author) list = list.filter((b) => b.author.map((a) => a.toLowerCase()).includes(author.toLowerCase()));
  if (series) list = list.filter((b) => b.series.some((s) => s.name.toLowerCase() === series.toLowerCase()));
  if (collection) list = list.filter((b) => b.collections.map((c) => c.toLowerCase()).includes(collection.toLowerCase()));
  if (era) list = list.filter((b) => (b.era ?? "").toLowerCase() === era.toLowerCase());
  if (format) list = list.filter((b) => b.format === format);
  if (year) list = list.filter((b) => b.year === year);

  if (q) {
    const needle = q.toLowerCase();
    list = list.filter((b) => {
      const inTitle = b.title.toLowerCase().includes(needle);
      const inAuthors = b.author.some((a) => a.toLowerCase().includes(needle));
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
