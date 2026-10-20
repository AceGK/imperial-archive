import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { client } from "@/lib/sanity/sanity.client";
import { readingGuideSlugsQuery } from "@/lib/sanity/queries";
import { getReadingGuide, readingGuideMetadata, WHERE_TO_START_SLUG } from "@/lib/readingGuides";
import GuideArticle from "../GuideArticle";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await client.fetch<string[]>(readingGuideSlugsQuery);
  return slugs.filter((slug) => slug !== WHERE_TO_START_SLUG).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getReadingGuide(slug);
  if (!guide) return { title: "Guide Not Found" };
  // hidden from search until the Reading Guides page launches
  return readingGuideMetadata(guide, { noindex: true });
}

export default async function ReadingGuidePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  // the beginners' guide has its own address
  if (slug === WHERE_TO_START_SLUG) permanentRedirect("/where-to-start");

  const guide = await getReadingGuide(slug);
  if (!guide) notFound();
  return <GuideArticle guide={guide} />;
}
