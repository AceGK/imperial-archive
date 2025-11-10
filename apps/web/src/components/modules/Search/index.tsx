// app/components/Search.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import {
  useSearchBox,
  useHits,
  UseHitsProps,
  Configure,
} from "react-instantsearch";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { useRouter } from "next/navigation";
import styles from "./styles.module.scss";

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_API_KEY!;

const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);

// Type for your Algolia book hit
type BookHit = {
  objectID: string;
  title: string;
  slug: string;
  format: string | null;
  authors: Array<{
    name: string;
    slug: string;
  }>;
  factions: Array<{
    name: string;
    slug: string;
  }>;
  era: {
    name: string;
    slug: string;
  } | null;
  series: {
    title: string;
    slug: string;
  } | null;
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const qn = normalize(query);
  if (!qn) return text;
  const raw = text;
  const lower = normalize(text);
  const parts: React.ReactNode[] = [];
  let i = 0;
  let idx = lower.indexOf(qn);
  while (idx !== -1) {
    if (idx > i) parts.push(raw.slice(i, idx));
    parts.push(<mark key={idx}>{raw.slice(idx, idx + qn.length)}</mark>);
    i = idx + qn.length;
    idx = lower.indexOf(qn, i);
  }
  if (i < raw.length) parts.push(raw.slice(i));
  return parts;
}

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
      // Remove duplicates and add to front
      const filtered = prev.filter((s) => s !== searchTerm);
      const updated = [searchTerm, ...filtered].slice(0, 5); // Keep max 5
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  };

  // Sync internal value with Algolia query
  useEffect(() => {
    setValue(query);
  }, [query]);

  // Update Algolia when value changes (debounced by Algolia)
  useEffect(() => {
    refine(value);
  }, [value, refine]);

  // Reset active index when query changes
  useEffect(() => {
    setActive(0);
  }, [query]);

  // Close dropdown on outside click
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
    // Save the search query before navigating
    if (query) {
      saveRecentSearch(query);
    }
    setValue("");
    refine("");
    router.push(`/books/${hit.slug}`);
  }


  function goToSearchPage() {
    setOpen(false);
    if (query) {
      saveRecentSearch(query);
    }
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
  // Total items in dropdown (1 for "See all" + hits)
  const totalItems = showResults ? 1 + hits.length : 0;

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    // Handle recent searches navigation
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

    // Handle search results navigation (including "See all" option)
    if (!totalItems) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, totalItems - 1));
      listRef.current?.children?.[
        Math.min(active + 1, totalItems - 1)
      ]?.scrollIntoView({
        block: "nearest",
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      listRef.current?.children?.[Math.max(active - 1, 0)]?.scrollIntoView({
        block: "nearest",
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active === 0) {
        // First item is "See all results"
        goToSearchPage();
      } else {
        // Subtract 1 because "See all" is at index 0
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
        <ul
          className={styles.list}
          ref={listRef}
          role="listbox"
          aria-label="Search suggestions"
        >
          {/* "See all results" option */}
          <li
            className={`${styles.item} ${styles.seeAllItem} ${active === 0 ? styles.active : ""}`}
            role="option"
            aria-selected={active === 0}
            onMouseEnter={() => setActive(0)}
            onMouseDown={(e) => {
              e.preventDefault();
              goToSearchPage();
            }}
          >
            <div className={styles.rowTitle}>
              <span className={styles.seeAllIcon}>→</span>
              <span>View all results for </span>
              <mark className={styles.queryHighlight}>{query}</mark>
            </div>
          </li>

          {/* Individual book results */}
          {hits.map((hit, i) => {
            const authorsLine =
              hit.authors?.map((a) => a.name).join(", ") || "";
            const factionsLine =
              hit.factions?.map((f) => f.name).join(", ") || "";
            const itemIndex = i + 1; // +1 because "See all" is at index 0

            return (
              <li
                key={hit.objectID}
                className={`${styles.item} ${itemIndex === active ? styles.active : ""}`}
                role="option"
                aria-selected={itemIndex === active}
                onMouseEnter={() => setActive(itemIndex)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  goTo(hit);
                }}
              >
                <div className={styles.rowTitle}>
                  {highlight(hit.title, query)}
                  <span className={styles.kind}>{hit.format || "Book"}</span>
                </div>

                <div className={styles.rowMeta}>
                  {authorsLine && <span>{highlight(authorsLine, query)}</span>}
                  {factionsLine && <span className={styles.dot}>·</span>}
                  {factionsLine && (
                    <span>{highlight(factionsLine, query)}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
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
      {/* Limit results to 10 */}
      <Configure hitsPerPage={10} />
      <CustomSearchBox />
    </InstantSearchNext>
  );
}
