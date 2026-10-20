// components/modules/Nav/MobileMenu.tsx
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useConvexAuth } from "convex/react";
import ThemeSwitch from "@/components/modules/ThemeSwitch";
import Button from "@/components/ui/Button";
import { mobileItems } from "./nav";
import styles from "./styles.module.scss";

// loads when the menu first opens; an empty box of the same size holds its place meanwhile
const NavSearch = dynamic(() => import("@/components/modules/NavSearch"), {
  ssr: false,
  loading: () => <div className={styles.mobileSearchPlaceholder} />,
});

/** The slide-down panel behind the hamburger, with a backdrop that closes it */
export default function MobileMenu({
  open,
  onClose,
  isLinkActive,
  showThemeSwitch,
}: {
  open: boolean;
  onClose: () => void;
  isLinkActive: (href: string) => boolean;
  showThemeSwitch: boolean;
}) {
  // lock scroll while the panel is open
  useEffect(() => {
    if (open) document.documentElement.style.overflow = "hidden";
    else document.documentElement.style.overflow = "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const [searchLoaded, setSearchLoaded] = useState(false);
  // while results show, they take the place of the links
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (open) setSearchLoaded(true);
  }, [open]);

  return (
    <>
      <div id="mobile-menu" className={`${styles.mobile} ${open ? styles.show : ""}`}>
        <div className={styles.mobileSearch}>
          {searchLoaded && <NavSearch variant="menu" onNavigate={onClose} onSearchingChange={setSearching} />}
        </div>

        <ul className={styles.mobileLinks} hidden={searching}>
          {mobileItems.map((item) => (
            <li key={item.label} className={styles.mobileGroup}>
              <div className={styles.mobileGroupLabel}>{item.label}</div>
              <ul className={`${styles.mobileSubLinks} ${styles.mobileTwoCol}`}>
                {item.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`${styles.mobileLink} ${isLinkActive(link.href) ? styles.active : ""}`}
                      >
                        {Icon && (
                          <span className={styles.mobileLinkIcon}>
                            <Icon aria-hidden="true" />
                          </span>
                        )}
                        {/* label and tag in one wrapping row: the tag moves under the label before the label breaks */}
                        <span className={styles.mobileLinkText}>
                          <span>{link.label}</span>
                          {link.comingSoon && <span className={styles.mobileSoon}>Soon</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>

        <div className={styles.mobileActions} hidden={searching}>
          <AuthButtons />
          {/* SiteWidthToggle omitted — it's desktop-only (hidden below 1250px) */}
          {showThemeSwitch && (
            <div className={styles.mobileTheme}>
              <span>Theme</span>
              <ThemeSwitch />
            </div>
          )}
        </div>
      </div>

      {/* dim backdrop */}
      <div className={`${styles.backdrop} ${open ? styles.show : ""}`} onClick={onClose} aria-hidden="true" />
    </>
  );
}

/** Full-width Login / Signup; signed-in users reach their account from the avatar in the bar */
function AuthButtons() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading || isAuthenticated) return null;

  return (
    <>
      <Button href="/login" variant="primary" size="lg" className={styles.mobileLoginButton} prefetch>
        Login
      </Button>
      <Button href="/signup" variant="secondary" size="lg" className={styles.mobileLoginButton} prefetch>
        Signup
      </Button>
    </>
  );
}
