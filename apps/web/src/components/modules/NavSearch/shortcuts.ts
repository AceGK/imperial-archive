// Authors, series, factions and eras for the nav search, fetched once per visit
// the first time a reader goes to search (the nav button preloads them on hover)
import { useEffect, useState } from "react";
import type { SearchShortcut } from "@/components/modules/Search/types";

let pending: Promise<SearchShortcut[]> | null = null;

export function loadShortcuts(): Promise<SearchShortcut[]> {
  pending ??= fetch("/api/search-shortcuts")
    .then((res) => (res.ok ? (res.json() as Promise<SearchShortcut[]>) : Promise.reject(res.status)))
    .catch(() => {
      // books still come from Algolia; try again on the next search
      pending = null;
      return [];
    });
  return pending;
}

/** The shortcuts once `enabled` turns on; empty until they arrive */
export function useShortcuts(enabled: boolean): SearchShortcut[] {
  const [shortcuts, setShortcuts] = useState<SearchShortcut[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    loadShortcuts().then((s) => {
      if (live) setShortcuts(s);
    });
    return () => {
      live = false;
    };
  }, [enabled]);

  return shortcuts;
}
