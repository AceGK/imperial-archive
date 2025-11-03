// /app/books/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { client } from "@/lib/sanity/sanity.client";
import { bookSlugs40kQuery, bookBySlug40kQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/sanity.image";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const rows: { slug: string }[] = await client.fetch(bookSlugs40kQuery);
  return rows.map((r) => ({ slug: r.slug }));
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

  // Expect enriched arrays from GROQ:
  // series: [{ name, slug, number? }]
  // factions: [{ title, slug, groupSlug? }]
  const series = Array.isArray(book.series) ? book.series : [];
  const factions = Array.isArray(book.factions) ? book.factions : [];

  const hasImage = Boolean(book?.image?.asset?.url);
  const imgUrl = book?.image?.asset?.url;
  const imgAlt: string =
    (book?.image?.alt && String(book.image.alt).trim()) ||
    (book?.title ? `${book.title} cover` : "Book cover");

  return (
    <main className="container">
      <article className="book_page">
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
          {/* Cover */}
          {hasImage && imgUrl && (
            <div
              style={{
                position: "relative",
                width: 500,
                height: 600,
                marginTop: "1rem",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <Image
                src={urlFor(book.image).width(500).auto("format").fit("max").url()}
                alt={imgAlt}
                fill
                sizes="500px"
                style={{ objectFit: "contain" }} 
                priority={true}
                unoptimized
              />
            </div>
          )}
        </div>

        <div>
          <h1>{book.title}</h1>

          {/* Byline with author links */}
          <p>
            <strong>Author: </strong>
            <AuthorsInline authors={book.authors} />
          </p>

          {/* Format */}
          {book.format && (
            <p>
              <strong>Format:</strong> {book.format}
            </p>
          )}

          {/* Series: link each series slug, include #number if present */}
          {series.length > 0 && (
            <p>
              <strong>Series:</strong>{" "}
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
            </p>
          )}

          {/* Publication date */}
          {book.publication_date && (
            <p>
              <strong>Released:</strong> {String(book.publication_date).slice(0, 4)}
            </p>
          )}

          {/* Era with slug link */}
          {book.era?.slug && (
            <p>
              <strong>Era:</strong>{" "}
              <Link href={`/eras/${encodeURIComponent(book.era.slug)}`}>
                {book.era.title ?? book.era.slug}
              </Link>
            </p>
          )}

          {/* Factions: link each to /factions/[group]/[slug] when groupSlug present */}
          {factions.length > 0 && (
            <p>
              <strong>Factions:</strong>{" "}
              {factions.map((f: any, i: number) => {
                const href = f?.groupSlug
                  ? `/factions/${encodeURIComponent(f.groupSlug)}/${encodeURIComponent(
                      f.slug
                    )}`
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
            </p>
          )}

          {/* Description & Story */}
          {book.description && (
            <div>
              <h2>Description</h2>
              <p>{book.description}</p>
            </div>
          )}
          {book.story && (
            <div>
              <h2>Story</h2>
              <p>{book.story}</p>
            </div>
          )}
        </div>
      </article>
    </main>
  );
}
