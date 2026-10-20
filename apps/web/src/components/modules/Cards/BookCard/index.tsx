import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";
import CardActions from "./CardActions";
import CardTags from "./CardTags";
import TrackMenu from "./TrackMenu";
import { DEFAULT_BOOK_DISPLAY, type BookDisplay } from "./display";

type CardAuthor = { name: string; slug?: string };
type CardSeries = { name?: string; title?: string; slug?: string; number?: number | null };

// Flexible image type that accepts both Sanity and Algolia shapes
export type CardImage =
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
  /** Which parts to show (the catalog's Cards menu); everything by default */
  display?: BookDisplay;
};

export function yearFromDate(d?: string | null) {
  if (!d) return undefined;
  const y = String(d).slice(0, 4);
  return /^\d{4}$/.test(y) ? y : undefined;
}

export function getImageUrl(image: CardImage): string | null {
  if (!image) return null;
  if ("url" in image) return image.url;
  if ("asset" in image) return image.asset?.url ?? null;
  return null;
}

export function normalizeSeriesArray(series: CardSeries[] | CardSeries | null | undefined): CardSeries[] {
  if (!series) return [];
  const arr = Array.isArray(series) ? series : [series];
  return arr.map((s) => ({
    ...s,
    name: s.name ?? s.title,
  }));
}

export default function BookCard({ book, href, compact, className, display = DEFAULT_BOOK_DISPLAY }: Props) {
  const id = book._id ?? book.objectID ?? book.slug;
  // the Sanity _id (Algolia's objectID is the same id); without one the card
  // can't be favorited or tracked, so it shows no buttons
  const bookId = book._id ?? book.objectID;
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

  const showCover = display.media !== "title";
  const showTitle = display.media !== "cover";
  const wide = display.layout === "card";
  const chips = (display.format && book.format) || (display.series && seriesList.length > 0);
  // on a wide card, or without the cover, the tags and Track button sit in the card body
  const bodyActions = (wide || !showCover) && bookId;
  const hasBody = showTitle || display.author || (display.date && year) || chips || bodyActions;

  return (
    <div className={`${styles.card} ${wide ? styles.wide : ""} ${className ?? ""} ${compact ? styles.compact : ""}`}>
      {showCover && (
        // the action buttons sit beside the cover link, not inside it: buttons
        // nested in a link are invalid and would also follow the link
        <div className={styles.media}>
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
                sizes={wide ? "128px" : "(max-width: 600px) 50vw, 200px"}
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
          {bookId && !wide && <CardActions bookId={bookId} title={book.title} showTags={display.tags} />}
        </div>
      )}

      {hasBody && (
        <div className={styles.content}>
          {showTitle && (
            <Link href={link} className={styles.title} title={book.title}>
              {book.title}
            </Link>
          )}

          {display.author && <div className={styles.author}>{showAuthors}</div>}
          {display.date && year && <div className={styles.year}>{year}</div>}

          {chips && (
            <div className={styles.meta}>
              <div className={styles.chips}>
                {display.format && book.format && (
                  <Link href={`/books?format=${book.format}`} className={styles.chip}>
                    {book.format}
                  </Link>
                )}
                {display.series &&
                  seriesList.map((s) => (
                    <Link
                      href={`/series/${s.slug}`}
                      className={`${styles.chip} ${styles.chipMuted}`}
                      key={`${id}-${s.slug}`}
                    >
                      {typeof s.number === "number" && Number.isFinite(s.number)
                        ? `${s.name} #${s.number}`
                        : s.name}
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {bodyActions && bookId && (
            <div className={styles.bodyActions}>
              {display.tags && <CardTags bookId={bookId} variant="inline" />}
              <TrackMenu bookId={bookId} title={book.title} variant="inline" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
