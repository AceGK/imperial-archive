// /apps/web/src/lib/sanity/sanity.client.ts
// Server only: the build fails if a client component imports this, so the
// read token can never reach the browser.
import "server-only";
import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2025-01-01",
  useCdn: true,
  // Viewer token, needed once the dataset is private; must not be NEXT_PUBLIC_
  token: process.env.SANITY_API_READ_TOKEN,
  perspective: "published",
  // Next.js only caches fetches that ask to be cached: without this every page
  // render queried Sanity. Now each query is reused for 60s, however much
  // traffic (or bot traffic) arrives, matching the pages' revalidate time.
  fetch: { next: { revalidate: 60 } },
});
