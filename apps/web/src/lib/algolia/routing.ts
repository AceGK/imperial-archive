// lib/algolia/routing.ts
import type { UiState } from "instantsearch.js";

export const encodeValue = (value: string): string => {
  return value.replace(/ /g, "+").replace(/&/g, "and");
};

export const decodeValue = (encoded: string): string => {
  return encoded.replace(/\+/g, " ").replace(/\band\b/g, "&");
};

export const encodeArray = (values?: string[]): string | undefined => {
  if (!values || values.length === 0) return undefined;
  return values.map(encodeValue).join(",");
};

export const decodeArray = (encodedString?: string): string[] | undefined => {
  if (!encodedString) return undefined;
  return encodedString.split(",").map(decodeValue);
};

/**
 * The catalog page a `?page=` value asks for, 1 when it's missing or not a
 * whole number above 1. Pages are 1-based, as in the URL.
 */
export function parseCatalogPage(value?: string | string[] | null): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{1,4}$/.test(raw)) return 1;
  return Math.max(1, Number(raw));
}

// Bidirectional mapping between URL keys and Algolia attributes
const ATTRIBUTE_TO_URL_KEY: Record<string, string> = {
  "format": "format",
  "authors.name": "author",
  "series.title": "series",
  "factions.name": "faction",
  "era.name": "era",
};

// Generate reverse mapping
const URL_KEY_TO_ATTRIBUTE: Record<string, string> = Object.fromEntries(
  Object.entries(ATTRIBUTE_TO_URL_KEY).map(([attr, key]) => [key, attr])
);

// Generic sort mapping - builds maps from index name
function createSortMaps(indexName: string) {
  const suffixes = [
    "title_asc", "title_desc",
    "name_asc", "name_desc",
    "date_asc", "date_desc",
    "books_desc", "books_asc",
  ];

  const toRoute: Record<string, string> = {};
  const fromRoute: Record<string, string> = {};

  suffixes.forEach((suffix) => {
    const indexValue = `${indexName}_${suffix}`;
    const routeValue = suffix.replace("_", "-");
    toRoute[indexValue] = routeValue;
    fromRoute[routeValue] = indexValue;
  });

  return { toRoute, fromRoute };
}

/**
 * @param baseIndex the index the sort replicas are named after ("books40k")
 * @param indexName the index InstantSearch starts on, i.e. the default sort;
 *   when it's a replica, the base index gets its own `?sort=added` value
 */
export function createAlgoliaRouting(baseIndex: string, indexName: string = baseIndex) {
  const { toRoute, fromRoute } = createSortMaps(baseIndex);
  if (indexName !== baseIndex) {
    toRoute[baseIndex] = "added";
    fromRoute.added = baseIndex;
  }

  // InstantSearch leaves sortBy out of the state when it equals indexName
  const sortToRoute = (sortBy?: string): string | undefined => {
    if (!sortBy || sortBy === indexName) return undefined;
    return toRoute[sortBy];
  };

  const routeToSort = (route?: string): string | undefined => {
    if (!route) return undefined;
    return fromRoute[route];
  };

  // The page the catalog is on, as last written. The URL never carries it
  // (see stateToRoute), so when the router rewrites a landing URL like
  // ?page=3 to the bare path and reads it back, this keeps the reader on page 3
  // instead of jumping back to page 1 (which also left a gap in the list:
  // pages 1 and 3 with no page 2)
  let currentPage: number | undefined;

  return {
    stateMapping: {
      stateToRoute(uiState: UiState) {
        const indexUiState = uiState[indexName] || {};
        currentPage = indexUiState.page;
        const refinements = indexUiState.refinementList || {};

        const routeState: Record<string, string | undefined> = {
          q: indexUiState.query || undefined,
          sort: sortToRoute(indexUiState.sortBy),
        };
        // the page is left out on purpose: "Load more" appends results in
        // place, so the URL stays on the list the reader started from

        // Convert attributes to URL keys using the mapping
        Object.entries(refinements).forEach(([attr, values]) => {
          if (values && values.length > 0) {
            const urlKey = ATTRIBUTE_TO_URL_KEY[attr] || attr;
            routeState[urlKey] = encodeArray(values);
          }
        });

        return routeState;
      },

      routeToState(routeState: Record<string, string | undefined>): UiState {
        // `page` is read but never written back (see stateToRoute): it's only
        // there so crawlable "Load more" links (?page=2) render that page
        const { q, sort, page, ...refinementParams } = routeState;
        const pageNumber = page ? parseCatalogPage(page) : (currentPage ?? 1);

        const refinementList: Record<string, string[]> = {};

        Object.entries(refinementParams).forEach(([urlKey, value]) => {
          if (value) {
            const attribute = URL_KEY_TO_ATTRIBUTE[urlKey] || urlKey;
            const decoded = decodeArray(value);
            if (decoded) {
              refinementList[attribute] = decoded;
            }
          }
        });

        return {
          [indexName]: {
            query: q || "",
            refinementList,
            ...(sort && { sortBy: routeToSort(sort) }),
            ...(pageNumber > 1 && { page: pageNumber }),
          },
        };
      },
    },
  };
}