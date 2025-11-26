"use client";

import React, { useEffect, useRef, useState } from "react";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { useSearchBox, useHits, Configure } from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { useRouter } from "next/navigation";
import { SearchResults } from "./SearchResults";
import styles from "./styles.module.scss";
import type { BookHit } from "./types";

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!;

const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);

function CustomSearchBox() {
  const router = useRouter();
  const { query, refine } = useSearchBox();
  const { hits } = useHits() as { hits: BookHit[] };

  const [value, setValue] = useState(query);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("recentSearches");
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }
  }, []);

  // Save a search to recent searches
  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== searchTerm);
      const updated = [searchTerm, ...filtered].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    refine(value);
  }, [value, refine]);

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

  function goTo(hit: BookHit) {
    setOpen(false);
    if (query) saveRecentSearch(query);
    setValue("");
    refine("");
    router.push(`/books/${hit.slug}`);
  }

  function goToSearchPage() {
    setOpen(false);
    if (query) saveRecentSearch(query);
    router.push(`/books?q=${encodeURIComponent(query)}`);
  }

  function handleRecentSearchClick(searchTerm: string) {
    setValue(searchTerm);
    refine(searchTerm);
    setOpen(true);
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  }

  const showRecentSearches = open && !query && recentSearches.length > 0;
  const showResults = open && query && hits.length > 0;
  const totalItems = showResults ? 1 + hits.length : 0;

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

    if (!totalItems) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, totalItems - 1));
      listRef.current?.children?.[
        Math.min(active + 1, totalItems - 1)
      ]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      listRef.current?.children?.[Math.max(active - 1, 0)]?.scrollIntoView({
        block: "nearest",
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active === 0) {
        goToSearchPage();
      } else {
        const hit = hits[active - 1];
        if (hit) goTo(hit);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={styles.searchBox} ref={boxRef}>
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
      />

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
          hits={hits}
          query={query}
          activeIndex={active}
          onSelectHit={goTo}
          onSelectSeeAll={goToSearchPage}
          onHover={setActive}
        />
      )}
    </div>
  );
}

export default function Search() {
  return (
    <InstantSearchNext
      indexName="books40k"
      searchClient={searchClient}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={10} />
      <CustomSearchBox />
    </InstantSearchNext>
  );
}