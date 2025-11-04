import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { single40kAuthorQuery, booksByAuthorSlug40kQuery } from "@/lib/sanity/queries";
import type { Author40k, Book40k } from "@/types/sanity";
import TwoPane from "@/components/layouts/TwoPane";
import BookGrid from "@/components/modules/BookGrid";
import AuthorDetails from "@/components/modules/Details/Author";
import Button from "@/components/ui/Button";
import ArrowLeft from "@/components/icons/arrow-left.svg";
import ChevronLeft from "@/components/icons/chevron-left.svg";
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

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const profile = await client.fetch<Author40k | null>(
    single40kAuthorQuery,
    { slug },
    { perspective: "published" }
  );
  if (!profile) notFound();

  const authored = await client.fetch<Book40k[]>(
    booksByAuthorSlug40kQuery,
    { slug },
    { perspective: "published" }
  );

  return (
    <main className="container">
      <Breadcrumb />
      <TwoPane sidebar={<AuthorDetails author={profile} />}>
        <h2>Books <span className="clr-subtle">({authored.length})</span></h2>
        <BookGrid books={authored} noResultsText="No books linked yet." />
      </TwoPane>
    </main>
  );
}
