// app/api/search-shortcuts/route.ts
// The authors, series, factions and eras the nav search matches in the browser.
// Loaded when a reader first opens the nav search rather than with every page,
// and rebuilt from Sanity at most once a minute.
import { NextResponse } from "next/server";
import { getSearchShortcuts } from "@/lib/searchShortcuts";

export const revalidate = 60;

export async function GET() {
  const shortcuts = await getSearchShortcuts();
  return NextResponse.json(shortcuts);
}
