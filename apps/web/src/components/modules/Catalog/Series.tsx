// components/modules/SearchContent/Series.tsx
"use client";

import React from "react";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { useHits, Configure } from "react-instantsearch";
import SeriesCard from "@/components/modules/Cards/SeriesCard";
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
  { label: "Title A-Z", value: "series40k" },
  { label: "Title Z-A", value: "series40k_title_desc" },
];

const FILTERS = [
  { attribute: "bookFormats", label: "Format" },
  { attribute: "authorNames", label: "Author", searchable: true, showMore: true, showMoreLimit: 200 },
  { attribute: "factionNames", label: "Faction", searchable: true, showMore: true },
  { attribute: "eraNames", label: "Era" },
];

type SeriesHit = {
  objectID: string;
  title: string;
  slug: string;
  subtitle: string;
  image: { url: string | null; alt: string | null };
  bookCount: number;
};

function Results({ noResultsText }: { noResultsText: string }) {
  const { items } = useHits<SeriesHit>();

  if (items.length === 0) {
    return (
      <div className={styles.noResults}>
        <p>{noResultsText}</p>
      </div>
    );
  }

  return (
    <div className={styles.seriesGrid}>
      {items.map((series) => (
        <SeriesCard
          key={series.objectID}
          title={series.title}
          slug={series.slug}
          image={
            series.image.url
              ? {
                  alt: series.image.alt || series.title,
                  asset: { _id: "", url: series.image.url, metadata: undefined },
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

interface SeriesContentProps {
  filters?: string;
  placeholder?: string;
  noResultsText?: string;
}

export default function SeriesContent({
  filters,
  placeholder = "Search series...",
  noResultsText = "No series match your search.",
}: SeriesContentProps) {
  const routing = React.useMemo(() => createAlgoliaRouting("series40k"), []);

  return (
    <InstantSearchNext
      indexName="series40k"
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
            <Stats singularLabel="series" pluralLabel="series" />
            <CurrentRefinements />
            <Results noResultsText={noResultsText} />
            <Pagination />
          </div>
        </section>
      </div>
    </InstantSearchNext>
  );
}