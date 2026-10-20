import Article from "@/components/modules/Article";
import JsonLd from "@/components/seo/JsonLd";
import { readingGuidePath } from "@/lib/readingGuides";
import { urlFor } from "@/lib/sanity/sanity.image";
import { absoluteUrl, breadcrumbJsonLd, SITE_NAME } from "@/lib/seo";
import type { ReadingGuideDoc } from "@/types/sanity";

/** A reading guide as a page, laid out like a blog post */
export default function GuideArticle({ guide }: { guide: ReadingGuideDoc }) {
  const path = readingGuidePath(guide.slug);
  const cover = guide.mainImage?.asset ? guide.mainImage : null;

  return (
    <main>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.title,
            description: guide.metaDescription || undefined,
            url: absoluteUrl(path),
            image: cover ? urlFor(cover).width(1200).auto("format").url() : undefined,
            datePublished: guide.publishedAt || undefined,
            dateModified: guide._updatedAt,
            author: guide.author
              ? { "@type": "Person", name: guide.author }
              : { "@type": "Organization", name: SITE_NAME },
            publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
          },
          breadcrumbJsonLd([
            { name: "Reading Guides", path: "/reading-guides" },
            { name: guide.title, path },
          ]),
        ]}
      />

      <Article
        post={guide}
        label="Reading Guide"
        back={{ href: "/reading-guides", label: "All reading guides" }}
        shareHeading="Share this guide"
        sharePath={path}
      />
    </main>
  );
}
