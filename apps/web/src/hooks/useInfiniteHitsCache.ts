// hooks/useInfiniteHitsCache.ts
"use client";

import { useEffect } from "react";
import { createInfiniteHitsSessionStorageCache } from "instantsearch.js/es/lib/infiniteHitsCache";
import type { InfiniteHitsCache } from "instantsearch.js/es/connectors/infinite-hits/connectInfiniteHits";
import type { BaseHit } from "instantsearch.js";

// Set once the app has hydrated. Until then the cache stays empty, so the
// first client render matches the server-rendered results.
let hydrated = false;

// One cache object per key, created once and never replaced: handing
// useInfiniteHits a different cache object resets the list and re-runs the
// search, which blanked the server-rendered results right after hydration
const cacheStore = new Map<string, InfiniteHitsCache<BaseHit>>();

function createHydrationSafeCache(): InfiniteHitsCache<BaseHit> {
  let storage: InfiniteHitsCache<BaseHit> | undefined;
  const active = () => {
    if (!hydrated || typeof window === "undefined") return undefined;
    return (storage ??= createInfiniteHitsSessionStorageCache() as unknown as InfiniteHitsCache<BaseHit>);
  };

  return {
    read: (args) => active()?.read(args) ?? null,
    write: (args) => active()?.write(args),
  };
}

/**
 * sessionStorage cache for useInfiniteHits, so "Load more" pages survive
 * back/forward navigation
 * @param key - Unique key for the cache (typically the index name)
 */
export function useInfiniteHitsCache<THit extends BaseHit>(key: string): InfiniteHitsCache<THit> {
  useEffect(() => {
    hydrated = true;
  }, []);

  if (!cacheStore.has(key)) cacheStore.set(key, createHydrationSafeCache());
  return cacheStore.get(key) as unknown as InfiniteHitsCache<THit>;
}
