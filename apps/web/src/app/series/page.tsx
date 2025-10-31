// /app/series/page.tsx
import PageHeader from "@/components/modules/PageHeader";
import SeriesCard from "@/components/modules/SeriesCard";
import { client } from "@/lib/sanity/sanity.client";
import { allSeries40kQuery } from "@/lib/sanity/queries";
import type { Series40kDoc } from "@/types/sanity";

export const revalidate = 60;

export default async function SeriesIndexPage() {
  const series = await client.fetch<Series40kDoc[]>(allSeries40kQuery);

  return (
    <main>
      <PageHeader
        title="Series"
        subtitle="Follow the sagas of heroes, traitors, and legends across campaigns, Crusades, and Black Library narrative arcs."
        align="center"
        strongOverlay
        height="xs"
        priority
        image="/images/eisenhorn-alexander-ovchinnikov.jpg"
        alt="Eisenhorn by Alexander Ovchinnikov"
      />

      <section className="container" style={{ padding: "1.5rem 0 2.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {series.map((s) => (
            <SeriesCard
              key={s._id}
              title={s.title}
              slug={s.slug}
              description={s.description ?? undefined}
              image={
                s.image
                  ? {
                      url: s.image?.asset?.url,
                      lqip: s.image?.asset?.metadata?.lqip ?? null,
                      alt: s.image?.alt ?? null,
                    }
                  : undefined
              }
              countLabel={
                s.items?.length ? `${s.items.length} book${s.items.length > 1 ? "s" : ""}` : undefined
              }
              compact
            />
          ))}
        </div>
      </section>
    </main>
  );
}
