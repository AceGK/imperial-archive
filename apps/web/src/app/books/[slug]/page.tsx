// /app/books/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { client } from "@/lib/sanity/sanity.client";
import { bookSlugs40kQuery, bookBySlug40kQuery } from "@/lib/sanity/queries";

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
  // Multiple authors: list and link each, comma-separated
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

  const factions: string[] = Array.isArray(book.factions) ? book.factions : [];
  const series: { name: string; number?: number | null }[] = book.series ?? [];

  const hasImage = Boolean(book?.image?.asset?.url);
  const imgUrl: string | undefined = book?.image?.asset?.url;
  const imgAlt: string =
    (book?.image?.alt && String(book.image.alt).trim()) ||
    (book?.title ? `${book.title} cover` : "Book cover");

  return (
    <main className="container">
      <section>
        <article>
          <h1>{book.title}</h1>

          {/* Byline with author links */}
          <p>
            <strong>By: </strong>
            <AuthorsInline authors={book.authors} />
          </p>

          {/* Format */}
          {book.format && (
            <p>
              <strong>Format:</strong> {book.format}
            </p>
          )}

          {/* Series */}
          {series.length > 0 && (
            <div>
              <strong>Series:</strong>{" "}
              {series
                .map((s) =>
                  typeof s.number === "number" && Number.isFinite(s.number)
                    ? `${s.name} #${s.number}`
                    : s.name
                )
                .join(", ")}
            </div>
          )}

          {/* Publication date */}
          {book.publication_date && (
            <p>
              <strong>Publication Date:</strong> {book.publication_date}
            </p>
          )}

          {/* Era */}
          {book.era && (
            <p>
              <strong>Era:</strong> {book.era}
            </p>
          )}

          {/* Factions */}
          {factions.length > 0 && (
            <p>
              <strong>Factions:</strong> {factions.join(", ")}
            </p>
          )}

          {/* Cover */}
          {hasImage && imgUrl && (
            <div
              style={{
                position: "relative",
                width: 300,
                height: 400,
                marginTop: "1rem",
              }}
            >
              <Image
                src={imgUrl}
                alt={imgAlt}
                fill
                sizes="300px"
                style={{ objectFit: "cover", borderRadius: 8 }}
                priority={false}
              />
            </div>
          )}

          {/* Description & Story */}
          {book.description && (
            <section>
              <h2>Description</h2>
              <p>{book.description}</p>
            </section>
          )}
          {book.story && (
            <section>
              <h2>Story</h2>
              <p>{book.story}</p>
            </section>
          )}

          {/* Optional credit */}
          {book?.image?.credit && (
            <p style={{ opacity: 0.7, marginTop: "0.5rem" }}>
              <small>{book.image.credit}</small>
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
