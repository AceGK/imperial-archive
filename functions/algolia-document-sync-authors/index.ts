// functions/algolia-document-sync-authors/index.ts
// npx sanity blueprints deploy
import { env } from "node:process";
import { documentEventHandler } from "@sanity/functions";
import { algoliasearch } from "algoliasearch";
import { createClient } from "@sanity/client";
import { AUTHOR_DATA_QUERY, AUTHORS_INDEX, toAuthorRecord } from "./record";

const {
  ALGOLIA_APP_ID = "",
  ALGOLIA_WRITE_API_KEY = "",
  SANITY_STUDIO_PROJECT_ID = "",
  SANITY_STUDIO_DATASET = "",
} = env;

const ALGOLIA_INDEX_NAME = AUTHORS_INDEX;

export const handler = documentEventHandler(async ({ event, context }) => {
  const { _id, operation } = event.data;

  console.log("🚀 Function triggered for author:", _id, "Operation:", operation);

  const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  if (operation === "delete") {
    try {
      await algolia.deleteObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
      });
      console.log(`✅ Successfully deleted author ${_id} from Algolia`);
    } catch (error) {
      console.error("❌ Error deleting from Algolia:", error);
      throw error;
    }
  } else {
    try {
      const { name, bio } = event.data;

      console.log("📦 Processing author:", _id);
      console.log("  - Name:", name);

      const sanityClient = createClient({
        projectId: SANITY_STUDIO_PROJECT_ID,
        dataset: SANITY_STUDIO_DATASET,
        apiVersion: "2024-01-01",
        useCdn: false,
        // the runtime's credential lives in clientOptions; needed now the dataset is private
        token: context.clientOptions.token,
      });

      console.log("🔍 Fetching author's books and aggregating data...");

      // the record is built in record.ts, shared with the full rebuild script
      const authorData = await sanityClient.fetch(AUTHOR_DATA_QUERY, {
        authorId: _id,
        bio: bio || null,
      });

      console.log("  ✓ Found books:", authorData?.books?.length || 0);

      const document = toAuthorRecord(event.data, authorData?.books, authorData?.bioText);
      const processedImage = document.image;
      const processedBio = document.bio;

      console.log("  ✓ Aggregated data:");
      console.log("    - Formats:", document.format.join(", ") || "none");
      console.log("    - Series:", document["series.title"].join(", ") || "none");
      console.log("    - Factions:", document["factions.name"].join(", ") || "none");
      console.log("    - Eras:", document["era.name"].join(", ") || "none");
      console.log("  ✓ Processed image:", processedImage.asset?._ref ? "✓" : "✗");

      const documentSize = JSON.stringify(document).length;
      if (documentSize > 9000) {
        console.warn(
          `⚠️  Author ${_id} is ${documentSize} bytes (close to 10KB limit)`
        );
      }

      console.log("\n📤 Sending to Algolia:");
      console.log("  - Name:", document.name);
      console.log("  - Last Name:", document.lastName);
      console.log("  - Slug:", document.slug);
      console.log("  - Book count:", document.bookCount);
      console.log("  - Formats:", document.format.join(", ") || "none");
      console.log("  - Series:", document["series.title"].join(", ") || "none");
      console.log("  - Factions:", document["factions.name"].join(", ") || "none");
      console.log("  - Eras:", document["era.name"].join(", ") || "none");
      console.log("  - Image:", processedImage.asset?._ref ? "✓" : "✗");
      console.log("  - Bio length:", processedBio.length, "chars");

      await algolia.addOrUpdateObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
        body: document,
      });

      console.log(`\n✅ Synced author ${_id} ("${document.name}") to Algolia`);
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