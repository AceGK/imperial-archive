"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./styles.module.scss";
import ThemeToggle from "@/components/modules/ThemeToggle";
import SiteWidthToggle from "@/components/modules/SiteWidthToggle";
import Button from "@/components/ui/Button";

const links = [
  { href: "/books", label: "Books" },
  { href: "/authors", label: "Authors" },
  { href: "/factions", label: "Factions" },
  { href: "/eras", label: "Eras" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className={styles.navWrapper}>
      <div className="container">
        <div className={styles.nav}>
          <div className={styles.primary}>
            <div className={styles.logo}>
              <Link href="/">Imperial Archive</Link>
            </div>
            <ul className={styles.links}>
              {links.map((link) => (
                <li key={link.href}>
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
          <div className={styles.secondary}>
            <Button href="/login" variant="secondary" size="sm">
              Login
            </Button>
            <Button href="/signup" variant="primary" size="sm">
              Signup
            </Button>
            <SiteWidthToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
