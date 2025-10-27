"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {usePathname} from "next/navigation";
import styles from "./styles.module.scss";
import ThemeToggle from "@/components/modules/ThemeToggle";
import SiteWidthToggle from "@/components/modules/SiteWidthToggle";
import Button from "@/components/ui/Button";
import Logo from "public/imperial-archive-logo.svg";

const links = [
  { href: "/books", label: "Books" },
  { href: "/series", label: "Series" },
  { href: "/authors", label: "Authors" },
  { href: "/factions", label: "Factions" },
  { href: "/eras", label: "Eras" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // lock scroll when menu open
  useEffect(() => {
    if (open) document.documentElement.style.overflow = "hidden";
    else document.documentElement.style.overflow = "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  // close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <nav className={styles.navWrapper} aria-label="Primary">
      <div className="container">
        <div className={styles.nav}>
          <div className={styles.primary}>
            <div className={styles.logo}>
              <Link href="/" aria-label="Imperial Archive Home">
                <Logo className={styles.logoImage} />
              </Link>
            </div>

            {/* desktop links */}
            <ul className={styles.links} role="menubar">
              {links.map((link) => (
                <li key={link.href} role="none">
                  <Button
                    variant="ghost"
                    href={link.href}
                    className={pathname === link.href ? styles.active : ""}
                  >
                    {link.label}
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          {/* desktop right controls */}
          <div className={styles.secondary}>
            <Button href="/login" variant="secondary" size="sm">Login</Button>
            <Button href="/signup" variant="primary" size="sm">Signup</Button>
            <SiteWidthToggle />
            <ThemeToggle />
          </div>

          {/* mobile hamburger */}
          <button
            type="button"
            className={`${styles.burger} ${open ? styles.open : ""}`}
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.bar} />
            <span className={styles.bar} />
            <span className={styles.bar} />
          </button>
        </div>
      </div>

      {/* mobile panel */}
      <div
        id="mobile-menu"
        className={`${styles.mobile} ${open ? styles.show : ""}`}
      >
        <ul className={styles.mobileLinks}>
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`${styles.mobileLink} ${pathname === l.href ? styles.active : ""}`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.mobileActions}>
          <Button href="/login" variant="secondary" size="sm">Login</Button>
          <Button href="/signup" variant="primary" size="sm">Signup</Button>
          <SiteWidthToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* dim backdrop */}
      <div
        className={`${styles.backdrop} ${open ? styles.show : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
    </nav>
  );
}
