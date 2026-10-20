// functions/algolia-document-sync-series/record.ts
//
// How a series40k document becomes its series40k record. The sync function
// and the full rebuild script (scripts/algolia/sync-series.ts) both build
// records with this file, so the two can't drift apart.
//
// It lives inside the function's folder because the deploy bundles only that
// folder (so hardTrim and formatBookType are repeated in each function's
// record.ts). It has no imports, so the scripts can load it directly.

export const SERIES_INDEX = "series40k";

/* ------------------------------ helpers ------------------------------- */
export const hardTrim = (str: unknown, max = 8000): string =>
  typeof str === "string" ? (str.length > max ? str.slice(0, max) : str) : "";

export function formatBookType(format: string | null): string {
  if (!format) return "Book";

  const formatMap: Record<string, string> = {
    novel: "Novel",
    novella: "Novella",
    short_story: "Short Story",
    audio_drama: "Audio Drama",
    anthology: "Anthology",
    omnibus: "Omnibus",
    graphic_novel: "Graphic Novel",
    audio_anthology: "Audio Anthology",
    other: "Other",
  };

  return formatMap[format] || format;
}

/* -------------------------------- GROQ --------------------------------- */
/** What each book in the series contributes to its record */
export const SERIES_BOOK_FIELDS = `
  _id,
  format,
  "authors": authors[]->{
    "name": coalesce(name, title),
    "slug": slug.current
  },
  "era": era->{ "name": coalesce(title, name), "slug": slug.current },
  "factions": factions[]->{
    "name": coalesce(title, name),
    "slug": slug.current
  }
`;

/** The function's lookup for one series: params { seriesId } */
export const SERIES_DATA_QUERY = `{
  "books": *[_type == "book40k" && !(_id in path("drafts.**")) && _id in *[_type == "series40k" && _id == $seriesId].lists[].items[].work._ref]{ ${SERIES_BOOK_FIELDS} }
}`;

/** Every published series with what toSeriesRecord needs, for the rebuild script */
export const ALL_SERIES_QUERY = `*[_type == "series40k" && !(_id in path("drafts.**"))]{
  _id,
  title,
  "slug": slug.current,
  subtitle,
  image,
  _createdAt,
  _updatedAt,
  "books": *[_type == "book40k" && !(_id in path("drafts.**")) && _id in ^.lists[].items[].work._ref]{ ${SERIES_BOOK_FIELDS} }
}`;

/* -------------------------------- types -------------------------------- */
export type ImageRef = {
  asset?: { _ref: string } | null;
  hotspot?: { x: number; y: number; width: number; height: number } | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  alt?: string | null;
};

export type SeriesDoc = {
  title?: string | null;
  slug?: string | { current?: string } | null;
  subtitle?: string | null;
  image?: ImageRef | null;
  _createdAt: string;
  _updatedAt: string;
};

export type AlgoliaSeries = {
  title: string;
  slug: string;
  subtitle: string;
  image: ImageRef;

  // Denormalized book data for filtering (consistent naming)
  format: string[];
  "authors.slug": string[];
  "authors.name": string[];
  "factions.slug": string[];
  "factions.name": string[];
  "era.slug": string[];
  "era.name": string[];
  bookCount: number;

  _createdAt: string;
  _updatedAt: string;
};

/* ------------------------------- record -------------------------------- */
export function toSeriesRecord(series: SeriesDoc, books: any[] | null): AlgoliaSeries {
  // unique values across the series' books
  const formats = new Set<string>();
  const authorSlugs = new Set<string>();
  const authorNames = new Set<string>();
  const factionSlugs = new Set<string>();
  const factionNames = new Set<string>();
  const eraSlugs = new Set<string>();
  const eraNames = new Set<string>();

  const list = books || [];
  list.forEach((book: any) => {
    if (book.format) {
      formats.add(formatBookType(book.format));
    }

    if (Array.isArray(book.authors)) {
      book.authors.forEach((author: any) => {
        if (author?.slug && author?.name) {
          authorSlugs.add(author.slug);
          authorNames.add(author.name);
        }
      });
    }

    if (book.era?.slug && book.era?.name) {
      eraSlugs.add(book.era.slug);
      eraNames.add(book.era.name);
    }

    if (Array.isArray(book.factions)) {
      book.factions.forEach((faction: any) => {
        if (faction?.slug && faction?.name) {
          factionSlugs.add(faction.slug);
          factionNames.add(faction.name);
        }
      });
    }
  });

  const slug = series.slug;

  return {
    title: series.title || "",
    slug: typeof slug === "object" ? slug?.current || "" : slug || "",
    subtitle: hardTrim(series.subtitle || "", 500),
    // the full Sanity image, so urlFor() can apply hotspot and crop
    image: {
      // just the reference, as every record has had it
      asset: series.image?.asset?._ref ? { _ref: series.image.asset._ref } : null,
      hotspot: series.image?.hotspot ?? null,
      crop: series.image?.crop ?? null,
      alt: series.image?.alt ?? null,
    },

    // Consistent field names with books/authors indices
    format: Array.from(formats),
    "authors.slug": Array.from(authorSlugs),
    "authors.name": Array.from(authorNames),
    "factions.slug": Array.from(factionSlugs),
    "factions.name": Array.from(factionNames),
    "era.slug": Array.from(eraSlugs),
    "era.name": Array.from(eraNames),
    bookCount: list.length,

    _createdAt: series._createdAt,
    _updatedAt: series._updatedAt,
  };
}
