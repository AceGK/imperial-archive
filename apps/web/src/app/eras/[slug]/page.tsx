// app/eras/[slug]/page.tsx
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { single40kEraQuery } from "@/lib/sanity/queries";
import type { Era40k } from "@/types/sanity";
import PageHeader from "@/components/modules/PageHeader";
import FavoriteButton from "@/components/modules/FavoriteButton";
import { ShareButton } from "@/components/modules/Share";
import BooksCatalog from "@/components/modules/Catalog/Books";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, truncate } from "@/lib/seo";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const eras = await client.fetch<{ slug: string }[]>(
    `*[_type == "era40k" && defined(slug.current)]{ "slug": slug.current }`
  );
  return eras.map((e) => ({ slug: e.slug }));
}

async function getEra(slug: string) {
  return client.fetch<Era40k | null>(single40kEraQuery, { slug });
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const era = await getEra(slug);
  if (!era) return { title: "Era Not Found" };

  return pageMetadata({
    title: `${era.title} Books`,
    description: truncate(
      era.description ||
        `Warhammer 40,000 books set in ${era.title}${era.period ? ` (${era.period})` : ""}, from Black Library.`
    ),
    path: `/eras/${era.slug}`,
    image: era.image?.url,
    imageAlt: era.image?.alt || era.title,
  });
}

export default async function EraPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const era = await getEra(slug);
  if (!era) notFound();

  return (
    <main>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${era.title} Books`,
            url: absoluteUrl(`/eras/${era.slug}`),
            description: era.description || undefined,
            about: { "@type": "Thing", name: era.title },
          },
          breadcrumbJsonLd([
            { name: "Eras", path: "/eras" },
            { name: era.title, path: `/eras/${era.slug}` },
          ]),
        ]}
      />
      <PageHeader
        title={era.title}
        subtitle={era.description}
        image={era.image}
        credit={era.image?.credit}
        alt={era.image?.alt}
        align="center"
        strongOverlay
        height="sm"
        priority
      >
        {era.period && <p style={{ textWrap: "balance" }}>{era.period}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem" }}>
          <FavoriteButton kind="era" itemId={era._id} variant="overlay" />
          <ShareButton
            url={`/eras/${era.slug}`}
            title={`${era.title}: Warhammer 40,000 books`}
            variant="overlay"
            align="center"
          />
        </div>
      </PageHeader>

      <BooksCatalog
        cacheKey={`era-${slug}`}
        baseFilters={`era.name:"${era.title}"`}
        placeholder={`Search books from ${era.title}...`}
        noResultsText={`No books from ${era.title} match your search.`}
        filters={[
          { attribute: "format", label: "Format" },
          { attribute: "authors.name", label: "Author", searchable: true },
          { attribute: "series.title", label: "Series", searchable: true },
          { attribute: "factions.name", label: "Faction", searchable: true },
        ]}
      />
    </main>
  );
}