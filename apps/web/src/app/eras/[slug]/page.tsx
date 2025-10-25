// /app/era/[slug]/page.tsx
import { client } from "@/lib/sanity/sanity.client";
import { single40kEraQuery } from "@/lib/sanity/queries";
import type { Era40k } from "@/types/sanity";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PageHeader from "@/components/modules/PageHeader";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const eras = await client.fetch<{ slug: string }[]>(
    `*[_type == "era40k"]{ "slug": slug.current }`
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
        alt={era.image?.alt}
        align="center"
        strongOverlay
        height="xs"
        priority
      >
        {era.description && <p style={{textWrap: "balance"}}>{era.period}</p>}
      </PageHeader>
      <section className="container">

      </section>
    </main>
  );
}
