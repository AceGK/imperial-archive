// /app/series/[slug]/page.tsx
import { notFound } from "next/navigation";
import PageHeader from "@/components/modules/PageHeader";
import { client } from "@/lib/sanity/sanity.client";
import { series40kBySlugQuery } from "@/lib/sanity/queries";
import type { Series40kDoc } from "@/types/sanity";
import { urlFor } from "@/lib/sanity/sanity.image";
import BookGrid from "@/components/modules/BookGrid";
import type { BookCardData } from "@/components/modules/Cards/BookCard";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await client.fetch<string[]>(
    `*[_type == "series40k" && defined(slug.current)].slug.current`
  );
  return slugs.map((slug) => ({ slug }));
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  const data = await client.fetch<Series40kDoc | null>(series40kBySlugQuery, { slug });
  if (!data) notFound();

  const hero = data.image?.asset
    ? {
        url: urlFor(data.image)
          .width(1600)
          .height(900)
          .fit("crop")
          .auto("format")
          .url(),
        lqip: data.image.asset.metadata?.lqip,
        alt: data.image.alt ?? "",
        credit: data.image.credit ?? undefined,
      }
    : null;

  return (
    <>
      <PageHeader
        title={data.title}
        subtitle={data.subtitle || `Stories from the ${data.title} series.`}
        align="center"
        strongOverlay
        height="sm"
        priority
        image={hero}
        alt={hero?.alt}
        credit={hero?.credit}
      />

      <main className="container" style={{ marginTop: "2rem" }}>
        {data.lists?.length ? (
          <div style={{ display: "grid", gap: "1.75rem" }}>
            {data.lists.map((list, li) => {
              // Convert [{ work: Book }] -> Book[]
              const books: BookCardData[] =
                (list.items ?? [])
                  .map((it: any) => it?.work)
                  .filter(Boolean) as BookCardData[];

              return (
                <section
                  key={list.key ?? `${li}`}
                  style={{ display: "grid", gap: "0.75rem" }}
                >
                  <header>
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
                      {list.title}
                    </h2>
                    {list.subtitle && (
                      <p style={{ margin: "0.25rem 0 0", color: "var(--subtle)" }}>
                        {list.subtitle}
                      </p>
                    )}
                  </header>

                  <BookGrid books={books} noResultsText="No books in this list yet." />
                </section>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "2rem 0", opacity: 0.6 }}>
            <em>No books linked yet.</em>
          </div>
        )}
      </main>
    </>
  );
}
