// functions/algolia-document-sync/record.ts
//
// How a book40k document becomes its books40k record. The sync function and
// the full rebuild script (scripts/algolia/sync-books.ts) both build records
// with this file, so the two can't drift apart.
//
// It lives inside the function's folder because the deploy bundles only that
// folder; the scripts import it from here. It has no imports of its own, so
// the scripts can load it without the function's dependencies.

export const BOOKS_INDEX = "books40k";

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
// Fields fetched for each referenced document. The function looks them up by
// id ($authorIds etc.); the rebuild script from each book (^.authors etc.).
export const AUTHOR_FIELDS = `_id, name, title, "displayName": coalesce(name, title), slug`;
export const ERA_FIELDS = `_id, name, title, "displayName": coalesce(title, name), slug`;
export const FACTION_FIELDS = `_id, name, title, "displayName": coalesce(title, name), slug, iconId`;

/** Every published series the book (given as a GROQ expression) is listed in */
export const seriesOf = (bookId: string) =>
  `*[_type == "series40k" && !(_id in path("drafts.**")) && ${bookId} in lists[].items[].work._ref] | order(title asc){
    title,
    "slug": slug.current
  }`;

/** The function's lookup of one book's references, with bookRefsParams */
export const BOOK_REFS_QUERY = `{
  "authors": *[_id in $authorIds]{ ${AUTHOR_FIELDS} },
  "era": select(defined($eraId) => *[_id == $eraId][0]{ ${ERA_FIELDS} }, null),
  "factions": *[_id in $factionIds]{ ${FACTION_FIELDS} },
  "imageUrl": select(defined($imageAssetId) => *[_id == $imageAssetId][0].url, null),
  "series": ${seriesOf("$bookId")}
}`;

export function bookRefsParams(doc: BookDoc) {
  return {
    authorIds: Array.isArray(doc.authors) ? doc.authors.map((a) => a?._ref).filter(Boolean) : [],
    eraId: doc.era?._ref || null,
    factionIds: Array.isArray(doc.factions) ? doc.factions.map((f) => f?._ref).filter(Boolean) : [],
    imageAssetId: doc.image?.asset?._ref || null,
    bookId: doc._id,
  };
}

/** The same references, as a projection on each book: { ..., "refs": BOOK_REFS_PROJECTION } */
export const BOOK_REFS_PROJECTION = `{
  "authors": *[_id in ^.authors[]._ref]{ ${AUTHOR_FIELDS} },
  "era": *[_id == ^.era._ref][0]{ ${ERA_FIELDS} },
  "factions": *[_id in ^.factions[]._ref]{ ${FACTION_FIELDS} },
  "imageUrl": image.asset->url,
  "series": ${seriesOf("^._id")}
}`;

/** The book's own fields, as the function's event projection delivers them */
export const BOOK_FIELDS = `_id, title, "slug": slug.current, format, publicationDate, description, story, authors, era, factions, image, _createdAt, _updatedAt`;

/* -------------------------------- types -------------------------------- */
type Ref = { _ref?: string } | null | undefined;

export type BookDoc = {
  _id: string;
  title?: string | null;
  slug?: string | null;
  format?: string | null;
  publicationDate?: string | null;
  description?: string | null;
  story?: string | null;
  authors?: Ref[] | null;
  era?: Ref;
  factions?: Ref[] | null;
  image?: { asset?: { _ref?: string; url?: string } | null; alt?: string | null } | null;
  _createdAt: string;
  _updatedAt: string;
};

export type BookRefs = {
  authors?: any[] | null;
  era?: any | null;
  factions?: any[] | null;
  imageUrl?: string | null;
  series?: any[] | null;
};

export type AuthorRef = { name: string; slug: string };
export type FactionRef = { name: string; slug: string; iconId?: string | null };
export type SeriesMini = { title: string; slug: string };
export type EraRef = { name: string; slug: string };
export type ImageRef = { url: string | null; alt: string | null };

export type AlgoliaBook = {
  title: string;
  slug: string;
  format: string | null;
  publicationDate: string | null;
  image: ImageRef;
  description: string;
  story: string;
  // every series the book belongs to, so the series filter finds it under each
  series: SeriesMini[];
  era: EraRef | null;
  factions: FactionRef[];
  authors: AuthorRef[];
  _createdAt: string;
  _updatedAt: string;
};

/* ------------------------------- record -------------------------------- */
const slugOf = (s: any): string => (typeof s === "object" ? s?.current || "" : s || "");

/** Looked-up documents in the order the book lists them (a lookup by id returns them by id) */
const inDocOrder = (found: any[] | null | undefined, order: Ref[] | null | undefined): any[] => {
  if (!Array.isArray(found)) return [];
  const ids = (order || []).map((r) => r?._ref);
  const rank = (d: any) => (ids.includes(d?._id) ? ids.indexOf(d._id) : ids.length);
  return [...found].sort((a, b) => rank(a) - rank(b));
};

export function toBookRecord(doc: BookDoc, refs: BookRefs | null): AlgoliaBook {
  const authors: AuthorRef[] = inDocOrder(refs?.authors, doc.authors)
    .map((a: any) => ({ name: a?.displayName || a?.name || a?.title || "", slug: slugOf(a?.slug) }))
    .filter((a) => a.name && a.slug);

  const factions: FactionRef[] = inDocOrder(refs?.factions, doc.factions)
    .map((f: any) => ({
      name: f?.displayName || f?.title || f?.name || "",
      slug: slugOf(f?.slug),
      iconId: f?.iconId ?? null,
    }))
    .filter((f) => f.name && f.slug);

  const era: EraRef | null = refs?.era
    ? { name: refs.era.displayName || refs.era.title || refs.era.name || "", slug: slugOf(refs.era.slug) }
    : null;

  // all of them; the series sync keeps this current when a series changes
  const series: SeriesMini[] = Array.isArray(refs?.series)
    ? refs.series.filter((s: any) => s?.title && s?.slug).map((s: any) => ({ title: s.title, slug: s.slug }))
    : [];

  return {
    title: doc.title ? doc.title.slice(0, 500) : "",
    slug: doc.slug || "",
    format: formatBookType(doc.format ?? null),
    publicationDate: doc.publicationDate ?? null,
    image: { url: refs?.imageUrl ?? doc.image?.asset?.url ?? null, alt: doc.image?.alt ?? null },
    description: hardTrim(doc.description, 6000),
    story: hardTrim(doc.story, 2000),
    series,
    era,
    factions,
    authors,
    _createdAt: doc._createdAt,
    _updatedAt: doc._updatedAt,
  };
}
