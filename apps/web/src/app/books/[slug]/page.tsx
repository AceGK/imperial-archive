// /app/books/[slug]/page.tsx  (Next.js 15, App Router)
import { notFound } from "next/navigation";
import { getAllBooks, getBookBySlug, type Book } from "@/lib/40k-books";

export const revalidate = 60; // ISR every 60s

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const books: Book[] = await getAllBooks();
  return books.map((b) => ({ slug: b.slug }));
}

function authorLabel(arr?: string[]) {
  if (!arr?.length) return "Unknown";
  if (arr.length === 1) return arr[0];
  return "Various Authors";
}

export default async function BookPage({
  params,
  // If you use query strings on this page, keep this and await it similarly.
  searchParams,
}: {
  params: Promise<Params>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // ✅ Next 15: await params (and searchParams if you use it)
  const { slug } = await params;

  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const byline = authorLabel(book.author);
  const tags = Array.isArray(book.tags) ? book.tags : [];
  const collections = Array.isArray(book.collections) ? book.collections : [];

  return (
    <main className="container">
      <section>
        <article>
          <h1>{book.title}</h1>
          <p className="author">By {byline}</p>

          {/* Series & Number */}
          {(book.series || typeof book.series_number === "number") && (
            <p>
              <strong>Series:</strong> {book.series ?? "—"}
              {typeof book.series_number === "number"
                ? ` (#${book.series_number})`
                : ""}
            </p>
          )}

          {/* Release date */}
          {book.releaseDate && (
            <p>
              <strong>Release Date:</strong> {book.releaseDate}
            </p>
          )}

          {/* Era / Setting */}
          {(book.era || book.setting) && (
            <p>
              {book.era && (
                <>
                  <strong>Era:</strong> {book.era}{" "}
                </>
              )}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <p>
              <strong>Tags:</strong> {tags.join(", ")}
            </p>
          )}

          {/* Collections */}
          {collections.length > 0 && (
            <p>
              <strong>Collections:</strong> {collections.join(", ")}
            </p>
          )}

          {/* Cover */}
          {book.cover_image_url && (
            <img
              src={book.cover_image_url}
              alt={book.title}
              width={400}
              height={600}
              style={{ objectFit: "cover", borderRadius: 8, marginTop: "1rem" }}
            />
          )}

          {/* Description/Story */}
          <section>
            {book.description && (
              <div style={{ marginBottom: "2rem" }}>
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
          </section>
        </article>
      </section>
    </main>
  );
}
