"use client";

import HeartIcon from "@/components/icons/account/favorites.svg";
import { STATUS_STEPS } from "@/components/modules/TrackButtons/steps";
import { useBookLibrary } from "./useBookLibrary";
import styles from "./styles.module.scss";

const STATUS_TAG = {
  want: styles.tagWant,
  reading: styles.tagReading,
  read: styles.tagRead,
};

/**
 * The reader's state for a book as tags: reading status and Owned, plus a
 * heart for favorites. "overlay" pins them to a cover's top corners, like
 * SALE tags on a product card; "inline" lays them out in a row.
 */
export default function CardTags({ bookId, variant = "overlay" }: { bookId: string; variant?: "overlay" | "inline" }) {
  const { favorite, status, owned } = useBookLibrary(bookId);
  const statusLabel = STATUS_STEPS.find((s) => s.status === status && s.status !== null)?.label;
  // dashed outline → solid outline → filled, as the book moves from wanted to read
  const statusClass = status ? `${styles.tag} ${STATUS_TAG[status]}` : styles.tag;

  if (!statusLabel && !owned && !favorite) return null;

  const heart = favorite && (
    <span className={variant === "inline" ? styles.favoriteTagInline : styles.favoriteTag}>
      <HeartIcon />
    </span>
  );

  // the same state is in the Track menu, so the tags are visual only
  if (variant === "inline") {
    return (
      <div className={styles.tagsInline} aria-hidden="true">
        {statusLabel && <span className={statusClass}>{statusLabel}</span>}
        {owned && <span className={styles.tag}>Owned</span>}
        {heart}
      </div>
    );
  }

  return (
    <>
      {(statusLabel || owned) && (
        <div className={styles.tags} aria-hidden="true">
          {statusLabel && <span className={statusClass}>{statusLabel}</span>}
          {owned && <span className={styles.tag}>Owned</span>}
        </div>
      )}
      {favorite && <span aria-hidden="true">{heart}</span>}
    </>
  );
}
