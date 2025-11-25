// components/modules/SearchContent/Books.tsx
"use client";

import React from "react";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { useHits, Configure } from "react-instantsearch";
import BookCard from "@/components/modules/Cards/BookCard";
import {
  SearchBox,
  Stats,
  Pagination,
  SortBy,
  RefinementList,
  MobileFilterModal,
  CurrentRefinements,
} from "@/components/algolia";
import { BookHit } from "@/types/algolia";
import { createAlgoliaRouting } from "@/lib/algolia/routing";
import StickyControls from "./StickyControls";
import styles from "./styles.module.scss";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!
);

const SORT_OPTIONS = [
  { label: "Most Recent", value: "books40k" },
  { label: "Title A-Z", value: "books40k_title_asc" },
  { label: "Title Z-A", value: "books40k_title_desc" },
  { label: "Publication Date ↓", value: "books40k_date_desc" },
  { label: "Publication Date ↑", value: "books40k_date_asc" },
];

const FILTERS = [
  { attribute: "format", label: "Format" },
  { attribute: "authors.name", label: "Author", searchable: true },
  { attribute: "series.title", label: "Series", searchable: true },
  { attribute: "factions.name", label: "Faction", searchable: true },
  { attribute: "era.name", label: "Era" },
];

function Results({ noResultsText }: { noResultsText: string }) {
  const { items } = useHits<BookHit>();

  if (items.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>{noResultsText}</p>
      </div>
    );
  }

  return (
    <div className={styles.bookGrid}>
      {items.map((hit) => (
        <BookCard key={hit.objectID} book={hit} />
      ))}
    </div>
  );
}

interface BooksContentProps {
  filters?: string;
  placeholder?: string;
  noResultsText?: string;
}

export default function BooksContent({
  filters,
  placeholder = "Search books...",
  noResultsText = "No books match your search.",
}: BooksContentProps) {
  const routing = React.useMemo(() => createAlgoliaRouting("books40k"), []);

  return (
    <InstantSearchNext
      indexName="books40k"
      searchClient={searchClient}
      routing={routing}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={25} filters={filters} />

      <div className={styles.contentWrapper}>
        <StickyControls>
          <SearchBox placeholder={placeholder} />

          <div className={styles.mobileFilters}>
            <MobileFilterModal filters={FILTERS} />
          </div>

          <div className={styles.desktopFilters}>
            {FILTERS.map((filter) => (
              <RefinementList
                key={filter.attribute}
                attribute={filter.attribute}
                title={filter.label}
                searchable={filter.searchable}
              />
            ))}
          </div>

          <SortBy items={SORT_OPTIONS} />
        </StickyControls>

        <section className="container">
          <div className={styles.mainContent}>
            <Stats singularLabel="Publication" pluralLabel="Publications" />
            <CurrentRefinements />
            <Results noResultsText={noResultsText} />
            <Pagination />
          </div>
        </section>
      </div>
    </InstantSearchNext>
  );
}