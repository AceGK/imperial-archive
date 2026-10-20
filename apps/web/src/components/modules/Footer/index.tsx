// /components/modules/Footer/index.tsx
import Link from "next/link";
import styles from "./styles.module.scss";
import Logo from "../../../../public/imperial-archive-logo.svg";
import ThemeSwitch from "@/components/modules/ThemeSwitch";
import { isProduction } from "@/lib/env";
import { navGroup } from "@/components/modules/Nav/nav";

type FooterLink = { href: string; label: string; comingSoon?: boolean };

export type FooterProps = {
  note?: string;
  /** Show a slim bottom bar with © and utility links */
  showBottomBar?: boolean;
};

const linksOf = (label: string): FooterLink[] =>
  navGroup(label).links.map(({ href, label, comingSoon }) => ({ href, label, comingSoon }));

// the nav's groups, in the same order
const columns = ["Browse", "Resources", "Info", "Support"].map((heading) => ({ heading, links: linksOf(heading) }));

// beside the copyright in the bottom bar
const legalLinks: FooterLink[] = [
  { href: "/terms", label: "Terms of Use" },
  { href: "/privacy", label: "Privacy Policy" },
];

function FooterColumn({ heading, label, links }: { heading: string; label: string; links: FooterLink[] }) {
  return (
    <nav className={styles.column} aria-label={label}>
      <h2 className={styles.heading}>{heading}</h2>
      <ul className={styles.linkList}>
        {links.map(({ href, label, comingSoon }) => (
          <li key={href}>
            <Link href={href} className={styles.link}>
              {label}
            </Link>
            {comingSoon && <span className={styles.soon}>Soon</span>}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer({
  note = "The Imperial Archive is an unofficial, fan-made resource for the Warhammer 40k universe. This site is not affiliated with Games Workshop. All Warhammer 40,000® logos, names, and images are the property of Games Workshop Limited.",
  showBottomBar = true,
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} aria-label="Site footer">
      <div className="container">
        <div className={styles.grid}>
          {/* Brand / blurb */}
          <div className={styles.brand}>
            <Link href="/" aria-label="Imperial Archive Home" className={styles.logoLink}>
              <Logo className={styles.logo} />
            </Link>
            {note && <p className={styles.note}>{note}</p>}
          </div>

          {columns.map(({ heading, links }) => (
            <FooterColumn key={heading} heading={heading} label={`${heading} links`} links={links} />
          ))}
        </div>
      </div>

      {showBottomBar && (
        <div className={styles.bottomBar} role="contentinfo" aria-label="Site credits">
          <div className="container">
            <div className={styles.bottomInner}>
              <div className={styles.legal}>
                <small className={styles.copy}>
                  © {year} Imperial Archive
                </small>
                <nav aria-label="Legal">
                  <ul className={styles.legalLinks}>
                    {legalLinks.map(({ href, label }) => (
                      <li key={href}>
                        <Link href={href} className={styles.legalLink}>
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              <div className={styles.bottomLinks}>
                {/* hidden in production until light mode is finished */}
                {!isProduction && <ThemeSwitch />}
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
