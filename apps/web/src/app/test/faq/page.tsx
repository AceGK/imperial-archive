import FaqList, { faqCategoryCode, type FaqCategory } from "@/components/modules/FaqList";
import TocLayout from "@/components/modules/Toc/TocLayout";
import styles from "@/app/faq/styles.module.scss";

// Sample content for previewing the FAQ layout before real FAQs are in Sanity
function text(t: string) {
  return [
    {
      _type: "block",
      _key: t.slice(0, 8),
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: "s", text: t, marks: [] }],
    },
  ];
}

const SAMPLE: FaqCategory[] = [
  {
    _id: "general",
    title: "General",
    slug: "general",
    description: "About the Archive itself.",
    faqs: [
      {
        _id: "q1",
        question: "Is Imperial Archive an official Games Workshop site?",
        answer: text("No. It's an unofficial, fan-made catalog and isn't affiliated with Games Workshop or Black Library."),
      },
      {
        _id: "q2",
        question: "Is the Archive free to use?",
        answer: text("Yes. Every page is free, with no ads and no paywalls."),
      },
    ],
  },
  {
    _id: "accounts",
    title: "Accounts",
    slug: "accounts",
    faqs: [
      {
        _id: "q3",
        question: "Do I need an account to browse the catalog?",
        answer: text("No. Accounts are only needed for favorites and, soon, reading tracking."),
      },
    ],
  },
];

export default function FaqTestPage() {
  return (
    <main>
      <section className="container row__lg">
        <TocLayout
          items={SAMPLE.map((c, i) => ({ id: c.slug, index: faqCategoryCode(i), label: c.title }))}
        >
          <header className={styles.header}>
            <div className={styles.ref}>Adeptus Administratum · IA-003 // Catechism</div>
            <h1 className={styles.title}>Frequently Asked Questions</h1>
            <div className={styles.divider} />
          </header>
          <FaqList categories={SAMPLE} />
        </TocLayout>
      </section>
    </main>
  );
}
