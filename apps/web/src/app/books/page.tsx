// /app/books/page.tsx
import { allBooks40kQuery } from "@/lib/sanity/queries";
import { client } from "@/lib/sanity/sanity.client";
import PageHeader from "@/components/modules/PageHeader";
import BookGrid from "@/components/modules/BookGrid";

export const revalidate = 60;

export default async function BrowsePage() {
  const books = await client.fetch(allBooks40kQuery);
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
        <div style={{ opacity: 0.5, paddingBottom: "1rem" }}>{count} Books</div>

        <BookGrid books={books} />
      </section>
    </main>
  );
}
