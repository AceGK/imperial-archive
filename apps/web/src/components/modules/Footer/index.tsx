// /components/modules/Footer/index.tsx
import Link from "next/link";
import styles from "./styles.module.scss";
import Logo from "../../../../public/imperial-archive-logo.svg";
import ThemeSwitch from "@/components/modules/ThemeSwitch";
import { accountNav } from "@/components/modules/Account/nav";

type FooterLink = { href: string; label: string };

export type FooterProps = {
  /** Primary site nav */
  links?: FooterLink[];
  /** Optional secondary links (legal, about, etc.) */
  secondary?: FooterLink[];
  note?: string;
  /** Show a slim bottom bar with © and utility links */
  showBottomBar?: boolean;
};

const defaultPrimary: FooterLink[] = [
  { href: "/books", label: "All Books" },
  { href: "/authors", label: "By Author" },
  { href: "/series", label: "By Series" },
  { href: "/factions", label: "By Faction" },
  { href: "/eras", label: "By Era" },
];

const defaultSecondary: FooterLink[] = [
  { href: "/about", label: "About" },
  { href: "/resources", label: "Resources" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
  { href: "/about#attribution", label: "Attribution" },
];

const accountLinks = accountNav.flatMap((group) => group.items);

export default function Footer({
  links = defaultPrimary,
  secondary = defaultSecondary,
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

          {/* Primary links */}
          <nav className={styles.nav} aria-label="Footer navigation">
            <h2 className={styles.heading}>Browse</h2>
            <ul className={styles.linkList}>
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={styles.link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Secondary / utility */}
          <nav className={styles.utility} aria-label="Utility links">
            <h2 className={styles.heading}>Info</h2>
            <ul className={styles.linkList}>
              {secondary.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={styles.link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Account */}
          <nav className={styles.utility} aria-label="Account links">
            <h2 className={styles.heading}>Account</h2>
            <ul className={styles.linkList}>
              {accountLinks.map(({ href, label, comingSoon }) => (
                <li key={href}>
                  <Link href={href} className={styles.link}>
                    {label}
                  </Link>
                  {comingSoon && <span className={styles.soon}>Soon</span>}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {showBottomBar && (
        <div className={styles.bottomBar} role="contentinfo" aria-label="Site credits">
          <div className="container">
            <div className={styles.bottomInner}>
              <small className={styles.copy}>
                © {year} Imperial Archive
              </small>

              <div className={styles.bottomLinks}>
                <ThemeSwitch />
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
