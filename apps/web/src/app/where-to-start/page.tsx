import type { Metadata } from "next";
import ComingSoon from "@/components/modules/ComingSoon";
import { pageMetadata } from "@/lib/seo";
import { getReadingGuide, readingGuideMetadata, WHERE_TO_START_SLUG } from "@/lib/readingGuides";
import GuideArticle from "../reading-guides/GuideArticle";

export const revalidate = 60;

/**
 * The reading guide with the slug "where-to-start", once it's published in
 * Sanity; a placeholder until then.
 */
export async function generateMetadata(): Promise<Metadata> {
  const guide = await getReadingGuide(WHERE_TO_START_SLUG);
  if (guide) return readingGuideMetadata(guide, { noindex: false });
  return pageMetadata({
    title: "Where to Start",
    description:
      "Where to start reading Warhammer 40,000: first books and series for new Black Library readers. Coming soon to Imperial Archive.",
    path: "/where-to-start",
    // placeholder until the guide is published
    noindex: true,
  });
}

export default async function WhereToStartPage() {
  const guide = await getReadingGuide(WHERE_TO_START_SLUG);
  if (guide) return <GuideArticle guide={guide} />;
  return (
    <ComingSoon
      title="Where to Start"
      description="Good first books and series for new readers, whatever drew you to the 41st millennium. This guide is being written. Check back soon."
    />
  );
}
