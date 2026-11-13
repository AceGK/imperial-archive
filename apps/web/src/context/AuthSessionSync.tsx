"use client";

import { useEffect } from "react";
import { AUTH_HINT_KEY } from "@/components/modules/Nav/authHint";

// Convex Auth keeps the browser's copy of the session in localStorage under
// these keys, namespaced by the deployment URL (as in @convex-dev/auth)
const namespace = (process.env.NEXT_PUBLIC_CONVEX_URL ?? "").replace(/[^a-zA-Z0-9]/g, "");
const JWT_KEY = `__convexAuthJWT_${namespace}`;
const REFRESH_KEY = `__convexAuthRefreshToken_${namespace}`;

/** Set just before an OAuth redirect: the session will only be in the cookies on return */
export const AUTH_SYNC_KEY = "ia-auth-sync";
/** sessionStorage: this tab already compared the browser's session with the cookies */
const CHECKED_KEY = "ia-auth-checked";

/**
 * Keeps the browser's session in step with the auth cookies, which pages no
 * longer read (that made every page render per request). The browser copy is
 * already right after a password sign-in or sign-out; it can drift when:
 *   - an OAuth sign-in comes back, with the session only in the cookies
 *   - the cookies ended with the browser session but localStorage kept a token
 *   - localStorage was cleared while still signed in (account pages)
 * Anonymous visitors make no request. The token is handed to Convex Auth the
 * way a sign-in in another tab would be: written to storage, then announced
 * with a storage event, which its provider listens for.
 */
export default function AuthSessionSync() {
  useEffect(() => {
    let jwt: string | null, pending: boolean, hintIn: boolean, checked: boolean;
    try {
      jwt = localStorage.getItem(JWT_KEY);
      pending = localStorage.getItem(AUTH_SYNC_KEY) === "1";
      hintIn = localStorage.getItem(AUTH_HINT_KEY) === "1";
      checked = sessionStorage.getItem(CHECKED_KEY) === "1";
    } catch {
      return;
    }
    // the middleware only lets signed-in visitors (by cookie) reach these
    const onAccountPage = /^\/(account|admin)(\/|$)/.test(window.location.pathname);
    const needed = pending || (!checked && (jwt !== null || hintIn)) || (jwt === null && onAccountPage);
    if (!needed) return;

    fetch("/api/session", { cache: "no-store", credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(({ token }: { token: string | null }) => {
        localStorage.removeItem(AUTH_SYNC_KEY);
        sessionStorage.setItem(CHECKED_KEY, "1");
        const current = localStorage.getItem(JWT_KEY);
        if (token === current) return;
        if (token) {
          localStorage.setItem(JWT_KEY, token);
          // the real refresh token stays in its httpOnly cookie; the /api/auth
          // proxy swaps it in, as with ConvexAuthNextjsServerProvider
          localStorage.setItem(REFRESH_KEY, "dummy");
        } else {
          localStorage.removeItem(JWT_KEY);
          localStorage.removeItem(REFRESH_KEY);
        }
        window.dispatchEvent(
          new StorageEvent("storage", { key: JWT_KEY, oldValue: current, newValue: token, storageArea: localStorage })
        );
      })
      .catch(() => {});
  }, []);

  return null;
}
