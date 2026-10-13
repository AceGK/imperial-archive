// hooks/useScrollRestoration.ts
"use client";

import { useEffect, useRef, useState } from "react";

const SCROLL_KEY_PREFIX = "scroll-pos-";

interface ScrollState {
  /** window scroll position */
  position: number;
  /** height of the results area (not the whole page) */
  height: number;
  itemCount: number;
}

function getScrollState(key: string): ScrollState | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(SCROLL_KEY_PREFIX + key) ?? "null");
    return typeof data?.position === "number" && typeof data?.height === "number" ? data : null;
  } catch {
    return null;
  }
}

function saveScrollState(key: string, state: ScrollState) {
  try {
    sessionStorage.setItem(SCROLL_KEY_PREFIX + key, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// Set by the browser's back/forward buttons; link clicks never set it. Only
// those history visits restore the old scroll position.
let navigatedThroughHistory = false;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    navigatedThroughHistory = true;
  });
}

/**
 * Returns the reader to where they were in a "Load more" list after Back.
 * Attach `ref` to the results container: while restoring, it's held at its
 * old height (`minHeight`) so the page is tall enough to scroll to.
 */
export function useScrollRestoration(key: string, itemCount: number, isLoading: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<ScrollState | null>(null);

  // decide once per visit whether this is a back/forward return
  useEffect(() => {
    if (navigatedThroughHistory) setPending(getScrollState(key));
    navigatedThroughHistory = false;
  }, [key]);

  // the reader scrolling themselves cancels restoration
  useEffect(() => {
    if (!pending) return;
    const cancel = () => setPending(null);
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchmove", cancel, { passive: true });
    return () => {
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchmove", cancel);
    };
  }, [pending]);

  // restore once the same (or more) items are back on screen
  useEffect(() => {
    if (!pending || isLoading || itemCount === 0) return;
    if (itemCount < pending.itemCount) {
      setPending(null);
      return;
    }
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: pending.position, behavior: "instant" });
      setPending(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pending, isLoading, itemCount]);

  // remember the position, for the next time the reader comes back
  useEffect(() => {
    if (pending) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!ref.current) return;
        saveScrollState(key, { position: window.scrollY, height: ref.current.offsetHeight, itemCount });
      }, 150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [key, itemCount, pending]);

  return { ref, minHeight: pending?.height ?? 0, isRestoring: pending !== null };
}

export function clearScrollPosition(key: string): void {
  try {
    sessionStorage.removeItem(SCROLL_KEY_PREFIX + key);
  } catch {
    // ignore
  }
}
