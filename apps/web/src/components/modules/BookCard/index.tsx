import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";
import type { Book40k, Series40k } from "@/types/sanity";

type Props = {
  book: Book40k;
  href?: string;
  compact?: boolean;
  className?: string;
};

function yearFromDate(d?: string | null) {
  if (!d) return undefined;
  const y = String(d).slice(0, 4);
  return /^\d{4}$/.test(y) ? y : undefined;
}

export default function BookCard({ book, href, compact, className }: Props) {
  const link = href ?? `/books/${book.slug}`;
  const year = yearFromDate(book.publication_date);
  const hasImage = Boolean(book.image?.asset?.url);
  const imgUrl = book.image?.asset?.url ?? "";
  const imgAlt =
    (book.image?.alt && book.image.alt.trim()) ||
    (book.title ? `${book.title} cover` : "Book cover");
  const authorText =
    !book.author || book.author.length === 0
      ? "Unknown"
      : book.author.length === 1
        ? book.author[0]
        : "Various";

  return (
    <Link href={link} className={`${styles.card} ${className ?? ""}`}>
      <div
        className={styles.image}
        aria-label={book.title ? `${book.title} cover` : "No cover image"}
      >
        {hasImage ? (
          <Image
            src={imgUrl}
            alt={imgAlt}
            fill
            sizes="(max-width: 600px) 50vw, 200px"
            priority={false}
            unoptimized
          />
        ) : (
          <div className={styles.placeholderImage} aria-hidden="true" />
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title} title={book.title}>
          {book.title}
        </h3>
        {book.author && <div className={styles.author}>{authorText}</div>}

        <div className={styles.meta}>
          <div className={styles.chips}>
            {book.format && <div className={styles.chip}>{book.format}</div>}
            {/* {year && <div className={styles.year}>{year}</div>} */}
             {book.series &&
              book.series.map((s: Series40k) => (
                <Link href={`/series/${s.slug}`} className={styles.chip} key={s.name}>
                  {s.name}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
