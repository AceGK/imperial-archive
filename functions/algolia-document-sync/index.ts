// functions/algolia-document-sync/index.ts
// npx sanity blueprints deploy
import { env } from "node:process";
import { documentEventHandler } from "@sanity/functions";
import { algoliasearch } from "algoliasearch";
import { createClient } from "@sanity/client";
import { BOOK_REFS_QUERY, BOOKS_INDEX, bookRefsParams, toBookRecord } from "./record";

const {
  ALGOLIA_APP_ID = "",
  ALGOLIA_WRITE_API_KEY = "",
  SANITY_STUDIO_PROJECT_ID = "",
  SANITY_STUDIO_DATASET = "",
} = env;

const ALGOLIA_INDEX_NAME = BOOKS_INDEX;

export const handler = documentEventHandler(async ({ event, context }) => {
  const { _id, operation } = event.data;

  console.log("🚀 Function triggered for book:", _id, "Operation:", operation);

  const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  if (operation === "delete") {
    try {
      await algolia.deleteObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
      });
      console.log(`✅ Successfully deleted book ${_id} from Algolia`);
    } catch (error) {
      console.error("❌ Error deleting from Algolia:", error);
      throw error;
    }
  } else {
    try {
      const { title } = event.data;

      console.log("📦 Processing book:", _id);
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

      console.log("🔍 Fetching references by ID...");

      // the record is built in record.ts, shared with the full rebuild script
      const bookData = await sanityClient.fetch(BOOK_REFS_QUERY, bookRefsParams(event.data));

      console.log("  ✓ Query result:");
      console.log(JSON.stringify(bookData, null, 2));

      const document = toBookRecord(event.data, bookData);
      const { authors: processedAuthors, factions: processedFactions, era: processedEra, series: processedSeries, image: processedImage } = document;
      const limitedTitle = document.title;

      console.log("  ✓ Processed authors:", processedAuthors);
      console.log("  ✓ Processed factions:", processedFactions);
      console.log("  ✓ Processed era:", processedEra);
      console.log("  ✓ Processed series:", processedSeries);
      console.log("  ✓ Processed image:", processedImage);

      // Check document size
      const documentSize = JSON.stringify(document).length;
      if (documentSize > 9000) {
        console.warn(
          `⚠️  Book ${_id} is ${documentSize} bytes (close to 10KB limit)`
        );
      }

      // Log what we're sending
      console.log("\n📤 Sending to Algolia:");
      console.log("  - Title:", limitedTitle);
      console.log("  - Format:", document.format);
      console.log(
        "  - Authors:",
        processedAuthors.map((a) => a.name).join(", ") || "none"
      );
      console.log("  - Era:", processedEra?.name || "none");
      console.log(
        "  - Factions:",
        processedFactions.map((f) => f.name).join(", ") || "none"
      );
      console.log("  - Image:", processedImage.url ? "✓" : "✗");
      console.log("  - Series:", processedSeries.map((s) => s.title).join(", ") || "none");

      await algolia.addOrUpdateObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
        body: document,
      });

      console.log(`\n✅ Synced book ${_id} ("${limitedTitle}") to Algolia`);
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