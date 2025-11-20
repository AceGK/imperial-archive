// scripts/series/algolia-setup-replicas-series.ts
// Run: npx tsx scripts/series/algolia-setup-replicas-series.ts

import { env } from "node:process";
import path from "node:path";
import dotenv from "dotenv";
import { algoliasearch } from "algoliasearch";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const { ALGOLIA_APP_ID = "", ALGOLIA_WRITE_API_KEY = "" } = env;
const ALGOLIA_INDEX_NAME = "series40k";

async function setupReplicas() {
  console.log("🔧 Setting up Algolia index replicas for series sorting...");

  if (!ALGOLIA_APP_ID || !ALGOLIA_WRITE_API_KEY) {
    console.error(
      "Missing required env: ALGOLIA_APP_ID / ALGOLIA_WRITE_API_KEY"
    );
    process.exit(1);
  }

  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  try {
    // Configure the main index with default A-Z sorting
    await client.setSettings({
      indexName: ALGOLIA_INDEX_NAME,
      indexSettings: {
        searchableAttributes: [
          "title",
          "subtitle",
          "authorNames",
          "factionNames",
          "eraNames",
        ],
        attributesForFaceting: [
          "searchable(bookFormats)",
          "searchable(authorNames)",
          "searchable(factionNames)",
          "searchable(eraNames)",
          "bookCount",
        ],
        ranking: [
          "asc(title)",
          "typo",
          "geo",
          "words",
          "filters",
          "proximity",
          "attribute",
          "exact",
          "custom",
        ],
        replicas: [
          "series40k_title_desc",
        ],
      },
    });

    console.log("✅ Main index configured");

    // Configure replica: Title Z-A
    await client.setSettings({
      indexName: "series40k_title_desc",
      indexSettings: {
        attributesForFaceting: [
          "searchable(bookFormats)",
          "searchable(authorNames)",
          "searchable(factionNames)",
          "searchable(eraNames)",
          "bookCount",
        ],
        ranking: [
          "desc(title)",
          "typo",
          "geo",
          "words",
          "filters",
          "proximity",
          "attribute",
          "exact",
          "custom",
        ],
      },
    });

    console.log("\n🎉 All replicas configured successfully!");
    console.log("\nAvailable sort options:");
    console.log("  - series40k (default: Title A-Z)");
    console.log("  - series40k_title_desc (Title Z-A)");
  } catch (error) {
    console.error("❌ Error setting up replicas:", error);
    process.exit(1);
  }
}

setupReplicas();