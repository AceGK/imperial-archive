import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { client } from "@/lib/sanity/sanity.client";
import { bookSlugs40kQuery, bookBySlug40kQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/sanity.image";
import styles from "./styles.module.scss";
import Button from "@/components/ui/Button";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs: { slug: string }[] = await client.fetch(bookSlugs40kQuery);
  return slugs.map((s) => ({ slug: s.slug }));
}

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

export default async function BookPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  const book = await client.fetch(bookBySlug40kQuery, { slug });
  if (!book) notFound();

  const series = Array.isArray(book.series) ? book.series : [];
  const factions = Array.isArray(book.factions) ? book.factions : [];

  const hasImage = Boolean(book?.image?.asset?.url);
  const imgAlt =
    (book?.image?.alt && String(book.image.alt).trim()) ||
    (book?.title ? `${book.title} cover` : "Book cover");

  return (
    <main className="container">
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
            <div className={styles.meta}>
              <div className={styles.label}>Author</div>
              <div className={styles.authors}>
                <AuthorsInline authors={book.authors} />
              </div>
            </div>
          )}

          {book.format && (
            <div className={styles.meta}>
              <div className={styles.label}>Format</div>
              <div className={styles.format}>{book.format}</div>
            </div>
          )}

          {book.publication_date && (
            <div className={styles.meta}>
              <div className={styles.label}>Released</div>
              <div>{String(book.publication_date).slice(0, 4)}</div>
            </div>
          )}

          {book.era?.slug && (
            <div className={styles.meta}>
              <div className={styles.label}>Era</div>
              <div className={styles.value}>
                <Link href={`/eras/${encodeURIComponent(book.era.slug)}`}>
                  {book.era.title ?? book.era.slug}
                </Link>
              </div>
            </div>
          )}

          {series.length > 0 && (
            <div className={styles.meta}>
              <div className={styles.label}>Series</div>
              <div className={styles.value}>
                {series.map((s: any, i: number) => {
                  const label =
                    typeof s?.number === "number" && Number.isFinite(s.number)
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
              </div>
            </div>
          )}

          {factions.length > 0 && (
            <div className={styles.meta}>
              <div className={styles.label}>Factions</div>
              <div className={styles.value}>
                {factions.map((f: any, i: number) => {
                  const href = f?.groupSlug
                    ? `/factions/${encodeURIComponent(f.groupSlug)}/${encodeURIComponent(f.slug)}`
                    : f?.slug
                      ? `/factions/${encodeURIComponent(f.slug)}`
                      : "";
                  const label = f?.title ?? f?.slug ?? "Unknown";
                  const node = href ? (
                    <Link
                      key={`${f?.groupSlug ?? "nogroup"}-${f?.slug ?? i}`}
                      href={href}
                    >
                      {label}
                    </Link>
                  ) : (
                    <span key={`${label}-${i}`}>{label}</span>
                  );
                  return (
                    <span key={`f-${f?.slug ?? i}`}>
                      {node}
                      {i < factions.length - 1 ? ", " : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {book.description && (
            <section className={styles.block}>
              <h2>Description</h2>
              <p>{book.description}</p>
            </section>
          )}

          {book.story && (
            <section className={styles.block}>
              <h2>Story</h2>
              <p>{book.story}</p>
            </section>
          )}
        </div>
      </article>
    </main>
  );
}
