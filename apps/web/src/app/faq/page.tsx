import type { Metadata } from "next";
import { toPlainText } from "@portabletext/react";
import ComingSoon from "@/components/modules/ComingSoon";
import FaqList, { faqCategoryCode, type FaqCategory } from "@/components/modules/FaqList";
import TocLayout from "@/components/modules/Toc/TocLayout";
import JsonLd from "@/components/seo/JsonLd";
import { client } from "@/lib/sanity/sanity.client";
import { faqPageQuery } from "@/lib/sanity/queries";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import styles from "./styles.module.scss";

export const revalidate = 60;

const TITLE = "Frequently Asked Questions";
const LABEL = "Adeptus Administratum · IA-003 // Catechism";

async function getFaqs() {
  return client.fetch<FaqCategory[]>(faqPageQuery);
}

export async function generateMetadata(): Promise<Metadata> {
  const categories = await getFaqs();
  return pageMetadata({
    title: TITLE,
    description:
      "Frequently asked questions about Imperial Archive, the fan-made catalog and reading tracker for Warhammer 40,000 Black Library books.",
    path: "/faq",
    // stays out of search until there are questions to show
    noindex: categories.length === 0,
  });
}

export default async function FaqPage() {
  const categories = await getFaqs();

  if (categories.length === 0) {
    return (
      <ComingSoon
        eyebrow={LABEL}
        title={TITLE}
        description="Answers to common questions about the Archive are being compiled. Check back soon."
      />
    );
  }

  // a question can sit in several categories; list it once in the structured data
  const uniqueFaqs = [
    ...new Map(categories.flatMap((c) => c.faqs).map((f) => [f._id, f])).values(),
  ];

  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          url: absoluteUrl("/faq"),
          mainEntity: uniqueFaqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: toPlainText(f.answer) },
          })),
        }}
      />

      <section className="container row__lg">
        <TocLayout
          items={categories.map((c, i) => ({ id: c.slug, index: faqCategoryCode(i), label: c.title }))}
        >
          <header className={styles.header}>
            <div className={styles.ref}>{LABEL}</div>
            <h1 className={styles.title}>{TITLE}</h1>
            <div className={styles.divider} />
          </header>

          <FaqList categories={categories} />
        </TocLayout>
      </section>
    </main>
  );
}
