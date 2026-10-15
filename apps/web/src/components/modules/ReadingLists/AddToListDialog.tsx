"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MAX_BOOKS_PER_LIST, MAX_LISTS, MAX_NAME_LENGTH } from "@convex/readingListLimits";
import CheckIcon from "@/components/icons/check.svg";
import XmarkIcon from "@/components/icons/xmark.svg";
import Button from "@/components/ui/Button";
import { bookCount, listErrorMessage, useReadingLists } from "./useReadingLists";
import styles from "./styles.module.scss";

type Props = {
  bookId: string;
  bookTitle: string;
  onClose: () => void;
};

/**
 * Pick which of the reader's lists hold this book (each list is a checkbox:
 * ticking adds, unticking removes), or name a new list to create it with the
 * book in it. Open while rendered: callers mount it on demand (client-side
 * only) and unmount it in onClose. Only for signed-in readers; callers send
 * others to /login.
 */
export default function AddToListDialog({ bookId, bookTitle, onClose }: Props) {
  const { ready, lists, toggleBook, create } = useReadingLists();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const headingId = useId();
  const inputId = useId();

  // a native modal dialog: traps focus, closes on Escape, sits above everything
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // the page behind shouldn't scroll while the dialog is up
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  // start on the first list, or the name field when there are none yet
  useEffect(() => {
    if (!ready) return;
    const first = dialogRef.current?.querySelector<HTMLButtonElement>("[role=checkbox]");
    (first ?? inputRef.current)?.focus();
  }, [ready]);

  const toggle = async (listId: (typeof lists)[number]["_id"]) => {
    setError(null);
    try {
      await toggleBook({ listId, bookId });
    } catch (err) {
      setError(listErrorMessage(err));
    }
  };

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setCreating(true);
    try {
      await create({ name, bookId });
      setName("");
    } catch (err) {
      setError(listErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const atLimit = lists.length >= MAX_LISTS;

  // portaled to <body>: the Track menu lives inside cards, whose click handlers
  // shouldn't see clicks in the dialog
  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={headingId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // a click on the backdrop lands on the dialog itself
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <XmarkIcon aria-hidden="true" />
        </button>

        <h2 id={headingId} className={styles.dialogTitle}>
          Add to list
        </h2>
        <p className={styles.dialogBook}>{bookTitle}</p>

        {!ready ? (
          <p className={styles.muted}>Loading your lists...</p>
        ) : (
          <>
            {lists.length > 0 ? (
              <ul className={styles.choices} aria-label="Your lists">
                {lists.map((list) => {
                  const inList = list.bookIds.includes(bookId);
                  const full = !inList && list.bookIds.length >= MAX_BOOKS_PER_LIST;
                  return (
                    <li key={list._id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={inList}
                        className={styles.choice}
                        onClick={() => toggle(list._id)}
                        disabled={full}
                      >
                        <span className={styles.checkbox} aria-hidden="true">
                          {inList && <CheckIcon />}
                        </span>
                        <span className={styles.choiceName}>{list.name}</span>
                        <span className={styles.choiceCount}>
                          {full ? "Full" : bookCount(list.bookIds.length)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.muted}>You don&apos;t have any lists yet. Name your first one below.</p>
            )}

            {atLimit ? (
              <p className={styles.muted}>
                You&apos;ve reached the {MAX_LISTS}-list limit. Delete a list to make a new one.
              </p>
            ) : (
              <form className={styles.newList} onSubmit={createList}>
                <label htmlFor={inputId}>New list</label>
                <div className={styles.newListRow}>
                  <input
                    ref={inputRef}
                    id={inputId}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Horus Heresy, in order"
                    maxLength={MAX_NAME_LENGTH}
                    autoComplete="off"
                    disabled={creating}
                  />
                  <Button type="submit" variant="secondary" disabled={creating || !name.trim()}>
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </div>
                <p className={styles.hint}>
                  Creates the list with this book in it. {lists.length} of {MAX_LISTS} lists used.
                </p>
              </form>
            )}
          </>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.dialogFooter}>
          <Link href="/account/reading-lists" className={styles.textLink} onClick={onClose}>
            Manage your lists
          </Link>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
