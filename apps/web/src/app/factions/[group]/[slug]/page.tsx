// app/factions/[group]/[slug]/page.tsx
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { factionPairs40kQuery, singleFaction40kBySlugsQuery } from "@/lib/sanity/queries";
import type { Faction40kDoc } from "@/types/sanity";
import Breadcrumb from "@/components/ui/Breadcrumb";
import BooksCatalog from "@/components/modules/Catalog/Books";
import FactionDetails from "@/components/modules/Details/Faction";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, truncate } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  const pairs = await client.fetch<{ group: string; slug: string }[]>(factionPairs40kQuery);
  return pairs.map((p) => ({ group: p.group, slug: p.slug }));
}

async function getFaction(group: string, slug: string) {
  return client.fetch<Faction40kDoc | null>(
    singleFaction40kBySlugsQuery,
    { group, slug },
    { perspective: "published" }
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string; slug: string }>;
}): Promise<Metadata> {
  const { group, slug } = await params;
  const faction = await getFaction(group, slug);
  if (!faction) return { title: "Faction Not Found" };

  return pageMetadata({
    title: `${faction.title} Books`,
    description: truncate(
      faction.description ||
        `Every Warhammer 40,000 book featuring the ${faction.title} from Black Library, with authors, series, and reading order.`
    ),
    path: `/factions/${group}/${slug}`,
  });
}

export default async function FactionPage({
  params,
}: {
  params: Promise<{ group: string; slug: string }>;
}) {
  const { group, slug } = await params;

  const faction = await getFaction(group, slug);
  if (!faction) notFound();

  const path = `/factions/${group}/${slug}`;

  return (
    <main>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${faction.title} Books`,
            url: absoluteUrl(path),
            description: faction.description || undefined,
            about: { "@type": "Thing", name: faction.title },
          },
          breadcrumbJsonLd([
            { name: "Factions", path: "/factions" },
            ...(faction.group?.title
              ? [{ name: faction.group.title, path: `/factions/${group}` }]
              : []),
            { name: faction.title, path },
          ]),
        ]}
      />
        {/* <Breadcrumb /> */}
        <FactionDetails faction={faction} />
      <BooksCatalog
        cacheKey={`faction-${group}-${slug}`}
        baseFilters={`factions.name:"${faction.title}"`}
        placeholder={`Search books featuring ${faction.title}...`}
        noResultsText={`No books featuring ${faction.title} match your search.`}
        filters={[
          { attribute: "format", label: "Format" },
          { attribute: "authors.name", label: "Author", searchable: true },
          { attribute: "series.title", label: "Series", searchable: true },
          { attribute: "era.name", label: "Era" },
        ]}
      />
    </main>
  );
}