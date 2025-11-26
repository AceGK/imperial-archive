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

// Author hit from authors40k index
export type AuthorHit = {
  objectID: string;
  name: string;
  lastName: string;
  slug: string;
  bio?: string;
  image?: {
    url?: string;
    lqip?: string;
    aspect?: number;
  };
  
  // Consistent with books index
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

// Series hit from series40k index
export type SeriesHit = {
  objectID: string;
  title: string;
  slug: string;
  description?: string | null;
  image: AlgoliaImage;
  bookCount?: number;
  _createdAt: string;
  _updatedAt: string;
};

// Faction hit from factions40k index
export type FactionHit = {
  objectID: string;
  name: string;
  slug: string;
  description?: string | null;
  iconId?: string | null;
  image: AlgoliaImage;
  bookCount?: number;
  _createdAt: string;
  _updatedAt: string;
};