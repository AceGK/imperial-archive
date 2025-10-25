// /app/books/page.tsx
import { searchBooks, type Book } from "@/lib/40k-books";
import BookCard from "@/components/modules/BookCard";
import PageHeader from "@/components/modules/PageHeader";

export const revalidate = 60;

export default async function BrowsePage() {
  const books: Book[] = await searchBooks({ sort: "title_asc" });
  const count = books.length;

  return (
    <main>
      <PageHeader
        title="All Books"
        subtitle="Browse the full catalog of Warhammer 40,000 stories across every age of the Imperium."
        align="center"
        strongOverlay
        height="xs"
        priority
        image="/images/black-library-books.jpg"
      />

      <section className="container">
        {/* <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          All Books{" "}
          <span
            style={{
              fontSize: "0.9rem",
              borderRadius: 999,
            }}
            aria-label={`Total books: ${count}`}
          >
            ({count})
          </span>
        </h1> */}
       
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(200px, 100%), 1fr))"
          }}
        >
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>
    </main>
  );
}
