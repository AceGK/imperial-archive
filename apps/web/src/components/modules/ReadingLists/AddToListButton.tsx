"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import AddToListDialog from "./AddToListDialog";
import styles from "./styles.module.scss";

/**
 * The book page's plain-text "Add to list" action. Only this book's entries
 * load up front (for the "in 2 lists" hint); the reader's full lists load
 * when the dialog opens. Signed-out readers go to /login.
 */
export default function AddToListButton({ bookId, bookTitle }: { bookId: string; bookTitle: string }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const inLists = useQuery(api.readingLists.countForBook, isAuthenticated ? { bookId } : "skip") ?? 0;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const openDialog = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.addToList}
        onClick={openDialog}
        disabled={isLoading}
        aria-haspopup="dialog"
      >
        + Add to list
        {inLists > 0 && (
          <span className={styles.addToListCount}>
            {" "}
            · in {inLists} {inLists === 1 ? "list" : "lists"}
          </span>
        )}
      </button>
      {open && (
        <AddToListDialog
          bookId={bookId}
          bookTitle={bookTitle}
          onClose={() => {
            setOpen(false);
            buttonRef.current?.focus();
          }}
        />
      )}
    </>
  );
}
