// lib/readingGuides.ts
// Reading guides are Sanity posts in the "Guides" category. They render
// like blog posts, at /reading-guides/[slug]; the guide with the slug
// "where-to-start" is the /where-to-start page instead.
import type { Metadata } from "next";
import { toPlainText } from "@portabletext/react";
import { client } from "@/lib/sanity/sanity.client";
import { readingGuideBySlugQuery, WHERE_TO_START_SLUG } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/sanity.image";
import { pageMetadata, truncate } from "@/lib/seo";
import type { ReadingGuideDoc } from "@/types/sanity";

export { WHERE_TO_START_SLUG };

export function getReadingGuide(slug: string) {
  return client.fetch<ReadingGuideDoc | null>(readingGuideBySlugQuery, { slug }, { next: { revalidate: 60 } });
}

/** Where a guide lives on the site */
export const readingGuidePath = (slug: string) =>
  slug === WHERE_TO_START_SLUG ? "/where-to-start" : `/reading-guides/${slug}`;

/**
 * A guide's metadata. Guides stay out of search results until the Reading
 * Guides page launches (`noindex`), except where a page is live on its own,
 * like /where-to-start.
 */
export function readingGuideMetadata(guide: ReadingGuideDoc, { noindex }: { noindex: boolean }): Metadata {
  const description = guide.metaDescription || (guide.body ? truncate(toPlainText(guide.body)) : undefined);
  return pageMetadata({
    title: guide.metaTitle || guide.title,
    description,
    path: readingGuidePath(guide.slug),
    image: guide.mainImage?.asset
      ? urlFor(guide.mainImage).width(1200).height(630).fit("crop").auto("format").url()
      : undefined,
    imageAlt: guide.mainImage?.alt || guide.title,
    noindex,
  });
}
