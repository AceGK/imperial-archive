"use client";

import { useEffect } from "react";
import { useConvexAuth } from "convex/react";
import Button from "@/components/ui/Button";
import LoginIcon from "@/components/icons/log-in.svg";
import AccountMenu from "./AccountMenu";
import { AUTH_HINT_KEY } from "./authHint";
import styles from "./AuthSlot.module.scss";

/**
 * Login/Signup or the account avatar, without layout shift.
 *
 * Both variants are always rendered stacked in one grid cell, so the slot is
 * always as wide as the wider one and nothing beside it moves when the session
 * resolves. `data-auth` on <html> decides which is visible.
 */
export default function AuthSlot({
  compact = false,
}: {
  /** Mobile top bar: Login as an icon and no Signup (the menu has both in full) */
  compact?: boolean;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Keep the hint (and the visible variant) in step with the real session,
  // including sign-in/out and expired sessions
  useEffect(() => {
    if (isLoading) return;
    try {
      localStorage.setItem(AUTH_HINT_KEY, isAuthenticated ? "1" : "0");
    } catch {}
    document.documentElement.setAttribute("data-auth", isAuthenticated ? "in" : "out");
  }, [isAuthenticated, isLoading]);

  return (
    <div className={styles.slot}>
      <span className={styles.out}>
        {/* prefetch: the site's layout is dynamic, so Next only fully prefetches these
            when asked, and the login/signup modal would otherwise wait on the server */}
        {compact ? (
          <Button href="/login" variant="ghost" size="icon" className={styles.loginIcon} title="Login" prefetch>
            <LoginIcon aria-hidden="true" />
            <span className="visually-hidden">Login</span>
          </Button>
        ) : (
          <>
            <Button href="/signup" variant="tertiary" size="sm" className={styles.signup} prefetch>
              Signup
            </Button>
            <Button href="/login" variant="primary" size="sm" className={styles.login} prefetch>
              Login
            </Button>
          </>
        )}
      </span>
      <span className={styles.in}>
        {!isLoading && isAuthenticated ? (
          <AccountMenu />
        ) : (
          <span className={styles.placeholder} aria-hidden="true" />
        )}
      </span>
    </div>
  );
}
