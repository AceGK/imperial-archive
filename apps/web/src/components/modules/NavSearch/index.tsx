"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Configure, InstantSearch, useHits, useInstantSearch, useSearchBox } from "react-instantsearch";
import { typedOnlySearchClient } from "@/lib/algolia/search";
import Carousel from "@/components/modules/Carousel/base";
import BookCard from "@/components/modules/Cards/BookCard";
import BookRow from "@/components/modules/Cards/BookRow";
import Button from "@/components/ui/Button";
import { buildLocalRows } from "@/components/modules/Search/rows";
import { highlight } from "@/components/modules/Search/SearchResultItem";
import {
  SUGGESTED_SEARCHES,
  clearRecentSearches,
  readRecentSearches,
  saveRecentSearch,
} from "@/components/modules/Search/terms";
import type { BookHit } from "@/types/algolia";
import MagnifyingGlassIcon from "@/components/icons/magnifying-glass.svg";
import XmarkIcon from "@/components/icons/xmark.svg";
import BookIcon from "@/components/icons/book-spine.svg";
import { useShortcuts } from "./shortcuts";
import styles from "./styles.module.scss";

export { loadShortcuts } from "./shortcuts";

// wait for a pause in typing before searching (matches the hero search)
const DEBOUNCE_MS = 250;
/** Algolia isn't asked about shorter queries (see typedOnlySearchClient) */
const MIN_QUERY = 2;

type Props = {
  /**
   * "panel": the desktop drop-down, books in a slider.
   * "menu": the top of the phone menu, books as a list of rows.
   */
  variant: "panel" | "menu";
  /** Panel only: focuses the box each time this turns on */
  open?: boolean;
  /** Close button and Escape (panel) */
  onClose?: () => void;
  /** After a result or "View all" is followed, so the panel or menu can close */
  onNavigate?: () => void;
  /** Whether results are showing, so the phone menu can hide its links meanwhile */
  onSearchingChange?: (searching: boolean) => void;
};

/**
 * The nav's search: authors, series, factions and eras matched in the browser,
 * then books from Algolia. One Algolia request per typed search, none for the
 * suggestions shown before typing.
 */
export default function NavSearch(props: Props) {
  return (
    <InstantSearch
      indexName="books40k"
      searchClient={typedOnlySearchClient}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={props.variant === "panel" ? 12 : 6} />
      <NavSearchBody {...props} />
    </InstantSearch>
  );
}

