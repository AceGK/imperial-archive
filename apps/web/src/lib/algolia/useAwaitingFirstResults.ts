// lib/algolia/useAwaitingFirstResults.ts
"use client";

import { useInstantSearch } from "react-instantsearch";

/**
 * True until a page's first search response arrives. Before then InstantSearch
 * holds placeholder ("artificial") results with no hits and no facets, which
 * must not be shown as "no results" or "0 results".
 */
export function useAwaitingFirstResults() {
  const { results } = useInstantSearch();
  return !results || (results as { __isArtificial?: boolean }).__isArtificial === true;
}
