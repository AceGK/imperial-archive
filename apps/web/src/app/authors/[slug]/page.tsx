// app/authors/[slug]/page.tsx
import { notFound } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { single40kAuthorQuery } from "@/lib/sanity/queries";
import type { Author40k } from "@/types/sanity";
import AuthorDetails from "@/components/modules/Details/Author";
import BooksCatalog from "@/components/modules/Catalog/Books";
import Breadcrumb from "@/components/ui/Breadcrumb";
import type { Metadata } from "next";
import { toPlainText } from "@portabletext/react";
import { urlFor } from "@/lib/sanity/sanity.image";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata, truncate } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  const authors = await client.fetch<{ slug: string }[]>(
    `*[_type == "author40k" && defined(slug.current)]{ "slug": slug.current }`,
    {},
    { perspective: "published" }
  );
  return authors;
}

async function getAuthor(slug: string) {
  return client.fetch<Author40k | null>(
    single40kAuthorQuery,
    { slug },
    { perspective: "published" }
  );
}

function authorImageUrl(profile: Author40k) {
  return profile.image?.asset ? urlFor(profile.image).width(800).auto("format").url() : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getAuthor(slug);
  if (!profile) return { title: "Author Not Found" };

  const bio = profile.bio ? toPlainText(profile.bio) : "";
  return pageMetadata({
    title: `${profile.name}: Warhammer 40k Books`,
    description: truncate(
      bio ||
        `Every Warhammer 40,000 book by ${profile.name} from Black Library: novels, novellas, short stories, and audio dramas, with series and reading order.`
    ),
    path: `/authors/${profile.slug}`,
    image: authorImageUrl(profile),
    imageAlt: profile.name,
    type: "profile",
  });
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const profile = await getAuthor(slug);

  if (!profile) notFound();

  const sameAs = (profile.links ?? []).map((l) => l?.url).filter(Boolean);

  return (
    <main>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            url: absoluteUrl(`/authors/${profile.slug}`),
            mainEntity: {
              "@type": "Person",
              name: profile.name,
              url: absoluteUrl(`/authors/${profile.slug}`),
              image: authorImageUrl(profile),
              description: profile.bio ? truncate(toPlainText(profile.bio), 500) : undefined,
              jobTitle: "Author",
              knowsAbout: "Warhammer 40,000",
              ...(sameAs.length && { sameAs }),
            },
          },
          breadcrumbJsonLd([
            { name: "Authors", path: "/authors" },
            { name: profile.name, path: `/authors/${profile.slug}` },
          ]),
        ]}
      />

        {/* <Breadcrumb /> */}
        <AuthorDetails author={profile} />
  
      <BooksCatalog
        cacheKey={`author-${profile.slug}`}
        baseFilters={`authors.name:"${profile.name}"`}
        placeholder={`Search ${profile.name}'s books...`}
        noResultsText={`No books by ${profile.name} match your search.`}
        filters={[
          { attribute: "format", label: "Format" },
          { attribute: "series.title", label: "Series", searchable: true },
          { attribute: "factions.name", label: "Faction", searchable: true },
          { attribute: "era.name", label: "Era" },
        ]}
      />
    </main>
  );
}