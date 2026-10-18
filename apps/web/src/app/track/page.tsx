import { absoluteUrl, breadcrumbJsonLd, pageMetadata, SITE_NAME } from "@/lib/seo";
import PageHeader from "@/components/modules/PageHeader";
import TrackGuide, { TrackHeaderActions } from "@/components/modules/TrackGuide";
import { toPlainText } from "@portabletext/react";
import type { FaqCategory } from "@/components/modules/FaqList";
import JsonLd from "@/components/seo/JsonLd";
import { client } from "@/lib/sanity/sanity.client";
import { faqCategoryBySlugQuery } from "@/lib/sanity/queries";

export const revalidate = 60;

const DESCRIPTION =
  "Track your Warhammer reading for free: mark Black Library books as want to read, reading, read, or owned, straight from any book card or book page.";

export const metadata = pageMetadata({
  title: "Warhammer 40k Reading Tracker",
  description: DESCRIPTION,
  path: "/track",
});

export default async function TrackPage() {
  // the studio's "Reading Tracker" FAQ category, also shown on /faq
  const faqCategory = await client.fetch<FaqCategory | null>(
    faqCategoryBySlugQuery,
    { slug: "reading-tracker" },
    { next: { revalidate } },
  );
  const faqs = faqCategory?.faqs ?? [];

  return (
    <main>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: `${SITE_NAME} Reading Tracker`,
            alternateName: "Warhammer 40k Reading Tracker",
            url: absoluteUrl("/track"),
            description: DESCRIPTION,
            applicationCategory: "LifestyleApplication",
            operatingSystem: "Any (web browser)",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            publisher: { "@id": absoluteUrl("/#organization") },
          },
          ...(faqs.length > 0
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  url: absoluteUrl("/track"),
                  mainEntity: faqs.map((f) => ({
                    "@type": "Question",
                    name: f.question,
                    acceptedAnswer: { "@type": "Answer", text: toPlainText(f.answer) },
                  })),
                },
              ]
            : []),
          breadcrumbJsonLd([{ name: "Reading Tracker", path: "/track" }]),
        ]}
      />
      <PageHeader
        title="Warhammer 40k Reading Tracker"
        subtitle="Track every Black Library book you want to read, are reading, have finished, and own."
        align="center"
        strongOverlay
        height="sm"
        priority
        image="/images/Inquisitor-Arch-vukasin-ivkovic.jpg"
        credit="Inquisitor Arch by Vukasin Ivkovic"
      >
        <TrackHeaderActions />
      </PageHeader>
      <div className="container">
        <TrackGuide faqCategory={faqCategory} />
      </div>
    </main>
  );
}
