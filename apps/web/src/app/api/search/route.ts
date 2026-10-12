// app/api/search/route.ts
// Search proxy for InstantSearch: keeps the Algolia key on the server, and lets
// Vercel's CDN answer repeat searches (default lists, popular queries) without
// calling Algolia. Requests come in as GET so the CDN can cache them.
import { NextResponse, type NextRequest } from "next/server";
import { CACHE_SECONDS, searchAlgolia, validateRequests } from "@/lib/algolia/search";

const MAX_QUERY_LENGTH = 6000;

const error = (message: string, status: number) =>
  NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("r");
  if (!raw || raw.length > MAX_QUERY_LENGTH) return error("Bad request", 400);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return error("Bad request", 400);
  }

  const requests = validateRequests(parsed);
  if (!requests) return error("Bad request", 400);

  try {
    const data = await searchAlgolia(requests);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
      },
    });
  } catch (err) {
    console.error(err);
    return error("Search is unavailable", 502);
  }
}
