// components/modules/Nav/index.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";
import ThemeToggle from "@/components/modules/ThemeToggle";
import SiteWidthToggle from "@/components/modules/SiteWidthToggle";
import ChevronDown from "@/components/icons/chevron-down.svg";
import AuthSlot from "./AuthSlot";
import DesktopDropdown from "./DesktopDropdown";
import MobileMenu from "./MobileMenu";
import { NAV_ITEMS, dropdownItems, type NavItem } from "./nav";
import { useDropdownMenu } from "./useDropdownMenu";
import Logo from "../../../../public/imperial-archive-logo.svg";
import styles from "./styles.module.scss";

/**
 * The site's top bar. Links and groups come from ./nav; the desktop dropdowns'
 * behavior lives in ./useDropdownMenu, their panel in ./DesktopDropdown, and
 * the phone menu in ./MobileMenu.
 */
export default function Nav() {
  const pathname = usePathname();
  const isVisible = useScrollVisibility();
  const menu = useDropdownMenu();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLinkActive = (href: string) => pathname === href;
  const isGroupActive = (item: NavItem) => "links" in item && item.links.some((l) => pathname === l.href);

  // close the mobile menu on route change (the dropdowns close themselves)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const { highlightStyle } = menu;

  return (
    <nav
      className={`${styles.navWrapper} ${!isVisible ? styles.hidden : ""}`}
      aria-label="Primary"
      ref={menu.rootRef}
      onMouseLeave={menu.startCloseDropdown}
    >
      <div className="container">
        <div className={styles.nav}>
          <div className={styles.logo}>
            <Link href="/" aria-label="Imperial Archive Home">
              <Logo className={styles.logoImage} />
            </Link>
          </div>

          {/* desktop links */}
          <div className={styles.linksWrap} ref={menu.menuListRef} onMouseLeave={menu.hideHighlight}>
            <div
              className={styles.highlight}
              style={{
                ...highlightStyle,
                transition: highlightStyle.skipTransition
                  ? "opacity 150ms ease"
                  : "transform 200ms ease, width 200ms ease, height 200ms ease, opacity 150ms ease",
              }}
            />
            <ul className={styles.links}>
              {NAV_ITEMS.map((item) => {
                if ("href" in item) {
                  return (
                    <li
                      key={item.label}
                      onMouseEnter={(e) => {
                        menu.updateHighlight(e);
                        menu.startCloseDropdown();
                      }}
                      onMouseLeave={menu.hideHighlight}
                    >
                      <Link
                        href={item.href}
                        className={`${styles.link} ${isLinkActive(item.href) ? styles.active : ""}`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                }

                const index = dropdownItems.indexOf(item);
                const itemIsActive = menu.activeIndex === index;

                return (
                  <li
                    key={item.label}
                    onMouseEnter={(e) => {
                      menu.updateHighlight(e);
                      menu.openDropdown(index);
                    }}
                    onMouseLeave={menu.hideHighlight}
                  >
                    <button
                      type="button"
                      className={`${styles.trigger} ${isGroupActive(item) ? styles.active : ""}`}
                      ref={(el) => {
                        menu.triggerRefs.current[index] = el;
                      }}
                      data-state={itemIsActive ? "open" : "closed"}
                      aria-expanded={itemIsActive}
                      aria-controls={`nav-panel-${index}`}
                      onClick={() => (itemIsActive ? menu.startCloseDropdown() : menu.openDropdown(index))}
                      onKeyDown={(e) => menu.onTriggerKeyDown(e, index)}
                    >
                      {item.label}
                      <ChevronDown className={styles.caret} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* desktop right controls */}
          <div className={styles.secondary}>
            <AuthSlot showSignup />
            <SiteWidthToggle />
            <ThemeToggle />
          </div>

          {/* mobile: account avatar (or Login when signed out) beside the hamburger */}
          <div className={styles.mobileAccount}>
            <AuthSlot />
          </div>

          {/* mobile hamburger */}
          <button
            type="button"
            className={`${styles.burger} ${mobileOpen ? styles.open : ""}`}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className={styles.bar} />
            <span className={styles.bar} />
            <span className={styles.bar} />
          </button>
        </div>
      </div>

      <DesktopDropdown menu={menu} isLinkActive={isLinkActive} />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} isLinkActive={isLinkActive} />
    </nav>
  );
}
