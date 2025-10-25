// /app/series/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getAllSeries, findSeriesBySlug } from "@/lib/40k-series";
import PageHeader from "@/components/modules/PageHeader";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const series = getAllSeries();
  return series.map((s) => ({ slug: s.slug }));
}

export default async function SeriesPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;               // ✅ await the promised params
  const series = findSeriesBySlug(slug);

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
        image="/images/placeholder-series.jpg"
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
