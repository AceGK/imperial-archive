// scripts/algolia/setup-authors.ts
// Sets the index's search settings and creates its sort replicas.
// Run from the repo root: npx tsx scripts/algolia/setup-authors.ts

import { env } from "node:process";
import { algoliasearch } from "algoliasearch";
import "./lib"; // loads the repo root's .env.local

const { ALGOLIA_APP_ID = "", ALGOLIA_WRITE_API_KEY = "" } = env;
const ALGOLIA_INDEX_NAME = "authors40k";

async function setupReplicas() {
  console.log("🔧 Setting up Algolia index replicas for authors sorting...");

  if (!ALGOLIA_APP_ID || !ALGOLIA_WRITE_API_KEY) {
    console.error(
      "Missing required env: ALGOLIA_APP_ID / ALGOLIA_WRITE_API_KEY"
    );
    process.exit(1);
  }

  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  try {
    // Configure the main index with consistent field names
    await client.setSettings({
      indexName: ALGOLIA_INDEX_NAME,
      indexSettings: {
        searchableAttributes: [
          "name",
          "lastName",
          "series.title",
          "factions.name",
          "era.name",
        ],
        attributesForFaceting: [
          "searchable(format)",
          "searchable(series.title)",
          "searchable(factions.name)",
          "searchable(era.name)",
          "bookCount",
        ],
        ranking: [
          "asc(lastName)",
          "asc(name)",
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
          "authors40k_name_desc",
          "authors40k_bookcount_desc",
          "authors40k_bookcount_asc",
        ],
      },
    });

    console.log("✅ Main index configured");

    // Configure replica: Name Z-A
    await client.setSettings({
      indexName: "authors40k_name_desc",
      indexSettings: {
        attributesForFaceting: [
          "searchable(format)",
          "searchable(series.title)",
          "searchable(factions.name)",
          "searchable(era.name)",
          "bookCount",
        ],
        ranking: [
          "desc(lastName)",
          "desc(name)",
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

    // Configure replica: Book Count (Most Works)
    await client.setSettings({
      indexName: "authors40k_bookcount_desc",
      indexSettings: {
        attributesForFaceting: [
          "searchable(format)",
          "searchable(series.title)",
          "searchable(factions.name)",
          "searchable(era.name)",
          "bookCount",
        ],
        ranking: [
          "desc(bookCount)",
          "asc(lastName)",
          "asc(name)",
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

    // Configure replica: Book Count (Fewest Works)
    await client.setSettings({
      indexName: "authors40k_bookcount_asc",
      indexSettings: {
        attributesForFaceting: [
          "searchable(format)",
          "searchable(series.title)",
          "searchable(factions.name)",
          "searchable(era.name)",
          "bookCount",
        ],
        ranking: [
          "asc(bookCount)",
          "asc(lastName)",
          "asc(name)",
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
    console.log("  - authors40k (default: Last Name A-Z)");
    console.log("  - authors40k_name_desc (Last Name Z-A)");
    console.log("  - authors40k_bookcount_desc (Most Works)");
    console.log("  - authors40k_bookcount_asc (Fewest Works)");
  } catch (error) {
    console.error("❌ Error setting up replicas:", error);
    process.exit(1);
  }
}

setupReplicas();