import Link from "next/link";
import { getGroupedFactions, getGroupMeta } from "@/lib/40k-factions";
import FactionCard from "@/components/modules/FactionCard";
import { resolveGroupIcon } from "@/components/icons/factions/resolve";
import { getBooksByCollection } from "@/lib/40k-books";

export async function generateStaticParams() {
  return getGroupedFactions().map(({ key }) => ({ group: key }));
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;
  const all = getGroupedFactions();
  const bucket = all.find((g) => g.key === group || g.meta.slug === group);
  if (!bucket)
    return (
      <main className="container">
        <p>Group not found.</p>
      </main>
    );

  const { key, meta, items } = bucket;
  const Icon = resolveGroupIcon(meta.iconId);
  const books = getBooksByCollection(meta.title);

  // ✅ Read the Lexicanum link safely (kebab-case or camelCase)
  const lexicanumLink =
    (meta as any)?.["lexicanum-link"] ?? (meta as any)?.lexicanumLink ?? null;

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
          }}
        >
          {Icon && <Icon width={100} height={100} />}
          <div>
            <h1 style={{ margin: 0 }}>{meta.title}</h1>

            {/* ✅ Group Lexicanum link */}
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
                  aria-label={`Open ${meta.title} on Lexicanum (opens in a new tab)`}
                >
                  View on Lexicanum →
                </a>
              </p>
            )}

            {meta.description && (
              <p style={{ opacity: 0.8 }}>{meta.description}</p>
            )}
          </div>
        </header>

        <section style={{ marginTop: 24 }}>
          <h2>Chapters / Sub-factions</h2>
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
              <li key={f.slug}>
                <FactionCard
                  title={f.title}
                  iconId={f.iconId}
                  slug={`/factions/${key}/${f.slug}`}
                  group={key}
                />
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginTop: 32 }}>
          <h2>
            Books featuring {meta.title} ({books.length})
          </h2>
          {books.length === 0 ? (
            <p style={{ opacity: 0.8 }}>No books yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
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
