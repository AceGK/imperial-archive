// scripts/algolia/setup-series.ts
// Sets the index's search settings and creates its sort replicas.
// Run from the repo root: npx tsx scripts/algolia/setup-series.ts

import { env } from "node:process";
import { algoliasearch } from "algoliasearch";
import "./lib"; // loads the repo root's .env.local

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
          "authors.name",
          "factions.name",
          "era.name",
        ],
        attributesForFaceting: [
          "searchable(format)",
          "searchable(authors.name)",
          "searchable(factions.name)",
          "searchable(era.name)",
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
          "searchable(format)",
          "searchable(authors.name)",
          "searchable(factions.name)",
          "searchable(era.name)",
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