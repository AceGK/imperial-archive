// functions/algolia-document-sync-series/index.ts
// npx sanity blueprints deploy
import { env } from "node:process";
import { documentEventHandler } from "@sanity/functions";
import { algoliasearch } from "algoliasearch";
import { createClient } from "@sanity/client";
import { SERIES_DATA_QUERY, SERIES_INDEX, toSeriesRecord } from "./record";

const {
  ALGOLIA_APP_ID = "",
  ALGOLIA_WRITE_API_KEY = "",
  SANITY_STUDIO_PROJECT_ID = "",
  SANITY_STUDIO_DATASET = "",
} = env;

const ALGOLIA_INDEX_NAME = SERIES_INDEX;

const BOOKS_INDEX_NAME = "books40k";

type SanityClient = ReturnType<typeof createClient>;
type Algolia = ReturnType<typeof algoliasearch>;

/** Books the books index currently lists under this series title (including any just removed from it) */
async function booksListedUnder(algolia: Algolia, title: string | undefined): Promise<string[]> {
  if (!title) return [];
  try {
    const res = await algolia.searchSingleIndex({
      indexName: BOOKS_INDEX_NAME,
      searchParams: {
        query: "",
        facetFilters: [[`series.title:${title}`]],
        hitsPerPage: 1000,
        attributesToRetrieve: [],
      },
    });
    return res.hits.map((h) => h.objectID);
  } catch (error) {
    // only removed books depend on this; members are refreshed regardless
    console.warn("  ⚠️  Couldn't look up books listed under this series:", error);
    return [];
  }
}

/**
 * Rewrites the series list on each book's record, from Sanity. A book's
 * series live on the series documents, so editing a series doesn't trigger
 * the book sync; this keeps the books index in step.
 */
async function refreshBookSeries(algolia: Algolia, sanityClient: SanityClient, bookIds: string[]) {
  const ids = [...new Set(bookIds)];
  if (ids.length === 0) return;
  const books: { _id: string; series: { title: string; slug: string }[] }[] = await sanityClient.fetch(
    `*[_type == "book40k" && _id in $ids && !(_id in path("drafts.**"))]{
      _id,
      "series": *[_type == "series40k" && !(_id in path("drafts.**")) && ^._id in lists[].items[].work._ref] | order(title asc){
        title,
        "slug": slug.current
      }
    }`,
    { ids }
  );
  await algolia.partialUpdateObjects({
    indexName: BOOKS_INDEX_NAME,
    // only books already in the index; the book sync creates records
    createIfNotExists: false,
    objects: books.map((b) => ({
      objectID: b._id,
      series: (b.series || []).filter((x) => x?.title && x?.slug),
    })),
  });
  console.log(`  ✓ Refreshed the series on ${books.length} book record(s)`);
}

export const handler = documentEventHandler(async ({ event, context }) => {
  const { _id, operation } = event.data;

  console.log("🚀 Function triggered for series:", _id, "Operation:", operation);

  const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  if (operation === "delete") {
    try {
      await algolia.deleteObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
      });
      console.log(`✅ Successfully deleted series ${_id} from Algolia`);

      // the deleted series' books lose it from their records
      const sanityClient = createClient({
        projectId: SANITY_STUDIO_PROJECT_ID,
        dataset: SANITY_STUDIO_DATASET,
        apiVersion: "2024-01-01",
        useCdn: false,
        token: context.clientOptions.token,
      });
      await refreshBookSeries(algolia, sanityClient, await booksListedUnder(algolia, event.data.title));
    } catch (error) {
      console.error("❌ Error deleting from Algolia:", error);
      throw error;
    }
  } else {
    try {
      const { title } = event.data;

      console.log("📦 Processing series:", _id);
      console.log("  - Title:", title);

      // Create Sanity client
      const sanityClient = createClient({
        projectId: SANITY_STUDIO_PROJECT_ID,
        dataset: SANITY_STUDIO_DATASET,
        apiVersion: "2024-01-01",
        useCdn: false,
        // the runtime's credential lives in clientOptions; needed now the dataset is private
        token: context.clientOptions.token,
      });

      console.log("🔍 Fetching series books and aggregating data...");

      // the record is built in record.ts, shared with the full rebuild script
      const seriesData = await sanityClient.fetch(SERIES_DATA_QUERY, { seriesId: _id });
      const books = seriesData?.books || [];

      console.log("  ✓ Found books:", books.length);

      const document = toSeriesRecord(event.data, books);
      const processedImage = document.image;

      console.log("  ✓ Aggregated data:");
      console.log("    - Formats:", document.format.join(", ") || "none");
      console.log("    - Authors:", document["authors.name"].join(", ") || "none");
      console.log("    - Factions:", document["factions.name"].join(", ") || "none");
      console.log("    - Eras:", document["era.name"].join(", ") || "none");
      console.log("  ✓ Processed image:", processedImage.asset?._ref ? "✓" : "✗");

      // Check document size
      const documentSize = JSON.stringify(document).length;
      if (documentSize > 9000) {
        console.warn(
          `⚠️  Series ${_id} is ${documentSize} bytes (close to 10KB limit)`
        );
      }

      // Log what we're sending
      console.log("\n📤 Sending to Algolia:");
      console.log("  - Title:", document.title);
      console.log("  - Slug:", document.slug);
      console.log("  - Book count:", document.bookCount);
      console.log("  - Formats:", document.format.join(", ") || "none");
      console.log("  - Authors:", document["authors.name"].join(", ") || "none");
      console.log("  - Factions:", document["factions.name"].join(", ") || "none");
      console.log("  - Eras:", document["era.name"].join(", ") || "none");
      console.log("  - Image:", processedImage.asset?._ref ? "✓" : "✗");

      await algolia.addOrUpdateObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
        body: document,
      });

      console.log(`\n✅ Synced series ${_id} ("${document.title}") to Algolia`);

      // its books: current members, and any the books index still lists under it
      const memberIds: string[] = books.map((b: any) => b._id).filter(Boolean);
      await refreshBookSeries(algolia, sanityClient, [...memberIds, ...(await booksListedUnder(algolia, title))]);
    } catch (error) {
      console.error("\n❌ Error syncing to Algolia:");
      console.error("Error:", error);
      if (error instanceof Error) {
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
      }
      throw error;
    }
  }
});