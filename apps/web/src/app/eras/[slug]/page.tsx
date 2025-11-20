import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { single40kEraQuery } from "@/lib/sanity/queries";
import type { Era40k } from "@/types/sanity";
import PageHeader from "@/components/modules/PageHeader";
import Books from "@/components/modules/SearchContent/Books";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const eras = await client.fetch<{ slug: string }[]>(
    `*[_type == "era40k" && defined(slug.current)]{ "slug": slug.current }`
  );
  return eras.map((e) => ({ slug: e.slug }));
}

export default async function EraPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const era = await client.fetch<Era40k | null>(single40kEraQuery, { slug });
  if (!era) notFound();

  return (
    <main>
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
      </PageHeader>

      <Books
        filterByEra={era.title}
        placeholder={`Search books from ${era.title}...`}
        noResultsText={`No books from ${era.title} match your search.`}
      />
    </main>
  );
}
