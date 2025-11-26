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

export function createAlgoliaRouting(indexName: string) {
  const { toRoute, fromRoute } = createSortMaps(indexName);

  const sortToRoute = (sortBy?: string): string | undefined => {
    if (!sortBy || sortBy === indexName) return undefined;
    return toRoute[sortBy];
  };

  const routeToSort = (route?: string): string | undefined => {
    if (!route) return undefined;
    return fromRoute[route];
  };

  return {
    stateMapping: {
      stateToRoute(uiState: UiState) {
        const indexUiState = uiState[indexName] || {};
        const refinements = indexUiState.refinementList || {};

        const routeState: Record<string, string | undefined> = {
          q: indexUiState.query || undefined,
          sort: sortToRoute(indexUiState.sortBy),
        };

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
        const { q, sort, ...refinementParams } = routeState;

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
          },
        };
      },
    },
  };
}