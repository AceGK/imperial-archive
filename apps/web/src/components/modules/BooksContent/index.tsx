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
  useClearRefinements,
} from "react-instantsearch";
import BookGrid from "@/components/modules/BookGrid";
import { BookCardData } from "@/components/modules/Cards/BookCard";
import { Dropdown } from "@/components/ui/Dropdown";
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

// Individual filter dropdown for desktop
function IndividualFilterDropdown({
  title,
  items,
  refine,
  searchable = false,
}: {
  title: string;
  items: Array<{ value: string; label: string; count: number; isRefined: boolean }>;
  refine: (value: string) => void;
  searchable?: boolean;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const hasActiveFilters = items.some((item) => item.isRefined);

  if (items.length === 0) return null;

  // Filter items based on search query
  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild aria-label={`Filter by ${title}`}>
        <button className={styles.filterButton}>
          {title}
          {hasActiveFilters && <span className={styles.badge} />}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </Dropdown.Trigger>

      <Dropdown.Content className={styles.individualFilterDropdown}>
        {searchable && (
          <div className={styles.filterSearchHeader}>
            <input
              type="search"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.filterSearchInput}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <div className={styles.filterItems}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <label key={item.value} className={styles.filterCheckbox}>
                <input
                  type="checkbox"
                  checked={item.isRefined}
                  onChange={() => refine(item.value)}
                />
                <span className={styles.filterLabel}>
                  {item.label}{" "}
                  <span className={styles.filterCount}>({item.count})</span>
                </span>
              </label>
            ))
          ) : (
            <div className={styles.noResults}>No results found</div>
          )}
        </div>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}

