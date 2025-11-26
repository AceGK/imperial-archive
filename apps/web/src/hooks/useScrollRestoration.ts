// hooks/useScrollRestoration.ts
"use client";

import { useEffect, useRef } from "react";

const SCROLL_KEY_PREFIX = "scroll-pos-";

interface ScrollState {
  position: number;
  contentHeight: number;
  itemCount: number;
}

function getScrollState(key: string): ScrollState | null {
  if (typeof window === "undefined") return null;
  try {
    const data = sessionStorage.getItem(SCROLL_KEY_PREFIX + key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveScrollState(key: string, state: ScrollState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SCROLL_KEY_PREFIX + key, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearScrollState(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SCROLL_KEY_PREFIX + key);
  } catch {
    // ignore
  }
}

/**
 * Returns the minimum height needed to restore scroll position
 */
export function useScrollRestoration(
  key: string,
  itemCount: number,
  isLoading: boolean
): { minHeight: number; isRestoring: boolean } {
  const hasRestoredRef = useRef(false);
  const userHasScrolledRef = useRef(false);
  const savedStateRef = useRef<ScrollState | null>(null);
  const keyRef = useRef(key);

  // Reset state when key changes
  useEffect(() => {
    if (keyRef.current !== key) {
      hasRestoredRef.current = false;
      userHasScrolledRef.current = false;
      savedStateRef.current = getScrollState(key);
      keyRef.current = key;
    }
  }, [key]);

  // Load saved state on mount
  useEffect(() => {
    savedStateRef.current = getScrollState(key);
  }, [key]);

  // Detect user scroll (abort restoration)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasRestoredRef.current) return;

    const handleUserScroll = () => {
      if (!hasRestoredRef.current) {
        userHasScrolledRef.current = true;
      }
    };

    window.addEventListener("wheel", handleUserScroll, { passive: true });
    window.addEventListener("touchmove", handleUserScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleUserScroll);
      window.removeEventListener("touchmove", handleUserScroll);
    };
  }, [key]);

  // Save scroll state on scroll (debounced)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (!hasRestoredRef.current) return;

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveScrollState(key, {
          position: window.scrollY,
          contentHeight: document.documentElement.scrollHeight,
          itemCount,
        });
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [key, itemCount]);

  // Restore scroll position
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasRestoredRef.current) return;
    if (userHasScrolledRef.current) return;
    if (isLoading) return;
    if (itemCount === 0) return;

    const saved = savedStateRef.current;

    // Only restore if we have saved state AND the item counts roughly match
    // This prevents restoring scroll for a different dataset
    if (saved && itemCount >= saved.itemCount) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: saved.position, behavior: "instant" });
          hasRestoredRef.current = true;
        });
      });
    } else {
      // No valid saved state or item count mismatch - mark as done
      hasRestoredRef.current = true;
      // Clear any stale scroll state for this key
      if (saved && itemCount < saved.itemCount) {
        clearScrollState(key);
      }
    }
  }, [key, itemCount, isLoading]);

  // Calculate minimum height only if we have matching saved state
  const saved = savedStateRef.current;
  const isRestoring = !hasRestoredRef.current && !userHasScrolledRef.current && !!saved;
  
  // Only apply minHeight if the saved item count matches current loading state
  // This prevents applying old height when loading a different dataset
  const shouldApplyHeight = isRestoring && saved && (itemCount === 0 || itemCount >= saved.itemCount);
  const minHeight = shouldApplyHeight ? saved.contentHeight : 0;

  return { minHeight, isRestoring };
}

export function clearScrollPosition(key: string): void {
  clearScrollState(key);
}