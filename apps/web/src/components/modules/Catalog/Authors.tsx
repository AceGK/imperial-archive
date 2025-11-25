// components/modules/SearchContent/Authors.tsx
"use client";

import React from "react";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { useHits, Configure } from "react-instantsearch";
import AuthorCard from "@/components/modules/Cards/AuthorCard";
import {
  SearchBox,
  Stats,
  Pagination,
  SortBy,
  RefinementList,
  MobileFilterModal,
  CurrentRefinements,
} from "@/components/algolia";
import { createAlgoliaRouting } from "@/lib/algolia/routing";
import StickyControls from "./StickyControls";
import styles from "./styles.module.scss";

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!
);

const SORT_OPTIONS = [
  { label: "Name A-Z", value: "authors40k" },
  { label: "Name Z-A", value: "authors40k_name_desc" },
  { label: "Most Works", value: "authors40k_bookcount_desc" },
  { label: "Fewest Works", value: "authors40k_bookcount_asc" },
];

const FILTERS = [
  { attribute: "bookFormats", label: "Format" },
  { attribute: "seriesTitles", label: "Series", searchable: true},
  { attribute: "factionNames", label: "Faction", searchable: true},
  { attribute: "eraNames", label: "Era" },
];

type AuthorHit = {
  objectID: string;
  name: string;
  slug: string;
  bio: string;
  image: { url: string | null; alt: string | null };
  bookCount: number;
};

function Results({ noResultsText }: { noResultsText: string }) {
  const { items } = useHits<AuthorHit>();

  if (items.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>{noResultsText}</p>
      </div>
    );
  }

  return (
    <div className={styles.authorGrid}>
      {items.map((author) => (
        <AuthorCard
          key={author.objectID}
          name={author.name}
          slug={author.slug}
          count={author.bookCount}
          image={author.image.url ? { url: author.image.url, aspect: 1 } : undefined}
        />
      ))}
    </div>
  );
}

interface AuthorsContentProps {
  filters?: string;
  placeholder?: string;
  noResultsText?: string;
}

export default function AuthorsContent({
  filters,
  placeholder = "Search authors...",
  noResultsText = "No authors match your search.",
}: AuthorsContentProps) {
  const routing = React.useMemo(() => createAlgoliaRouting("authors40k"), []);

  return (
    <InstantSearchNext
      indexName="authors40k"
      searchClient={searchClient}
      routing={routing}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={24} filters={filters} />

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
            <Stats singularLabel="author" pluralLabel="authors" />
            <CurrentRefinements />
            <Results noResultsText={noResultsText} />
            <Pagination />
          </div>
        </section>
      </div>
    </InstantSearchNext>
  );
}