// app/books/page.tsx
import PageHeader from "@/components/modules/PageHeader";
import Books from "@/components/modules/SearchContent/Books";

export const revalidate = 60;

export default async function BrowsePage() {
  return (
    <main>
      <PageHeader
        title="All Books"
        subtitle="Browse the full catalog of Warhammer 40,000 stories across every age of the Imperium."
        align="center"
        strongOverlay
        height="sm"
        priority
        image="/images/black-library-books.jpg"
        credit="Black Library © Games Workshop"
      />

      <Books />
    </main>
  );
}