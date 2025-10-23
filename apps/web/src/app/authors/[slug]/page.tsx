// /app/authors/[slug]/page.tsx
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { single40kAuthorQuery } from "@/lib/sanity/queries";
import { getAllBooks, type Book } from "@/lib/40k-books"; // ✅ import the canonical Book type
import type { Author40k } from "@/types/sanity";
import AuthorProfile from "@/components/modules/AuthorProfile";
import Breadcrumb from "@/components/ui/Breadcrumb";

export const revalidate = 60;

type SlugParam = { slug: string };

// Pre-generate all author slugs (authors list is small and we are revalidating frequently)
export async function generateStaticParams(): Promise<SlugParam[]> {
  const authors = await client.fetch<{ slug: string }[]>(
    `*[_type == "author40k" && defined(slug.current)]{ "slug": slug.current }`
  );
  return authors.map((a) => ({ slug: a.slug }));
}

export default async function AuthorPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const profile = await client.fetch<Author40k | null>(
    single40kAuthorQuery,
    { slug },
    { perspective: "published" }
  );
  if (!profile) notFound();

  // ✅ Already typed as Book[]
  const books = await getAllBooks();

  // ✅ Keep full Book objects; don't re-shape to a narrower type
  const authored: Book[] = books
    .filter((b) => (b.author ?? []).some((n) => n.trim() === profile.name))
    .sort((a, b) => a.title.localeCompare(b.title));

  // Optional if you want to override links
  const toBookHref = (s: string) => (s.startsWith("/") ? `/books${s}` : `/books/${s}`);

  return (
    <main className="container">
      <Breadcrumb />
      <AuthorProfile
        slug={slug}
        profile={profile}
        authored={authored}          // ✅ exact type match
        // makeHref={toBookHref}     // optional, if you want to normalize hrefs
      />
    </main>
  );
}
