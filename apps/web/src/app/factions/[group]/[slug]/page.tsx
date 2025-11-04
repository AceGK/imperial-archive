import Link from "next/link";
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import {
  factionPairs40kQuery,
  singleFaction40kBySlugsQuery,
  booksByFactionId40kQuery,
} from "@/lib/sanity/queries";
import { resolveGroupIcon, resolveIcon } from "@/components/icons/factions/resolve";
import FactionTheme from "@/components/modules/FactionTheme";
import type { Faction40kDoc, Book40k } from "@/types/sanity";
import Breadcrumb from "@/components/ui/Breadcrumb";
import BookCard from "@/components/modules/BookCard";
import BookGrid from "@/components/modules/BookGrid";

export const revalidate = 60;

export async function generateStaticParams() {
  const pairs = await client.fetch<{ group: string; slug: string }[]>(factionPairs40kQuery);
  return pairs.map((p) => ({ group: p.group, slug: p.slug }));
}

export default async function FactionPage({
  params,
}: {
  params: Promise<{ group: string; slug: string }>;
}) {
  const { group, slug } = await params;

  const faction = await client.fetch<Faction40kDoc | null>(
    singleFaction40kBySlugsQuery,
    { group, slug },
    { perspective: "published" }
  );
  if (!faction) notFound();

  const GroupIcon = resolveGroupIcon(faction.group?.iconId || "");
  const FactionIcon = resolveIcon(faction.iconId || faction.slug);

  const lexicanumLink =
    faction.links?.find((l) => l.type === "lexicanum")?.url ?? null;

  // NEW: pull books from Sanity by referencing this faction doc
  const books = await client.fetch<Book40k[]>(
    booksByFactionId40kQuery,
    { factionId: faction._id },
    { perspective: "published" }
  );

  return (
    <main className="container">
      <Breadcrumb />
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
                  style={{
                    width: 160,
                    height: 160,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 16,
                    background: "var(--faction-primary)",
                    color: "var(--faction-secondary)",
                    fill: "currentcolor",
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
              href={`/factions/${faction.group.slug}`}
              style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
            >
              {GroupIcon && <GroupIcon width={32} height={32} />}
              {faction.group.title}
            </Link>

            <h1 style={{ margin: 0 }}>{faction.title}</h1>

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

        <section style={{ marginTop: 24 }}>
          <h2>
            Books featuring {faction.title}{" "}
            <span className="clr-subtle">({books.length})</span>
          </h2>

          <BookGrid books={books} noResultsText="No books linked to this faction yet." />
        </section>
      </section>
    </main>
  );
}
