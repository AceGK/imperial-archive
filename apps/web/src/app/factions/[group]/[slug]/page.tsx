import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { factionPairs40kQuery, singleFaction40kBySlugsQuery, booksByFactionId40kQuery } from "@/lib/sanity/queries";
import type { Faction40kDoc, Book40k } from "@/types/sanity";
import Breadcrumb from "@/components/ui/Breadcrumb";
import TwoPane from "@/components/layouts/TwoPane";
import BookGrid from "@/components/modules/BookGrid";
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

  const books = await client.fetch<Book40k[]>(
    booksByFactionId40kQuery,
    { factionId: faction._id },
    { perspective: "published" }
  );

  return (
    <main className="container">
      <Breadcrumb />
      <TwoPane sidebar={<FactionDetails faction={faction} />}>
        <h2>
          Books featuring {faction.title} <span className="clr-subtle">({books.length})</span>
        </h2>
        <BookGrid books={books} noResultsText="No books linked to this faction yet." />
      </TwoPane>
    </main>
  );
}
