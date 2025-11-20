// components/modules/SearchContent/Series.tsx
"use client";

import React from "react";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { useHits, useRefinementList, Configure } from "react-instantsearch";
import SeriesCard from "@/components/modules/Cards/SeriesCard";
import {
  SearchBox,
  Stats,
  Pagination,
  SortBy,
  RefinementList,
  MobileFilterModal,
  CurrentRefinements,
  type FilterSection,
} from "@/components/algolia";
import { createAlgoliaRouting } from "@/lib/algolia/routing";
import styles from "./styles.module.scss";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!;

const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);

const SORT_OPTIONS = [
  { label: "Title A-Z", value: "series40k" },
  { label: "Title Z-A", value: "series40k_title_desc" },
];

type SeriesHit = {
  objectID: string;
  title: string;
  slug: string;
  subtitle: string;
  image: {
    url: string | null;
    alt: string | null;
  };
  bookFormats: string[];
  authorSlugs: string[];
  authorNames: string[];
  factionSlugs: string[];
  factionNames: string[];
  eraSlugs: string[];
  eraNames: string[];
  bookCount: number;
  _createdAt: string;
  _updatedAt: string;
};

interface FilterControlsProps {
  showFormatFilter?: boolean;
  showAuthorFilter?: boolean;
  showFactionFilter?: boolean;
  showEraFilter?: boolean;
}

function FilterControls({
  showFormatFilter = true,
  showAuthorFilter = true,
  showFactionFilter = true,
  showEraFilter = true,
}: FilterControlsProps) {
  const formatFilter = useRefinementList({
    attribute: "bookFormats",
    sortBy: ["name:asc"],
  });

  const authorFilter = useRefinementList({
    attribute: "authorNames",
    sortBy: ["name:asc"],
    limit: 100,
    showMore: true,
    showMoreLimit: 200,
  });

  const factionFilter = useRefinementList({
    attribute: "factionNames",
    sortBy: ["name:asc"],
    limit: 50,
  });

  const eraFilter = useRefinementList({
    attribute: "eraNames",
    sortBy: ["name:asc"],
  });

  const hasActiveFilters =
    (showFormatFilter && formatFilter.items.some((item) => item.isRefined)) ||
    (showAuthorFilter && authorFilter.items.some((item) => item.isRefined)) ||
    (showFactionFilter && factionFilter.items.some((item) => item.isRefined)) ||
    (showEraFilter && eraFilter.items.some((item) => item.isRefined));

  const filterSections: FilterSection[] = [
    ...(showFormatFilter
      ? [
          {
            label: "Format",
            items: formatFilter.items,
            refine: formatFilter.refine,
            searchable: false,
          },
        ]
      : []),
    ...(showAuthorFilter
      ? [
          {
            label: "Author",
            items: authorFilter.items,
            refine: authorFilter.refine,
            searchable: true,
          },
        ]
      : []),
    ...(showFactionFilter
      ? [
          {
            label: "Faction",
            items: factionFilter.items,
            refine: factionFilter.refine,
            searchable: true,
          },
        ]
      : []),
    ...(showEraFilter
      ? [
          {
            label: "Era",
            items: eraFilter.items,
            refine: eraFilter.refine,
            searchable: false,
          },
        ]
      : []),
  ];

  return (
    <>
      <div className={styles.mobileFilters}>
        <MobileFilterModal
          sections={filterSections}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <div className={styles.desktopFilters}>
        {showFormatFilter && (
          <RefinementList attribute="bookFormats" title="Format" />
        )}
        {showAuthorFilter && (
          <RefinementList
            attribute="authorNames"
            title="Author"
            searchable
            limit={100}
            showMore
            showMoreLimit={200}
          />
        )}
        {showFactionFilter && (
          <RefinementList
            attribute="factionNames"
            title="Faction"
            searchable
            limit={50}
          />
        )}
        {showEraFilter && <RefinementList attribute="eraNames" title="Era" />}
      </div>
    </>
  );
}

interface ResultsProps {
  noResultsText?: string;
}

