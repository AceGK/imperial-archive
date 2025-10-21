// /app/factions/[group]/[slug]/page.tsx
import Link from "next/link";
import {
  getGroupedFactions,
  getGroupMeta,
  type Faction,
} from "@/lib/40k-factions";
import {
  resolveGroupIcon,
  resolveIcon,
} from "@/components/icons/factions/resolve";
import { getBooksByCollection } from "@/lib/40k-books";
import FactionTheme from "@/components/modules/FactionTheme";

export async function generateStaticParams() {
  const groups = getGroupedFactions();
  return groups.flatMap(({ key, items }) =>
    items.map((f) => ({ group: key, slug: f.slug }))
  );
}

export default async function FactionPage({
  params,
}: {
  params: Promise<{ group: string; slug: string }>;
}) {
  const { group, slug } = await params;

  const bucket = getGroupedFactions().find(
    (g) => g.key === group || g.meta.slug === group
  );
  const faction: Faction | undefined = bucket?.items.find((f) => f.slug === slug);

  if (!bucket || !faction) {
    return (
      <main className="container">
        <p>Faction not found.</p>
      </main>
    );
  }

  const groupMeta = getGroupMeta(bucket.key)!;
  const GroupIcon = resolveGroupIcon(groupMeta.iconId);
  const FactionIcon = resolveIcon(faction.iconId ?? faction.slug);

  // ✅ Read the Lexicanum link from either "lexicanum-link" or "lexicanumLink"
  const lexicanumLink =
    (faction as any)?.["lexicanum-link"] ?? (faction as any)?.lexicanumLink ?? null;

  const books = getBooksByCollection(faction.title);

  return (
    <main className="container">
      <section>
        <p>
          <Link href="/factions">← All factions</Link>
        </p>

        <section>
          <header
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 160,
                height: 160,
                display: "grid",
                placeItems: "center",
                borderRadius: 16,
                background: "var(--surface, #0f0f10)",
                color: "var(--text, #dfe3e6)",
              }}
            >
              {FactionIcon && (
                <FactionTheme slugOrIconId={faction.iconId || faction.slug}>
                  <div
                    className="iconBox"
                    style={{
                      width: 160,
                      height: 160,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 16,
                      background: "var(--faction-primary)",
                      color: "var(--faction-secondary)",
                    }}
                  >
                    <FactionIcon
                      width={120}
                      height={120}
                      role="img"
                      aria-label={`${faction.title} icon`}
                    />
                  </div>
                </FactionTheme>
              )}
            </div>

            <div>
              <Link
                href={`/factions/${bucket.key}`}
                style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
              >
                {GroupIcon && <GroupIcon width={32} height={32} />}
                {groupMeta.title}
              </Link>

              <h1 style={{ margin: 0 }}>{faction.title}</h1>

              {/* ✅ Lexicanum link above the description */}
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
                    aria-label={`Open ${faction.title} on Lexicanum (opens in a new tab)`}
                  >
                    View on Lexicanum →
                  </a>
                </p>
              )}

              {faction.description && (
                <p style={{ opacity: 0.85 }}>{faction.description}</p>
              )}
            </div>
          </header>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2>
            Books featuring {faction.title}{" "}
            <span className="clr-subtle">({books.length})</span>
          </h2>
          {books.length === 0 ? (
            <p style={{ opacity: 0.8 }}>No books yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {books.map((b) => (
                <li key={b.id}>
                  <Link href={`/books/${b.slug}`}>{b.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}