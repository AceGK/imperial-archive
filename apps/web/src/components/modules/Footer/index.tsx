// /components/modules/Footer/index.tsx
import Link from "next/link";
import styles from "./styles.module.scss";
import Logo from "public/imperial-archive-logo.svg";
import Button from "@/components/ui/Button";

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
  { href: "/books", label: "Books" },
  { href: "/authors", label: "Authors" },
  { href: "/factions", label: "Factions" },
  { href: "/eras", label: "Eras" },
];

const defaultSecondary: FooterLink[] = [
  { href: "/about", label: "About" },
  { href: "/support", label: "Support" },
  { href: "/attribution", label: "Attribution" },
  { href: "/privacy", label: "Privacy" },
];

export default function Footer({
  links = defaultPrimary,
  secondary = defaultSecondary,
  note = "Imperial Archive is a fan-made resource for Warhammer reading and lore. Not affiliated with Games Workshop.",
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
            <h2 className={styles.heading}>Explore</h2>
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
        </div>
      </div>

      {showBottomBar && (
        <div className={styles.bottomBar} role="contentinfo" aria-label="Site credits">
          <div className="container">
            <div className={styles.bottomInner}>
              <small className={styles.copy}>
                © {year} Imperial Archive. All rights reserved.
              </small>

              <div className={styles.bottomLinks}>
                <Button 
                  href="#top" 
                  variant="ghost"
                  size="sm"
                  aria-label="Back to top"
                  title="Back to top"
                >
                  Back to top ↑
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
