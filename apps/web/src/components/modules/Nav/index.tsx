// components/modules/Nav/index.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType, MouseEvent, SVGProps } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";
import styles from "./styles.module.scss";
import ThemeToggle from "@/components/modules/ThemeToggle";
import ThemeSwitch from "@/components/modules/ThemeSwitch";
import { accountNav } from "@/components/modules/Account/nav";
import SignOutIcon from "@/components/icons/account/sign-out.svg";
import SiteWidthToggle from "@/components/modules/SiteWidthToggle";
import Button from "@/components/ui/Button";
import ChevronDown from "@/components/icons/chevron-down.svg";
import BookIcon from "@/components/icons/book.svg";
import UserIcon from "@/components/icons/user.svg";
import LayersIcon from "@/components/icons/layers.svg";
import ShieldIcon from "@/components/icons/shield.svg";
import HourglassIcon from "@/components/icons/hourglass.svg";
import SwordsIcon from "@/components/icons/swords.svg";
import AuthSlot from "./AuthSlot";
import Logo from "../../../../public/imperial-archive-logo.svg";

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;
type NavLink = {
  href: string;
  label: string;
  description?: string;
  icon?: NavIcon;
  comingSoon?: boolean;
};
type NavGroup = { label: string; links: NavLink[]; columns?: number };
type NavPlain = { href: string; label: string; comingSoon?: boolean };
type NavItem = NavGroup | NavPlain;

const NAV_ITEMS: NavItem[] = [
  {
    label: "Browse",
    columns: 2,
    links: [
      { href: "/books", label: "Books", description: "The full catalog, cover to cover", icon: BookIcon },
      { href: "/authors", label: "Authors", description: "Writers of the Black Library", icon: UserIcon },
      { href: "/series", label: "Series", description: "Ongoing sagas and campaigns", icon: LayersIcon },
      { href: "/factions", label: "Factions", description: "Armies, legions, and chapters", icon: ShieldIcon },
      { href: "/eras", label: "Eras", description: "Epochs of the 41st millennium", icon: HourglassIcon },
      {
        href: "/characters",
        label: "Characters",
        description: "Heroes and villains across the books",
        icon: SwordsIcon,
        comingSoon: true,
      },
    ],
  },
  { href: "/track", label: "Track", comingSoon: true },
  {
    label: "Info",
    links: [
      { href: "/about", label: "About", description: "The charter behind this archive" },
      { href: "/resources", label: "Resources", description: "Reading orders and community guides" },
      { href: "/faq", label: "FAQ", description: "Common questions, answered" },
    ],
  },
  { href: "/support", label: "Support" },
];

const dropdownItems = NAV_ITEMS.filter((item): item is NavGroup => !("href" in item));

// The mobile menu lists the sections first, then the single links: Track sits
// below Info instead of between Browse and Info as on desktop
const MOBILE_ORDER = ["Browse", "Info", "Track", "Support"];
const mobileItems = [...NAV_ITEMS].sort(
  (a, b) => MOBILE_ORDER.indexOf(a.label) - MOBILE_ORDER.indexOf(b.label)
);

type IndicatorStyle = { opacity: number; width?: number; transform?: string };
type HighlightStyle = {
  opacity: number;
  width?: number;
  height?: number;
  transform?: string;
  skipTransition?: boolean;
};
type ViewportSize = { width: number; height: number; left: number };

const CLOSE_DELAY = 150;

