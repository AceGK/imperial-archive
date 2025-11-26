// app/series/page.tsx
"use client";

import PageHeader from "@/components/modules/PageHeader";
import Catalog from "@/components/modules/Catalog";
import SeriesCard from "@/components/modules/Cards/SeriesCard";
import type { SeriesHit } from "@/types/algolia";

export default function SeriesIndexPage() {
  return (
    <main>
      <PageHeader
        title="Series"
        subtitle="Follow the sagas of heroes, traitors, and legends across campaigns, Crusades, and Black Library narrative arcs."
        align="center"
        strongOverlay
        height="sm"
        priority
        image="/images/eisenhorn-alexander-ovchinnikov.jpg"
        credit="Eisenhorn by Alexander Ovchinnikov"
      />

      <Catalog<SeriesHit>
        cacheKey="series-index"
        indexName="series40k"
        placeholder="Search series..."
        noResultsText="No series match your search."
        filters={[
          { attribute: "format", label: "Format" },
          { attribute: "authors.name", label: "Author", searchable: true },
          { attribute: "factions.name", label: "Faction", searchable: true },
          { attribute: "era.name", label: "Era" },
        ]}
        sortOptions={[
          { value: "series40k", label: "Title A-Z" },
          { value: "series40k_title_desc", label: "Title Z-A" },
        ]}
        gridVariant="series"
        hitsPerPage={36}
        renderHit={(hit) => (
          //TODO make SeriesCard accept hit directly
          <SeriesCard
            key={hit.objectID}
            title={hit.title}
            slug={hit.slug}
            image={hit.image?.asset ? hit.image as any : null}
            countLabel={`${hit.bookCount} ${hit.bookCount === 1 ? "Work" : "Works"}`}
          />
        )}
      />
    </main>
  );
}