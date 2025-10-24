// /app/era/[slug]/page.tsx
import { client } from "@/lib/sanity/sanity.client"
import { single40kEraQuery } from "@/lib/sanity/queries"
import type { Era40k } from "@/types/sanity"
import Link from "next/link"
import { notFound } from "next/navigation"
import Breadcrumb from "@/components/ui/Breadcrumb"

export const revalidate = 60

type Params = { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  const eras = await client.fetch<{ slug: string }[]>(`*[_type == "era40k"]{ "slug": slug.current }`)
  return eras.map((e) => ({ slug: e.slug }))
}

export default async function EraPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const era = await client.fetch<Era40k | null>(single40kEraQuery, { slug })

  if (!era) notFound()

  return (
    <main className="container">
      <Breadcrumb />

      <h1>{era.title}</h1>
      {era.period && <h2 style={{ opacity: 0.8 }}>{era.period}</h2>}
      {era.description && <p style={{ marginTop: "1rem" }}>{era.description}</p>}
    </main>
  )
}
