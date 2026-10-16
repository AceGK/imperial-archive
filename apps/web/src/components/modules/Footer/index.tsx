// /components/modules/Footer/index.tsx
import Link from "next/link";
import styles from "./styles.module.scss";
import Logo from "../../../../public/imperial-archive-logo.svg";
import ThemeSwitch from "@/components/modules/ThemeSwitch";
import { accountNav } from "@/components/modules/Account/nav";

type FooterLink = { href: string; label: string; comingSoon?: boolean };

export type FooterProps = {
  /** Primary site nav */
  links?: FooterLink[];
  /** Info links (about, FAQ, etc.) */
  secondary?: FooterLink[];
  note?: string;
  /** Show a slim bottom bar with © and utility links */
  showBottomBar?: boolean;
};

const defaultPrimary: FooterLink[] = [
  { href: "/books", label: "Books" },
  { href: "/authors", label: "Authors" },
  { href: "/series", label: "Series" },
  { href: "/factions", label: "Factions" },
  { href: "/eras", label: "Eras" },
  { href: "/characters", label: "Characters", comingSoon: true },
];

const defaultSecondary: FooterLink[] = [
  { href: "/track", label: "Reading Tracker" },
  { href: "/about", label: "About" },
  { href: "/resources", label: "Resources" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
];

const legalLinks: FooterLink[] = [
  { href: "/about#attribution", label: "Attribution" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/privacy", label: "Privacy Policy" },
];

const accountLinks = accountNav.flatMap((group) => group.items);

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

          <FooterColumn heading="Browse" label="Footer navigation" links={links} />
          <FooterColumn heading="Info" label="Info links" links={secondary} />
          <FooterColumn heading="Account" label="Account links" links={accountLinks} />
          <FooterColumn heading="Legal" label="Legal links" links={legalLinks} />
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
