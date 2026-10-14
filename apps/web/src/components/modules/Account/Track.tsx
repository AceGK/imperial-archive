'use client';

import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "@convex/_generated/api";
import { getTrackedBooks, type TrackedBook } from "@/app/account/track/actions";
import BookGrid from "@/components/modules/BookGrid";
import Button from "@/components/ui/Button";
import SectionHeader from "./SectionHeader";
import styles from "./styles.module.scss";

export default function Track() {
  const tracked = useQuery(api.tracking.list);
  const [books, setBooks] = useState<Map<string, TrackedBook> | null>(null);
  const [error, setError] = useState(false);

  // Refetch card data whenever the set of tracked books changes, not when a
  // book only moves between sections
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

  // Most recently changed first, from Convex
  const pick = (keep: (t: NonNullable<typeof tracked>[number]) => boolean) =>
    (tracked ?? [])
      .filter(keep)
      .map((t) => books?.get(t.bookId))
      .filter((b): b is TrackedBook => b !== undefined);

  const reading = pick((t) => t.status === "reading");
  const want = pick((t) => t.status === "want");
  const read = pick((t) => t.status === "read");
  const owned = pick((t) => t.owned);
  const loading = tracked === undefined || books === null;

  return (
    <>
      <SectionHeader title="Track" description="The books you're reading, want to read, have read, and own." />

      {error ? (
        <p className={styles.error}>Couldn&apos;t load your tracked books. Please refresh the page.</p>
      ) : loading ? (
        <p className={styles.muted}>Loading...</p>
      ) : reading.length + want.length + read.length + owned.length === 0 ? (
        <section className={`${styles.card} ${styles.comingSoon}`}>
          <h2>Nothing tracked yet</h2>
          <p className={styles.cardDescription}>
            Use the Track buttons on any book page to mark it as want to read, reading, read, or owned.
          </p>
          <Button href="/books" variant="secondary">
            Browse Books
          </Button>
        </section>
      ) : (
        <>
          <TrackSection title="Reading" books={reading} empty="Nothing in progress." />
          <TrackSection title="Want to Read" books={want} empty="Nothing on your list yet." />
          <TrackSection title="Read" books={read} empty="No finished books yet." />
          <TrackSection title="Owned" books={owned} empty="No owned books yet." />
        </>
      )}
    </>
  );
}

function TrackSection({ title, books, empty }: { title: string; books: TrackedBook[]; empty: string }) {
  return (
    <section className={styles.favoriteSection}>
      <h2>
        {title} <span className={styles.muted}>({books.length})</span>
      </h2>
      {books.length > 0 ? <BookGrid books={books} /> : <p className={styles.muted}>{empty}</p>}
    </section>
  );
}
