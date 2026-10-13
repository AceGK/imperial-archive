"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import BookIcon from "@/components/icons/book.svg";
import favoriteStyles from "@/components/modules/FavoriteButton/styles.module.scss";
import styles from "./styles.module.scss";
import { STATUS_STEPS, statusSteps, type ReadingStatus } from "./steps";

/**
 * A reading-status button that cycles Unread → Want to read → Reading → Read,
 * and a separate Owned toggle (owning a book is independent of reading it).
 * Signed-out visitors are sent to /login.
 */
export default function TrackButtons({ bookId }: { bookId: string }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const state = useQuery(api.tracking.get, isAuthenticated ? { bookId } : "skip");
  const router = useRouter();
  const [error, setError] = useState(false);

  const setStatus = useMutation(api.tracking.setStatus).withOptimisticUpdate((store, args) => {
    const current = store.getQuery(api.tracking.get, { bookId: args.bookId });
    if (current) store.setQuery(api.tracking.get, { bookId: args.bookId }, { ...current, status: args.status });
  });
  const setOwned = useMutation(api.tracking.setOwned).withOptimisticUpdate((store, args) => {
    const current = store.getQuery(api.tracking.get, { bookId: args.bookId });
    if (current) store.setQuery(api.tracking.get, { bookId: args.bookId }, { ...current, owned: args.owned });
  });

  const status: ReadingStatus = isAuthenticated ? (state?.status ?? null) : null;
  const owned = isAuthenticated && state?.owned === true;
  const disabled = isLoading || (isAuthenticated && state === undefined);

  const { index, step, next } = statusSteps(status);
  const StatusIcon = step.icon;

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

  const hint = error ? "Couldn't save. Try again." : `Click to mark as ${next.label}`;

  return (
    <div className={styles.group} role="group" aria-label="Track this book">
      <button
        type="button"
        className={`${favoriteStyles.button} ${styles.status} ${status ? favoriteStyles.active : ""}`}
        onClick={() => run(() => setStatus({ bookId, status: next.status }))}
        disabled={disabled}
        aria-label={`Reading status: ${step.label}. ${hint}.`}
        title={hint}
        // for styling: on as soon as any status is set
        data-active={status ? "" : undefined}
      >
        <StatusIcon className={styles.icon} aria-hidden="true" />
        <span className={styles.label}>{step.label}</span>
        {/* progress through Want to read, Reading, Read */}
        <span className={styles.steps} aria-hidden="true">
          {STATUS_STEPS.slice(1).map((s, i) => (
            <span key={s.label} className={i < index ? styles.stepDone : styles.step} />
          ))}
        </span>
      </button>

      <button
        type="button"
        className={`${favoriteStyles.button} ${owned ? favoriteStyles.active : ""}`}
        onClick={() => run(() => setOwned({ bookId, owned: !owned }))}
        disabled={disabled}
        aria-pressed={owned}
        title={error ? "Couldn't save. Try again." : undefined}
      >
        <BookIcon className={styles.icon} aria-hidden="true" />
        <span>Owned</span>
      </button>
    </div>
  );
}
