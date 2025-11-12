import Link from "next/link";
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
  book: Pick<BookDetailData, "_id" | "series">;
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

  return (
    <>
      {series.map((s: any, i: number) => {
        const label =
          typeof s?.number === "number" && Number.isFinite(s.number)
            ? `${s?.name} #${s.number}`
            : (s?.name ?? s?.slug);
        const href = s?.slug ? `/series/${encodeURIComponent(s.slug)}` : "";
        const node = href ? (
          <Link key={s?.slug ?? i} href={href}>
            {label}
          </Link>
        ) : (
          <span key={s?.name ?? i}>{label}</span>
        );
        return (
          <span key={`series-${s?.slug ?? i}`}>
            {node}
            {i < series.length - 1 ? ", " : ""}
          </span>
        );
      })}

      {/* Series Navigation */}
      {navigationData.map((navData: any, idx: number) => (
        <div
          key={`${navData.seriesSlug}-${navData.listName}-${idx}`}
          className={styles.seriesNav}
        >
          <div className={styles.seriesNavLinks}>
            {navData.previousBook && (
              <div>
                Preceded by{" "}
                <Link
                  href={`/books/${encodeURIComponent(navData.previousBook.slug)}`}
                  className={styles.navLink}
                >
                  {navData.previousBook.title}
                </Link>
              </div>
            )}
            {navData.nextBook && (
              <div>
                Followed by{" "}
                <Link
                  href={`/books/${encodeURIComponent(navData.nextBook.slug)}`}
                  className={styles.navLink}
                >
                  {navData.nextBook.title}
                </Link>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}