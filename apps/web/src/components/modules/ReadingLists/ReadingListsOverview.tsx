"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { MAX_LISTS, MAX_NAME_LENGTH } from "@convex/readingListLimits";
import { getListBooks, type ListBook } from "@/app/account/reading-lists/actions";
import SectionHeader from "@/components/modules/Account/SectionHeader";
import accountStyles from "@/components/modules/Account/styles.module.scss";
import Button from "@/components/ui/Button";
import { bookCount, listErrorMessage, thumbUrl, useReadingLists } from "./useReadingLists";
import styles from "./styles.module.scss";

// covers shown on each list's card
const PREVIEW_COVERS = 4;

/** /account/reading-lists: the reader's lists, and a form to start a new one. */
export default function ReadingListsOverview() {
  const { ready, lists, create } = useReadingLists();
  const [covers, setCovers] = useState<Map<string, ListBook>>(new Map());
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const inputId = useId();

  // card data for the first few books of each list
  const coverKey = [...new Set(lists.flatMap((l) => l.bookIds.slice(0, PREVIEW_COVERS)))].sort().join(",");
  useEffect(() => {
    if (!coverKey) return;
    let cancelled = false;
    getListBooks(coverKey.split(","))
      .then((docs) => !cancelled && setCovers(new Map(docs.map((d) => [d._id, d]))))
      .catch(() => {
        // the lists still work without their covers
      });
    return () => {
      cancelled = true;
    };
  }, [coverKey]);

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setCreating(true);
    try {
      await create({ name });
      setName("");
    } catch (err) {
      setError(listErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const atLimit = lists.length >= MAX_LISTS;

  return (
    <>
      <SectionHeader
        title="Reading Lists"
        description="Your own lists of books, in the order you choose. Add books from the Track menu on any book card, or Add to list on a book's page."
      />

      {!ready ? (
        <p className={accountStyles.muted}>Loading...</p>
      ) : (
        <>
          {lists.length === 0 ? (
            <section className={`${accountStyles.card} ${accountStyles.comingSoon}`}>
              <h2>No lists yet</h2>
              <p className={accountStyles.cardDescription}>
                Make a list for a reading order, a series you&apos;re working through, or books to recommend.
              </p>
            </section>
          ) : (
            <ul className={styles.listGrid}>
              {lists.map((list) => {
                const preview = list.bookIds
                  .slice(0, PREVIEW_COVERS)
                  .map((id) => covers.get(id))
                  .filter((b): b is ListBook => b !== undefined);
                return (
                  <li key={list._id}>
                    <Link href={`/account/reading-lists/${list._id}`} className={styles.listCard}>
                      <span className={styles.coverStrip} aria-hidden="true">
                        {Array.from({ length: PREVIEW_COVERS }, (_, i) => {
                          const book = preview[i];
                          const url = book ? thumbUrl(book, 120) : null;
                          return (
                            <span key={i} className={styles.coverSlot}>
                              {url && <Image src={url} alt="" fill sizes="64px" unoptimized />}
                            </span>
                          );
                        })}
                      </span>
                      <span className={styles.listName}>{list.name}</span>
                      <span className={styles.listMeta}>{bookCount(list.bookIds.length)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <section className={accountStyles.card}>
            <h2>New List</h2>
            {atLimit ? (
              <p className={accountStyles.cardDescription}>
                You&apos;ve reached the {MAX_LISTS}-list limit. Delete a list to make a new one.
              </p>
            ) : (
              <form className={styles.newList} onSubmit={createList}>
                <label htmlFor={inputId}>Name</label>
                <div className={styles.newListRow}>
                  <input
                    id={inputId}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Horus Heresy, in order"
                    maxLength={MAX_NAME_LENGTH}
                    autoComplete="off"
                    disabled={creating}
                  />
                  <Button type="submit" variant="primary" disabled={creating || !name.trim()}>
                    {creating ? "Creating..." : "Create List"}
                  </Button>
                </div>
                <p className={styles.hint}>
                  {lists.length} of {MAX_LISTS} lists used.
                </p>
              </form>
            )}
            {error && (
              <p className={accountStyles.error} role="alert">
                {error}
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}
