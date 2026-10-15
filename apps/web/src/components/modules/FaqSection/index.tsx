"use client";

import { useId, useState } from "react";
import RichText from "@/components/ui/RichText";
import Button from "@/components/ui/Button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import type { FaqCategory } from "@/components/modules/FaqList";
import styles from "./styles.module.scss";

type FaqSectionProps = {
  /** One or more FAQ categories; with several, pills switch between them */
  categories: FaqCategory[];
  /** List every category's questions together in one accordion, with no pills */
  combined?: boolean;
  /** Gold label above the heading, e.g. the category name */
  kicker?: string;
  title?: string;
  subtitle?: string;
  /** Shows a "View all FAQs" button under the heading, linking here */
  viewAllHref?: string;
  /** id for the heading, so the section can be labelled by it */
  headingId?: string;
};

/**
 * Two columns: the heading (sticky on desktop) beside an accordion of questions.
 * Every category's answers stay in the HTML, only hidden while another category
 * is selected, so search engines read them all.
 */
export default function FaqSection({
  categories,
  combined = false,
  kicker,
  title = "Frequently Asked Questions",
  subtitle,
  viewAllHref,
  headingId = "faq-heading",
}: FaqSectionProps) {
  const nonEmpty = categories.filter((c) => c.faqs.length > 0);
  // a question can sit in several categories; list it once
  const shown: FaqCategory[] =
    combined && nonEmpty.length > 1
      ? [{ ...nonEmpty[0], faqs: [...new Map(nonEmpty.flatMap((c) => c.faqs).map((f) => [f._id, f])).values()] }]
      : nonEmpty;
  const [active, setActive] = useState(shown[0]?._id);
  const panelId = useId();

  if (shown.length === 0) return null;

  return (
    <section className={styles.wrapper} aria-labelledby={headingId}>
      <div className={styles.sidebar}>
        {kicker && <span className={styles.kicker}>{kicker}</span>}
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        {shown.length > 1 && (
          <div className={styles.pills} role="group" aria-label="FAQ categories">
            {shown.map((c) => (
              <button
                key={c._id}
                type="button"
                className={styles.pill}
                aria-pressed={active === c._id}
                aria-controls={`${panelId}-${c.slug}`}
                onClick={() => setActive(c._id)}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}

        {viewAllHref && (
          <Button href={viewAllHref} variant="secondary" className={styles.viewAll}>
            View all FAQs
          </Button>
        )}
      </div>

      <div className={styles.list}>
        {shown.map((c, i) => (
          <div key={c._id} id={`${panelId}-${c.slug}`} hidden={active !== c._id}>
            <Accordion type="multiple" defaultValue={i === 0 ? [c.faqs[0]._id] : undefined}>
              {c.faqs.map((faq) => (
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
          </div>
        ))}
      </div>
    </section>
  );
}
