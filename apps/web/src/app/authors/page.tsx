// /app/authors/page.tsx
import { client } from "@/lib/sanity/sanity.client";
import { all40kAuthorsQuery } from "@/lib/sanity/queries";
import PageHeader from "@/components/modules/PageHeader";
import AuthorCard from "@/components/modules/Cards/AuthorCard";

export const revalidate = 60;

type AuthorFromQuery = {
  _id: string;
  name: string;
  slug: string;
  image?: {
    url?: string;
    lqip?: string;
    aspect?: number;
  };
  bookCount: number;
};

export default async function AuthorsPage() {
  
  const authors = await client.fetch<AuthorFromQuery[]>(
    all40kAuthorsQuery,
    {},
    { perspective: "published" }
  );

  return (
    <main>
      <PageHeader
        title="Authors"
        subtitle="Discover the writers who bring the grim darkness of the far future to life across the Black Library."
        align="center"
        strongOverlay
        height="sm"
        priority
        image="/images/imperial-library-erik-nykvist.jpg"
        credit="Imperial Library by Erik Nykvist"
      />

      <section className="container">
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          Authors <span style={{ fontSize: "0.9rem" }}>({authors.length})</span>
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          {authors.map((a) => (
            <AuthorCard
              key={a._id}
              name={a.name}
              slug={a.slug}
              count={a.bookCount} 
              image={a.image}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
