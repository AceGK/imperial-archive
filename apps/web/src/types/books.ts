import type { SourceLink } from "@/components/modules/Sources";
import type { SanityImageField } from './sanity';

// Minimal author shape for display
export type BookAuthor = {
  name?: string;
  slug?: string;
  bio?: string;
  image?: (SanityImageField & { lqip?: string | null }) | null;
};

// Minimal series shape for display
export type BookSeries = {
  name?: string;
  number?: number | null;
  slug?: string;
};

// Minimal era shape for display
export type BookEra = {
  title?: string;
  slug?: string;
};

// Minimal faction shape for display
export type BookFaction = {
  title?: string;
  slug?: string;
  groupSlug?: string; // needed for the URL construction
};

// Book content item (for anthologies/omnibus)
export type BookContent = {
  _id: string;
  title: string;
  slug: string;
  format?: string | null;
  authors?: BookAuthor[];
};

// An anthology or omnibus that includes a book
export type BookCollection = {
  _id: string;
  title: string;
  slug: string;
  format?: string | null;
};

// Full book detail data structure
export type BookDetailData = {
  _id: string;
  title: string;
  slug: string;
  authors?: BookAuthor[];
  series?: BookSeries[];
  publication_date?: string | null;
  format?: string | null;
  era?: BookEra | null;
  factions?: BookFaction[];
  image?: SanityImageField;
  description?: string | null;
  story?: string | null;
  /** Shown as the page's numbered sources (see Sources) */
  links?: SourceLink[];
  contents?: BookContent[];
  collectedIn?: BookCollection[];
  page_count?: number | null;
};