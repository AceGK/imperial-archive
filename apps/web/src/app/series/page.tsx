import PageHeader from "@/components/modules/PageHeader";
import SeriesCard from "@/components/modules/Cards/SeriesCard";
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
        credit="Eisenhorn by Alexander Ovchinnikov"
      />

      <section className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {series.map((s) => {
            const count =
              typeof s.totalCount === "number"
                ? s.totalCount
                : (s.lists ?? []).reduce(
                    (acc, list) => acc + (list.items?.length ?? 0),
                    0
                  );

            return (
              <SeriesCard
                key={s._id}
                title={s.title}
                slug={s.slug}
                description={s.description ?? undefined}
                image={s.image}
                countLabel={
                  count ? `${count} book${count > 1 ? "s" : ""}` : undefined
                }
                compact
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}
