import Link from "next/link";
import Image from "next/image";
import styles from "./styles.module.scss";

type SanitySeries = { name: string; number?: number | null };
type SanityImage =
  | {
      alt?: string | null;
      credit?: string | null;
      asset?: {
        _id: string;
        url: string;
        metadata?: { dimensions?: { width?: number; height?: number } };
      } | null;
    }
  | null
  | undefined;

type SanityBook = {
  _id: string;
  title: string;
  slug: string;
   author?: string[];        // keep the array if you want elsewhere
  authorLabel?: string; 
  series?: SanitySeries[];
  publication_date?: string | null;
  factions?: string[];
  image?: SanityImage;
  description?: string | null;
  story?: string | null;
  format?: string | null;
};

type Props = {
  book: SanityBook;
  href?: string;
  compact?: boolean;
  className?: string;
};

function yearFromDate(d?: string | null) {
  if (!d) return undefined;
  const y = String(d).slice(0, 4);
  return /^\d{4}$/.test(y) ? y : undefined;
}
function primarySeriesLabel(series?: SanitySeries[]) {
  if (!series?.length) return undefined;
  const s = series[0];
  if (!s?.name) return undefined;
  const n = typeof s.number === "number" && Number.isFinite(s.number) ? ` #${s.number}` : "";
  return `${s.name}${n}`;
}

export default function BookCard({ book, href, compact, className }: Props) {
  const link = href ?? `/books/${book.slug}`; 
  const seriesLabel = primarySeriesLabel(book.series);
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
      <div className={styles.image} aria-label={book.title ? `${book.title} cover` : "No cover image"}>
        {hasImage ? (
          <Image
            src={imgUrl}
            alt={imgAlt}
            fill
            sizes="(max-width: 600px) 50vw, 200px"
            priority={false}
          />
        ) : (
          <div className={styles.placeholderImage} aria-hidden="true" />
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title} title={book.title}>
          {book.title}
        </h3>

        <div className={styles.meta}>
          {book.author && <div className={styles.author}>
            {authorText}
          </div>}
          {/* {!compact && (seriesLabel || year) && (
            <div className={styles.series}>
              {seriesLabel}
              {seriesLabel && year ? " · " : ""}
              {year ?? ""}
            </div>
          )} */}
        </div>
      </div>
    </Link>
  );
}
