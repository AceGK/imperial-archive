// /lib/40k-series.ts
import fs from "fs";
import path from "path";

export type SeriesItem = {
  name: string;
  slug: string;
};

// Absolute path to the JSON file no matter where called from
const seriesFile = path.join(process.cwd(), "/data/40k-series.json");

/**
 * Load & parse the series JSON file.
 * This runs on the server — safe in Next.js App Router.
 */
export function getAllSeries(): SeriesItem[] {
  const raw = fs.readFileSync(seriesFile, "utf-8");
  return JSON.parse(raw);
}

/**
 * Async version (same API shape as fetching from Sanity later).
 */
export async function getAllSeriesAsync(): Promise<SeriesItem[]> {
  return getAllSeries();
}

/**
 * Lookup by slug
 */
export function findSeriesBySlug(slug: string): SeriesItem | undefined {
  return getAllSeries().find((s) => s.slug === slug);
}

/**
 * Lightweight search for future autocomplete / filter UI
 */
export function searchSeries(query: string): SeriesItem[] {
  const q = query.toLowerCase();
  return getAllSeries().filter((s) => s.name.toLowerCase().includes(q));
}
