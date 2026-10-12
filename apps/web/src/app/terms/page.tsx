import Link from "next/link";
import InfoHeader from "@/components/modules/InfoHeader";
import { pageMetadata } from "@/lib/seo";
import styles from "./styles.module.scss";

export const metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "Terms of use for Imperial Archive, the free, fan-made catalog of Warhammer 40,000 fiction: what you're welcome to do with the site, and what isn't allowed.",
  path: "/terms",
});

const LAST_UPDATED = "October 12, 2026";

export default function TermsPage() {
  return (
    <main>
      <section className="container row__md">
        <article className={styles.content}>
          <InfoHeader label="Adeptus Administratum · IA-007 // Edicts" title="Terms of Use">
            <p className={styles.meta}>Last updated {LAST_UPDATED}</p>
          </InfoHeader>

          <div className={`${styles.body} rich-text`}>
            <p>
              These terms cover how you can use Imperial Archive (imperialarchive.com). By using the
              site, you agree to them.
            </p>

            <h2>The Archive</h2>
            <p>
              Imperial Archive is a free, unofficial, fan-made catalog of Warhammer 40,000 fiction. It
              is not affiliated with or endorsed by Games Workshop. Warhammer 40,000 and related names,
              logos, and book cover artwork are the property of Games Workshop Limited and their
              respective owners, and appear here for identification only.
            </p>

            <h2>Our content</h2>
            <p>
              The catalog itself is the work of Imperial Archive: the selection and arrangement of
              books, authors, series, factions, and eras, the reading orders and series lists, and the
              descriptions and other text written for the site. Book titles, publication details, and
              cover artwork belong to their respective owners.
            </p>

            <h2>What you&apos;re welcome to do</h2>
            <ul>
              <li>Browse the catalog and use it to plan and track your own reading.</li>
              <li>Share links to any page, anywhere.</li>
              <li>Quote short passages, with a link back to the page you quoted.</li>
            </ul>

            <h2>What isn&apos;t allowed</h2>
            <ul>
              <li>
                Using bots, scrapers, crawlers, or scripts to copy, download, or harvest the catalog.
                Search engines and AI assistants that follow our robots.txt file are welcome to index
                pages so people can find them.
              </li>
              <li>
                Republishing or redistributing substantial parts of the catalog, or using it to build
                a competing database, app, or website.
              </li>
              <li>Using the site&apos;s content to train AI or machine-learning models.</li>
              <li>
                Interfering with the site, including overloading it, getting around rate limits or
                other protections, or accessing other people&apos;s accounts.
              </li>
            </ul>
            <p>
              We may block access for anyone who breaks these terms, and may ask hosts and search
              engines to remove copies of our content.
            </p>

            <h2>Accounts and tips</h2>
            <p>
              If you create an account, keep your login details safe; you&apos;re responsible for
              activity on your account. We may suspend accounts that break these terms. Tips through
              the <Link href="/support">Support</Link> page are voluntary, are processed by Ko-fi
              under its own terms, and don&apos;t buy any extra access.
            </p>

            <h2>No guarantees</h2>
            <p>
              The Archive is compiled by hand and offered as-is. It may contain gaps or errors, and
              the site may change, pause, or go offline at any time.
            </p>

            <h2>Changes</h2>
            <p>
              These terms may be updated from time to time. The date at the top shows when they last
              changed.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
