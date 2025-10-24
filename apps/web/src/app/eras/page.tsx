import { client } from "@/lib/sanity/sanity.client"
import { all40kErasQuery } from "@/lib/sanity/queries"
import type { Era40k } from "@/types/sanity"
import EraCard from "@/components/modules/EraCard"

export const revalidate = 60

export default async function EraListPage() {
  const eras = await client.fetch<Era40k[]>(all40kErasQuery, {}, { perspective: "published" })

  return (
    <main className="container">
      <h1>Warhammer 40k Eras</h1>

      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
        {eras.map((era) => (
          <EraCard
            key={era._id}
            title={era.title}
            slug={era.slug}
            period={era.period}
            description={era.description}
            image={era.image}
          />
        ))}
      </div>
    </main>
  )
}
