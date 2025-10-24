import { client } from "@/lib/sanity/sanity.client"
import { all40kErasQuery } from "@/lib/sanity/queries"
import type { Era40k } from "@/types/sanity"
import EraCard from "@/components/modules/EraCard"

export const revalidate = 60

export default async function EraListPage() {
  const eras = await client.fetch<Era40k[]>(all40kErasQuery, {}, { perspective: "published" })

  return (
    <main className="container">
      <section>
      <h1>Eras</h1>
      <p>Discover Warhammer 40,000 stories organized by the defining ages of the Imperium, from the Great Crusade to the Indomitus Crusade.</p>
      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", marginTop: "2rem" }}>
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
      </section>
    </main>
  )
}
