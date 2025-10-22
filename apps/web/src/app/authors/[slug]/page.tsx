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
  slug: string;      // e.g. "/horus-rising" or "horus-rising"
  author: string[];  // author names
};

type SlugParam = { slug: string };

export async function generateStaticParams(): Promise<SlugParam[]> {
  const authors = await client.fetch<{ slug: string }[]>(
    `*[_type == "author40k" && defined(slug.current)]{ "slug": slug.current }`
  );
  return authors.map((a) => ({ slug: a.slug }));
}

export default async function AuthorPage({
  params,
}: {
  params: SlugParam; 
}) {
  const { slug } = params;

  // Fetch author profile (published only)
  const profile: Author40k | null = await client.fetch(
    single40kAuthorQuery,
    { slug },
    { perspective: "published" }
  );

  // Still using JSON for books
  const books: Book[] = await getAllBooks();

  // Slugify like your earlier helper: trim, drop dots, kebab-case alnum
  const authorSlug = (name: string) =>
    name
      .trim()
      .replace(/\./g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const authored = books
    .filter((b) => (b.author ?? []).some((name) => authorSlug(name) === slug))
    .sort((a, b) => a.title.localeCompare(b.title));

  if (!profile && authored.length === 0) {
    notFound();
  }

  // Normalize book href to avoid double slashes if b.slug already starts with '/'
  const toBookHref = (s: string) =>
    s.startsWith("/") ? `/books${s}` : `/books/${s}`;

  return (
    <main className="container">
      <Breadcrumb />
      <AuthorProfile
        slug={slug}
        profile={profile}
        authored={authored.map((b) => ({
          id: b.id,
          title: b.title,
          href: toBookHref(b.slug),
        }))}
      />
    </main>
  );
}
