import Link from "next/link";
import Image from "next/image";
import {
  getImageUrl,
  normalizeSeriesArray,
  yearFromDate,
  type BookCardData,
} from "@/components/modules/Cards/BookCard";
import CardTags from "@/components/modules/Cards/BookCard/CardTags";
import TrackMenu from "@/components/modules/Cards/BookCard/TrackMenu";
import {
  DEFAULT_BOOK_DISPLAY,
  type BookDisplay,
} from "@/components/modules/Cards/BookCard/display";
import styles from "@/components/modules/Cards/ListRow/styles.module.scss";

type Props = {
  book: BookCardData & { description?: string | null };
  /** Which parts to show (the catalog's Display menu); everything by default */
  display?: BookDisplay;
};

/** A book in a catalog's list view: [cover] [details] ..... [tags over Track] */
export default function BookRow({
  book,
  display = DEFAULT_BOOK_DISPLAY,
}: Props) {
  const bookId = book._id ?? book.objectID;
  const link = `/books/${book.slug}`;
  const imgUrl = getImageUrl(book.image);
  const year = yearFromDate(book.publication_date ?? book.publicationDate);
  const series = normalizeSeriesArray(book.series);
  const authors = (book.authors ?? []).filter((a) => a?.name);
  const shown = authors.slice(0, 2);
  const showCover = display.media !== "title";
  const showTitle = display.media !== "cover";
  const facts =
    (display.date && year) ||
    (display.format && book.format) ||
    (display.series && series.length > 0);

  return (
    <article className={`${styles.row} ${showCover ? "" : styles.rowNoThumb}`}>
      {showCover && (
        <Link
          href={link}
          className={`${styles.thumb} ${styles.thumbBook}`}
          aria-label={`${book.title} cover`}
        >
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={book.image?.alt?.trim() || `${book.title} cover`}
              fill
              sizes="72px"
              unoptimized
            />
          ) : (
            <span className={styles.placeholder} aria-hidden="true">
              {book.title}
            </span>
          )}
        </Link>
      )}

      <div className={styles.details}>
        {showTitle && (
          <Link href={link} className={styles.title}>
            {book.title}
          </Link>
        )}

        {display.author && (
          <div className={styles.byline}>
            {shown.length === 0
              ? "Unknown author"
              : shown.map((a, i) => (
                  <span key={a.slug ?? a.name}>
                    {i > 0 && ", "}
                    {a.slug ? (
                      <Link href={`/authors/${a.slug}`}>{a.name}</Link>
                    ) : (
                      a.name
                    )}
                  </span>
                ))}
            {authors.length > 2 && ` +${authors.length - 2} more`}
          </div>
        )}

        {facts && (
          <div className={styles.facts}>
            {display.date && year && <span>{year}</span>}
            {display.format && book.format && (
              <Link
                href={`/books?format=${book.format}`}
                className={styles.chip}
              >
                {book.format}
              </Link>
            )}
            {display.series &&
              series.map((s) => (
                <Link
                  key={s.slug}
                  href={`/series/${s.slug}`}
                  className={`${styles.chip} ${styles.chipMuted}`}
                >
                  {typeof s.number === "number" && Number.isFinite(s.number)
                    ? `${s.name} #${s.number}`
                    : s.name}
                </Link>
              ))}
          </div>
        )}

        {book.description && (
          <p className={styles.excerpt}>{book.description}</p>
        )}
      </div>

      {bookId && (
        <div className={styles.actions}>
          {/* the reader's state, just above the button that changes it */}
          {display.tags && <CardTags bookId={bookId} variant="inline" />}
          <TrackMenu bookId={bookId} title={book.title} variant="inline" />
        </div>
      )}
    </article>
  );
}
