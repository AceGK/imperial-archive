// components/modules/Catalog/index.tsx
"use client";

import React from "react";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { useInfiniteHits, useInstantSearch, Configure } from "react-instantsearch";
import { useInfiniteHitsCache } from "@/hooks/useInfiniteHitsCache";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { createAlgoliaRouting } from "@/lib/algolia/routing";
import { forgetServerResults, searchClient } from "@/lib/algolia/search";
import { useAwaitingFirstResults } from "@/lib/algolia/useAwaitingFirstResults";
import CatalogSkeleton from "./Skeleton";
import {
  SearchBox,
  Stats,
  SortBy,
  RefinementList,
  MobileFilterModal,
  CurrentRefinements,
} from "@/components/algolia";
import StickyControls from "./StickyControls";
import { useCatalogView, ViewToggle, type CatalogView } from "./ViewToggle";
import { useCatalogWidth, WidthToggle } from "./WidthToggle";
import { DisplayMenu, useBookDisplay } from "./DisplayMenu";
import type { BookDisplay } from "@/components/modules/Cards/BookCard/display";
import styles from "./styles.module.scss";
import Button from "@/components/ui/Button";
import type { BaseHit } from "instantsearch.js";

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
export type { CatalogView } from "./ViewToggle";

export interface CatalogProps<THit extends BaseHit> {
  /** Algolia index name */
  indexName: string;
  /** Component to render each hit, as a grid card or a list row */
  renderHit: (hit: THit, view: CatalogView, display: BookDisplay) => React.ReactNode;
  /** Offer the book card Cards menu (which parts of each card show) */
  bookDisplay?: boolean;
  /** Grid layout variant */
  gridVariant?: GridVariant;
  /** Unique key for caching (defaults to indexName) */
  cacheKey?: string;
  /** Available sort options */
  sortOptions?: SortOption[];
  /** Sort used when the URL has none (an option's value); defaults to indexName */
  defaultSort?: string;
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
  renderHit: (hit: THit, view: CatalogView, display: BookDisplay) => React.ReactNode;
  view: CatalogView;
  display: BookDisplay;
  noResultsText: string;
  gridVariant: GridVariant;
  skeletonCount: number;
}

function Results<THit extends BaseHit>({
  cacheKey,
  renderHit,
  view,
  display,
  noResultsText,
  gridVariant,
  skeletonCount,
}: ResultsProps<THit>) {
  const cache = useInfiniteHitsCache<THit>(cacheKey);
  const { items, showMore, isLastPage } = useInfiniteHits<THit>({
    cache,
  });
  const { status } = useInstantSearch();

  // a search still in flight isn't "no results"
  const isLoading = useAwaitingFirstResults() || status === "loading" || status === "stalled";
  const { ref, minHeight, isRestoring } = useScrollRestoration(
    `${cacheKey}-catalog`,
    items.length,
    isLoading
  );

  if (items.length === 0 && isLoading) {
    return (
      <CatalogSkeleton variant={gridVariant} count={skeletonCount} view={view} />
    );
  }

  if (items.length === 0 && status === "error") {
    return (
      <div className={styles.noResults}>
        <p>Results couldn&apos;t be loaded. Please try again.</p>
      </div>
    );
  }

  if (items.length === 0 && !isRestoring) {
    return (
      <div className={styles.noResults}>
        <p>{noResultsText}</p>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ minHeight: minHeight || undefined }}>
      <div className={view === "list" ? styles.list : gridClasses[gridVariant]}>
        {items.map((hit) => (
          <React.Fragment key={hit.objectID}>
            {renderHit(hit, view, display)}
          </React.Fragment>
        ))}
      </div>

      {!isLastPage && (
        <div className={styles.loadMoreContainer}>
          <Button onClick={showMore} className={styles.loadMoreButton} variant="secondary" size="lg">
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
  bookDisplay = false,
  gridVariant = "book",
  cacheKey,
  sortOptions,
  defaultSort,
  filters = [],
  hitsPerPage = 25,
  baseFilters,
  placeholder = "Search...",
  noResultsText = "No results found.",
  stats = { singular: "Result", plural: "Results" },
}: CatalogProps<THit>) {
  const resolvedCacheKey = cacheKey ?? indexName;
  const [view, setView] = useCatalogView();
  const [display, setDisplay] = useBookDisplay();
  const [width, setWidth] = useCatalogWidth();

  const routing = React.useMemo(
    () => createAlgoliaRouting(indexName, defaultSort),
    [indexName, defaultSort]
  );

  // runs after InstantSearch (a child) has hydrated from this page's results
  React.useEffect(() => {
    forgetServerResults();
  }, []);

  return (
    <InstantSearchNext
      indexName={defaultSort ?? indexName}
      searchClient={searchClient}
      routing={routing}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={hitsPerPage} filters={baseFilters} />

      <div
        className={`${styles.contentWrapper} ${width === "full" ? styles.fullWidth : styles.boxedWidth}`}
      >
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
            {/* the count, with the display, width and grid/list switches on the right */}
            <div className={styles.resultsHeader}>
              <Stats
                singularLabel={stats.singular}
                pluralLabel={stats.plural}
              />
              <div className={styles.resultsTools}>
                {bookDisplay && <DisplayMenu display={display} onChange={setDisplay} />}
                <WidthToggle width={width} onChange={setWidth} />
                <ViewToggle view={view} onChange={setView} />
              </div>
            </div>
            <CurrentRefinements />
            <Results<THit>
              cacheKey={resolvedCacheKey}
              renderHit={renderHit}
              view={view}
              display={display}
              noResultsText={noResultsText}
              gridVariant={gridVariant}
              skeletonCount={Math.min(hitsPerPage, 12)}
            />
          </div>
        </section>
      </div>
    </InstantSearchNext>
  );
}