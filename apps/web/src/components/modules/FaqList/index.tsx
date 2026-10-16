import type { PortableTextBlock } from "@portabletext/types";
import RichText from "@/components/ui/RichText";
import Card from "@/components/ui/Card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import { sectionIndex } from "@/lib/sectionIndex";
import styles from "./styles.module.scss";

export type Faq = { _id: string; question: string; answer: PortableTextBlock[] };
export type FaqCategory = {
  _id: string;
  title: string;
  slug: string;
  description?: string | null;
  faqs: Faq[];
};

/** FAQ categories as cards (§ I, § II, …, matching the page's contents), each with its questions in an accordion */
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
                <span className={styles.eyebrowCode}>{sectionIndex(i + 1)}</span> ·{" "}
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
