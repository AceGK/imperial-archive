import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/sanity.image";
import Badge from "@/components/ui/Badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/Accordion";
import styles from "./styles.module.scss";
import type { BookDetailData } from "@/types/books";

function AuthorsInline({
  authors,
}: {
  authors?: { name?: string; slug?: string }[];
}) {
  if (!authors || authors.length === 0) return <span>Unknown</span>;
  if (authors.length === 1) {
    const a = authors[0];
    return a?.slug ? (
      <Link href={`/authors/${encodeURIComponent(a.slug)}`}>{a.name}</Link>
    ) : (
      <span>{a?.name ?? "Unknown"}</span>
    );
  }
  return (
    <>
      {authors.map((a, i) => {
        const node = a?.slug ? (
          <Link key={a.slug} href={`/authors/${encodeURIComponent(a.slug)}`}>
            {a?.name ?? "Unknown"}
          </Link>
        ) : (
          <span key={a?.name ?? i}>{a?.name ?? "Unknown"}</span>
        );
        return (
          <span key={(a?.slug ?? a?.name ?? "") + i}>
            {node}
            {i < authors.length - 1 ? ", " : ""}
          </span>
        );
      })}
    </>
  );
}

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
  allBooks: Book[];
}

interface SeriesNav {
  seriesSlug: string;
  seriesName: string;
  lists: SeriesList[];
}

interface BookDetailProps {
  book: BookDetailData & {
    seriesNavigation?: SeriesNav[];
  };
}

export default function BookDetails({ book }: BookDetailProps) {
  const series = Array.isArray(book.series) ? book.series : [];
  const factions = Array.isArray(book.factions) ? book.factions : [];
  const seriesNav = Array.isArray(book.seriesNavigation)
    ? book.seriesNavigation
    : [];

  const hasImage = Boolean(book?.image?.asset?.url);
  const imgAlt =
    (book?.image?.alt && String(book.image.alt).trim()) ||
    (book?.title ? `${book.title} cover` : "Book cover");

  // Calculate previous/next books for each list in each series
  const navigationData = seriesNav
    .flatMap((nav) => {
      if (!nav.lists || nav.lists.length === 0) return [];

      return nav.lists
        .map((list) => {
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
    <div className="container">
      <article className={styles.page}>
        <div className={styles.mediaCol}>
          {hasImage && (
            <div className={styles.imageContainer}>
              <Image
                src={urlFor(book.image)
                  .width(500)
                  .auto("format")
                  .fit("max")
                  .url()}
                alt={imgAlt}
                fill
                sizes="(max-width: 768px) 80vw, 500px"
                className={styles.image}
                priority
                unoptimized
              />
            </div>
          )}
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>{book.title}</h1>

          {book.authors && (
            <div className={styles.authors}>
              <div className={styles.label}>
                {book.authors.length > 1 ? "Authors" : "Author"}
              </div>
              <div className={styles.list}>
                <AuthorsInline authors={book.authors} />
              </div>
            </div>
          )}

          <div className={styles.meta}>
            {book.format && (
              <div className={styles.item}>
                <div className={styles.label}>Format</div>
                <Link
                  href={`/books?format=${book.format}`}
                  className={styles.format}
                >
                  {book.format}
                </Link>
              </div>
            )}

            {book.publication_date && (
              <div className={styles.item}>
                <div className={styles.label}>Released</div>
                <div>{String(book.publication_date).slice(0, 4)}</div>
              </div>
            )}

            {book.era?.slug && (
              <div className={styles.item}>
                <div className={styles.label}>Era</div>
                <div className={styles.value}>
                  <Link href={`/eras/${encodeURIComponent(book.era.slug)}`}>
                    {book.era.title ?? book.era.slug}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {(book.description ||
            book.story ||
            book.factions ||
            book.series ||
            book.contents) && (
            <Accordion type="multiple" defaultValue={["description", "series"]}>
              {book.series && (
                <AccordionItem value="series">
                  <AccordionTrigger>Series</AccordionTrigger>
                  <AccordionContent>
                    {series.map((s: any, i: number) => {
                      const label =
                        typeof s?.number === "number" &&
                        Number.isFinite(s.number)
                          ? `${s?.name} #${s.number}`
                          : (s?.name ?? s?.slug);
                      const href = s?.slug
                        ? `/series/${encodeURIComponent(s.slug)}`
                        : "";
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
                        {navData.listName && (
                          <div className={styles.listTitle}>
                            {navData.listName}
                          </div>
                        )}
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
                  </AccordionContent>
                </AccordionItem>
              )}
              {book.description && (
                <AccordionItem value="description">
                  <AccordionTrigger>Description</AccordionTrigger>
                  <AccordionContent>{book.description}</AccordionContent>
                </AccordionItem>
              )}
              {book.story && (
                <AccordionItem value="short-story">
                  <AccordionTrigger>Story</AccordionTrigger>
                  <AccordionContent>{book.story}</AccordionContent>
                </AccordionItem>
              )}
              {book.contents && book.contents.length > 0 && (
                <AccordionItem value="contents">
                  <AccordionTrigger>Contents</AccordionTrigger>
                  <AccordionContent>
                    <ul className={styles.contentsList}>
                      {book.contents.map((content: any, i: number) => (
                        <li key={content._id || i}>
                          <Link
                            href={`/books/${encodeURIComponent(content.slug)}`}
                          >
                            {content.title}
                          </Link>
                          {content.authors && content.authors.length > 0 && (
                            <>
                              {" by "}
                              <AuthorsInline authors={content.authors} />
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {factions.length > 0 && (
                <AccordionItem value="factions">
                  <AccordionTrigger>
                    Factions{" "}
                    <Badge variant="secondary" size="sm">
                      May Contain Spoilers
                    </Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className={styles.value}>
                      {factions.map((f: any, i: number) => {
                        const href =
                          f?.groupSlug && f?.slug
                            ? `/factions/${f.groupSlug}/${f.slug}`
                            : null;

                        const label = f?.title ?? f?.slug ?? "Unknown";

                        return (
                          <span key={f?.slug ?? i}>
                            {href ? (
                              <Link href={href}>{label}</Link>
                            ) : (
                              <span>{label}</span>
                            )}
                            {i < factions.length - 1 && ", "}
                          </span>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </div>
      </article>
    </div>
  );
}
