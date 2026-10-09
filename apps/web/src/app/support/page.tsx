import Card from "@/components/ui/Card";
import KofiButton from "@/components/modules/KofiButton";
import { pageMetadata } from "@/lib/seo";
import styles from "./styles.module.scss";

export const metadata = pageMetadata({
  title: "Support",
  description:
    "Support Imperial Archive, the free, fan-made Warhammer 40k book catalog and reading tracker. Tips help cover hosting, search, and the database that keep it running.",
  path: "/support",
});

const KOFI_USERNAME = "imperialarchive";
const KOFI_URL = `https://ko-fi.com/${KOFI_USERNAME}`;
// keep in step with the minimum tip set in Ko-fi's settings
const KOFI_MIN_TIP = "$3";

const COSTS = [
  { name: "Hosting", detail: "Serving every page, quickly, wherever readers are" },
  { name: "Catalog database", detail: "Storing and delivering 1,000+ book records and their covers" },
  { name: "Search", detail: "Instant search and filtering across the catalog" },
  { name: "Accounts & email", detail: "Sign-in, favorites, and verification emails" },
];

function KofiLink() {
  return (
    <a href={KOFI_URL} target="_blank" rel="noopener noreferrer" className={styles.kofiLink}>
      Ko-fi
    </a>
  );
}

/** Card label with a cogitator-style reference code, e.g. "EX-01 · Contribute" */
function Eyebrow({ code, label }: { code: string; label: string }) {
  return (
    <span className={styles.eyebrow}>
      <span>
        <span className={styles.eyebrowCode}>{code}</span> · {label}
      </span>
    </span>
  );
}

export default function SupportPage() {
  return (
    <main>
      <section className="container row__md">
        <header className={styles.header}>
          <div className={styles.ref}>Adeptus Administratum · IA-005 // Exchequer</div>
          <h1 className={styles.title}>Support the Archive</h1>
          <div className={styles.divider} />
        </header>

        <div className={styles.layout}>
          <aside className={styles.payment} aria-label="Donate">
            <Card eyebrow={<Eyebrow code="EX-01" label="Contribute" />} title="Offer a tithe">
              <p>
                Tips start at {KOFI_MIN_TIP}, and every one helps. You&apos;ll
                choose your amount and payment method on Ko-fi. Payments are
                handled securely by{" "}
                <KofiLink />; card details never touch this site.
              </p>
              <div className={styles.action}>
                <KofiButton username={KOFI_USERNAME} label="Donate" className={styles.kofiButton} />
                <span className={styles.poweredBy}>
                  Powered by <KofiLink />
                </span>
              </div>
            </Card>
          </aside>

          <div className={styles.info}>
            <Card eyebrow={<Eyebrow code="EX-02" label="Upkeep" />} title="Keeping the Archive running">
              <p>
                The Imperial Archive is free, with no ads and no paywalls, and
                it&apos;s built and maintained by one person in their spare
                time. Running it still has real costs, and tips help cover
                them:
              </p>
              <dl className={styles.costs}>
                {COSTS.map(({ name, detail }) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{detail}</dd>
                  </div>
                ))}
              </dl>
              <p>
                Support is entirely optional and changes nothing about how the
                site works for you. Every page stays free for everyone.
              </p>
            </Card>

            <Card eyebrow={<Eyebrow code="EX-03" label="Other ways to help" />} title="Spread the word">
              <p>
                Not in a position to tip? Sharing the Archive with fellow
                readers helps just as much, whether that&apos;s a reading order
                for a friend starting the Horus Heresy or a link in your
                favorite 40k community.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
