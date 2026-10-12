// lib/algolia/search.ts
// InstantSearch's search client. Browsers send searches through /api/search,
// where identical requests are served from Vercel's CDN cache and the Algolia
// key stays on the server. Server-side renders call Algolia directly.
//
// ALGOLIA_APP_ID and ALGOLIA_SEARCH_API_KEY must stay non-NEXT_PUBLIC: Next.js
// never ships other env vars to the browser, so the key can't leak from here.
import type { SearchClient } from "instantsearch.js";

export type SearchRequest = {
  indexName: string;
  type?: "default" | "facet";
  facet?: string;
  params?: Record<string, unknown>;
};

type SearchResponse = { results: unknown[] };
type SearchInput = SearchRequest[] | { requests: SearchRequest[] };

/** How long a search result is reused before Algolia is asked again */
export const CACHE_SECONDS = 3600;

const INDEX_PATTERN = /^(books40k|authors40k|series40k)(_[a-z]+)*$/;
const MAX_REQUESTS = 10;
const MAX_HITS_PER_PAGE = 50;
// Every distinct query is a fresh Algolia call, so oversized or deep-paged
// requests are trimmed rather than rejected (they can arrive from page URLs
// during server rendering, where an error would break the page)
const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 100;

const toRequests = (input: SearchInput) => (Array.isArray(input) ? input : input.requests);

/** Checks search requests from the browser; null when anything looks wrong */
export function validateRequests(input: unknown): SearchRequest[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_REQUESTS) return null;

  const requests: SearchRequest[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const { indexName, type, facet, params } = item as Record<string, unknown>;

    if (typeof indexName !== "string" || !INDEX_PATTERN.test(indexName)) return null;
    if (type !== undefined && type !== "default" && type !== "facet") return null;
    if (facet !== undefined && typeof facet !== "string") return null;
    if (params !== undefined && (typeof params !== "object" || params === null || Array.isArray(params))) return null;

    const safeParams = { ...(params as Record<string, unknown> | undefined) };
    if (typeof safeParams.hitsPerPage === "number") {
      safeParams.hitsPerPage = Math.min(safeParams.hitsPerPage, MAX_HITS_PER_PAGE);
    }
    for (const key of ["query", "facetQuery"]) {
      if (typeof safeParams[key] === "string") {
        safeParams[key] = (safeParams[key] as string).slice(0, MAX_QUERY_LENGTH);
      }
    }
    if (typeof safeParams.page === "number") {
      safeParams.page = Math.min(Math.max(0, Math.floor(safeParams.page)), MAX_PAGE);
    }
    // offset/length paging would sidestep the page and hitsPerPage caps;
    // InstantSearch doesn't use them
    delete safeParams.offset;
    delete safeParams.length;
    requests.push({ indexName, type, facet, params: safeParams });
  }
  return requests;
}

// Algolia's REST API takes each request's parameters as a query string
function toParamString(params: Record<string, unknown> = {}) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      const text = typeof value === "object" ? JSON.stringify(value) : String(value);
      return `${encodeURIComponent(key)}=${encodeURIComponent(text)}`;
    })
    .join("&");
}

/** Server only: sends validated requests to Algolia, reusing identical results for CACHE_SECONDS */
export async function searchAlgolia(requests: SearchRequest[]): Promise<SearchResponse> {
  const appId = process.env.ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_SEARCH_API_KEY;
  if (!appId || !apiKey) {
    throw new Error("Algolia isn't configured: set ALGOLIA_APP_ID and ALGOLIA_SEARCH_API_KEY");
  }

  const res = await fetch(`https://${appId}-dsn.algolia.net/1/indexes/*/queries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Algolia-Application-Id": appId,
      "X-Algolia-API-Key": apiKey,
    },
    body: JSON.stringify({
      requests: requests.map(({ indexName, type, facet, params }) => ({
        indexName,
        ...(type === "facet" ? { type, facet } : {}),
        params: toParamString(params),
      })),
    }),
    next: { revalidate: CACHE_SECONDS },
  });

  if (!res.ok) throw new Error(`Algolia search failed (${res.status})`);
  return res.json();
}

// Repeat searches in the same visit (back/forward, re-renders) reuse the response
const browserCache = new Map<string, Promise<SearchResponse>>();

function search(input: SearchInput): Promise<SearchResponse> {
  const requests = toRequests(input);

  if (typeof window === "undefined") {
    const valid = validateRequests(requests);
    if (!valid) return Promise.reject(new Error("Invalid search request"));
    return searchAlgolia(valid);
  }

  const key = JSON.stringify(requests);
  const cached = browserCache.get(key);
  if (cached) return cached;

  const pending = fetch(`/api/search?r=${encodeURIComponent(key)}`).then((res) => {
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    return res.json() as Promise<SearchResponse>;
  });
  browserCache.set(key, pending);
  pending.catch(() => browserCache.delete(key));
  return pending;
}

export const searchClient = { search } as unknown as SearchClient;

const emptyResult = (request: SearchRequest) => ({
  hits: [],
  nbHits: 0,
  nbPages: 0,
  page: 0,
  hitsPerPage: (request.params?.hitsPerPage as number | undefined) ?? 0,
  processingTimeMS: 0,
  exhaustiveNbHits: true,
  query: "",
  params: "",
  index: request.indexName,
});

/**
 * A search client that answers empty searches itself, for search boxes that
 * show nothing until the reader types
 */
export const typedOnlySearchClient = {
  search(input: SearchInput) {
    const requests = toRequests(input);
    const allEmpty = requests.every((r) => r.type !== "facet" && !String(r.params?.query ?? "").trim());
    if (allEmpty) return Promise.resolve({ results: requests.map(emptyResult) });
    return search(input);
  },
} as unknown as SearchClient;
