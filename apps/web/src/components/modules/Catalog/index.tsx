// components/modules/Catalog/index.tsx
"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
// Full rows
// ============================================

/**
 * How many columns a grid lays out right now (1 for anything that isn't a
 * grid, like the list view). The book grid uses auto-fill, so this changes
 * with the window and the width toggle; it's measured, not hardcoded.
 * Starts at 1 so the server render and first client render show every hit.
 */
function useGridColumns() {
  const [columns, setColumns] = React.useState(1);
  // a callback ref, so it measures again whenever the grid mounts (it isn't
  // there while the first results load)
  const [el, setEl] = React.useState<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    if (!el) return;
    const measure = () => {
      const style = getComputedStyle(el);
      const count =
        style.display === "grid"
          ? style.gridTemplateColumns.split(" ").filter(Boolean).length
          : 1;
      setColumns(Math.max(1, count));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);

  return [columns, setEl] as const;
}

// ============================================
// Crawlable paging links
// ============================================

/**
 * Builds the href for a catalog page: the current URL with `page` set (left
 * off for page 1). With no search or filters that's a plain `?page=2`, which
 * robots.txt lets crawlers follow; filtered views stay blocked.
 */
function useCatalogPageHref() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (page: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("page");
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
}

/**
 * Click handler for a paging link: a plain click loads the results in place;
 * modified clicks (new tab, new window) follow the link as usual
 */
function inPlace(load: () => void) {
  return (event: React.MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    load();
  };
}

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
  const { items, results, showMore, showPrevious, isFirstPage, isLastPage } =
    useInfiniteHits<THit>({ cache });
  const pageHref = useCatalogPageHref();
  const [columns, gridRef] = useGridColumns();
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

  // 1-based pages of the first and last loaded hits, from their absolute
  // positions, so the links stay right after loading more or previous pages
  const perPage = results?.hitsPerPage || items.length || 1;
  const pageOf = (hit?: THit) => {
    const position = (hit as { __position?: number } | undefined)?.__position;
    return position ? Math.floor((position - 1) / perPage) + 1 : 1;
  };
  const firstPage = pageOf(items[0]);
  const lastPage = pageOf(items[items.length - 1]);

  // Hold back a part-filled last row until more results load, so the grid
  // always ends on a full row (36 per page leaves 1 over on a 5-column row).
  // The held-back hits lead the next row after "Load more"; on the last page
  // everything shows. The server render has every hit, so crawlers see all.
  const leftover = items.length % columns;
  const shown =
    !isLastPage && columns > 1 && items.length > columns && leftover > 0
      ? items.slice(0, items.length - leftover)
      : items;

  return (
    <div ref={ref} style={{ minHeight: minHeight || undefined }}>
      {!isFirstPage && (
        <div className={`${styles.loadMoreContainer} ${styles.loadPreviousContainer}`}>
          <Button
            href={pageHref(firstPage - 1)}
            onClick={inPlace(showPrevious)}
            prefetch={false}
            className={styles.loadMoreButton}
            variant="secondary"
            size="lg"
          >
            Load Previous
          </Button>
        </div>
      )}

      <div
        ref={gridRef}
        className={
          view === "list"
            ? styles.list
            : `${gridClasses[gridVariant]} ${gridVariant === "book" && display.layout === "card" ? styles.wideCards : ""}`
        }
      >
        {shown.map((hit) => (
          <React.Fragment key={hit.objectID}>
            {renderHit(hit, view, display)}
          </React.Fragment>
        ))}
      </div>

      {!isLastPage && (
        <div className={styles.loadMoreContainer}>
          {/* a real link, so crawlers can reach every page of the catalog;
              readers get the results appended in place */}
          <Button
            href={pageHref(lastPage + 1)}
            onClick={inPlace(showMore)}
            prefetch={false}
            className={styles.loadMoreButton}
            variant="secondary"
            size="lg"
          >
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