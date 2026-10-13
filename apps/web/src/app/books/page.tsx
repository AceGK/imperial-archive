// app/books/page.tsx
"use client";

import PageHeader from "@/components/modules/PageHeader";
import Catalog from "@/components/modules/Catalog";
import BookCard from "@/components/modules/Cards/BookCard";
import BookRow from "@/components/modules/Cards/BookRow";
import { BOOK_DEFAULT_SORT, BOOK_SORT_OPTIONS } from "@/components/modules/Catalog/Books";
import type { BookHit } from "@/types/algolia";

export default function BooksPage() {
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

      <Catalog<BookHit>
        indexName="books40k"
        renderHit={(hit, view, display) =>
        view === "list" ? <BookRow book={hit} display={display} /> : <BookCard book={hit} display={display} />
      }
      bookDisplay
        gridVariant="book"
        placeholder="Search books..."
        noResultsText="No books match your search."
        stats={{ singular: "Publication", plural: "Publications" }}
        hitsPerPage={36}
        sortOptions={BOOK_SORT_OPTIONS}
        defaultSort={BOOK_DEFAULT_SORT}
        filters={[
          { attribute: "format", label: "Format" },
          { attribute: "authors.name", label: "Author", searchable: true },
          { attribute: "series.title", label: "Series", searchable: true },
          { attribute: "factions.name", label: "Faction", searchable: true },
          { attribute: "era.name", label: "Era" },
        ]}
      />
    </main>
  );
}