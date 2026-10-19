// components/modules/Nav/index.tsx
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useNavPin, useScrollVisibility } from "@/hooks/useScrollVisibility";
import ThemeToggle from "@/components/modules/ThemeToggle";
import SiteWidthToggle from "@/components/modules/SiteWidthToggle";
import ChevronDown from "@/components/icons/chevron-down.svg";
import MagnifyingGlassIcon from "@/components/icons/magnifying-glass.svg";
import AuthSlot from "./AuthSlot";
import DesktopDropdown from "./DesktopDropdown";
import MobileMenu from "./MobileMenu";
import { NAV_ITEMS, dropdownItems, type NavItem } from "./nav";
import { useDropdownMenu } from "./useDropdownMenu";
import Logo from "../../../../public/imperial-archive-logo.svg";
import styles from "./styles.module.scss";

// InstantSearch and the slider load when a reader first goes to search, not with every page
const loadNavSearch = () => import("@/components/modules/NavSearch");
const NavSearch = dynamic(loadNavSearch, { ssr: false });

/** Starts loading the search (and its author/series list) on hover or focus, ahead of the click */
function preloadSearch() {
  loadNavSearch().then((m) => m.loadShortcuts());
}

/**
 * The site's top bar. Links and groups come from ./nav; the desktop dropdowns'
 * behavior lives in ./useDropdownMenu, their panel in ./DesktopDropdown, and
 * the phone menu in ./MobileMenu.
 */
export default function Nav({
  showThemeToggle = true,
  showLayoutToggle = true,
}: {
  showThemeToggle?: boolean;
  showLayoutToggle?: boolean;
}) {
  const pathname = usePathname();
  const isVisible = useScrollVisibility();
  const menu = useDropdownMenu();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // stays mounted once opened, so reopening shows the last search
  const [searchLoaded, setSearchLoaded] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  // the nav stays in view while the search panel hangs from it
  useNavPin(searchOpen);

  const isLinkActive = (href: string) => pathname === href;
  const isGroupActive = (item: NavItem) => "links" in item && item.links.some((l) => pathname === l.href);

  const openSearch = () => {
    setSearchLoaded(true);
    setSearchOpen(true);
  };

  const closeSearch = useCallback(() => {
    // focus goes back to the button, unless the reader has moved on to a new page
    if (searchPanelRef.current?.contains(document.activeElement)) searchButtonRef.current?.focus();
    setSearchOpen(false);
  }, []);

  // close the mobile menu and search on route change (the dropdowns close themselves)
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Escape from anywhere in the panel (the box handles its own: clear first, then close);
  // the page behind doesn't scroll while it's open
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [searchOpen, closeSearch]);

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
            <button
              ref={searchButtonRef}
              type="button"
              className={styles.searchButton}
              aria-label="Search"
              title="Search"
              aria-expanded={searchOpen}
              aria-controls="nav-search"
              onClick={() => (searchOpen ? closeSearch() : openSearch())}
              onMouseEnter={preloadSearch}
              onFocus={preloadSearch}
            >
              <MagnifyingGlassIcon aria-hidden="true" />
            </button>
            <AuthSlot showSignup />
            {showLayoutToggle && <SiteWidthToggle />}
            {showThemeToggle && <ThemeToggle />}
          </div>

          {/* mobile: account avatar (or Login when signed out) beside the hamburger */}
          <div className={styles.mobileAccount}>
            <AuthSlot />
          </div>

        </div>
      </div>

      <DesktopDropdown menu={menu} isLinkActive={isLinkActive} />

      {/* desktop search: hangs from the bar, over a dimmed page */}
      <div
        id="nav-search"
        ref={searchPanelRef}
        className={`${styles.searchPanel} ${searchOpen ? styles.show : ""}`}
        role="dialog"
        aria-label="Search"
        inert={!searchOpen}
      >
        <div className="container">
          {searchLoaded && (
            <NavSearch variant="panel" open={searchOpen} onClose={closeSearch} onNavigate={closeSearch} />
          )}
        </div>
      </div>
      <div
        className={`${styles.searchBackdrop} ${searchOpen ? styles.show : ""}`}
        onClick={closeSearch}
        aria-hidden="true"
      />
      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isLinkActive={isLinkActive}
        showThemeSwitch={showThemeToggle}
      />
    </nav>
  );
}
