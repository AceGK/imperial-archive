'use client';

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@convex/_generated/api";
import { getTrackedBooks, type TrackedBook } from "@/app/account/track/actions";
import BookGrid from "@/components/modules/BookGrid";
import BookRow from "@/components/modules/Cards/BookRow";
import { useStoredView } from "@/components/modules/Catalog/ViewToggle";
import Button from "@/components/ui/Button";
import { LibraryControls, LibraryCount, LibrarySection, matchesQuery, useChipFilter } from "./LibraryControls";
import SectionHeader from "./SectionHeader";
import styles from "./styles.module.scss";
import libraryStyles from "./Library.module.scss";

type Entry = { bookId: string; status: "want" | "reading" | "read" | null; owned: boolean };

const FILTERS = [
  { key: "reading", label: "Reading", matches: (e: Entry) => e.status === "reading" },
  { key: "want", label: "Want to Read", matches: (e: Entry) => e.status === "want" },
  { key: "read", label: "Read", matches: (e: Entry) => e.status === "read" },
  { key: "owned", label: "Owned", matches: (e: Entry) => e.owned },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

// The All view in sections, each book once: by reading status, then owned
// books not started yet (an owned book with a status shows its Owned tag)
const SECTIONS = [
  { title: "Reading", matches: (e: Entry) => e.status === "reading" },
  { title: "Want to Read", matches: (e: Entry) => e.status === "want" },
  { title: "Read", matches: (e: Entry) => e.status === "read" },
  { title: "Owned", matches: (e: Entry) => e.status === null && e.owned },
];

const searchText = (book: TrackedBook) => [book.title, ...(book.authors ?? []).map((a) => a?.name ?? "")].join(" ");

export default function Track() {
  const tracked = useQuery(api.tracking.list);
  const [books, setBooks] = useState<Map<string, TrackedBook> | null>(null);
  const [error, setError] = useState(false);
  // none selected is All; several selected show books matching any of them
  const filter = useChipFilter<FilterKey>();
  const [query, setQuery] = useState("");
  const [view, setView] = useStoredView("track-view", "list");

  // Refetch card data whenever the set of tracked books changes, not when a
  // book only changes status. Search and filters then run on this data in the
  // browser: no Sanity or Algolia requests while typing.
  const idsKey = tracked?.map((t) => t.bookId).sort().join(",");
  useEffect(() => {
    if (idsKey === undefined) return;
    const ids = idsKey ? idsKey.split(",") : [];
    let cancelled = false;
    getTrackedBooks(ids)
      .then((docs) => !cancelled && setBooks(new Map(docs.map((d) => [d._id, d]))))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const loading = tracked === undefined || books === null;
  // most recently changed first, from Convex; books deleted from the catalog are skipped
  const entries = (tracked ?? []).filter((t) => books?.has(t.bookId));

  const active = FILTERS.filter((f) => filter.selected.has(f.key));
  const visible = entries.filter(
    (e) =>
      (active.length === 0 || active.some((f) => f.matches(e))) && matchesQuery(searchText(books!.get(e.bookId)!), query),
  );
  const toBooks = (list: Entry[]) => list.map((e) => books!.get(e.bookId)!);
  // All: in sections; chosen filters: one list
  const sections =
    active.length === 0
      ? SECTIONS.map((s) => ({ title: s.title, books: toBooks(visible.filter(s.matches)) })).filter(
          (s) => s.books.length > 0,
        )
      : [{ title: null, books: toBooks(visible) }];

  const renderBooks = (list: TrackedBook[]) =>
    view === "grid" ? (
      <BookGrid books={list} />
    ) : (
      <div className={libraryStyles.rows}>
        {list.map((b) => (
          <BookRow key={b._id} book={b} />
        ))}
      </div>
    );

  return (
    <>
      <SectionHeader title="Track" description="The books you're reading, want to read, have read, and own." />

      {error ? (
        <p className={styles.error}>Couldn&apos;t load your tracked books. Please refresh the page.</p>
      ) : loading ? (
        <p className={styles.muted}>Loading...</p>
      ) : entries.length === 0 ? (
        <section className={`${styles.card} ${styles.comingSoon}`}>
          <h2>Nothing tracked yet</h2>
          <p className={styles.cardDescription}>
            Use the Track buttons on any book page to mark it as want to read, reading, read, or owned.
          </p>
          <Button href="/books" variant="tertiary">
            Browse Books
          </Button>
        </section>
      ) : (
        <>
          <LibraryControls
            query={query}
            onQueryChange={setQuery}
            searchLabel="Search your books by title or author"
            searchPlaceholder="Search by title or author"
            total={entries.length}
            chips={FILTERS.map((f) => ({ key: f.key, label: f.label, count: entries.filter(f.matches).length }))}
            selected={filter.selected}
            onToggle={filter.toggle}
            onAll={filter.clear}
            view={view}
            onViewChange={setView}
          />

          <LibraryCount shown={visible.length} total={entries.length} noun={["book", "books"]} />

          {visible.length === 0 ? (
            <section className={`${styles.card} ${styles.comingSoon}`}>
              <h2>No matches</h2>
              <p className={styles.cardDescription}>No tracked books match these filters.</p>
              <Button
                variant="tertiary"
                onClick={() => {
                  filter.clear();
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            </section>
          ) : (
            <div className={libraryStyles.sections}>
              {sections.map(({ title, books: list }) =>
                title ? (
                  <LibrarySection key={title} title={title} count={list.length}>
                    {renderBooks(list)}
                  </LibrarySection>
                ) : (
                  <div key="results">{renderBooks(list)}</div>
                ),
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
