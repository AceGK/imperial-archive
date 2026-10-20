export type BookHit = {
  objectID: string;
  title: string;
  slug: string;
  format: string | null;
  authors: Array<{ name: string; slug: string }>;
  factions: Array<{ name: string; slug: string }>;
  era: { name: string; slug: string } | null;
  // every series the book is in; older records may still hold a single object or null
  series: { title: string; slug: string }[] | { title: string; slug: string } | null;
};

/**
 * Authors, series, factions and eras: few enough that the page loads them all
 * from Sanity and they're matched in the browser, which keeps the hero search
 * to one Algolia request (books) per search
 */
export type SearchShortcut = {
  id: string;
  kind: "author" | "series" | "faction" | "factionGroup" | "era";
  title: string;
  href: string;
  /** Shown under the title, e.g. a faction's group or an author's publication count */
  context?: string;
  /** Publications linked to it; breaks ties between equally good matches, and 0 hides it */
  count?: number;
};

/** One selectable row in the results dropdown */
export type ResultRow = {
  key: string;
  href: string;
  title: string;
  /** Secondary line, e.g. a book's authors or an author's publication count */
  meta?: string;
  /** Pill on the right: the book's format, or Author, Series, Faction, Era */
  badge?: string;
};
