// /app/series/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getAllSeries, findSeriesBySlug } from "@/lib/40k-series";
import PageHeader from "@/components/modules/PageHeader";

type Params = { slug: string };

export async function generateStaticParams() {
  const series = getAllSeries();
  return series.map((s) => ({ slug: s.slug }));
}

export default function SeriesPage({ params }: { params: Params }) {
  const series = findSeriesBySlug(params.slug);

  if (!series) notFound();

  return (
    <>
      <PageHeader
        title={series.name}
        subtitle={`Stories from the ${series.name} series.`}
        align="center"
        strongOverlay
        height="xs"
        priority
        image="/images/placeholder-series.jpg" // optional hero image placeholder
        alt={series.name}
      />

      <main className="container" style={{ marginTop: "2rem" }}>

        {/* TODO: Replace with real book grid */}
        <div style={{ padding: "2rem 0", opacity: 0.5 }}>
          <em>Book listing coming soon…</em>
        </div>
      </main>
    </>
  );
}
