import { client } from "@/lib/sanity/sanity.client";
import { authors40kForCardsQuery } from "@/lib/sanity/queries";
import { getAllBooks } from "@/lib/40k-books";
import AuthorCard from "@/components/modules/AuthorCard";

export const revalidate = 60;

type Book = {
  id: number;
  title: string;
  slug: string;
  author: string[];
};

function authorSlug(name: string) {
  return name
    .trim()
    .replace(/\./g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function AuthorsPage() {
  // 1) Build counts from your JSON source
  const books: Book[] = await getAllBooks();
  const bySlug: Record<string, { slug: string; name: string; count: number }> = {};

  for (const b of books) {
    for (const rawName of b.author || []) {
      if (!rawName) continue;
      const name = rawName.trim();
      const slug = authorSlug(name);
      if (!bySlug[slug]) bySlug[slug] = { slug, name, count: 0 };
      bySlug[slug].count += 1;
    }
  }

  const authorsFromJson = Object.values(bySlug).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // 2) Fetch published author docs from Sanity
  const authorsFromSanity: Array<{ name: string; slug: string; imageUrl?: string }> =
    await client.fetch(authors40kForCardsQuery);

  // 3) Build a lookup by slug for quick merge
  const sanityBySlug = new Map(
    authorsFromSanity
      .filter((a) => a.slug)
      .map((a) => [a.slug, { name: a.name, imageUrl: a.imageUrl }])
  );

  // 4) Merge the Sanity data into your JSON list
  const merged = authorsFromJson.map((a) => {
    const hit = sanityBySlug.get(a.slug);
    return {
      ...a,
      imageUrl: hit?.imageUrl, // may be undefined (fallback to initials)
    };
  });

  return (
    <main className="container">
      <section>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Authors{" "}
          <span style={{ fontSize: "0.9rem", borderRadius: 999 }}>
            ({merged.length})
          </span>
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {merged.map(({ slug, name, count, imageUrl }) => (
            <AuthorCard
              key={slug}
              name={name}
              slug={slug}
              count={count}
              imageUrl={imageUrl}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
