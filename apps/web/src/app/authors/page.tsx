import { getAllBooks } from "@/lib/40k-books";
import AuthorCard from "@/components/modules/AuthorCard";

export const revalidate = 60;

type Book = {
  id: number;
  title: string;
  slug: string;
  author: string[];
};

// same slugger you use elsewhere
function authorSlug(name: string) {
  return name
    .trim()
    .replace(/\./g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function AuthorsPage() {
  const books: Book[] = await getAllBooks();

  // Build counts keyed by slug; keep a display name per slug
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

  const authors = Object.values(bySlug).sort((a, b) => a.name.localeCompare(b.name));
  const count = authors.length;

  return (
    <main className="container">
      <section>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Authors{" "}
          <span
            style={{ fontSize: "0.9rem", borderRadius: "999px" }}
            aria-label={`Total authors: ${count}`}
          >
            ({count})
          </span>
        </h1>

        {/* Card grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          {authors.map(({ slug, name, count }) => (
            <AuthorCard key={slug} name={name} slug={slug} count={count} />
          ))}
        </div>
      </section>
    </main>
  );
}
