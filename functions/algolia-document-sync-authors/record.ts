// functions/algolia-document-sync-authors/record.ts
//
// How an author40k document becomes its authors40k record. The sync function
// and the full rebuild script (scripts/algolia/sync-authors.ts) both build
// records with this file, so the two can't drift apart.
//
// It lives inside the function's folder because the deploy bundles only that
// folder (so hardTrim and formatBookType are repeated in each function's
// record.ts). It has no imports, so the scripts can load it directly.

export const AUTHORS_INDEX = "authors40k";

/* ------------------------------ helpers ------------------------------- */
export const hardTrim = (str: unknown, max = 8000): string =>
  typeof str === "string" ? (str.length > max ? str.slice(0, max) : str) : "";

export function extractLastName(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

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
/** What each of the author's books contributes to their record */
export const AUTHOR_BOOK_FIELDS = `
  format,
  "series": *[
    _type == "series40k" && !(_id in path("drafts.**")) && ^._id in lists[].items[].work._ref
  ]{ "title": title, "slug": slug.current },
  "era": era->{ "name": coalesce(title, name), "slug": slug.current },
  "factions": factions[]->{
    "name": coalesce(title, name),
    "slug": slug.current
  }
`;

/** The function's lookup for one author: params { authorId, bio } */
export const AUTHOR_DATA_QUERY = `{
  "books": *[_type == "book40k" && !(_id in path("drafts.**")) && references($authorId)]{ ${AUTHOR_BOOK_FIELDS} },
  "bioText": select(defined($bio) => pt::text($bio), "")
}`;

/** Every published author with what toAuthorRecord needs, for the rebuild script */
export const ALL_AUTHORS_QUERY = `*[_type == "author40k" && !(_id in path("drafts.**"))]{
  _id,
  name,
  "slug": slug.current,
  image,
  "bioText": pt::text(bio),
  _createdAt,
  _updatedAt,
  "books": *[_type == "book40k" && !(_id in path("drafts.**")) && references(^._id)]{ ${AUTHOR_BOOK_FIELDS} }
}`;

/* -------------------------------- types -------------------------------- */
export type ImageRef = {
  asset?: { _ref: string } | null;
  hotspot?: { x: number; y: number; width: number; height: number } | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  alt?: string | null;
};

export type AuthorDoc = {
  name?: string | null;
  slug?: string | { current?: string } | null;
  image?: ImageRef | null;
  _createdAt: string;
  _updatedAt: string;
};

export type AlgoliaAuthor = {
  name: string;
  lastName: string;
  slug: string;
  bio: string;
  image: ImageRef;

  // Consistent field names with books index
  format: string[];
  "series.title": string[];
  "series.slug": string[];
  "factions.name": string[];
  "factions.slug": string[];
  "era.name": string[];
  "era.slug": string[];
  bookCount: number;

  _createdAt: string;
  _updatedAt: string;
};

/* ------------------------------- record -------------------------------- */
export function toAuthorRecord(author: AuthorDoc, books: any[] | null, bioText: string | null): AlgoliaAuthor {
  // unique values across the author's books
  const formats = new Set<string>();
  const seriesSlugs = new Set<string>();
  const seriesTitles = new Set<string>();
  const factionSlugs = new Set<string>();
  const factionNames = new Set<string>();
  const eraSlugs = new Set<string>();
  const eraNames = new Set<string>();

  const list = books || [];
  list.forEach((book: any) => {
    if (book.format) {
      formats.add(formatBookType(book.format));
    }

    // every series the book is in, not just the first
    for (const s of Array.isArray(book.series) ? book.series : []) {
      if (s?.slug && s?.title) {
        seriesSlugs.add(s.slug);
        seriesTitles.add(s.title);
      }
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

  const name = author.name || "";
  const slug = author.slug;

  return {
    name,
    lastName: extractLastName(name),
    slug: typeof slug === "object" ? slug?.current || "" : slug || "",
    bio: hardTrim(bioText || "", 6000),
    // the full Sanity image, so urlFor() can apply hotspot and crop
    image: {
      // just the reference, as every record has had it
      asset: author.image?.asset?._ref ? { _ref: author.image.asset._ref } : null,
      hotspot: author.image?.hotspot ?? null,
      crop: author.image?.crop ?? null,
      alt: author.image?.alt ?? null,
    },

    // Consistent field names with books index
    format: Array.from(formats),
    "series.title": Array.from(seriesTitles),
    "series.slug": Array.from(seriesSlugs),
    "factions.name": Array.from(factionNames),
    "factions.slug": Array.from(factionSlugs),
    "era.name": Array.from(eraNames),
    "era.slug": Array.from(eraSlugs),
    bookCount: list.length,

    _createdAt: author._createdAt,
    _updatedAt: author._updatedAt,
  };
}
