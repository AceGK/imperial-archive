// /apps/web/src/lib/sanity/sanity.client.ts
import { createClient } from "@sanity/client";
import { apiVersion, dataset, projectId } from "./sanity.config";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2025-01-01",
  useCdn: false,
  token: process.env.NEXT_PUBLIC_SANITY_API_READ_TOKEN,
  perspective: "published",
});

// Optional: authenticated client for preview/drafts
// export const previewClient = createClient({
//   projectId,
//   dataset,
//   apiVersion,
//   token: process.env.SANITY_API_READ_TOKEN, // requires “Viewer” or higher
//   useCdn: false,
//   perspective: 'previewDrafts',
// })
