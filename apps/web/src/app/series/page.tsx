import PageHeader from "@/components/modules/PageHeader";

export default function SeriesPage() {
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
        <h1>Series</h1>
      </section>
    </main>
  );
}
