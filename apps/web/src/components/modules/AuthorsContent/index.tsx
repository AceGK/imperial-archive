// components/modules/AuthorsContent/index.tsx
"use client";

import React from "react";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { useHits, useRefinementList, Configure } from "react-instantsearch";
import AuthorCard from "@/components/modules/Cards/AuthorCard";
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
  { label: "Name A-Z", value: "authors40k" }, // Default
  { label: "Name Z-A", value: "authors40k_name_desc" },
  { label: "Most Works", value: "authors40k_bookcount_desc" },
  { label: "Fewest Works", value: "authors40k_bookcount_asc" },
];

const transformAuthorLabel = (attribute: string): string => {
  const labelMap: Record<string, string> = {
    bookFormats: "Format",
    seriesTitles: "Series",
    factionNames: "Faction",
    eraNames: "Era",
  };
  
  return labelMap[attribute] || attribute;
};

type AuthorHit = {
  objectID: string;
  name: string;
  slug: string;
  bio: string;
  image: {
    url: string | null;
    alt: string | null;
  };
  bookFormats: string[];
  seriesSlugs: string[];
  seriesTitles: string[];
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
  showSeriesFilter?: boolean;
  showFactionFilter?: boolean;
  showEraFilter?: boolean;
}

function FilterControls({
  showFormatFilter = true,
  showSeriesFilter = true,
  showFactionFilter = true,
  showEraFilter = true,
}: FilterControlsProps) {
  const formatFilter = useRefinementList({
    attribute: "bookFormats",
    sortBy: ["name:asc"],
  });

  const seriesFilter = useRefinementList({
    attribute: "seriesTitles",
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
    (showSeriesFilter && seriesFilter.items.some((item) => item.isRefined)) ||
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
    ...(showSeriesFilter
      ? [
          {
            label: "Series",
            items: seriesFilter.items,
            refine: seriesFilter.refine,
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
        {showSeriesFilter && (
          <RefinementList
            attribute="seriesTitles"
            title="Series"
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
  noResultsText = "No authors match your search.",
}: ResultsProps) {
  const { hits } = useHits() as { hits: AuthorHit[] };

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
      {hits.map((author) => (
        <AuthorCard
          key={author.objectID}
          name={author.name}
          slug={author.slug}
          count={author.bookCount}
          image={
            author.image.url
              ? {
                  url: author.image.url,
                  aspect: 1,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

interface AuthorsContentProps {
  filterByFormat?: string;
  filterBySeries?: string;
  filterByFaction?: string;
  filterByEra?: string;
  placeholder?: string;
  noResultsText?: string;
}

export default function AuthorsContent({
  filterByFormat,
  filterBySeries,
  filterByFaction,
  filterByEra,
  placeholder = "Search authors...",
  noResultsText = "No authors match your search.",
}: AuthorsContentProps) {
  const isNavVisible = useScrollVisibility();
  const [isSticky, setIsSticky] = React.useState(false);
  const [isScrollingDown, setIsScrollingDown] = React.useState(true);
  const controlsRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const lastScrollY = React.useRef(0);

  const routing = React.useMemo(() => createAlgoliaRouting("authors40k"), []);

  // Build filters string
  const filters = React.useMemo(() => {
    const filterParts = [];
    if (filterByFormat) filterParts.push(`bookFormats:"${filterByFormat}"`);
    if (filterBySeries) filterParts.push(`seriesTitles:"${filterBySeries}"`);
    if (filterByFaction) filterParts.push(`factionNames:"${filterByFaction}"`);
    if (filterByEra) filterParts.push(`eraNames:"${filterByEra}"`);
    return filterParts.length > 0 ? filterParts.join(" AND ") : undefined;
  }, [filterByFormat, filterBySeries, filterByFaction, filterByEra]);

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
      indexName="authors40k"
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
                showSeriesFilter={!filterBySeries}
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
            <Stats singularLabel="author" pluralLabel="authors" />
            <CurrentRefinements transformLabel={transformAuthorLabel} />
            <Results noResultsText={noResultsText} />
            <Pagination />
          </div>
        </section>
      </div>
    </InstantSearchNext>
  );
}
