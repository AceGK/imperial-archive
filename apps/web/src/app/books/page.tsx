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
        alt="Black Library © Games Workshop"
      />

      <section className="container">
        <div style={{opacity: 0.5, paddingBottom:"1rem"}}>{count} Books</div>
       
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