// Combined filter dropdown for mobile
function CombinedFilterDropdown() {
  const formatFilter = useRefinementList({
    attribute: "format",
    sortBy: ["name:asc"],
  });

  const authorFilter = useRefinementList({
    attribute: "authors.name",
    sortBy: ["name:asc"],
    limit: 200,
    showMore: true,
    showMoreLimit: 300,
  });

  const factionFilter = useRefinementList({
    attribute: "factions.name",
    sortBy: ["name:asc"],
    limit: 200,
    showMore: true,
    showMoreLimit: 300,
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

  const { canRefine, refine: clearRefinements } = useClearRefinements();

  const [authorSearch, setAuthorSearch] = React.useState("");
  const [factionSearch, setFactionSearch] = React.useState("");
  const [seriesSearch, setSeriesSearch] = React.useState("");

  const hasActiveFilters =
    formatFilter.items.some((item) => item.isRefined) ||
    authorFilter.items.some((item) => item.isRefined) ||
    factionFilter.items.some((item) => item.isRefined) ||
    eraFilter.items.some((item) => item.isRefined) ||
    seriesFilter.items.some((item) => item.isRefined);

  // Filter items based on search
  const filteredAuthors = authorSearch
    ? authorFilter.items.filter((item) =>
        item.label.toLowerCase().includes(authorSearch.toLowerCase())
      )
    : authorFilter.items;

  const filteredFactions = factionSearch
    ? factionFilter.items.filter((item) =>
        item.label.toLowerCase().includes(factionSearch.toLowerCase())
      )
    : factionFilter.items;

  const filteredSeries = seriesSearch
    ? seriesFilter.items.filter((item) =>
        item.label.toLowerCase().includes(seriesSearch.toLowerCase())
      )
    : seriesFilter.items;

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild aria-label="Filter books">
        <button className={styles.filterButton}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 4h12M4 8h8M6 12h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Filters
          {hasActiveFilters && <span className={styles.badge} />}
        </button>
      </Dropdown.Trigger>

      <Dropdown.Content className={styles.combinedFilterDropdown}>
        <div className={styles.filterDropdownHeader}>
          <span>Filters</span>
          {canRefine && (
            <button
              onClick={() => clearRefinements()}
              className={styles.clearAllButton}
              type="button"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Format Filter */}
        {formatFilter.items.length > 0 && (
          <div className={styles.filterSection}>
            <Dropdown.Label>Format</Dropdown.Label>
            <div className={styles.filterItems}>
              {formatFilter.items.map((item) => (
                <label key={item.value} className={styles.filterCheckbox}>
                  <input
                    type="checkbox"
                    checked={item.isRefined}
                    onChange={() => formatFilter.refine(item.value)}
                  />
                  <span className={styles.filterLabel}>
                    {item.label}{" "}
                    <span className={styles.filterCount}>({item.count})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Author Filter */}
        {authorFilter.items.length > 0 && (
          <div className={styles.filterSection}>
            <Dropdown.Label>Author</Dropdown.Label>
            <div className={styles.filterSectionSearch}>
              <input
                type="search"
                placeholder="Search authors..."
                value={authorSearch}
                onChange={(e) => setAuthorSearch(e.target.value)}
                className={styles.filterSectionSearchInput}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className={styles.filterItems}>
              {filteredAuthors.length > 0 ? (
                filteredAuthors.map((item) => (
                  <label key={item.value} className={styles.filterCheckbox}>
                    <input
                      type="checkbox"
                      checked={item.isRefined}
                      onChange={() => authorFilter.refine(item.value)}
                    />
                    <span className={styles.filterLabel}>
                      {item.label}{" "}
                      <span className={styles.filterCount}>({item.count})</span>
                    </span>
                  </label>
                ))
              ) : (
                <div className={styles.noResults}>No results found</div>
              )}
            </div>
          </div>
        )}

        {/* Faction Filter */}
        {factionFilter.items.length > 0 && (
          <div className={styles.filterSection}>
            <Dropdown.Label>Faction</Dropdown.Label>
            <div className={styles.filterSectionSearch}>
              <input
                type="search"
                placeholder="Search factions..."
                value={factionSearch}
                onChange={(e) => setFactionSearch(e.target.value)}
                className={styles.filterSectionSearchInput}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className={styles.filterItems}>
              {filteredFactions.length > 0 ? (
                filteredFactions.map((item) => (
                  <label key={item.value} className={styles.filterCheckbox}>
                    <input
                      type="checkbox"
                      checked={item.isRefined}
                      onChange={() => factionFilter.refine(item.value)}
                    />
                    <span className={styles.filterLabel}>
                      {item.label}{" "}
                      <span className={styles.filterCount}>({item.count})</span>
                    </span>
                  </label>
                ))
              ) : (
                <div className={styles.noResults}>No results found</div>
              )}
            </div>
          </div>
        )}

        {/* Era Filter */}
        {eraFilter.items.length > 0 && (
          <div className={styles.filterSection}>
            <Dropdown.Label>Era</Dropdown.Label>
            <div className={styles.filterItems}>
              {eraFilter.items.map((item) => (
                <label key={item.value} className={styles.filterCheckbox}>
                  <input
                    type="checkbox"
                    checked={item.isRefined}
                    onChange={() => eraFilter.refine(item.value)}
                  />
                  <span className={styles.filterLabel}>
                    {item.label}{" "}
                    <span className={styles.filterCount}>({item.count})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Series Filter */}
        {seriesFilter.items.length > 0 && (
          <div className={styles.filterSection}>
            <Dropdown.Label>Series</Dropdown.Label>
            <div className={styles.filterSectionSearch}>
              <input
                type="search"
                placeholder="Search series..."
                value={seriesSearch}
                onChange={(e) => setSeriesSearch(e.target.value)}
                className={styles.filterSectionSearchInput}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className={styles.filterItems}>
              {filteredSeries.length > 0 ? (
                filteredSeries.map((item) => (
                  <label key={item.value} className={styles.filterCheckbox}>
                    <input
                      type="checkbox"
                      checked={item.isRefined}
                      onChange={() => seriesFilter.refine(item.value)}
                    />
                    <span className={styles.filterLabel}>
                      {item.label}{" "}
                      <span className={styles.filterCount}>({item.count})</span>
                    </span>
                  </label>
                ))
              ) : (
                <div className={styles.noResults}>No results found</div>
              )}
            </div>
          </div>
        )}
      </Dropdown.Content>
    </Dropdown.Root>
  );
}

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

  return (
    <>
      {/* Mobile: Combined filter dropdown */}
      <div className={styles.mobileFilters}>
        <CombinedFilterDropdown />
      </div>

      {/* Desktop: Individual filter dropdowns */}
      <div className={styles.desktopFilters}>
        <IndividualFilterDropdown
          title="Format"
          items={formatFilter.items}
          refine={formatFilter.refine}
        />
        <IndividualFilterDropdown
          title="Author"
          items={authorFilter.items}
          refine={authorFilter.refine}
          searchable
        />
        <IndividualFilterDropdown
          title="Faction"
          items={factionFilter.items}
          refine={factionFilter.refine}
          searchable
        />
        <IndividualFilterDropdown
          title="Era"
          items={eraFilter.items}
          refine={eraFilter.refine}
        />
        <IndividualFilterDropdown
          title="Series"
          items={seriesFilter.items}
          refine={seriesFilter.refine}
          searchable
        />
      </div>
    </>
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
          <div className={styles.mainContent}>
            {/* Search and Controls */}
            <div className={styles.controls}>
              <SearchBox />
              <div className={styles.controlsRight}>
                <FilterControls />
                <SortByDropdown />
              </div>
            </div>

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