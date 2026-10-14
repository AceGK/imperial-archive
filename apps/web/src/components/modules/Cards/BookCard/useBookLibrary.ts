"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import type { OptimisticLocalStore } from "convex/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import type { ReadingStatus } from "@/components/modules/TrackButtons/steps";

type Tracking = { status: ReadingStatus; owned: boolean };

// Every card reads the same two lists rather than querying per book: Convex
// shares identical subscriptions, so a page of 36 cards is still 2 queries
function patchTrackedList(store: OptimisticLocalStore, bookId: string, change: Partial<Tracking>) {
  const list = store.getQuery(api.tracking.list, {});
  if (list) {
    const current = list.find((t) => t.bookId === bookId) ?? { bookId, status: null, owned: false };
    const updated = { ...current, ...change };
    const rest = list.filter((t) => t.bookId !== bookId);
    store.setQuery(
      api.tracking.list,
      {},
      updated.status === null && !updated.owned ? rest : [updated, ...rest],
    );
  }
  // keep an open book page in step too
  const single = store.getQuery(api.tracking.get, { bookId });
  if (single) store.setQuery(api.tracking.get, { bookId }, { ...single, ...change });
}

/**
 * The signed-in reader's favorite, reading status and ownership for one book,
 * with actions that update instantly. Signed-out readers are sent to /login.
 */
export function useBookLibrary(bookId: string) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const favorites = useQuery(api.favorites.list, isAuthenticated ? {} : "skip");
  const tracked = useQuery(api.tracking.list, isAuthenticated ? {} : "skip");
  const router = useRouter();
  const [error, setError] = useState(false);

  const toggleFavoriteMutation = useMutation(api.favorites.toggle).withOptimisticUpdate((store, { itemId, kind }) => {
    const list = store.getQuery(api.favorites.list, {});
    if (list) {
      const has = list.some((f) => f.itemId === itemId);
      store.setQuery(
        api.favorites.list,
        {},
        has ? list.filter((f) => f.itemId !== itemId) : [{ kind, itemId }, ...list],
      );
    }
    const single = store.getQuery(api.favorites.isFavorite, { itemId });
    if (single !== undefined) store.setQuery(api.favorites.isFavorite, { itemId }, !single);
  });
  const setStatusMutation = useMutation(api.tracking.setStatus).withOptimisticUpdate((store, args) =>
    patchTrackedList(store, args.bookId, { status: args.status }),
  );
  const setOwnedMutation = useMutation(api.tracking.setOwned).withOptimisticUpdate((store, args) =>
    patchTrackedList(store, args.bookId, { owned: args.owned }),
  );

  const entry = tracked?.find((t) => t.bookId === bookId);
  const favorite = isAuthenticated && !!favorites?.some((f) => f.itemId === bookId);
  const status: ReadingStatus = isAuthenticated ? (entry?.status ?? null) : null;
  const owned = isAuthenticated && entry?.owned === true;
  const ready = !isLoading && (!isAuthenticated || (favorites !== undefined && tracked !== undefined));

  const run = async (change: () => Promise<unknown>) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setError(false);
    try {
      await change();
    } catch {
      setError(true);
    }
  };

  return {
    favorite,
    status,
    owned,
    ready,
    error,
    toggleFavorite: () => run(() => toggleFavoriteMutation({ kind: "book", itemId: bookId })),
    /** Picking the status the book already has clears it */
    chooseStatus: (next: Exclude<ReadingStatus, null>) =>
      run(() => setStatusMutation({ bookId, status: status === next ? null : next })),
    toggleOwned: () => run(() => setOwnedMutation({ bookId, owned: !owned })),
  };
}
