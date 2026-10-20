// Catalog content placed in rich text from Sanity: book and series shelves,
// and links to catalog documents. The body query resolves their references
// (bodyProjection in lib/sanity/queries.ts); where it hasn't, they render nothing.
import type { ReactNode } from "react";
import Link from "next/link";
import BookCard from "@/components/modules/Cards/BookCard";
import SeriesCard from "@/components/modules/Cards/SeriesCard";
import BooksCarousel from "@/components/modules/Carousel/BooksCarousel";
import SeriesCarousel from "@/components/modules/Carousel/SeriesCarousel";
import type { Book40k, Series40kDoc } from "@/types/sanity";
import styles from "./styles.module.scss";

type Layout = "grid" | "slider";
type ShelfSeries = Pick<Series40kDoc, "_id" | "title" | "slug" | "image" | "totalCount">;

const publications = (n?: number | null) =>
  n != null ? `${n} ${n === 1 ? "Publication" : "Publications"}` : undefined;

export function BookShelf({ value }: { value: { books?: (Book40k | null)[]; layout?: Layout } }) {
  // references to deleted or unpublished books come back null
  const books = (value.books ?? []).filter((b): b is Book40k => Boolean(b?.slug));
  if (books.length === 0) return null;

  return (
    <div className={styles.embed}>
      {value.layout === "slider" ? (
        <BooksCarousel books={books} />
      ) : (
        <div className={styles.bookGrid}>
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SeriesShelf({ value }: { value: { series?: (ShelfSeries | null)[]; layout?: Layout } }) {
  const series = (value.series ?? []).filter((s): s is ShelfSeries => Boolean(s?.slug));
  if (series.length === 0) return null;

  return (
    <div className={styles.embed}>
      {value.layout === "slider" ? (
        <SeriesCarousel series={series} />
      ) : (
        <div className={styles.seriesGrid}>
          {series.map((s) => (
            <SeriesCard key={s._id} title={s.title} slug={s.slug} image={s.image} countLabel={publications(s.totalCount)} />
          ))}
        </div>
      )}
    </div>
  );
}

type LinkTarget = { _type: string; slug?: string | null; group?: string | null } | null | undefined;

/** The site path for a catalog document, or null when it can't be built */
export function catalogPath(target: LinkTarget): string | null {
  if (!target?.slug) return null;
  switch (target._type) {
    case "book40k":
      return `/books/${target.slug}`;
    case "series40k":
      return `/series/${target.slug}`;
    case "author40k":
      return `/authors/${target.slug}`;
    case "era40k":
      return `/eras/${target.slug}`;
    case "faction40k":
      return target.group ? `/factions/${target.group}/${target.slug}` : null;
    default:
      return null;
  }
}

/** A link to a catalog document; plain text if the document is gone */
export function ArchiveLink({ value, children }: { value?: { target?: LinkTarget }; children: ReactNode }) {
  const path = catalogPath(value?.target);
  return path ? <Link href={path}>{children}</Link> : <>{children}</>;
}
