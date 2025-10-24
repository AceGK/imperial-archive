// /app/factions/page.tsx
import { client } from '@/lib/sanity/sanity.client'
import { groupedFactions40kQuery } from '@/lib/sanity/queries'
import type { FactionGroupWithItems } from '@/types/sanity'
import FactionCard from '@/components/modules/FactionCard'
import { resolveGroupIcon } from '@/components/icons/factions/resolve'

export const revalidate = 60

export default async function FactionsPage() {
  const groups = await client.fetch<FactionGroupWithItems[]>(
    groupedFactions40kQuery,
    {},
    { perspective: 'published' }
  )

  return (
    <main className="container">
      <section>
        <h1>Factions</h1>
        <p>Browse Warhammer 40,000 books by army, legion, chapter, and faction.</p>

        {groups.map((g) => {
          const Icon = resolveGroupIcon(g.iconId || '')
          return (
            <section key={g._id} style={{ marginBottom: '2rem' }}>
              <header style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                {Icon ? <Icon width={100} height={100} role="img" aria-label={`${g.slug} icon`} /> : null}
                <div>
                  <h2>{g.title}</h2>
                  {g.description ? <p style={{ margin: '0.25rem 0 0', opacity: 0.8 }}>{g.description}</p> : null}
                </div>
              </header>

              <ul
                style={{
                  display: 'grid',
                  gap: '1rem',
                  padding: 0,
                  gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
                  listStyle: 'none',
                }}
              >
                {g.items.map((f) => (
                  <li key={f._id}>
                    <FactionCard
                      title={f.title}
                      slug={f.slug}
                      iconId={f.iconId}
                      // your card doesn’t need image unless you add it to the schema
                      group={g.slug}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </section>
    </main>
  )
}
