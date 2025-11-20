// app/series/page.tsx
import PageHeader from "@/components/modules/PageHeader";
import Series from "@/components/modules/SearchContent/Series";

export const revalidate = 60;

export default async function SeriesIndexPage() {
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

      <Series />
    </main>
  );
}