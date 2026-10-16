// components/modules/Nav/MobileMenu.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import ThemeSwitch from "@/components/modules/ThemeSwitch";
import { accountNav } from "@/components/modules/Account/nav";
import SignOutIcon from "@/components/icons/account/sign-out.svg";
import Button from "@/components/ui/Button";
import { mobileItems } from "./nav";
import styles from "./styles.module.scss";

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

  return (
    <>
      <div id="mobile-menu" className={`${styles.mobile} ${open ? styles.show : ""}`}>
        <ul className={styles.mobileLinks}>
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
                        {link.label}
                        {link.comingSoon && <span className={styles.mobileSoon}>Soon</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
          <AccountGroup isLinkActive={isLinkActive} />
        </ul>

        <div className={styles.mobileActions}>
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

/** Full-width Login / Signup; signed-in users get the Account group instead */
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

function AccountGroup({ isLinkActive }: { isLinkActive: (href: string) => boolean }) {
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
              <Link href={href} className={`${styles.mobileLink} ${isLinkActive(href) ? styles.active : ""}`}>
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
