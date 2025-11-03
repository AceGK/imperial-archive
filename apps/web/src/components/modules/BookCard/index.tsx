import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";
import type { Series40k } from "@/types/sanity";

/** Minimal Book type for the card (matches bookCardFields) */
type CardAuthor = { name: string; slug?: string };
type CardImageAsset = { _id: string; url: string; metadata?: any };
type CardImage = { alt?: string | null; credit?: string | null; asset?: CardImageAsset | null } | null | undefined;

export type BookCardData = {
  _id: string;
  title: string;
  slug: string;
  authors?: CardAuthor[];
  format?: string | null;       // pretty label from projection
  formatValue?: string | null;  // raw, if needed
  publication_date?: string | null;
  factions?: string[];
  image?: CardImage;
  description?: string | null;
  story?: string | null;
  series?: Series40k[];
};

type Props = {
  book: BookCardData;
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

  const authors = book.authors ?? [];
  const showAuthors =
    authors.length === 0 ? (
      <span>Unknown</span>
    ) : authors.length === 1 ? (
      authors[0].slug ? (
        <Link href={`/authors/${authors[0].slug}`}>{authors[0].name}</Link>
      ) : (
        <span>{authors[0].name}</span>
      )
    ) : (
      authors.map((a, idx) => (
        <span key={a.slug ?? a.name}>
          {a.slug ? <Link href={`/authors/${a.slug}`}>{a.name}</Link> : a.name}
          {idx < authors.length - 1 ? ", " : ""}
        </span>
      ))
    );

  return (
    <div className={`${styles.card} ${className ?? ""} ${compact ? styles.compact : ""}`}>
      <Link
        href={link}
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
      </Link>

      <div className={styles.content}>
        <Link href={link} className={styles.title} title={book.title}>
          {book.title}
        </Link>

        <div className={styles.author}>{showAuthors}</div>

        <div className={styles.meta}>
          <div className={styles.chips}>
            {book.format && <div className={styles.chip}>{book.format}</div>}
            {year && <div className={styles.year}>{year}</div>}
            {book.series?.map((s) => (
              <Link href={`/series/${s.slug}`} className={styles.chip} key={`${book._id}-${s.slug}`}>
                {typeof s.number === "number" && Number.isFinite(s.number) ? `${s.name} #${s.number}` : s.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
