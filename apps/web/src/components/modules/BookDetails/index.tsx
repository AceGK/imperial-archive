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
import FavoriteButton from "@/components/modules/FavoriteButton";
import TrackButtons from "@/components/modules/TrackButtons";
import { ShareButton } from "@/components/modules/Share";
import type { BookDetailData } from "@/types/books";
import Series from "./Series";
import Factions from "./Factions";
import { buildSources, Cite, SourceList } from "@/components/modules/Sources";

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

// "Dan Abnett" -> "DA", shown when an author has no photo
function initials(name?: string) {
  return (name ?? "")
    .replace(/[.’']/g, " ")
    .split(/[\s-]+/)
    .map((part) => part.match(/\p{L}/u)?.[0] ?? "")
    .join("")
    .toUpperCase();
}

interface BookDetailProps {
  book: BookDetailData & {
    seriesNavigation?: SeriesNav[];
  };
}

export default function BookDetails({ book }: BookDetailProps) {
  const series = Array.isArray(book.series) ? book.series : [];
  const factions = Array.isArray(book.factions) ? book.factions : [];
  // the book's links, numbered and cited after its description and story
  const { sources, citations } = buildSources(book.links, ["description", "story"]);

  const hasImage = Boolean(book?.image?.asset?.url);
  const imgAlt =
    (book?.image?.alt && String(book.image.alt).trim()) ||
    (book?.title ? `${book.title} cover` : "Book cover");

  // cover's width/height ratio (falls back to a typical 5:8 book)
  const dims = book?.image?.asset?.metadata?.dimensions;
  const coverRatio = dims?.width && dims?.height ? dims.width / dims.height : 5 / 8;
  const coverHeight = Math.round(500 / coverRatio);

  const authorNames = (book.authors ?? []).map((a) => a?.name).filter(Boolean).join(", ");
  const shareTitle = authorNames ? `${book.title} by ${authorNames}` : book.title;

  return (
    <div className="container">
      <article className={styles.page}>
        <div className={styles.mediaCol}>
          <figure
            className={styles.media}
            style={{ "--cover-ratio": coverRatio } as React.CSSProperties}
          >
            {hasImage ? (
              <Image
                src={urlFor(book.image)
                  .width(500)
                  .auto("format")
                  .fit("max")
                  .url()}
                alt={imgAlt}
                width={500}
                height={coverHeight}
                sizes="(max-width: 768px) 80vw, 500px"
                className={styles.image}
                priority
                unoptimized
              />
            ) : (
              <div className={styles.placeholderImage} aria-hidden="true">
                <span className={styles.placeholderText}>{book.title}</span>
              </div>
            )}
            <figcaption className={styles.copyright}>© Games Workshop</figcaption>
          </figure>
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>{book.title}</h1>

          {book.authors && <Authors authors={book.authors} />}

          {/* the reader's own library actions together, sharing set apart at the end */}
          <div className={styles.actions}>
            <TrackButtons bookId={book._id} />
            <FavoriteButton kind="book" itemId={book._id} iconOnly />
            <div className={styles.shareAction}>
              <ShareButton url={`/books/${book.slug}`} title={shareTitle} iconOnly align="end" />
            </div>
          </div>

          {(book.description ||
            book.story ||
            book.factions ||
            book.series ||
            book.contents ||
            book.authors) && (
            <Accordion
              type="multiple"
              defaultValue={["description", "details", "collected-in", "series"]}
            >
              {book.description && (
                <AccordionItem value="description">
                  <AccordionTrigger>Description</AccordionTrigger>
                  <AccordionContent>
                    {book.description}
                    <Cite numbers={citations.description} />
                  </AccordionContent>
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
                  <AccordionContent>
                    {book.story}
                    <Cite numbers={citations.story} />
                  </AccordionContent>
                </AccordionItem>
              )}
              {book.contents && book.contents.length > 0 && (
                <AccordionItem value="contents">
                  <AccordionTrigger>Contents</AccordionTrigger>
                  <AccordionContent>
                    <ul className={styles.contentsList}>
                      {book.contents.map((content, i) => (
                        <li key={content._id || i}>
                          <Link
                            href={`/books/${encodeURIComponent(content.slug)}`}
                          >
                            {content.title}
                          </Link>
                          {content.authors && content.authors.length > 0 && (
                            <span className={styles.contentsBy}>
                              {" by "}
                              <Authors authors={content.authors} inline />
                            </span>
                          )}
                          {content.format && (
                            <span className={styles.contentsFormat}> ({content.format})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {book.collectedIn && book.collectedIn.length > 0 && (
                <AccordionItem value="collected-in">
                  <AccordionTrigger>Collected In</AccordionTrigger>
                  <AccordionContent>
                    <ul className={styles.contentsList}>
                      {book.collectedIn.map((collection) => (
                        <li key={collection._id}>
                          <Link href={`/books/${encodeURIComponent(collection.slug)}`}>
                            {collection.title}
                          </Link>
                          {collection.format && (
                            <span className={styles.contentsFormat}> ({collection.format})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
                      {book.authors &&
                book.authors.some((author) => author.bio) && (
                  <AccordionItem value="about-author">
                    <AccordionTrigger>
                      About the Author{book.authors.filter((a) => a.bio).length > 1 ? "s" : ""}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className={styles.authorBios}>
                        {book.authors
                          .filter((author) => author.bio)
                          .map((author) => (
                            <div key={author.slug} className={styles.authorBio}>
                              <div className={styles.authorHeader}>
                                {/* the name link next to it is the accessible one */}
                                <Link
                                  href={`/authors/${author.slug}`}
                                  className={styles.authorThumb}
                                  aria-hidden="true"
                                  tabIndex={-1}
                                >
                                  {author.image?.asset ? (
                                    <Image
                                      src={urlFor(author.image).width(128).height(128).fit("crop").url()}
                                      alt=""
                                      width={64}
                                      height={64}
                                      unoptimized
                                      {...(author.image.lqip && {
                                        placeholder: "blur" as const,
                                        blurDataURL: author.image.lqip,
                                      })}
                                    />
                                  ) : (
                                    initials(author.name)
                                  )}
                                </Link>
                                <div className={styles.authorName}>
                                  <Link href={`/authors/${author.slug}`}>
                                    {author.name}
                                  </Link>
                                </div>
                              </div>
                              <div className={styles.bio}>{author.bio}</div>
                            </div>
                          ))}
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
                      book={{ _id: book._id, series: book.series, format: book.format }}
                      seriesNavigation={book.seriesNavigation}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}

          <SourceList sources={sources} title={book.title} />
        </div>
      </article>
    </div>
  );
}
