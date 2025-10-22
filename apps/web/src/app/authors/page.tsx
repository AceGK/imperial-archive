// /app/authors/page.tsx
import { client } from "@/lib/sanity/sanity.client";
import { all40kAuthorsQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/sanity.image";
import type { Author40k } from "@/types/sanity";

import { getAllBooks } from "@/lib/40k-books";
import AuthorCard from "@/components/modules/AuthorCard";

export const revalidate = 60;

type Book = {
  id: number;
  title: string;
  slug: string;
  author: string[];
};

export default async function AuthorsPage() {
  // Fetch authors from Sanity (typed)
  const authors = await client.fetch<Author40k[]>(all40kAuthorsQuery);

  // Build counts from your JSON books (todo replace with sanity)
  const books: Book[] = await getAllBooks();
  const countsByAuthor = new Map<string, number>();

  for (const b of books) {
    for (const raw of b.author || []) {
      const name = (raw || "").trim();
      if (!name) continue;
      countsByAuthor.set(name, (countsByAuthor.get(name) ?? 0) + 1);
    }
  }

  // Shape data for AuthorCard: slug string, imageUrl, count
  const items = authors.map((a) => {
    const slug = a.slug?.current ?? "";
    const imageUrl = a.image
      ? urlFor(a.image).width(400).height(400).fit("crop").url()
      : undefined;
    const count = countsByAuthor.get(a.name) ?? 0;
    return { name: a.name, slug, imageUrl, count };
  });

  return (
    <main className="container">
      <section>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Authors{" "}
          <span style={{ fontSize: "0.9rem", borderRadius: 999 }}>
            ({items.length})
          </span>
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {items.map(({ slug, name, count, imageUrl }) => (
            <AuthorCard
              key={slug || name}
              name={name}
              slug={slug}
              count={count}
              imageUrl={imageUrl}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
