import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";

type CardAuthor = { name: string; slug?: string };
type CardSeries = { name?: string; title?: string; slug?: string; number?: number | null };

// Flexible image type that accepts both Sanity and Algolia shapes
type CardImage =
  | { url: string | null; alt?: string | null } // Algolia shape
  | { asset?: { url: string } | null; alt?: string | null } // Sanity shape
  | null
  | undefined;

export type BookCardData = {
  _id?: string;
  objectID?: string;
  title: string;
  slug: string;
  authors?: CardAuthor[];
  format?: string | null;
  publication_date?: string | null;
  publicationDate?: string | null;
  image?: CardImage;
  series?: CardSeries[] | CardSeries | null;
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

function getImageUrl(image: CardImage): string | null {
  if (!image) return null;
  if ("url" in image) return image.url;
  if ("asset" in image) return image.asset?.url ?? null;
  return null;
}

function normalizeSeriesArray(series: CardSeries[] | CardSeries | null | undefined): CardSeries[] {
  if (!series) return [];
  const arr = Array.isArray(series) ? series : [series];
  return arr.map((s) => ({
    ...s,
    name: s.name ?? s.title,
  }));
}

export default function BookCard({ book, href, compact, className }: Props) {
  const id = book._id ?? book.objectID ?? book.slug;
  const link = href ?? `/books/${book.slug}`;
  const year = yearFromDate(book.publication_date ?? book.publicationDate);

  const imgUrl = getImageUrl(book.image);
  const imgAlt = book.image?.alt?.trim() || `${book.title} cover`;

  const authors = book.authors ?? [];
  const seriesList = normalizeSeriesArray(book.series);

  const showAuthors =
    authors.length === 0 ? (
      <span>Unknown</span>
    ) : authors.length === 1 ? (
      authors[0].slug ? (
        <Link className={styles.authorLink} href={`/authors/${authors[0].slug}`}>
          {authors[0].name}
        </Link>
      ) : (
        <span>{authors[0].name}</span>
      )
    ) : (
      "Various Authors"
    );

  return (
    <div className={`${styles.card} ${className ?? ""} ${compact ? styles.compact : ""}`}>
      <Link
        href={link}
        className={styles.image}
        aria-label={`${book.title} cover`}
      >
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={imgAlt}
            fill
            sizes="(max-width: 600px) 50vw, 200px"
            priority={false}
            unoptimized
          />
        ) : (
          <div className={styles.placeholderImage} aria-hidden="true">
            <div className={styles.placeholderText}>
              <span>{book.title}</span>
            </div>
          </div>
        )}
      </Link>

      <div className={styles.content}>
        <Link href={link} className={styles.title} title={book.title}>
          {book.title}
        </Link>

        <div className={styles.author}>{showAuthors}</div>
        {year && <div className={styles.year}>{year}</div>}

        <div className={styles.meta}>
          <div className={styles.chips}>
            {book.format && (
              <Link href={`/books?format=${book.format}`} className={styles.chip}>
                {book.format}
              </Link>
            )}
            {seriesList.map((s) => (
              <Link
                href={`/series/${s.slug}`}
                className={styles.chip}
                key={`${id}-${s.slug}`}
              >
                {typeof s.number === "number" && Number.isFinite(s.number)
                  ? `${s.name} #${s.number}`
                  : s.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}