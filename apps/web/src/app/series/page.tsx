import PageHeader from "@/components/modules/PageHeader";
import Link from "next/link";
import { getAllSeries } from "@/lib/40k-series";

export default function SeriesPage() {
  const series = getAllSeries();
  return (
    <main>
      <PageHeader
        title={`Series`}
        subtitle="Follow the sagas of heroes, traitors, and legends across campaigns, Crusades, and Black Library narrative arcs."
        // subtitle="Explore narrative arcs, character sagas, and storylines across the Warhammer universe."
        align="center"
        strongOverlay
        height="xs"
        priority
        image="/images/eisenhorn-alexander-ovchinnikov.jpg"
        alt="Eisenhorn by Alexander Ovchinnikov"
      />
      <section className="container">
        <ul style={{ listStyle: "none", padding: 0, marginTop: "1.5rem" }}>
          {series.map((s) => (
            <li key={s.slug} style={{ padding: "0.25rem 0" }}>
              <Link href={`/series/${s.slug}`}>{s.name}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
