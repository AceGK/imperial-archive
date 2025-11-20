// components/modules/SearchContent/Books.tsx
"use client";

import React from "react";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { useHits, useRefinementList, Configure } from "react-instantsearch";
import BookGrid from "@/components/modules/BookGrid";
import { BookCardData } from "@/components/modules/Cards/BookCard";
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
import { BookHit } from "@/types/algolia";
import { createAlgoliaRouting } from "@/lib/algolia/routing";
import styles from "./styles.module.scss";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";


const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!;

const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);

const SORT_OPTIONS = [
  { label: "Most Recent", value: "books40k" },
  { label: "Title A-Z", value: "books40k_title_asc" },
  { label: "Title Z-A", value: "books40k_title_desc" },
  { label: "Publication Date ↓", value: "books40k_date_desc" },
  { label: "Publication Date ↑", value: "books40k_date_asc" },
];

function convertToBookCardData(hit: BookHit): BookCardData {
  return {
    _id: hit.objectID,
    title: hit.title,
    slug: hit.slug,
    format: hit.format,
    formatValue: hit.format?.toLowerCase().replace(" ", "_") || null,
    publication_date: hit.publicationDate,
    description: hit.description,
    story: hit.story,
    image: hit.image.url
      ? {
          alt: hit.image.alt || hit.title,
          credit: null,
          asset: {
            _id: "",
            url: hit.image.url,
            metadata: {
              lqip: null,
              dimensions: { aspectRatio: 1.5 },
            },
          },
        }
      : null,
    authors: hit.authors || [],
    factions: hit.factions?.map((f) => f.name) || [],
    series: hit.series
      ? [
          {
            name: hit.series.title,
            slug: hit.series.slug,
            number: null,
          },
        ]
      : [],
  };
}

interface FilterControlsProps {
  showAuthorFilter?: boolean;
  showFactionFilter?: boolean;
  showEraFilter?: boolean;
}

function FilterControls({ showAuthorFilter = true, showFactionFilter = true, showEraFilter = true }: FilterControlsProps) {
  const formatFilter = useRefinementList({
    attribute: "format",
    sortBy: ["name:asc"],
  });

  const authorFilter = useRefinementList({
    attribute: "authors.name",
    sortBy: ["name:asc"],
    limit: 100,
    showMore: true,
    showMoreLimit: 200,
  });

  const seriesFilter = useRefinementList({
    attribute: "series.title",
    sortBy: ["name:asc"],
    limit: 100,
    showMore: true,
    showMoreLimit: 200,
  });

  const factionFilter = useRefinementList({
    attribute: "factions.name",
    sortBy: ["name:asc"],
    limit: 50,
  });

  const eraFilter = useRefinementList({
    attribute: "era.name",
    sortBy: ["name:asc"],
  });

  const hasActiveFilters =
    formatFilter.items.some((item) => item.isRefined) ||
    (showAuthorFilter && authorFilter.items.some((item) => item.isRefined)) ||
    (showFactionFilter && factionFilter.items.some((item) => item.isRefined)) ||
    (showEraFilter && eraFilter.items.some((item) => item.isRefined)) ||
    seriesFilter.items.some((item) => item.isRefined);

  const filterSections: FilterSection[] = [
    {
      label: "Format",
      items: formatFilter.items,
      refine: formatFilter.refine,
      searchable: false,
    },
    ...(showAuthorFilter ? [{
      label: "Author",
      items: authorFilter.items,
      refine: authorFilter.refine,
      searchable: true,
    }] : []),
    ...(showFactionFilter ? [{
      label: "Faction",
      items: factionFilter.items,
      refine: factionFilter.refine,
      searchable: true,
    }] : []),
    ...(showEraFilter ? [{
      label: "Era",
      items: eraFilter.items,
      refine: eraFilter.refine,
      searchable: false,
    }] : []),
    {
      label: "Series",
      items: seriesFilter.items,
      refine: seriesFilter.refine,
      searchable: true,
    },
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
        <RefinementList attribute="format" title="Format" />
        {showAuthorFilter && (
          <RefinementList
            attribute="authors.name"
            title="Author"
            searchable
            limit={100}
            showMore
            showMoreLimit={200}
          />
        )}
        <RefinementList
          attribute="series.title"
          title="Series"
          searchable
          limit={100}
          showMore
          showMoreLimit={200}
        />
        {showFactionFilter && (
          <RefinementList
            attribute="factions.name"
            title="Faction"
            searchable
            limit={50}
          />
        )}
        {showEraFilter && (
          <RefinementList attribute="era.name" title="Era" />
        )}
      </div>
    </>
  );
}

