import type { UiState } from "instantsearch.js";

// URL encoding/decoding utilities
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

// Sort mapping utilities
const SORT_TO_ROUTE_MAP: Record<string, string> = {
  "books40k_title_asc": "title-asc",
  "books40k_title_desc": "title-desc",
  "books40k_date_desc": "date-desc",
  "books40k_date_asc": "date-asc",
};

const ROUTE_TO_SORT_MAP: Record<string, string> = {
  "title-asc": "books40k_title_asc",
  "title-desc": "books40k_title_desc",
  "date-desc": "books40k_date_desc",
  "date-asc": "books40k_date_asc",
};

export const sortToRoute = (sortBy?: string): string | undefined => {
  if (!sortBy || sortBy === "books40k") return undefined;
  return SORT_TO_ROUTE_MAP[sortBy];
};

export const routeToSort = (route?: string): string | undefined => {
  if (!route) return undefined;
  return ROUTE_TO_SORT_MAP[route];
};

// Main routing configuration factory
export function createAlgoliaRouting(indexName: string = "books40k") {
  return {
    stateMapping: {
      stateToRoute(uiState: UiState) {
        const indexUiState = uiState[indexName] || {};
        
        return {
          q: indexUiState.query,
          format: encodeArray(indexUiState.refinementList?.format),
          author: encodeArray(indexUiState.refinementList?.["authors.name"]),
          faction: encodeArray(indexUiState.refinementList?.["factions.name"]),
          era: encodeArray(indexUiState.refinementList?.["era.name"]),
          series: encodeArray(indexUiState.refinementList?.["series.title"]),
          sort: sortToRoute(indexUiState.sortBy),
          page: indexUiState.page && indexUiState.page > 1 ? indexUiState.page : undefined,
        };
      },
      routeToState(routeState: any) {
        return {
          [indexName]: {
            query: routeState.q,
            refinementList: {
              ...(routeState.format && { format: decodeArray(routeState.format) }),
              ...(routeState.author && { "authors.name": decodeArray(routeState.author) }),
              ...(routeState.faction && { "factions.name": decodeArray(routeState.faction) }),
              ...(routeState.era && { "era.name": decodeArray(routeState.era) }),
              ...(routeState.series && { "series.title": decodeArray(routeState.series) }),
            },
            ...(routeState.sort && { sortBy: routeToSort(routeState.sort) }),
            ...(routeState.page && { page: parseInt(routeState.page, 10) }),
          },
        };
      },
    },
  };
}