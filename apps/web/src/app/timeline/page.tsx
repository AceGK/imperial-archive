import Link from "next/link";
import InfoHeader from "@/components/modules/InfoHeader";
import ExternalLinkIcon from "@/components/icons/external-link.svg";
import { pageMetadata } from "@/lib/seo";
import Timeline from "./Timeline";
import { SOURCES, SOURCE_ORDER } from "./data";
import styles from "./page.module.scss";
import { EXTERNAL_REL } from "@/lib/links";

export const metadata = pageMetadata({
  title: "Warhammer 40k Timeline",
  description:
    "A Warhammer 40,000 timeline, millennium by millennium: from the War in Heaven and the Age of Terra to the Horus Heresy, the Time of Ending, and the Era Indomitus.",
  path: "/timeline",
});

/** Fuller accounts on Lexicanum, beside the intro */
const FURTHER_READING = [
  {
    title: "Imperial Dating System",
    blurb: "How dates like 999.M41 are written",
    href: "https://wh40k.lexicanum.com/wiki/Imperial_Dating_System",
  },
  {
    title: "Timeline",
    blurb: "The ages of the galaxy at a glance",
    href: "https://wh40k.lexicanum.com/wiki/Timeline",
  },
  {
    title: "Horus Heresy Timeline",
    blurb: "The Heresy, year by year",
    href: "https://wh40k.lexicanum.com/wiki/Timeline_of_the_Horus_Heresy",
  },
];

/** The setting's history, M1 to M42, with the sources it's drawn from */
export default function TimelinePage() {
  return (
    <main className={styles.page}>
      <section className="container row__md">
        <InfoHeader
          label="Adeptus Administratum · IA-012 // Chronology"
          title={
            <>
              Timeline <span className={styles.beta}>Beta</span>
            </>
          }
        />

        <div className={styles.introGrid}>
          <div className={styles.intro}>
            <p className={styles.spoilers}>
              <span className={styles.spoilerTag}>Spoilers</span>
              <span>
                This timeline covers major plot points from across the setting, including how the Horus Heresy ends.
                Most are well known among fans, but if you&apos;d rather discover them in the books, read only the
                titles: the cards stay closed until you open them.
              </span>
            </p>
            <p>
              The key events of the Warhammer 40,000 setting, millennium by millennium. Dates follow the Imperial
              calendar, where 999.M41 is the year 40,999. Millennia with no major recorded events are folded together.
            </p>
            <ul className={styles.introList}>
              <li>Open a millennium to read what happened and when, with the sources for each entry.</li>
              <li>
                Treat the dates as approximate. Imperial records are fragmentary, and over ten thousand years the
                calendar itself drifted into rival versions: by some reckonings, the 41st millennium has not yet ended.
              </li>
            </ul>
          </div>

          <aside className={styles.further} aria-labelledby="further-reading">
            <h2 id="further-reading" className={styles.furtherTitle}>
              Further reading on Lexicanum
            </h2>
            <ul className={styles.furtherList}>
              {FURTHER_READING.map(({ title, blurb, href }) => (
                <li key={href}>
                  <a href={href} target="_blank" rel={EXTERNAL_REL} className={styles.furtherLink}>
                    <span className={styles.furtherName}>
                      {title}
                      <ExternalLinkIcon className={styles.externalIcon} aria-hidden="true" />
                      <span className={styles.visuallyHidden}> (opens Lexicanum in a new tab)</span>
                    </span>
                    <span className={styles.furtherMeta}>{blurb}</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <Timeline />

        <section className={styles.sources} aria-labelledby="timeline-sources">
          <h2 id="timeline-sources" className={styles.sourcesTitle}>
            Sources
          </h2>
          <p className={styles.sourcesIntro}>
            Summaries are written for the Archive from the sources below.
          </p>
          <ol className={styles.sourceList}>
            {SOURCE_ORDER.map((key) => {
              const { title, detail, href } = SOURCES[key];
              return (
                <li key={key} id={`source-${key}`}>
                  {href ? (
                    <a href={href} target="_blank" rel={EXTERNAL_REL}>
                      {title}
                    </a>
                  ) : (
                    <cite>{title}</cite>
                  )}
                  {detail && <span className={styles.sourceDetail}>, {detail}</span>}
                </li>
              );
            })}
          </ol>
        </section>
      </section>
    </main>
  );
}
