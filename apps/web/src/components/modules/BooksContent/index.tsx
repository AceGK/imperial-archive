// app/books/BooksContent.tsx
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
  type FilterSection,
} from "@/components/algolia";
import styles from "./styles.module.scss";

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!;

const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);

// Type for Algolia book hit
type BookHit = {
  objectID: string;
  title: string;
  slug: string;
  format: string | null;
  publicationDate: string | null;
  description: string;
  story: string;
  image: {
    url: string | null;
    alt: string | null;
  };
  authors: Array<{
    name: string;
    slug: string;
  }>;
  factions: Array<{
    name: string;
    slug: string;
    iconId?: string | null;
  }>;
  era: {
    name: string;
    slug: string;
  } | null;
  series: {
    title: string;
    slug: string;
  } | null;
  _createdAt: string;
  _updatedAt: string;
};

// Convert Algolia hit to BookCardData format
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

// Sort options for books
const SORT_OPTIONS = [
  { label: "Most Recent", value: "books40k" },
  { label: "Title A-Z", value: "books40k_title_asc" },
  { label: "Title Z-A", value: "books40k_title_desc" },
  { label: "Publication Date (Newest)", value: "books40k_date_desc" },
  { label: "Publication Date (Oldest)", value: "books40k_date_asc" },
];

function FilterControls() {

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

  const factionFilter = useRefinementList({
    attribute: "factions.name",
    sortBy: ["name:asc"],
    limit: 50,
  });

  const eraFilter = useRefinementList({
    attribute: "era.name",
    sortBy: ["name:asc"],
  });

  const seriesFilter = useRefinementList({
    attribute: "series.title",
    sortBy: ["name:asc"],
    limit: 100,
    showMore: true,
    showMoreLimit: 200,
  });

  // Check if any filters are active
  const hasActiveFilters =
    formatFilter.items.some((item) => item.isRefined) ||
    authorFilter.items.some((item) => item.isRefined) ||
    factionFilter.items.some((item) => item.isRefined) ||
    eraFilter.items.some((item) => item.isRefined) ||
    seriesFilter.items.some((item) => item.isRefined);

  // Prepare sections for mobile filter modal
  const filterSections: FilterSection[] = [
    {
      label: "Format",
      items: formatFilter.items,
      refine: formatFilter.refine,
      searchable: false,
    },
    {
      label: "Author",
      items: authorFilter.items,
      refine: authorFilter.refine,
      searchable: true,
    },
    {
      label: "Faction",
      items: factionFilter.items,
      refine: factionFilter.refine,
      searchable: true,
    },
    {
      label: "Era",
      items: eraFilter.items,
      refine: eraFilter.refine,
      searchable: false,
    },
    {
      label: "Series",
      items: seriesFilter.items,
      refine: seriesFilter.refine,
      searchable: true,
    },
  ];

  return (
    <>
      {/* Mobile: Combined filter modal */}
      <div className={styles.mobileFilters}>
        <MobileFilterModal
          sections={filterSections}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Desktop: Individual filter dropdowns */}
      <div className={styles.desktopFilters}>
        <RefinementList attribute="format" title="Format" />
        <RefinementList
          attribute="authors.name"
          title="Author"
          searchable
          limit={100}
          showMore
          showMoreLimit={200}
        />
        <RefinementList
          attribute="factions.name"
          title="Faction"
          searchable
          limit={50}
        />
        <RefinementList attribute="era.name" title="Era" />
        <RefinementList
          attribute="series.title"
          title="Series"
          searchable
          limit={100}
          showMore
          showMoreLimit={200}
        />
      </div>
    </>
  );
}

function Results() {
  const { hits } = useHits() as { hits: BookHit[] };
  const books = hits.map(convertToBookCardData);

  return <BookGrid books={books} noResultsText="No books match your search." />;
}

export default function BooksContent() {
  return (
    <InstantSearchNext
      indexName="books40k"
      searchClient={searchClient}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={25} />

      <section className="container">
        <div className={styles.contentWrapper}>
          <div className={styles.mainContent}>

            {/* Search and Controls */}
            <div className={styles.controls}>
              <SearchBox placeholder="Search books..." />
              <div className={styles.controlsRight}>
                <FilterControls />
                <SortBy items={SORT_OPTIONS} />
              </div>
            </div>

            <Stats singularLabel="book" pluralLabel="books" />
            <Results />
            <Pagination />
            
          </div>
        </div>
      </section>
    </InstantSearchNext>
  );
}