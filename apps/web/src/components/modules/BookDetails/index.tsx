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
import Authors from "./Authors";
import styles from "./styles.module.scss";
import type { BookDetailData } from "@/types/books";
import Series from "./Series";
import Factions from "./Factions";

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

interface BookDetailProps {
  book: BookDetailData & {
    seriesNavigation?: SeriesNav[];
  };
}

export default function BookDetails({ book }: BookDetailProps) {
  const series = Array.isArray(book.series) ? book.series : [];
  const factions = Array.isArray(book.factions) ? book.factions : [];

  const hasImage = Boolean(book?.image?.asset?.url);
  const imgAlt =
    (book?.image?.alt && String(book.image.alt).trim()) ||
    (book?.title ? `${book.title} cover` : "Book cover");

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

          {book.authors && <Authors authors={book.authors} />}

          {(book.description ||
            book.story ||
            book.factions ||
            book.series ||
            book.contents ||
            book.authors) && (
            <Accordion
              type="multiple"
              defaultValue={["description", "details", "series"]}
            >
              {book.description && (
                <AccordionItem value="description">
                  <AccordionTrigger>Description</AccordionTrigger>
                  <AccordionContent>{book.description}</AccordionContent>
                </AccordionItem>
              )}
              {(book.format ||
                book.publication_date ||
                book.page_count ||
                book.era?.slug) && (
                <AccordionItem value="details">
                  <AccordionTrigger>Details</AccordionTrigger>
                  <AccordionContent>
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

                      {book.page_count && (
                        <div className={styles.item}>
                          <div className={styles.label}>Pages</div>
                          <div>{book.page_count}</div>
                        </div>
                      )}

                      {book.era?.slug && (
                        <div className={styles.item}>
                          <div className={styles.label}>Era</div>
                          <div className={styles.value}>
                            <Link
                              href={`/eras/${encodeURIComponent(book.era.slug)}`}
                            >
                              {book.era.title ?? book.era.slug}
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
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
                              <Authors authors={content.authors} inline />
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {book.authors &&
                book.authors.length === 1 &&
                book.authors[0].bio && (
                  <AccordionItem value="about-author">
                    <AccordionTrigger>About the Author</AccordionTrigger>
                    <AccordionContent>
                      <div className={styles.authorBios}>
                        <div className={styles.authorBio}>
                          <h3 className={styles.authorName}>
                            <Link href={`/authors/${book.authors[0].slug}`}>
                              {book.authors[0].name}
                            </Link>
                          </h3>
                          {book.authors[0].bio && (
                            <div className={styles.bio}>
                              {book.authors[0].bio}
                            </div>
                          )}
                        </div>
                      </div>
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
                    <Factions factions={factions} />
                  </AccordionContent>
                </AccordionItem>
              )}
              {series.length > 0 && (
                <AccordionItem value="series">
                  <AccordionTrigger>Series</AccordionTrigger>
                  <AccordionContent>
                    <Series
                      book={{ _id: book._id, series: book.series }}
                      seriesNavigation={book.seriesNavigation}
                    />
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
