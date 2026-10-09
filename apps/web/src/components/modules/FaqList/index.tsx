import type { PortableTextBlock } from "@portabletext/types";
import RichText from "@/components/ui/RichText";
import Card from "@/components/ui/Card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import styles from "./styles.module.scss";

export type Faq = { _id: string; question: string; answer: PortableTextBlock[] };
export type FaqCategory = {
  _id: string;
  title: string;
  slug: string;
  description?: string | null;
  faqs: Faq[];
};

/** Reference code for the nth category (0-based), e.g. "CA-01" */
export const faqCategoryCode = (i: number) => `CA-${String(i + 1).padStart(2, "0")}`;

/** FAQ categories as cards (CA-01, CA-02, …), each with its questions in an accordion */
export default function FaqList({ categories }: { categories: FaqCategory[] }) {
  return (
    <div className={styles.sections}>
      {categories.map((category, i) => (
        <Card
          key={category._id}
          id={category.slug}
          className={styles.anchor}
          eyebrow={
            <span className={styles.eyebrow}>
              <span>
                <span className={styles.eyebrowCode}>{faqCategoryCode(i)}</span> ·{" "}
                {category.faqs.length} {category.faqs.length === 1 ? "Question" : "Questions"}
              </span>
            </span>
          }
          title={category.title}
        >
          {category.description && <p className={styles.description}>{category.description}</p>}
          <Accordion type="multiple">
            {category.faqs.map((faq) => (
              <AccordionItem key={faq._id} value={faq._id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <div className={styles.answer}>
                    <RichText value={faq.answer} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      ))}
    </div>
  );
}