function Results({
  noResultsText = "No series match your search.",
}: ResultsProps) {
  const { hits } = useHits() as { hits: SeriesHit[] };

  if (hits.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 0", opacity: 0.7 }}>
        <p>{noResultsText}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "1rem",
        marginTop: "2rem",
      }}
    >
      {hits.map((series) => (
        <SeriesCard
          key={series.objectID}
          title={series.title}
          slug={series.slug}
          image={
            series.image.url
              ? {
                  alt: series.image.alt || series.title,
                  asset: {
                    _id: "",
                    url: series.image.url,
                    metadata: {
                      lqip: undefined, // ← Changed from null
                      dimensions: {
                        width: 800,
                        height: 533,
                      },
                    },
                  },
                }
              : undefined
          }
          countLabel={
            series.bookCount
              ? `${series.bookCount} book${series.bookCount > 1 ? "s" : ""}`
              : undefined
          }
          compact
        />
      ))}
    </div>
  );
}

const transformSeriesLabel = (attribute: string): string => {
  const labelMap: Record<string, string> = {
    bookFormats: "Format",
    authorNames: "Author",
    factionNames: "Faction",
    eraNames: "Era",
  };

  return labelMap[attribute] || attribute;
};

interface SeriesContentProps {
  filterByFormat?: string;
  filterByAuthor?: string;
  filterByFaction?: string;
  filterByEra?: string;
  placeholder?: string;
  noResultsText?: string;
}

export default function SeriesContent({
  filterByFormat,
  filterByAuthor,
  filterByFaction,
  filterByEra,
  placeholder = "Search series...",
  noResultsText = "No series match your search.",
}: SeriesContentProps) {
  const isNavVisible = useScrollVisibility();
  const [isSticky, setIsSticky] = React.useState(false);
  const [isScrollingDown, setIsScrollingDown] = React.useState(true);
  const controlsRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const lastScrollY = React.useRef(0);

  const routing = React.useMemo(() => createAlgoliaRouting("series40k"), []);

  // Build filters string
  const filters = React.useMemo(() => {
    const filterParts = [];
    if (filterByFormat) filterParts.push(`bookFormats:"${filterByFormat}"`);
    if (filterByAuthor) filterParts.push(`authorNames:"${filterByAuthor}"`);
    if (filterByFaction) filterParts.push(`factionNames:"${filterByFaction}"`);
    if (filterByEra) filterParts.push(`eraNames:"${filterByEra}"`);
    return filterParts.length > 0 ? filterParts.join(" AND ") : undefined;
  }, [filterByFormat, filterByAuthor, filterByFaction, filterByEra]);

  // Track scroll direction
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrollingDown(currentScrollY > lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for sticky detection
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: [1], rootMargin: `0px 0px 0px 0px` }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const shouldTranslate =
    isSticky && isNavVisible && (isScrollingDown || isSticky);

  return (
    <InstantSearchNext
      indexName="series40k"
      searchClient={searchClient}
      routing={routing}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={24} {...(filters && { filters })} />

      <div className={styles.contentWrapper}>
        {/* Invisible sentinel element */}
        <div ref={sentinelRef} style={{ height: "1px", marginTop: "-1px" }} />

        {/* Full-width sticky controls */}
        <div
          ref={controlsRef}
          className={`${styles.controls} ${shouldTranslate ? styles.navVisible : ""}`}
        >
          <div className="container">
            <div className={styles.controlsInner}>
              <SearchBox placeholder={placeholder} />
              <FilterControls
                showFormatFilter={!filterByFormat}
                showAuthorFilter={!filterByAuthor}
                showFactionFilter={!filterByFaction}
                showEraFilter={!filterByEra}
              />
              <SortBy items={SORT_OPTIONS} />
            </div>
          </div>
        </div>

        {/* Regular container for results */}
        <section className="container">
          <div className={styles.mainContent}>
            <Stats singularLabel="series" pluralLabel="series" />
            <CurrentRefinements transformLabel={transformSeriesLabel} />
            <Results noResultsText={noResultsText} />
            <Pagination />
          </div>
        </section>
      </div>
    </InstantSearchNext>
  );
}
