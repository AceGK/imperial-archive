// /apps/web/app/authors/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { client } from "@/lib/sanity/sanity.client";
import { single40kAuthorQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/sanity.image";
import { getAllBooks } from "@/lib/40k-books";
import type { Author40k } from "@/types/sanity";

export const revalidate = 60;

type Book = {
  id: number;
  title: string;
  slug: string;
  author: string[];
};

export async function generateStaticParams() {
  const authors = await client.fetch<{slug: string}[]>(
    `*[_type == "author40k" && defined(slug.current)]{ "slug": slug.current }`
  )
  return authors.map((a) => ({ slug: a.slug }))
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 🧠 Fetch author from Sanity
  const profile: Author40k | null = await client.fetch(single40kAuthorQuery, { slug });

  // still use your JSON-based books (for now)
  const books: Book[] = await getAllBooks();
  const authored = books
    .filter((b) =>
      (b.author || []).some(
        (a) => a && a.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug
      )
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  if (!profile && !authored.length) return notFound();

  const authorLabel = profile?.name ?? slug;
  const visibleLinks = (profile?.links ?? []).filter((l) => !!l?.url);
  const bookCount = authored.length;

console.log('[author page] slug param:', slug)

const control = await client.fetch(
  `*[_type=="author40k" && slug.current=="aaron-dembski-bowden"][0]{_id,name,slug}`
)
console.log('[author page] control:', control)

  const labelMap: Record<string, string> = {
    website: "Official site",
    black_library: "Black Library",
    lexicanum: "Lexicanum",
    wikipedia: "Wikipedia",
    x: "X / Twitter",
    facebook: "Facebook",
    instagram: "Instagram",
  };

  return (
    <main className="container">
      <section>
        <h1>{authorLabel}</h1>

        {profile?.image && (
          <Image
            src={urlFor(profile.image).width(320).height(320).fit("crop").url()}
            alt={authorLabel}
            width={320}
            height={320}
            style={{ objectFit: "cover", borderRadius: 12, margin: "1rem 0" }}
          />
        )}

        {!!visibleLinks.length && (
          <ul
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              padding: 0,
              listStyle: "none",
              margin: "0 0 1rem",
            }}
          >
            {visibleLinks.map((link) => (
              <li key={`${link.type}-${link.url}`}>
                <a
                  href={link.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {labelMap[link.type] ??
                    link.type.charAt(0).toUpperCase() + link.type.slice(1)}{" "}
                  ↗
                </a>
              </li>
            ))}
          </ul>
        )}

        {profile?.bio && (
          <div style={{ maxWidth: 720, marginBottom: "1.5rem" }}>
            {profile.bio.map((block: any) =>
              block.children?.map((span: any) => (
                <p key={span._key}>{span.text}</p>
              ))
            )}
          </div>
        )}

        <h2
          style={{
            marginTop: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          Books{" "}
          <span
            style={{ fontSize: "0.85rem", borderRadius: 999 }}
            aria-label={`Total books for ${authorLabel}: ${bookCount}`}
          >
            ({bookCount})
          </span>
        </h2>

        <ul>
          {authored.map((b) => (
            <li key={b.id}>
              <Link href={`/books${b.slug}`}>{b.title}</Link>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: "1rem" }}>
          <Link href="/authors">← Back to all authors</Link>
        </p>
      </section>
    </main>
  );
}
