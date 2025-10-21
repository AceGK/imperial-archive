import { createClient } from "@sanity/client";
import { apiVersion, dataset, projectId } from "./sanity.config";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
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
