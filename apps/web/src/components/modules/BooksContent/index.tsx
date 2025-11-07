// app/books/BooksContent.tsx
"use client";

import React from "react";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import {
  useHits,
  useSearchBox,
  useSortBy,
  useRefinementList,
  usePagination,
  useStats,
  Configure,
} from "react-instantsearch";
import BookGrid from "@/components/modules/BookGrid";
import { BookCardData } from "@/components/modules/Cards/BookCard";
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
          // crop: null,
          // hotspot: null,
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

function SearchBox() {
  const { query, refine } = useSearchBox();
  const [value, setValue] = React.useState(query);

  React.useEffect(() => {
    setValue(query);
  }, [query]);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      refine(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [value, refine]);

  return (
    <div className={styles.searchBox}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search books..."
        className={styles.searchInput}
      />
    </div>
  );
}

function SortByDropdown() {
  const { currentRefinement, options, refine } = useSortBy({
    items: [
      { label: "Most Recent", value: "books40k" },
      { label: "Title A-Z", value: "books40k_title_asc" },
      { label: "Title Z-A", value: "books40k_title_desc" },
      { label: "Publication Date (Newest)", value: "books40k_date_desc" },
      { label: "Publication Date (Oldest)", value: "books40k_date_asc" },
    ],
  });

  return (
    <div className={styles.sortBy}>
      <label htmlFor="sort-by">Sort by:</label>
      <select
        id="sort-by"
        value={currentRefinement}
        onChange={(e) => refine(e.target.value)}
        className={styles.select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormatFilter() {
  const { items, refine } = useRefinementList({
    attribute: "format",
    sortBy: ["name:asc"],
  });

  if (items.length === 0) return null;

  return (
    <div className={styles.filter}>
      <h3>Format</h3>
      <ul className={styles.filterList}>
        {items.map((item) => (
          <li key={item.value}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
              />
              <span>
                {item.label}{" "}
                <span className={styles.count}>({item.count})</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FactionFilter() {
  const { items, refine } = useRefinementList({
    attribute: "factions.name",
    sortBy: ["name:asc"],
    limit: 20,
  });

  if (items.length === 0) return null;

  return (
    <div className={styles.filter}>
      <h3>Faction</h3>
      <ul className={styles.filterList}>
        {items.map((item) => (
          <li key={item.value}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
              />
              <span>
                {item.label}{" "}
                <span className={styles.count}>({item.count})</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EraFilter() {
  const { items, refine } = useRefinementList({
    attribute: "era.name",
    sortBy: ["name:asc"],
  });

  if (items.length === 0) return null;

  return (
    <div className={styles.filter}>
      <h3>Era</h3>
      <ul className={styles.filterList}>
        {items.map((item) => (
          <li key={item.value}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
              />
              <span>
                {item.label}{" "}
                <span className={styles.count}>({item.count})</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pagination() {
  const { currentRefinement, nbPages, pages, isFirstPage, isLastPage, refine } =
    usePagination();

  if (nbPages <= 1) return null;

  return (
    <div className={styles.pagination}>
      <button
        onClick={() => refine(currentRefinement - 1)}
        disabled={isFirstPage}
        className={styles.paginationButton}
      >
        Previous
      </button>

      <div className={styles.paginationPages}>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => refine(page)}
            className={`${styles.paginationButton} ${
              page === currentRefinement ? styles.active : ""
            }`}
          >
            {page + 1}
          </button>
        ))}
      </div>

      <button
        onClick={() => refine(currentRefinement + 1)}
        disabled={isLastPage}
        className={styles.paginationButton}
      >
        Next
      </button>
    </div>
  );
}

function Stats() {
  const { nbHits } = useStats();
  return (
    <div className={styles.stats}>
      {nbHits.toLocaleString()} {nbHits === 1 ? "book" : "books"}
    </div>
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
          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* Search and Sort Controls */}
            <div className={styles.controls}>
              <SearchBox />
              <SortByDropdown />
            </div>

            {/* Filters */}
            {/* <div className={styles.filters}>
              <div className={styles.filtersHeader}>
                <h2>Filters</h2>
              </div>

              <FormatFilter />
              <FactionFilter />
              <EraFilter />
            </div> */}

            {/* Stats */}
            <Stats />

            {/* Results Grid */}
            <Results />

            {/* Pagination */}
            <Pagination />
          </div>
        </div>
      </section>
    </InstantSearchNext>
  );
}
