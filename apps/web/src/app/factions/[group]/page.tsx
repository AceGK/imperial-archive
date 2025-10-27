import Link from "next/link";
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { groupedFactions40kQuery } from "@/lib/sanity/queries";
import { resolveGroupIcon } from "@/components/icons/factions/resolve";
import FactionCard from "@/components/modules/FactionCard";
import type { FactionGroupWithItems } from "@/types/sanity";

export const revalidate = 60;

// Generate static params for all groups
export async function generateStaticParams() {
  const groups = await client.fetch<FactionGroupWithItems[]>(groupedFactions40kQuery);
  return groups.map((g) => ({ group: g.slug }));
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;

  // Fetch all groups + their factions
  const groups = await client.fetch<FactionGroupWithItems[]>(groupedFactions40kQuery);
  const bucket = groups.find((g) => g.slug === group);

  if (!bucket) notFound();

  const { title, description, iconId, links, items } = bucket;
  const Icon = resolveGroupIcon(iconId);

  // Find Lexicanum link
  const lexicanumLink = links?.find((l) => l.type === "lexicanum")?.url ?? null;

  return (
    <main className="container">
      <section>
        <p>
          <Link href="/factions">← All factions</Link>
        </p>

        <header
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          {Icon && <Icon width={100} height={100} />}
          <div>
            <h1 style={{ margin: 0 }}>{title}</h1>

            {lexicanumLink && (
              <p style={{ margin: "6px 0 8px" }}>
                <a
                  href={lexicanumLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    gap: 6,
                    alignItems: "center",
                    textDecoration: "underline",
                  }}
                  aria-label={`Open ${title} on Lexicanum (opens in a new tab)`}
                >
                  View on Lexicanum →
                </a>
              </p>
            )}

            {description && <p style={{ opacity: 0.8 }}>{description}</p>}
          </div>
        </header>

        <section>
          {items?.length > 0 ? (
            <ul
              style={{
                display: "grid",
                gap: 16,
                listStyle: "none",
                padding: 0,
                gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
              }}
            >
              {items.map((f) => (
                <li key={f._id}>
                  <FactionCard
                    title={f.title}
                    slug={`/factions/${group}/${f.slug}`}
                    iconId={f.iconId}
                    group={group}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ opacity: 0.8 }}>No factions found.</p>
          )}
        </section>
      </section>
    </main>
  );
}
