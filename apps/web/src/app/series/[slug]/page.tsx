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
  const slugs = await client.fetch<string[]>(
    `*[_type == "series40k" && defined(slug.current)].slug.current`
  );
  return slugs.map((slug) => ({ slug }));
}

// NOTE: params is a Promise here
export default async function SeriesPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const data = await client.fetch<Series40kDoc | null>(series40kBySlugQuery, { slug });
  if (!data) notFound();

  const heroUrl = data.image?.asset?.url ?? "/images/placeholder-series.jpg";
  const heroAlt = data.image?.alt ?? data.title;

  return (
    <>
      <PageHeader
        title={data.title}
        subtitle={data.description || `Stories from the ${data.title} series.`}
        align="center"
        strongOverlay
        height="xs"
        priority
        image={heroUrl}
        alt={heroAlt}
      />

      <main className="container" style={{ marginTop: "2rem" }}>
        {/* If you adopted the new multi-list schema, render lists; else keep the single items block */}
        {data.lists?.length ? (
          <div style={{ display: "grid", gap: "1.25rem" }}>
            {data.lists.map((list, li) => (
              <section key={list.key ?? `${li}`} style={{ display: "grid", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>{list.title}</h2>
                {list.description && (
                  <p style={{ margin: 0, color: "var(--subtle)" }}>{list.description}</p>
                )}
                {list.items?.length ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.75rem" }}>
                    {list.items.map((it, i) => (
                      <li key={`${it.book._id}-${i}`} style={{ display: "grid", gap: "0.125rem" }}>
                        <div style={{ fontWeight: 600 }}>
                          {typeof it.number === "number"
                            ? `#${it.number} `
                            : it.label
                            ? `${it.label} `
                            : ""}
                          <Link href={`/books/${it.book.slug}`}>{it.book.title}</Link>
                        </div>
                        {it.note && (
                          <div style={{ fontSize: "0.9rem", color: "var(--subtle)" }}>{it.note}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ opacity: 0.6 }}>
                    <em>No books in this list yet.</em>
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : data.items?.length ? (
          // Back-compat for old single "items" field
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