function NavSearchBody({ variant, open, onClose, onNavigate, onSearchingChange }: Props) {
  const router = useRouter();
  const { query, refine } = useSearchBox();
  const { items, results } = useHits() as unknown as {
    items: BookHit[];
    results?: { nbHits: number };
  };
  const { status } = useInstantSearch();

  const [value, setValue] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  // shortcuts load the first time the reader goes to search
  const [engaged, setEngaged] = useState(false);
  const shortcuts = useShortcuts(engaged);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

  // panel: ready to type as soon as it opens
  useEffect(() => {
    if (!open) return;
    setEngaged(true);
    setRecent(readRecentSearches());
    // after the panel's open transition starts, or focus can be refused while it's still hidden
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (value === query) return;
    const timer = setTimeout(() => refine(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, query, refine]);

  const term = query.trim();
  const searching = term.length >= MIN_QUERY;

  useEffect(() => {
    onSearchingChange?.(searching);
  }, [searching, onSearchingChange]);

  const localRows = searching ? buildLocalRows(term, shortcuts) : [];
  // still typing, or waiting on Algolia
  const pending = value !== query || status === "loading" || status === "stalled";
  const searchHref = `/books?q=${encodeURIComponent(term)}`;

  function reset() {
    setValue("");
    refine("");
  }

  // the menu goes back to its links next time; the panel keeps the last search
  function afterNavigate(searchTerm: string) {
    setRecent(saveRecentSearch(searchTerm));
    if (variant === "menu") reset();
    onNavigate?.();
  }

  function goToSearchPage() {
    const typed = value.trim();
    if (!typed) return;
    router.push(`/books?q=${encodeURIComponent(typed)}`);
    afterNavigate(typed);
  }

  function searchFor(searchTerm: string) {
    setValue(searchTerm);
    refine(searchTerm);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      goToSearchPage();
    } else if (e.key === "Escape") {
      // first Escape clears the box, the next closes the panel
      e.stopPropagation();
      if (value) reset();
      else onClose?.();
    }
  }

  // any link in the results (a card, an author, "View all") counts as following one
  function onResultsClick(e: React.MouseEvent) {
    const link = (e.target as Element).closest("a[href]");
    if (link) afterNavigate(term);
  }

  return (
    <div className={`${styles.search} ${styles[variant]}`}>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <MagnifyingGlassIcon className={styles.fieldIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            className={styles.input}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Search books, authors, series…"
            aria-label="Search the Archive"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setEngaged(true);
            }}
            onFocus={() => setEngaged(true)}
            onKeyDown={onKeyDown}
          />
          {value && (
            <button
              type="button"
              className={styles.clear}
              onClick={() => {
                reset();
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <XmarkIcon aria-hidden="true" />
            </button>
          )}
        </div>
        {variant === "panel" && (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close search">
            <XmarkIcon aria-hidden="true" />
          </button>
        )}
      </div>

      {/* before typing: recent and popular searches (panel only; the menu keeps its links) */}
      {!searching && variant === "panel" && (
        <div className={styles.idle}>
          {recent.length > 0 && (
            <div className={styles.termGroup}>
              <div className={styles.termHead}>
                <span className={styles.label}>Recent</span>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => {
                    clearRecentSearches();
                    setRecent([]);
                  }}
                >
                  Clear
                </button>
              </div>
              <TermChips terms={recent} onPick={searchFor} />
            </div>
          )}
          <div className={styles.termGroup}>
            <div className={styles.termHead}>
              <span className={styles.label}>Popular</span>
            </div>
            <TermChips terms={SUGGESTED_SEARCHES} onPick={searchFor} />
          </div>
        </div>
      )}

      {searching && (
        <div className={styles.results} onClickCapture={onResultsClick} aria-live="polite">
          {localRows.length > 0 && (
            <div className={styles.group}>
              <h2 className={styles.label}>Authors, series &amp; factions</h2>
              <ul className={styles.shortcuts}>
                {localRows.map((row) => (
                  <li key={row.key}>
                    <Link href={row.href} className={styles.shortcut}>
                      <span className={styles.shortcutKind}>{row.badge}</span>
                      <span className={styles.shortcutTitle}>{highlight(row.title, term)}</span>
                      {row.meta && <span className={styles.shortcutMeta}>{row.meta}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {items.length > 0 ? (
            <div className={styles.group}>
              <div className={styles.booksHead}>
                <h2 className={styles.label}>
                  Books
                  {results?.nbHits ? <span className={styles.count}>{results.nbHits}</span> : null}
                </h2>
                {variant === "panel" && (
                  <Button href={searchHref} variant="secondary" size="sm">
                    View all results
                  </Button>
                )}
              </div>

              {variant === "panel" ? (
                <Carousel
                  items={items.map((hit) => (
                    <BookCard key={hit.objectID} book={hit} />
                  ))}
                  layout="books"
                  pagination={false}
                  viewAllLink={searchHref}
                  lastSlideTitle="View all results"
                  viewAllIcon={BookIcon}
                  showViewAllButton={false}
                  resetKey={term}
                  className={styles.carousel}
                />
              ) : (
                <>
                  <ul className={styles.rows}>
                    {items.map((hit) => (
                      <li key={hit.objectID}>
                        {/* no blurb: shorter rows, so more results fit on a phone */}
                        <BookRow book={{ ...hit, description: null }} />
                      </li>
                    ))}
                  </ul>
                  <Button href={searchHref} variant="secondary" size="lg" className={styles.viewAllWide}>
                    View all results
                  </Button>
                </>
              )}
            </div>
          ) : pending ? (
            localRows.length === 0 && <p className={styles.status}>Searching…</p>
          ) : (
            localRows.length === 0 && (
              <p className={styles.status}>
                Nothing in the Archive matches <q>{term}</q>.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}

function TermChips({ terms, onPick }: { terms: string[]; onPick: (term: string) => void }) {
  return (
    <ul className={styles.chips}>
      {terms.map((t) => (
        <li key={t}>
          <button type="button" className={styles.chip} onClick={() => onPick(t)}>
            {t}
          </button>
        </li>
      ))}
    </ul>
  );
}