interface ResultsProps {
  noResultsText?: string;
}

function Results({ noResultsText = "No books match your search." }: ResultsProps) {
  const { hits } = useHits() as { hits: BookHit[] };
  const books = hits.map(convertToBookCardData);

  return <BookGrid books={books} noResultsText={noResultsText} />;
}

interface BooksContentProps {
  filterByAuthor?: string;
  filterByFaction?: string;
  filterByFactionGroup?: string[];
  filterByEra?: string;
  placeholder?: string;
  noResultsText?: string;
}

export default function BooksContent({ 
  filterByAuthor,
  filterByFaction,
  filterByFactionGroup,
  filterByEra,
  placeholder = "Search books...",
  noResultsText = "No books match your search."
}: BooksContentProps) {
  const isNavVisible = useScrollVisibility();
  const [isSticky, setIsSticky] = React.useState(false);
  const [isScrollingDown, setIsScrollingDown] = React.useState(true);
  const controlsRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const lastScrollY = React.useRef(0);

  const routing = React.useMemo(
    () => createAlgoliaRouting("books40k"),
    []
  );

  // Build filters string
  const filters = React.useMemo(() => {
    const filterParts = [];
    if (filterByAuthor) filterParts.push(`authors.name:"${filterByAuthor}"`);
    if (filterByFaction) filterParts.push(`factions.name:"${filterByFaction}"`);
    if (filterByEra) filterParts.push(`era.name:"${filterByEra}"`);
    if (filterByFactionGroup && filterByFactionGroup.length > 0) {
      // OR filter: show books that have ANY of these factions
      const factionFilters = filterByFactionGroup
        .map(name => `factions.name:"${name}"`)
        .join(' OR ');
      filterParts.push(`(${factionFilters})`);
    }
    return filterParts.length > 0 ? filterParts.join(' AND ') : undefined;
  }, [filterByAuthor, filterByFaction, filterByFactionGroup, filterByEra]);

  // Track scroll direction
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrollingDown(currentScrollY > lastScrollY.current);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer for sticky detection
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: [1], 
      rootMargin: `0px 0px 0px 0px`
       }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const shouldTranslate = isSticky && isNavVisible && (isScrollingDown || isSticky);

  return (
    <InstantSearchNext
      indexName="books40k"
      searchClient={searchClient}
      routing={routing}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure 
        hitsPerPage={25}
        {...(filters && { filters })}
      />

      <div className={styles.contentWrapper}>
        {/* Invisible sentinel element */}
        <div ref={sentinelRef} style={{ height: '1px', marginTop: '-1px' }} />
        
        {/* Full-width sticky controls */}
        <div 
          ref={controlsRef}
          className={`${styles.controls} ${shouldTranslate ? styles.navVisible : ''}`}
        >
          <div className="container">
            <div className={styles.controlsInner}>
              <SearchBox placeholder={placeholder} />
              <FilterControls 
                showAuthorFilter={!filterByAuthor} 
                showFactionFilter={!filterByFaction && !filterByFactionGroup}
                showEraFilter={!filterByEra}
              />
              <SortBy items={SORT_OPTIONS} />
            </div>
          </div>
        </div>

        {/* Regular container for results */}
        <section className="container">
          <div className={styles.mainContent}>
            <Stats singularLabel="book" pluralLabel="books" />
            <CurrentRefinements />
            <Results noResultsText={noResultsText} />
            <Pagination />
          </div>
        </section>
      </div>
    </InstantSearchNext>
  );
}