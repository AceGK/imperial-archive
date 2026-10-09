import type { MetadataRoute } from "next";
import { groq } from "next-sanity";
import { client } from "@/lib/sanity/sanity.client";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

type Entry = { slug: string; updatedAt: string };

const sitemapQuery = groq`{
  "books": *[_type == "book40k" && defined(slug.current) && !(_id in path("drafts.**"))]{ "slug": slug.current, "updatedAt": _updatedAt },
  "authors": *[_type == "author40k" && defined(slug.current) && !(_id in path("drafts.**"))]{ "slug": slug.current, "updatedAt": _updatedAt },
  "series": *[_type == "series40k" && defined(slug.current) && !(_id in path("drafts.**"))]{ "slug": slug.current, "updatedAt": _updatedAt },
  "eras": *[_type == "era40k" && defined(slug.current) && !(_id in path("drafts.**"))]{ "slug": slug.current, "updatedAt": _updatedAt },
  "factionGroups": *[_type == "factionGroup40k" && defined(slug.current) && !(_id in path("drafts.**"))]{ "slug": slug.current, "updatedAt": _updatedAt },
  "factions": *[_type == "faction40k" && defined(slug.current) && defined(group->slug.current) && !(_id in path("drafts.**"))]{
    "slug": group->slug.current + "/" + slug.current,
    "updatedAt": _updatedAt
  },
  // /faq is only indexable once it has questions (see app/faq/page.tsx)
  "faqUpdatedAt": *[_type == "faq" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0]._updatedAt
}`;

// Only pages meant to rank: placeholder ("coming soon"), account, and auth
// pages are noindexed and left out on purpose
const STATIC_PAGES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/books", priority: 0.9 },
  { path: "/series", priority: 0.9 },
  { path: "/authors", priority: 0.8 },
  { path: "/factions", priority: 0.8 },
  { path: "/eras", priority: 0.7 },
  { path: "/about", priority: 0.4 },
  { path: "/support", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await client.fetch<Record<string, Entry[]> & { faqUpdatedAt?: string | null }>(
    sitemapQuery
  );

  const section = (prefix: string, entries: Entry[] = [], priority: number) =>
    entries.map((e) => ({
      url: absoluteUrl(`${prefix}/${e.slug}`),
      lastModified: e.updatedAt,
      priority,
    }));

  return [
    ...STATIC_PAGES.map((p) => ({ url: absoluteUrl(p.path), priority: p.priority })),
    ...(data.faqUpdatedAt
      ? [{ url: absoluteUrl("/faq"), lastModified: data.faqUpdatedAt, priority: 0.4 }]
      : []),
    ...section("/series", data.series, 0.8),
    ...section("/books", data.books, 0.7),
    ...section("/authors", data.authors, 0.6),
    ...section("/factions", data.factionGroups, 0.6),
    ...section("/factions", data.factions, 0.6),
    ...section("/eras", data.eras, 0.5),
  ];
}
