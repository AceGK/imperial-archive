// /src/lib/40k-books.ts
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

// ---------- Schema (only fields we care about) ----------
const BookZ = z
  .object({
    id: z.number(),
    title: z.string(),
    slug: z.string(),
    author: z.array(z.string()).or(z.string().transform((s) => [s])),

    // tolerate single string or array (or absent)
    tags: z.array(z.string()).or(z.string().transform((s) => [s])).optional(),

    release_date: z.string().optional().nullable(),
    publication_date: z.string().optional().nullable(),

    series: z.string().optional().nullable(),
    series_number: z.number().optional().nullable(),
    era: z.string().optional().nullable(),
    setting: z.string().optional().nullable(),

    black_library_link: z.string().url().optional().nullable(),
    lexicanum_link: z.string().url().optional().nullable(),

    // keep simple metadata
    description: z.string().optional().nullable(),
    story: z.string().optional().nullable(),

    // keep single isbn (optional)
    isbn: z.string().optional().nullable(),
    page_count: z.number().optional().nullable(),
    language: z.string().optional().nullable(),
    cover_image_url: z.string().url().optional().nullable(),

    // can be null in your data
    collections: z.array(z.string()).optional().nullable(),

    // keep editor if present
    editor: z.array(z.string()).optional().nullable(),
  })
  .passthrough(); // ignore all other fields (isbn_* arrays, editions, asin*, kindle/audible, etc.)

export type RawBook = z.infer<typeof BookZ>;

// ---------- Normalized Book shape ----------
export interface Book {
  id: number;
  title: string;
  slug: string;             // normalized: no leading slash
  author: string[];
  tags: string[];

  releaseDate?: string;
  year?: string;

  series?: string | null;
  series_number?: number | null;
  era?: string | null;
  setting?: string | null;

  black_library_link?: string | null;
  lexicanum_link?: string | null;

  description?: string | null;
  story?: string | null;

  // keep single isbn (optional)
  isbn?: string | null;
  page_count?: number | null;
  language?: string | null;
  cover_image_url?: string | null;

  collections: string[];

  editor?: string[];
}

// ---------- IO ----------
const DATA_FILE = path.join(process.cwd(), "data", "40k-books.json");

// ---------- Normalization helpers ----------
const stripLeadingSlash = (s: string) => s.replace(/^\/+/, "");

function bestReleaseDate(b: RawBook): string | undefined {
  const d = b.release_date ?? b.publication_date ?? undefined;
  return typeof d === "string" && d.trim() ? d.trim() : undefined;
}

function bestYear(b: RawBook): string | undefined {
  const date = bestReleaseDate(b);
  return date && /^\d{4}/.test(date) ? date.slice(0, 4) : undefined;
}

function normalizeBook(b: RawBook): Book {
  return {
    id: b.id,
    title: b.title,
    slug: stripLeadingSlash(b.slug),
    author: Array.isArray(b.author) ? b.author : [b.author],
    tags: Array.isArray(b.tags) ? b.tags : b.tags ? [b.tags] : [],

    releaseDate: bestReleaseDate(b),
    year: bestYear(b),

    series: b.series ?? null,
    series_number: b.series_number ?? null,
    era: b.era ?? null,
    setting: b.setting ?? null,

    black_library_link: b.black_library_link ?? null,
    lexicanum_link: b.lexicanum_link ?? null,

    description: b.description ?? null,
    story: b.story ?? null,

    isbn: b.isbn ?? null,
    page_count: typeof b.page_count === "number" ? b.page_count : null,
    language: b.language ?? null,
    cover_image_url: b.cover_image_url ?? null,

    collections: Array.isArray(b.collections) ? b.collections : [],

    editor: Array.isArray(b.editor) ? b.editor : [],
  };
}

// ---------- Caches & Indexes ----------
let _all: Book[] | null = null;

