// /app/authors/[slug]/page.tsx
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import {
  single40kAuthorQuery,
  booksByAuthorSlug40kQuery,
} from "@/lib/sanity/queries";
import type { Author40k, Book40k } from "@/types/sanity";
import AuthorProfile from "@/components/modules/AuthorProfile";
import Breadcrumb from "@/components/ui/Breadcrumb";

export const revalidate = 60;

export async function generateStaticParams() {
  // Build SSG params from author slugs
  const authors = await client.fetch<{ slug: string }[]>(
    `*[_type == "author40k" && defined(slug.current)]{ "slug": slug.current }`,
    {},
    { perspective: "published" }
  );
  return authors; // { slug: string }[]
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const profile = await client.fetch<Author40k | null>(
    single40kAuthorQuery,
    { slug },
    { perspective: "published" }
  );
  if (!profile) notFound();

  // Fetch authored books from Sanity (already projected for cards)
  const authored = await client.fetch<Book40k[]>(
    booksByAuthorSlug40kQuery,
    { slug },
    { perspective: "published" }
  );

  return (
    <main className="container">
      <Breadcrumb />
      <AuthorProfile
        slug={slug}
        profile={profile}
        authored={authored}
      />
    </main>
  );
}