export default function Nav() {
  const pathname = usePathname();
  const isVisible = useScrollVisibility();

  const [mobileOpen, setMobileOpen] = useState(false);

  // dropdown state
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({ opacity: 0 });
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0, left: 0 });
  const [highlightStyle, setHighlightStyle] = useState<HighlightStyle>({ opacity: 0 });
  const highlightVisible = useRef(false);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideHighlightTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useRef<HTMLElement | null>(null);
  const menuListRef = useRef<HTMLDivElement | null>(null);

  const isOpen = activeIndex !== null;

  const isLinkActive = (href: string) => pathname === href;
  const isGroupActive = (item: NavItem) => "links" in item && item.links.some((l) => pathname === l.href);

  // slide direction for the content swap animation
  const getMotion = useCallback(
    (index: number) => {
      if (activeIndex !== index) return null;
      if (prevIndex === null) return null;
      return index > prevIndex ? "from-end" : "from-start";
    },
    [activeIndex, prevIndex]
  );

  // position the little arrow under the active trigger
  const updateIndicator = useCallback((index: number) => {
    const trigger = triggerRefs.current[index];
    const root = rootRef.current;
    if (!trigger || !root) return;

    const triggerRect = trigger.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();

    setIndicatorStyle({
      opacity: 1,
      width: triggerRect.width,
      transform: `translateX(${triggerRect.left - rootRect.left}px)`,
    });
  }, []);

  // measure content and center the panel under the active trigger, clamped
  // so it never overflows past the nav bar's own edges
  const updateViewportSize = useCallback((index: number) => {
    const content = contentRefs.current[index];
    const trigger = triggerRefs.current[index];
    const root = rootRef.current;
    if (!content || !trigger || !root) return;

    requestAnimationFrame(() => {
      const triggerRect = trigger.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const contentWidth = content.scrollWidth;
      const padding = 16;

      let left = triggerRect.left + triggerRect.width / 2 - rootRect.left;
      const minLeft = padding + contentWidth / 2;
      const maxLeft = rootRect.width - padding - contentWidth / 2;
      left = Math.max(minLeft, Math.min(maxLeft, left));

      setViewportSize({ width: contentWidth, height: content.scrollHeight, left });
    });
  }, []);

  const openDropdown = useCallback(
    (index: number) => {
      clearTimeout(closeTimer.current);
      if (activeIndex === index) return;

      const trigger = triggerRefs.current[index];
      const root = rootRef.current;
      if (trigger && root) {
        const triggerRect = trigger.getBoundingClientRect();
        const rootRect = root.getBoundingClientRect();
        const left = triggerRect.left + triggerRect.width / 2 - rootRect.left;
        setViewportSize((s) => ({ ...s, left }));
      }

      setPrevIndex(activeIndex);
      setActiveIndex(index);
      updateIndicator(index);
    },
    [activeIndex, updateIndicator]
  );

  const startCloseDropdown = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setPrevIndex(activeIndex);
      setActiveIndex(null);
      setIndicatorStyle((s) => ({ ...s, opacity: 0 }));
    }, CLOSE_DELAY);
  }, [activeIndex]);

  const closeDropdown = useCallback(() => {
    clearTimeout(closeTimer.current);
    setPrevIndex(activeIndex);
    setActiveIndex(null);
    setIndicatorStyle((s) => ({ ...s, opacity: 0 }));
  }, [activeIndex]);

  const cancelCloseDropdown = useCallback(() => {
    clearTimeout(closeTimer.current);
  }, []);

  const updateHighlight = useCallback((e: MouseEvent<HTMLLIElement>) => {
    clearTimeout(hideHighlightTimer.current);
    const el = e.currentTarget.querySelector("button, a");
    const list = menuListRef.current;
    if (!el || !list) return;

    const elRect = el.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const wasVisible = highlightVisible.current;
    highlightVisible.current = true;

    setHighlightStyle({
      opacity: 1,
      width: elRect.width,
      height: elRect.height,
      transform: `translate(${elRect.left - listRect.left}px, ${elRect.top - listRect.top}px)`,
      skipTransition: !wasVisible,
    });
  }, []);

  const hideHighlight = useCallback(() => {
    clearTimeout(hideHighlightTimer.current);
    hideHighlightTimer.current = setTimeout(() => {
      highlightVisible.current = false;
      setHighlightStyle((s) => ({ ...s, opacity: 0 }));
    }, 50);
  }, []);

  // measure the panel once React has rendered the active content
  useEffect(() => {
    if (activeIndex !== null) updateViewportSize(activeIndex);
  }, [activeIndex, updateViewportSize]);

  // close the open dropdown on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveIndex(null);
        setIndicatorStyle((s) => ({ ...s, opacity: 0 }));
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // lock scroll while the mobile panel is open
  useEffect(() => {
    if (mobileOpen) document.documentElement.style.overflow = "hidden";
    else document.documentElement.style.overflow = "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [mobileOpen]);

  // close everything on route change
  useEffect(() => {
    setMobileOpen(false);
    setActiveIndex(null);
    setIndicatorStyle((s) => ({ ...s, opacity: 0 }));
  }, [pathname]);

  return (
    <nav
      className={`${styles.navWrapper} ${!isVisible ? styles.hidden : ""}`}
      aria-label="Primary"
      ref={rootRef}
      onMouseLeave={startCloseDropdown}
    >
      <div className="container">
        <div className={styles.nav}>
          <div className={styles.logo}>
            <Link href="/" aria-label="Imperial Archive Home">
              <Logo className={styles.logoImage} />
            </Link>
          </div>

          {/* desktop links */}
          <div className={styles.linksWrap} ref={menuListRef} onMouseLeave={hideHighlight}>
            <div
              className={styles.highlight}
              style={{
                ...highlightStyle,
                transition: highlightStyle.skipTransition
                  ? "opacity 150ms ease"
                  : "transform 200ms ease, width 200ms ease, height 200ms ease, opacity 150ms ease",
              }}
            />
            <ul className={styles.links} role="menubar">
              {NAV_ITEMS.map((item) => {
                if ("href" in item) {
                  return (
                    <li
                      key={item.label}
                      role="none"
                      onMouseEnter={(e) => {
                        updateHighlight(e);
                        startCloseDropdown();
                      }}
                      onMouseLeave={hideHighlight}
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
                const itemIsActive = activeIndex === index;

                return (
                  <li
                    key={item.label}
                    role="none"
                    onMouseEnter={(e) => {
                      updateHighlight(e);
                      openDropdown(index);
                    }}
                    onMouseLeave={hideHighlight}
                  >
                    <button
                      type="button"
                      className={`${styles.trigger} ${isGroupActive(item) ? styles.active : ""}`}
                      ref={(el) => {
                        triggerRefs.current[index] = el;
                      }}
                      data-state={itemIsActive ? "open" : "closed"}
                      aria-haspopup="true"
                      aria-expanded={itemIsActive}
                      onClick={() => (itemIsActive ? startCloseDropdown() : openDropdown(index))}
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
            <AuthSlot signupVariant="secondary-bracket" />
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

      {/* dropdown indicator arrow */}
      <div
        className={styles.indicator}
        style={{
          ...indicatorStyle,
          transition:
            prevIndex === null && isOpen
              ? "opacity 200ms ease"
              : "transform 250ms ease, width 250ms ease, opacity 200ms ease",
        }}
      >
        <div className={styles.arrow} />
      </div>

      {/* dropdown panel */}
      <div
        className={styles.viewportPosition}
        style={{
          left: viewportSize.left,
          pointerEvents: isOpen ? "auto" : "none",
          transition: prevIndex === null && isOpen ? "none" : undefined,
        }}
        onMouseEnter={cancelCloseDropdown}
        onMouseLeave={startCloseDropdown}
      >
        <div className={styles.bridge} />
        <div
          className={styles.viewport}
          data-state={isOpen ? "open" : "closed"}
          style={{
            width: isOpen ? viewportSize.width : 0,
            height: isOpen ? viewportSize.height : 0,
          }}
        >
          {dropdownItems.map((item, index) => {
            const itemIsActive = activeIndex === index;
            const motion = getMotion(index);

            return (
              <div
                key={item.label}
                className={styles.content}
                ref={(el) => {
                  contentRefs.current[index] = el;
                }}
                data-motion={motion}
                style={{ display: itemIsActive ? "block" : "none" }}
              >
                <ul
                  className={`${styles.linkList} ${item.columns === 2 ? styles.twoCol : ""}`}
                >
                  {item.links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={`${styles.listItemLink} ${isLinkActive(link.href) ? styles.active : ""}`}
                          onClick={closeDropdown}
                        >
                          {Icon && (
                            <span className={styles.listItemIcon}>
                              <Icon aria-hidden="true" />
                            </span>
                          )}
                          <span className={styles.listItemText}>
                            <span className={styles.listItemLabel}>
                              {link.label}
                              {link.comingSoon && <span className={styles.soonTag}>Soon</span>}
                            </span>
                            {link.description && (
                              <span className={styles.listItemDesc}>{link.description}</span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* mobile panel */}
      <div id="mobile-menu" className={`${styles.mobile} ${mobileOpen ? styles.show : ""}`}>
        <ul className={styles.mobileLinks}>
          {mobileItems.map((item) =>
            "href" in item ? (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`${styles.mobileLink} ${isLinkActive(item.href) ? styles.active : ""}`}
                >
                  {item.label}
                  {item.comingSoon && <span className={styles.mobileSoon}>Soon</span>}
                </Link>
              </li>
            ) : (
              <li key={item.label} className={styles.mobileGroup}>
                <div className={styles.mobileGroupLabel}>{item.label}</div>
                <ul
                  className={`${styles.mobileSubLinks} ${item.columns === 2 ? styles.mobileTwoCol : ""}`}
                >
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
                          {link.label}
                          {link.comingSoon && <span className={styles.mobileSoon}>Soon</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            )
          )}
          <MobileAccountGroup isLinkActive={isLinkActive} />
        </ul>

        <div className={styles.mobileActions}>
          <MobileAuthButtons />
          {/* SiteWidthToggle omitted — it's desktop-only (hidden below 1250px) */}
          <div className={styles.mobileTheme}>
            <span>Theme</span>
            <ThemeSwitch />
          </div>
        </div>
      </div>

      {/* dim backdrop */}
      <div
        className={`${styles.backdrop} ${mobileOpen ? styles.show : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
    </nav>
  );
}


/** Full-width Login / Signup in the mobile panel; signed-in users get the Account group instead */
function MobileAuthButtons() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading || isAuthenticated) return null;

  return (
    <>
      <Button href="/login" variant="primary" size="lg" className={styles.mobileLoginButton}>
        Login
      </Button>
      <Button href="/signup" variant="secondary" size="lg" className={styles.mobileLoginButton}>
        Signup
      </Button>
    </>
  );
}

function MobileAccountGroup({ isLinkActive }: { isLinkActive: (href: string) => boolean }) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();

  if (!isAuthenticated) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <li className={styles.mobileGroup}>
      <div className={styles.mobileGroupLabel}>Account</div>
      <ul className={`${styles.mobileSubLinks} ${styles.mobileTwoCol}`}>
        {accountNav
          .flatMap((group) => group.items)
          .map(({ href, label, icon: Icon, comingSoon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.mobileLink} ${isLinkActive(href) ? styles.active : ""}`}
              >
                <span className={styles.mobileLinkIcon}>
                  <Icon aria-hidden="true" />
                </span>
                {label}
                {comingSoon && <span className={styles.mobileSoon}>Soon</span>}
              </Link>
            </li>
          ))}
        <li>
          <button type="button" className={styles.mobileLink} onClick={handleSignOut}>
            <span className={styles.mobileLinkIcon}>
              <SignOutIcon aria-hidden="true" />
            </span>
            Sign Out
          </button>
        </li>
      </ul>
    </li>
  );
}