const _bySlug = new Map<string, Book>();
const _byAuthor = new Map<string, Book[]>();
const _byTag = new Map<string, Book[]>();
const _byYear = new Map<string, Book[]>();
const _bySeries = new Map<string, Book[]>();
const _byCollection = new Map<string, Book[]>();
const _byEra = new Map<string, Book[]>();

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

  for (const b of books) {
    _bySlug.set(b.slug, b);

    b.author.forEach((a) => pushMapArray(_byAuthor, a.toLowerCase(), b));
    b.tags.forEach((t) => pushMapArray(_byTag, t.toLowerCase(), b));
    if (b.year) pushMapArray(_byYear, b.year, b);
    if (b.series) pushMapArray(_bySeries, b.series.toLowerCase(), b);
    b.collections.forEach((c) => pushMapArray(_byCollection, c.toLowerCase(), b));
    if (b.era) pushMapArray(_byEra, b.era.toLowerCase(), b);
  }

  const sortByTitle = (x: Book, y: Book) => x.title.localeCompare(y.title);
  [_byAuthor, _byTag, _byYear, _bySeries, _byCollection, _byEra].forEach((m) =>
    m.forEach((arr) => arr.sort(sortByTitle))
  );
}

// ---------- Public API ----------
export function getAllBooks(): Book[] {
  if (_all) return _all;

  const rawText = fs.readFileSync(DATA_FILE, "utf-8");
  const rawArr = JSON.parse(rawText) as unknown[];

  // validate & normalize with tolerant schema
  const parsed: Book[] = rawArr.map((x) => normalizeBook(BookZ.parse(x)));

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

export function getBooksBySeries(series: string): Book[] {
  getAllBooks();
  return _bySeries.get(series.toLowerCase()) ?? [];
}

export function getBooksByCollection(collection: string): Book[] {
  getAllBooks();
  return _byCollection.get(collection.toLowerCase()) ?? [];
}

export function getBooksByEra(era: string): Book[] {
  getAllBooks();
  return _byEra.get(era.toLowerCase()) ?? [];
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
  sort?: SortKey;
} = {}): Book[] {
  const { q, author, tag, year, series, collection, era, sort } = params;
  let list = getAllBooks();

  if (author) list = getBooksByAuthor(author);
  if (series) list = (author ? list : getBooksBySeries(series));
  if (collection) list = (author || series ? list : getBooksByCollection(collection));
  if (era) list = (author || series || collection ? list : getBooksByEra(era));
  if (tag) {
    list =
      author || series || collection || era
        ? list.filter((b) => b.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase()))
        : getBooksByTag(tag);
  }
  if (year) list = list.filter((b) => b.year === year);

  if (q) {
    const needle = q.toLowerCase();
    list = list.filter((b) => {
      const inTitle = b.title.toLowerCase().includes(needle);
      const inAuthors = b.author.some((a) => a.toLowerCase().includes(needle));
      const inTags = b.tags.some((t) => t.toLowerCase().includes(needle));
      const inSeries = b.series?.toLowerCase().includes(needle) ?? false;
      const inEra = b.era?.toLowerCase().includes(needle) ?? false;
      const inCollections = b.collections.some((c) => c.toLowerCase().includes(needle));
      return inTitle || inAuthors || inTags || inSeries || inEra || inCollections;
    });
  }

  if (sort === "title_asc") {
    list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "date_desc") {
    list = [...list].sort((a, b) => (b.releaseDate || "").localeCompare(a.releaseDate || ""));
  } else if (sort === "series_then_number") {
    list = [...list].sort((a, b) => {
      const sA = (a.series || "").toLowerCase();
      const sB = (b.series || "").toLowerCase();
      if (sA !== sB) return sA.localeCompare(sB);
      const nA = a.series_number ?? Number.POSITIVE_INFINITY;
      const nB = b.series_number ?? Number.POSITIVE_INFINITY;
      return nA - nB;
    });
  }

  return list;
}
