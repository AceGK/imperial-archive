// /app/series/[slug]/page.tsx
import { notFound } from "next/navigation";
import PageHeader from "@/components/modules/PageHeader";
import { client } from "@/lib/sanity/sanity.client";
import { series40kBySlugQuery } from "@/lib/sanity/queries";
import type { Series40kDoc } from "@/types/sanity";
import Link from "next/link";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  // Only pull slugs to keep the build lean
  const slugs = await client.fetch<string[]>(
    `*[_type == "series40k" && defined(slug.current)].slug.current`
  );
  return slugs.map((slug) => ({ slug }));
}

export default async function SeriesPage({ params }: { params: Params }) {
  const data = await client.fetch<Series40kDoc | null>(series40kBySlugQuery, {
    slug: params.slug,
  });

  if (!data) notFound();

  const hero = data.image
    ? {
        url: data.image?.asset?.url,
        lqip: data.image?.asset?.metadata?.lqip,
        alt: data.image?.alt ?? data.title,
      }
    : undefined;

  return (
    <>
      <PageHeader
        title={data.title}
        subtitle={data.description || `Stories from the ${data.title} series.`}
        align="center"
        strongOverlay
        height="xs"
        priority
        image={hero?.url || "/images/placeholder-series.jpg"}
        alt={hero?.alt || data.title}
      />

      <main className="container" style={{ marginTop: "2rem" }}>
        {data.items?.length ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.75rem" }}>
            {data.items.map((it, i) => (
              <li key={`${it.book._id}-${i}`} style={{ display: "grid", gap: "0.125rem" }}>
                <div style={{ fontWeight: 600 }}>
                  {typeof it.number === "number" ? `#${it.number} ` : it.label ? `${it.label} ` : ""}
                  <Link href={`/books/${it.book.slug}`}>{it.book.title}</Link>
                </div>
                {it.note && (
                  <div style={{ fontSize: "0.9rem", color: "var(--subtle)" }}>{it.note}</div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ padding: "2rem 0", opacity: 0.6 }}>
            <em>No books linked yet.</em>
          </div>
        )}
      </main>
    </>
  );
}
