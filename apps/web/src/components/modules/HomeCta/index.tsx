import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { client } from "@/lib/sanity/sanity.client";
import { catalogStats40kQuery } from "@/lib/sanity/queries";
import styles from "./styles.module.scss";

type CatalogStats = { books: number; authors: number; series: number; factions: number };

const IMAGE = "/images/simon-norrmen-library03.jpg";
const CREDIT = "Imperial Library by Simon Norrmén";

/**
 * The homepage's closing call to action, over a parallax library scene. Signed-out
 * visitors are asked to sign up; signed-in readers get their tracker instead
 * (switched in CSS from <html data-auth>, so the right buttons show on first paint).
 */
export default async function HomeCta() {
  const stats = await client.fetch<CatalogStats>(catalogStats40kQuery, {}, { next: { revalidate: 60 } });
  const figures = [
    { value: stats.books, label: "Books" },
    { value: stats.authors, label: "Authors" },
    { value: stats.series, label: "Series" },
    { value: stats.factions, label: "Factions" },
  ];

  return (
    <section className={styles.cta} aria-labelledby="home-cta">
      {/* always dark: the text sits over the artwork in either theme */}
      <div className={styles.inner} data-theme="dark">
        <div className={styles.media} aria-hidden="true">
          <Image src={IMAGE} alt="" fill sizes="100vw" className={styles.image} />
        </div>
        <div className={styles.shade} aria-hidden="true" />

        <div className={`container ${styles.content}`}>
          <span className={styles.kicker}>Enter the Archive</span>
          <h2 id="home-cta" className={styles.title}>
            Your Black Library<sup>™</sup> journey starts here
          </h2>
          <p className={styles.text}>
            Browse every Warhammer 40,000 book by author, series, faction and era, then track what you want to read,
            are reading and have finished. Free, with no limits.
          </p>

          <dl className={styles.stats}>
            {figures.map(({ value, label }) => (
              <div key={label} className={styles.stat}>
                <dt>{label}</dt>
                <dd>{value.toLocaleString("en-US")}</dd>
              </div>
            ))}
          </dl>

          <div className={styles.actions}>
            <Button href="/books" variant="primary" size="lg">
              Browse books
            </Button>
            <Button href="/signup" variant="secondary" size="lg" className={styles.guestOnly}>
              Create a free account
            </Button>
            <Button href="/account/track" variant="secondary" size="lg" className={styles.memberOnly}>
              Open your tracker
            </Button>
          </div>
          <p className={`${styles.login} ${styles.guestOnly}`}>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>

        <span className={styles.credit}>{CREDIT}</span>
      </div>
    </section>
  );
}
