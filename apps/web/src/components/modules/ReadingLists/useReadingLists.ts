"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
export type ReadingList = {
  _id: Id<"readingLists">;
  name: string;
  updatedAt: number;
  bookIds: string[];
};

/**
 * The signed-in reader's reading lists and the actions on them. Every card,
 * dialog and page reads the same `mine` subscription (Convex shares identical
 * ones), and changes show instantly through optimistic updates.
 *
 * Pass `enabled: false` to skip loading the lists until they're needed (each
 * load counts against the Convex plan's bandwidth); the actions still work.
 */
export function useReadingLists(enabled = true) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const lists = useQuery(api.readingLists.mine, isAuthenticated && enabled ? {} : "skip");

  const toggleBook = useMutation(api.readingLists.toggleBook).withOptimisticUpdate((store, { listId, bookId }) => {
    const current = store.getQuery(api.readingLists.mine, {});
    if (!current) return;
    store.setQuery(
      api.readingLists.mine,
      {},
      current.map((l) =>
        l._id !== listId
          ? l
          : {
              ...l,
              bookIds: l.bookIds.includes(bookId) ? l.bookIds.filter((id) => id !== bookId) : [...l.bookIds, bookId],
            },
      ),
    );
  });

  const reorder = useMutation(api.readingLists.reorder).withOptimisticUpdate((store, { listId, bookIds }) => {
    const current = store.getQuery(api.readingLists.mine, {});
    if (current) {
      store.setQuery(api.readingLists.mine, {}, current.map((l) => (l._id === listId ? { ...l, bookIds } : l)));
    }
  });

  const rename = useMutation(api.readingLists.rename).withOptimisticUpdate((store, { listId, name }) => {
    const current = store.getQuery(api.readingLists.mine, {});
    if (current) {
      store.setQuery(api.readingLists.mine, {}, current.map((l) => (l._id === listId ? { ...l, name: name.trim() } : l)));
    }
  });

  const remove = useMutation(api.readingLists.remove).withOptimisticUpdate((store, { listId }) => {
    const current = store.getQuery(api.readingLists.mine, {});
    if (current) store.setQuery(api.readingLists.mine, {}, current.filter((l) => l._id !== listId));
  });

  const create = useMutation(api.readingLists.create);

  return {
    isAuthenticated,
    /** Auth is known and, when signed in, the lists have loaded */
    ready: !isLoading && (!isAuthenticated || lists !== undefined),
    lists: (lists ?? []) as ReadingList[],
    toggleBook,
    reorder,
    rename,
    remove,
    create,
  };
}

/** The message from a ConvexError thrown on purpose (limits, duplicate names), or a fallback */
export function listErrorMessage(err: unknown, fallback = "Couldn't save. Try again.") {
  return err instanceof ConvexError && typeof err.data === "string" ? err.data : fallback;
}

type CoverImage = { url?: string | null; asset?: { url?: string | null } | null } | null | undefined;

/** A small cover from Sanity's image CDN rather than the full-size original */
export function thumbUrl(book: { image?: CoverImage }, width: number) {
  const url = book.image?.url ?? book.image?.asset?.url;
  if (!url) return null;
  return url.includes("cdn.sanity.io") ? `${url}?w=${width}&auto=format` : url;
}

export function bookCount(n: number) {
  return `${n} ${n === 1 ? "book" : "books"}`;
}
