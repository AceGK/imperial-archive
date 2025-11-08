// components/modules/BooksContent/index.tsx
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
const routing = createAlgoliaRouting("books40k");

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

const SORT_OPTIONS = [
  { label: "Most Recent", value: "books40k" },
  { label: "Title A-Z", value: "books40k_title_asc" },
  { label: "Title Z-A", value: "books40k_title_desc" },
  { label: "Publication Date ↓", value: "books40k_date_desc" },
  { label: "Publication Date ↑", value: "books40k_date_asc" },
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
    authorFilter.items.some((item) => item.isRefined) ||
    factionFilter.items.some((item) => item.isRefined) ||
    eraFilter.items.some((item) => item.isRefined) ||
    seriesFilter.items.some((item) => item.isRefined);

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
      <div className={styles.mobileFilters}>
        <MobileFilterModal
          sections={filterSections}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

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
          attribute="series.title"
          title="Series"
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
  const isNavVisible = useScrollVisibility();

  return (
    <InstantSearchNext
      indexName="books40k"
      searchClient={searchClient}
      routing={routing}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={25} />

      <div className={styles.contentWrapper}>
        {/* Full-width sticky controls */}
        <div className={`${styles.controls} ${isNavVisible ? styles.navVisible : ''}`}>
          <div className="container">
            <div className={styles.controlsInner}>
              <SearchBox placeholder="Search books..." />
              <FilterControls />
              <SortBy items={SORT_OPTIONS} />
            </div>
          </div>
        </div>

        {/* Regular container for results */}
        <section className="container">
          <div className={styles.mainContent}>
            <Stats singularLabel="book" pluralLabel="books" />
            <CurrentRefinements />
            <Results />
            <Pagination />
          </div>
        </section>
      </div>
    </InstantSearchNext>
  );
}