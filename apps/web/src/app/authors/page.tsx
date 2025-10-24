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

  return (
    <main className="container">
      <section>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Authors{" "}
          <span style={{ fontSize: "0.9rem", borderRadius: 999 }}>
            ({authors.length})
          </span>
        </h1>
        <p>Discover the writers who bring the grim darkness of the far future to life across the Black Library.</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {authors.map((a) => (
            <AuthorCard
              key={a._id}
              name={a.name}
              slug={a.slug}
              count={countsByAuthor.get(a.name) ?? 0}
              image={a.image}
            />
          ))}
        </div>
      </section>
    </main>
  );
}