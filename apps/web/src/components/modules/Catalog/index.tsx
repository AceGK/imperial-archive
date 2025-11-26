// components/modules/Catalog/index.tsx
"use client";

import React from "react";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { useInfiniteHits, Configure } from "react-instantsearch";
import { useInfiniteHitsCache } from "@/hooks/useInfiniteHitsCache";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { createAlgoliaRouting } from "@/lib/algolia/routing";
import {
  SearchBox,
  Stats,
  SortBy,
  RefinementList,
  MobileFilterModal,
  CurrentRefinements,
} from "@/components/algolia";
import StickyControls from "./StickyControls";
import styles from "./styles.module.scss";
import Button from "@/components/ui/Button";
import type { BaseHit } from "instantsearch.js";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!
);

// ============================================
// Type Definitions
// ============================================

export interface FilterConfig {
  attribute: string;
  label: string;
  searchable?: boolean;
}

export interface SortOption {
  label: string;
  value: string;
}

export type GridVariant = "book" | "author" | "series";

export interface CatalogProps<THit extends BaseHit> {
  /** Algolia index name */
  indexName: string;
  /** Component to render each hit */
  renderHit: (hit: THit) => React.ReactNode;
  /** Grid layout variant */
  gridVariant?: GridVariant;
  /** Unique key for caching (defaults to indexName) */
  cacheKey?: string;
  /** Available sort options */
  sortOptions?: SortOption[];
  /** Algolia Filter configurations */
  filters?: FilterConfig[];
  /** Hits per page (default: 25) */
  hitsPerPage?: number;
  /** Static Algolia filters */
  baseFilters?: string;
  /** Search box placeholder (default: "Search...") */
  placeholder?: string;
  /** Message when no results (default: "No results found.") */
  noResultsText?: string;
  /** Stats labels (default: Result/Results) */
  stats?: {
    singular: string;
    plural: string;
  };
}

// ============================================
// Grid class mapping
// ============================================

const gridClasses: Record<GridVariant, string> = {
  book: styles.bookGrid,
  author: styles.authorGrid,
  series: styles.seriesGrid,
};

// ============================================
// Results Component
// ============================================

interface ResultsProps<THit extends BaseHit> {
  cacheKey: string;
  renderHit: (hit: THit) => React.ReactNode;
  noResultsText: string;
  gridVariant: GridVariant;
}

function Results<THit extends BaseHit>({
  cacheKey,
  renderHit,
  noResultsText,
  gridVariant,
}: ResultsProps<THit>) {
  const cache = useInfiniteHitsCache<THit>(cacheKey);
  const { items, showMore, isLastPage, results } = useInfiniteHits<THit>({
    cache,
  });

  const isLoading = results === undefined;
  const { minHeight, isRestoring } = useScrollRestoration(
    `${cacheKey}-catalog`,
    items.length,
    isLoading
  );

  if (items.length === 0 && !isRestoring) {
    return (
      <div className={styles.noResults}>
        <p>{noResultsText}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: minHeight || undefined }}>
      <div className={gridClasses[gridVariant]}>
        {items.map((hit) => (
          <React.Fragment key={hit.objectID}>
            {renderHit(hit)}
          </React.Fragment>
        ))}
      </div>

      {!isLastPage && (
        <div className={styles.loadMoreContainer}>
          <Button onClick={showMore} className={styles.loadMoreButton}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Catalog Component
// ============================================

export default function Catalog<THit extends BaseHit>({
  indexName,
  renderHit,
  gridVariant = "book",
  cacheKey,
  sortOptions,
  filters = [],
  hitsPerPage = 25,
  baseFilters,
  placeholder = "Search...",
  noResultsText = "No results found.",
  stats = { singular: "Result", plural: "Results" },
}: CatalogProps<THit>) {
  const resolvedCacheKey = cacheKey ?? indexName;

  const routing = React.useMemo(
    () => createAlgoliaRouting(indexName),
    [indexName]
  );

  return (
    <InstantSearchNext
      indexName={indexName}
      searchClient={searchClient}
      routing={routing}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={hitsPerPage} filters={baseFilters} />

      <div className={styles.contentWrapper}>
        <StickyControls>
          <SearchBox placeholder={placeholder} />

          {filters.length > 0 && (
            <>
              <div className={styles.mobileFilters}>
                <MobileFilterModal filters={filters} />
              </div>

              <div className={styles.desktopFilters}>
                {filters.map((filter) => (
                  <RefinementList
                    key={filter.attribute}
                    attribute={filter.attribute}
                    title={filter.label}
                    searchable={filter.searchable}
                  />
                ))}
              </div>
            </>
          )}

          {sortOptions && sortOptions.length > 0 && (
            <SortBy items={sortOptions} />
          )}
        </StickyControls>

        <section className="container">
          <div className={styles.mainContent}>
            <Stats
              singularLabel={stats.singular}
              pluralLabel={stats.plural}
            />
            <CurrentRefinements />
            <Results<THit>
              cacheKey={resolvedCacheKey}
              renderHit={renderHit}
              noResultsText={noResultsText}
              gridVariant={gridVariant}
            />
          </div>
        </section>
      </div>
    </InstantSearchNext>
  );
}