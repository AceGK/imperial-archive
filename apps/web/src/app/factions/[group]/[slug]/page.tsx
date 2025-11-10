import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { factionPairs40kQuery, singleFaction40kBySlugsQuery } from "@/lib/sanity/queries";
import type { Faction40kDoc } from "@/types/sanity";
import Breadcrumb from "@/components/ui/Breadcrumb";
import TwoPane from "@/components/layouts/TwoPane";
import BooksContent from "@/components/modules/BooksContent";
import FactionDetails from "@/components/modules/Details/Faction";

export const revalidate = 60;

export async function generateStaticParams() {
  const pairs = await client.fetch<{ group: string; slug: string }[]>(factionPairs40kQuery);
  return pairs.map((p) => ({ group: p.group, slug: p.slug }));
}

export default async function FactionPage({ params }: { params: Promise<{ group: string; slug: string }> }) {
  const { group, slug } = await params;

  const faction = await client.fetch<Faction40kDoc | null>(
    singleFaction40kBySlugsQuery,
    { group, slug },
    { perspective: "published" }
  );
  if (!faction) notFound();

  return (
    <main>
      <div className="container">
      <Breadcrumb />
      <FactionDetails faction={faction} />
      </div>
      <BooksContent 
        filterByFaction={faction.title}
        placeholder={`Search books featuring ${faction.title}...`}
        noResultsText={`No books featuring ${faction.title} match your search.`}
      />
    </main>
  );
}