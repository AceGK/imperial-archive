import Link from "next/link";
import Image from "next/image";
import type { Book } from "@/lib/40k-books";
import styles from "./styles.module.scss";

type Props = {
  book: Book;
  href?: string; // override if needed
  compact?: boolean; // hides some extras in tight grids
  className?: string;
};

function authorsLabel(arr: string[]) {
  if (!arr?.length) return "Unknown";
  if (arr.length === 1) return arr[0];
  return "Various Authors";
}

export default function BookCard({ book, href, compact, className }: Props) {
  const link = href ?? `/books/${book.slug}`;
  const author = authorsLabel(book.author);
  const series = book.series ? book.series : null;

  const factions = book.factions ?? [];
  const shown = factions.slice(0, compact ? 2 : 3);
  const extra = Math.max(0, factions.length - shown.length);

  return (
    <Link href={link} className={`${styles.card} ${className ?? ""}`}>
      {/* Cover (or placeholder) */}
      <div
        className={styles.image}
        aria-label={book.title ? `${book.title} cover` : "No cover image"}
      >
        <div className={styles.placeholderImage} aria-hidden="true" />
      </div>

      <div className={styles.content}>
        {/* Title */}
        <h3 className={styles.title} title={book.title}>
          {book.title}
        </h3>

        {/* Meta block (author / series / year) */}
        <div className={styles.meta}>
          <div className={styles.author} title={author}>
            {author}
          </div>

          {!compact && (series || book.year) && (
            <div className={styles.series}>
              {/* {series} */}
              {series && book.year ? " · " : ""}
              {book.year ?? ""}
            </div>
          )}
        </div>

        {/* Collections */}
        {/* {shown.length > 0 && (
        <div className={styles.chips}>
          {shown.map((c) => (
            <span className={styles.chip} key={c} title={c}>
              {c}
            </span>
          ))}
          {extra > 0 && (
            <span className={styles.chip} aria-label={`${extra} more collections`}>
              +{extra} more
            </span>
          )}
        </div>
      )} */}
      </div>
    </Link>
  );
}
