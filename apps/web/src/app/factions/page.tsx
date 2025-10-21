// /app/factions/page.tsx (or /pages/factions/index.tsx)
import { getGroupedFactions } from "@/lib/40k-factions";
import FactionCard from "@/components/modules/FactionCard";
import { resolveGroupIcon } from "@/components/icons/factions/resolve";

export default async function FactionsPage() {
  const groups = getGroupedFactions();

  return (
    <main className="container">
      <section>
        <h1>Factions</h1>
        <p>Browse Warhammer 40,000 books by army, legion, chapter, and faction. Only factions with published stories or major appearances are included.</p>
        {groups.map(({ key, meta, items }) => {
          // get the component from registry
          const Icon = resolveGroupIcon(meta.iconId);

          return (
            <section key={key} style={{ marginBottom: "2rem" }}>
              <header
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                {Icon &&
                  <Icon
                    width={100}
                    height={100}
                    role="img"
                    aria-label={`${key} icon`}
                  />
                }

                <div>
                  <h2>
                    {meta.title}
                  </h2>
                  {meta.description && (
                    <p style={{ margin: "0.25rem 0 0", opacity: 0.8 }}>
                      {meta.description}
                    </p>
                  )}
                </div>
              </header>

              <ul
                style={{
                  display: "grid",
                  gap: "1rem",
                  padding: 0,
                  gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
                  listStyle: "none",
                }}
              >
                {items.map((f) => (
                  <li key={f.slug}>
                    <FactionCard
                      title={f.title}
                      slug={f.slug}
                      iconId={f.iconId}
                      image={f.image}
                      group={key}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </section>
    </main>
  );
}
