// app/authors/page.tsx
"use client";

import PageHeader from "@/components/modules/PageHeader";
import Catalog from "@/components/modules/Catalog";
import AuthorCard from "@/components/modules/Cards/AuthorCard";
import type { AuthorHit } from "@/types/algolia";

export default function AuthorsPage() {
  return (
    <main>
      <PageHeader
        title="Authors"
        subtitle="Discover the writers who bring the grim darkness of the far future to life across the Black Library."
        align="center"
        strongOverlay
        height="sm"
        priority
        image="/images/imperial-library-erik-nykvist.jpg"
        credit="Imperial Library by Erik Nykvist"
      />

      <Catalog<AuthorHit>
        indexName="authors40k"
        renderHit={(hit) => (
          <AuthorCard
            name={hit.name}
            slug={hit.slug}
            count={hit.bookCount ?? 0}
            image={hit.image}
          />
        )}
        gridVariant="author"
        placeholder="Search authors..."
        noResultsText="No authors match your search."
        stats={{ singular: "Author", plural: "Authors" }}
        hitsPerPage={36}
        sortOptions={[
          { label: "Name A-Z", value: "authors40k" },
          { label: "Name Z-A", value: "authors40k_name_desc" },
          { label: "Most Works", value: "authors40k_bookcount_desc" },
        ]}
        filters={[
          { attribute: "format", label: "Format" },
          { attribute: "series.title", label: "Series", searchable: true },
          { attribute: "factions.name", label: "Faction", searchable: true },
          { attribute: "era.name", label: "Era" },
        ]}
      />
    </main>
  );
}