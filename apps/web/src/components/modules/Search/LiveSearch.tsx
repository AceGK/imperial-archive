"use client";

// The hero search box once a reader engages with it: Algolia results as they
// type, plus authors, series, factions and eras (shared with the nav search).
// Loaded on demand by ./index.tsx, which shows a plain box until then.
import React, { useEffect, useRef, useState } from "react";
import { InstantSearch, useSearchBox, useHits, Configure } from "react-instantsearch";
import { typedOnlySearchClient } from "@/lib/algolia/search";
import { useRouter } from "next/navigation";
import { SearchResults } from "./SearchResults";
import styles from "./styles.module.scss";
import XmarkIcon from "@/components/icons/xmark.svg";
import MagnifyingGlassIcon from "@/components/icons/magnifying-glass.svg";
import { buildRows } from "./rows";
import { useShortcuts } from "@/components/modules/NavSearch/shortcuts";
import {
  clearRecentSearches as forgetRecentSearches,
  readRecentSearches,
  saveRecentSearch as storeRecentSearch,
} from "./terms";
import type { BookHit, ResultRow, SearchShortcut } from "./types";

const INDEX_NAME = "books40k";

// wait for a pause in typing before searching
const DEBOUNCE_MS = 250;

function CustomSearchBox({ autoFocus }: { autoFocus: boolean }) {
  const router = useRouter();
  const shortcuts: SearchShortcut[] = useShortcuts(true);
  const { query, refine } = useSearchBox();
  const { items: hits } = useHits() as unknown as { items: BookHit[] };

  const rows = buildRows(query, hits, shortcuts);

  const [value, setValue] = useState(query);
  // already open when the reader was in the box as it loaded
  const [open, setOpen] = useState(autoFocus);
  const [active, setActive] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    setRecentSearches(readRecentSearches());
  }, []);

  const saveRecentSearch = (searchTerm: string) => setRecentSearches(storeRecentSearch(searchTerm));

  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    if (value === query) return;
    const timer = setTimeout(() => refine(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, query, refine]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function goTo(row: ResultRow) {
    setOpen(false);
    if (query) saveRecentSearch(query);
    setValue("");
    refine("");
    router.push(row.href);
  }

  // uses the typed text, which can be ahead of the debounced query
  function goToSearchPage() {
    const term = value.trim();
    setOpen(false);
    if (term) saveRecentSearch(term);
    router.push(`/books?q=${encodeURIComponent(term)}`);
  }

  function handleRecentSearchClick(searchTerm: string) {
    setValue(searchTerm);
    refine(searchTerm);
    setOpen(true);
  }

  // back to an empty box with focus kept, so recent searches show again
  function clearInput() {
    setValue("");
    refine("");
    setOpen(true);
    inputRef.current?.focus();
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    forgetRecentSearches();
  }

  const showRecentSearches = open && !query && recentSearches.length > 0;
  const showResults = open && query && rows.length > 0;
  // "View all" at the top and again at the bottom, around the rows
  const totalItems = showResults ? rows.length + 2 : 0;

  const scrollToOption = (i: number) =>
    listRef.current?.querySelectorAll('[role="option"]')[i]?.scrollIntoView({ block: "nearest" });

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (showRecentSearches) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, recentSearches.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const searchTerm = recentSearches[active];
        if (searchTerm) handleRecentSearchClick(searchTerm);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
      return;
    }

    // Enter before the debounced results arrive still searches
    if (e.key === "Enter" && !totalItems && value.trim()) {
      e.preventDefault();
      goToSearchPage();
      return;
    }

    if (!totalItems) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, totalItems - 1));
      scrollToOption(Math.min(active + 1, totalItems - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      scrollToOption(Math.max(active - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active === 0 || active === rows.length + 1) {
        goToSearchPage();
      } else {
        const row = rows[active - 1];
        if (row) goTo(row);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={styles.searchBox} ref={boxRef}>
      <MagnifyingGlassIcon className={styles.searchIcon} aria-hidden="true" />
      <input
        id="hero-search"
        className={styles.input}
        type="search"
        autoComplete="off"
        placeholder="Search the Archive…"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        ref={inputRef}
        autoFocus={autoFocus}
      />

      {value && (
        <button
          type="button"
          className={styles.clearInput}
          onClick={clearInput}
          aria-label="Clear search"
        >
          <XmarkIcon aria-hidden="true" />
        </button>
      )}

      {/* Recent Searches */}
      {showRecentSearches && (
        <div className={styles.list}>
          <div className={styles.recentHeader}>
            <span className={styles.recentTitle}>Recent Searches</span>
            <button
              className={styles.clearButton}
              onClick={clearRecentSearches}
              type="button"
            >
              Clear History
            </button>
          </div>
          <ul className={styles.recentList}>
            {recentSearches.map((searchTerm, i) => (
              <li
                key={searchTerm}
                className={`${styles.item} ${i === active ? styles.active : ""}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleRecentSearchClick(searchTerm);
                }}
              >
                <div className={styles.rowTitle}>
                  <span className={styles.recentIcon}>🕒</span>
                  {searchTerm}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <SearchResults
          ref={listRef}
          rows={rows}
          query={query}
          activeIndex={active}
          onSelectRow={goTo}
          onSelectSeeAll={goToSearchPage}
          onHover={setActive}
        />
      )}
    </div>
  );
}

type Props = {
  /** What the reader typed into the plain box before this loaded */
  initialQuery: string;
  /** Focus the box on arrival (the reader was in the plain one) */
  autoFocus: boolean;
};

export default function LiveSearch({ initialQuery, autoFocus }: Props) {
  return (
    <InstantSearch
      indexName={INDEX_NAME}
      searchClient={typedOnlySearchClient}
      initialUiState={{ [INDEX_NAME]: { query: initialQuery } }}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={5} />
      <CustomSearchBox autoFocus={autoFocus} />
    </InstantSearch>
  );
}
