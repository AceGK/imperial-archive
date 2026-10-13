import Link from "next/link";
import Image from "next/image";
import type { BookDetailData } from "@/types/books";
import styles from "./styles.module.scss";

interface Book {
  _id: string;
  title: string;
  slug: string;
  image?: {
    asset?: { url?: string };
    alt?: string;
  };
}

interface SeriesList {
  listName: string;
  ordered?: boolean;
  allBooks: Book[];
}

interface SeriesNav {
  seriesSlug: string;
  seriesName: string;
  lists: SeriesList[];
}

interface SeriesSectionProps {
  book: Pick<BookDetailData, "_id" | "series" | "format">;
  seriesNavigation?: SeriesNav[];
}

export default function SeriesSection({
  book,
  seriesNavigation = [],
}: SeriesSectionProps) {
  const series = Array.isArray(book.series) ? book.series : [];

  // Calculate previous/next books for each list in each series
  const navigationData = seriesNavigation
    .flatMap((nav) => {
      if (!nav.lists || nav.lists.length === 0) return [];

      return nav.lists
        .map((list) => {
          // Skip navigation for unordered lists
          if (list.ordered === false) return null;

          if (!list.allBooks || list.allBooks.length === 0) return null;

          const currentIndex = list.allBooks.findIndex(
            (b) => b._id === book._id
          );
          if (currentIndex === -1) return null;

          const previousBook =
            currentIndex > 0 ? list.allBooks[currentIndex - 1] : undefined;
          const nextBook =
            currentIndex < list.allBooks.length - 1
              ? list.allBooks[currentIndex + 1]
              : undefined;

          return {
            seriesName: nav.seriesName,
            seriesSlug: nav.seriesSlug,
            listName: list.listName,
            previousBook,
            nextBook,
          };
        })
        .filter(Boolean);
    })
    .filter(Boolean);

  // "novel", "short story"… for the sentence; anything unlabelled is a "book"
  const kind = book.format && book.format.toLowerCase() !== "other" ? book.format.toLowerCase() : "book";

  return (
    <>
      <p className={styles.seriesIntro}>
        This {kind} is included in the series:{" "}
        {series.map((s: any, i: number) => {
          const label =
            typeof s?.number === "number" && Number.isFinite(s.number)
              ? `${s?.name} #${s.number}`
              : (s?.name ?? s?.slug);
          const href = s?.slug ? `/series/${encodeURIComponent(s.slug)}` : "";
          const node = href ? (
            <Link href={href} className={styles.seriesLink}>
              {label}
            </Link>
          ) : (
            <span>{label}</span>
          );
          // "A", "A and B", "A, B and C"
          const separator =
            i === series.length - 1 ? "" : i === series.length - 2 ? " and " : ", ";
          return (
            <span key={`series-${s?.slug ?? i}`}>
              {node}
              {separator}
            </span>
          );
        })}
      </p>

      {/* Series Navigation */}
      {navigationData.map((navData: any, idx: number) => (
        <div
          key={`${navData.seriesSlug}-${navData.listName}-${idx}`}
          className={styles.seriesNav}
        >
          <div className={styles.seriesNavLinks}>
            {navData.previousBook && (
              <Link
                href={`/books/${encodeURIComponent(navData.previousBook.slug)}`}
                className={`${styles.navItem} ${styles.navPrev}`}
              >
                <div className={styles.navThumb}>
                  {navData.previousBook.image?.asset?.url ? (
                    <Image
                      src={navData.previousBook.image.asset.url}
                      alt={navData.previousBook.image.alt || navData.previousBook.title}
                      fill
                      sizes="48px"
                      unoptimized
                    />
                  ) : (
                    <div className={styles.navThumbPlaceholder} />
                  )}
                </div>
                <div className={styles.navText}>
                  <span className={styles.navLabel}>Preceded by</span>
                  <span className={styles.navTitle}>{navData.previousBook.title}</span>
                </div>
              </Link>
            )}
            {navData.nextBook && (
              <Link
                href={`/books/${encodeURIComponent(navData.nextBook.slug)}`}
                className={`${styles.navItem} ${styles.navNext}`}
              >
                <div className={styles.navText}>
                  <span className={styles.navLabel}>Followed by</span>
                  <span className={styles.navTitle}>{navData.nextBook.title}</span>
                </div>
                <div className={styles.navThumb}>
                  {navData.nextBook.image?.asset?.url ? (
                    <Image
                      src={navData.nextBook.image.asset.url}
                      alt={navData.nextBook.image.alt || navData.nextBook.title}
                      fill
                      sizes="48px"
                      unoptimized
                    />
                  ) : (
                    <div className={styles.navThumbPlaceholder} />
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      ))}
    </>
  );
}