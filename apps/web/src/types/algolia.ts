// apps/web/types/algolia.ts

/**
 * Algolia Hit Types
 * These represent the structure of documents returned from Algolia indices
 */

// Shared nested types
export type AlgoliaAuthor = {
  name: string;
  slug: string;
};

export type AlgoliaFaction = {
  name: string;
  slug: string;
  iconId?: string | null;
};

export type AlgoliaEra = {
  name: string;
  slug: string;
};

export type AlgoliaSeries = {
  title: string;
  slug: string;
};

export type AlgoliaImage = {
  url: string | null;
  alt: string | null;
};

// Book hit from books40k index
export type BookHit = {
  objectID: string;
  title: string;
  slug: string;
  format: string | null;
  publicationDate: string | null;
  description: string;
  story: string;
  image: AlgoliaImage;
  authors: AlgoliaAuthor[];
  factions: AlgoliaFaction[];
  era: AlgoliaEra | null;
  series: AlgoliaSeries | null;
  _createdAt: string;
  _updatedAt: string;
};

// export type AuthorHit = { ... };
// export type SeriesHit = { ... };
// export type FactionHit = { ... };