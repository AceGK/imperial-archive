import Link from "next/link";
import Card from "@/components/ui/Card";
import InfoHeader from "@/components/modules/InfoHeader";
import { supportGroup } from "@/components/modules/Nav/nav";
import { pageMetadata } from "@/lib/seo";
import tiles from "@/components/modules/ReportForm/page.module.scss";
import styles from "./styles.module.scss";

export const metadata = pageMetadata({
  title: "Support",
  description:
    "Donate to Imperial Archive, report a bug or a missing Warhammer 40k book, or send feedback on the catalog and reading tracker.",
  path: "/support",
});

/** The hub for the Support menu: donating, the report forms and feedback */
export default function SupportPage() {
  return (
    <main>
      <section className="container row__md">
        <div className={tiles.page}>
          <InfoHeader label="Adeptus Administratum · IA-008 // Officio Assistance" title="Support" />

          <Card>
            <p className={styles.intro}>
              The Imperial Archive is built and kept by one person. Tips help with the running costs, and reports of
              broken pages or missing books, authors and series keep the catalog accurate.
            </p>
          </Card>

          <nav className={`${tiles.others} ${styles.links}`} aria-label="Support">
            {supportGroup.links.map(({ href, label, description, icon: Icon }) => (
              <Link key={href} href={href} className={tiles.other}>
                {Icon && <Icon className={tiles.otherIcon} aria-hidden="true" />}
                <span className={tiles.otherTitle}>{label}</span>
                <span className={tiles.otherBlurb}>{description}</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </main>
  );
}
