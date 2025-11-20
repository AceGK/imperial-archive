import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { single40kAuthorQuery } from "@/lib/sanity/queries";
import type { Author40k } from "@/types/sanity";
import TwoPane from "@/components/layouts/TwoPane";
import AuthorDetails from "@/components/modules/Details/Author";
import Books from "@/components/modules/SearchContent/Books";
import Breadcrumb from "@/components/ui/Breadcrumb";

export const revalidate = 60;

export async function generateStaticParams() {
  const authors = await client.fetch<{ slug: string }[]>(
    `*[_type == "author40k" && defined(slug.current)]{ "slug": slug.current }`,
    {},
    { perspective: "published" }
  );
  return authors;
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

  return (
    <main>
      <div className="container">
        <Breadcrumb />
        <AuthorDetails author={profile} />
      </div>
      <Books
        filterByAuthor={profile.name}
        placeholder="Search this author's books..."
        noResultsText="No books by this author match your search."
      />
    </main>
  );
}
