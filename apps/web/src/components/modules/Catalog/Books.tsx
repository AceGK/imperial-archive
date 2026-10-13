// components/modules/Catalog/Books.tsx
// wrapper for SSR pages showing book catalog (since /Catalog/index.tsx is a client component)
"use client";

import Catalog, { type FilterConfig, type SortOption } from "@/components/modules/Catalog";
import BookCard from "@/components/modules/Cards/BookCard";
import type { BookHit } from "@/types/algolia";

export const BOOK_SORT_OPTIONS: SortOption[] = [
  { label: "Publication Date ↓", value: "books40k_date_desc" },
  { label: "Publication Date ↑", value: "books40k_date_asc" },
  { label: "Title A-Z", value: "books40k_title_asc" },
  { label: "Title Z-A", value: "books40k_title_desc" },
  { label: "Recently Added", value: "books40k" },
];

/** Newest releases first unless the reader picks another sort */
export const BOOK_DEFAULT_SORT = "books40k_date_desc";

const DEFAULT_FILTERS: FilterConfig[] = [
  { attribute: "format", label: "Format" },
  { attribute: "authors.name", label: "Author", searchable: true },
  { attribute: "series.title", label: "Series", searchable: true },
  { attribute: "factions.name", label: "Faction", searchable: true },
  { attribute: "era.name", label: "Era" },
];

interface BooksCatalogProps {
  /* Unique key for caching */
  cacheKey?: string;
  /* Static Algolia filters (e.g., filter by author) */
  baseFilters?: string;
  /* Search box placeholder */
  placeholder?: string;
  /* Message when no results */
  noResultsText?: string;
  /* Override default sort options */
  sortOptions?: SortOption[];
  /* Override default filters */
  filters?: FilterConfig[];
  /* Hits per page */
  hitsPerPage?: number;
}

export default function BooksCatalog({
  cacheKey,
  baseFilters,
  placeholder = "Search books...",
  noResultsText = "No books match your search.",
  sortOptions = BOOK_SORT_OPTIONS,
  filters = DEFAULT_FILTERS,
  hitsPerPage,
}: BooksCatalogProps) {
  return (
    <Catalog<BookHit>
      indexName="books40k"
      cacheKey={cacheKey}
      baseFilters={baseFilters}
      renderHit={(hit) => <BookCard book={hit} />}
      gridVariant="book"
      placeholder={placeholder}
      noResultsText={noResultsText}
      stats={{ singular: "Publication", plural: "Publications" }}
      sortOptions={sortOptions}
      defaultSort={BOOK_DEFAULT_SORT}
      filters={filters}
      hitsPerPage={hitsPerPage}
    />
  );
}