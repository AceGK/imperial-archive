// hooks/useInfiniteHitsCache.ts
"use client";

import { useState, useEffect } from "react";
import { createInfiniteHitsSessionStorageCache } from "instantsearch.js/es/lib/infiniteHitsCache";
import type { InfiniteHitsCache } from "instantsearch.js/es/connectors/infinite-hits/connectInfiniteHits";
import type { BaseHit } from "instantsearch.js";

// Store caches by key to allow different caches for different indexes
const cacheStore = new Map<string, InfiniteHitsCache<any>>();

function getCache<THit extends BaseHit>(key: string): InfiniteHitsCache<THit> | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  
  if (!cacheStore.has(key)) {
    cacheStore.set(
      key,
      createInfiniteHitsSessionStorageCache() as unknown as InfiniteHitsCache<THit>
    );
  }
  
  return cacheStore.get(key) as InfiniteHitsCache<THit>;
}

/**
 * Hook that provides a hydration-safe sessionStorage cache for useInfiniteHits
 * @param key - Unique key for the cache (typically the index name)
 * @returns Cache object to pass to useInfiniteHits, undefined during SSR/hydration
 */
export function useInfiniteHitsCache<THit extends BaseHit>(
  key: string
): InfiniteHitsCache<THit> | undefined {
  const [cache, setCache] = useState<InfiniteHitsCache<THit> | undefined>(undefined);

  useEffect(() => {
    setCache(getCache<THit>(key));
  }, [key]);

  return cache;
}