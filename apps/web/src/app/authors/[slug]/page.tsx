import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { single40kAuthorQuery } from "@/lib/sanity/queries";
import { getAllBooks } from "@/lib/40k-books";
import type { Author40k } from "@/types/sanity";
import AuthorProfile from "@/components/modules/AuthorProfile";
import Breadcrumb from "@/components/ui/Breadcrumb";

export const revalidate = 60;

type Book = {
  id: number;
  title: string;
  slug: string;      // e.g. "/horus-rising"
  author: string[];  // author names
};

export async function generateStaticParams() {
  const authors = await client.fetch<{ slug: string }[]>(
    `*[_type == "author40k" && defined(slug.current)]{ "slug": slug.current }`
  );
  return authors.map((a) => ({ slug: a.slug }));
}

export default async function AuthorPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  // Fetch author profile
  const profile: Author40k | null = await client.fetch(single40kAuthorQuery, { slug });

  // Still using JSON for books
  const books: Book[] = await getAllBooks();

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const authored = books
    .filter((b) => (b.author ?? []).some((name) => slugify(name) === slug))
    .sort((a, b) => a.title.localeCompare(b.title));

  if (!profile && authored.length === 0) return notFound();

  return (
    <main className="container">
      <Breadcrumb />
        <AuthorProfile
          slug={slug}
          profile={profile}
          authored={authored.map((b) => ({ id: b.id, title: b.title, href: `/books/${b.slug}` }))}
        />
    </main>
  );
}
