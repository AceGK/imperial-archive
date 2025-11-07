// scripts/algolia-setup-replicas.ts
// Run: npx tsx scripts/algolia-setup-replicas.ts

import { env } from "node:process";
import path from "node:path";
import dotenv from "dotenv";
import { algoliasearch } from "algoliasearch";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const { ALGOLIA_APP_ID = "", ALGOLIA_WRITE_API_KEY = "" } = env;
const ALGOLIA_INDEX_NAME = "books40k";

async function setupReplicas() {
  console.log("🔧 Setting up Algolia index replicas for sorting...");

  if (!ALGOLIA_APP_ID || !ALGOLIA_WRITE_API_KEY) {
    console.error(
      "Missing required env: ALGOLIA_APP_ID / ALGOLIA_WRITE_API_KEY"
    );
    process.exit(1);
  }

  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  try {
    // Configure the main index
    await client.setSettings({
      indexName: ALGOLIA_INDEX_NAME,
      indexSettings: {
        searchableAttributes: [
          "title",
          "authors.name",
          "description",
          "factions.name",
          "era.name",
          "series.title",
        ],
        attributesForFaceting: [
          "searchable(format)",
          "searchable(authors.name)",
          "searchable(factions.name)",
          "searchable(era.name)",
          "searchable(series.title)",
        ],
        replicas: [
          "books40k_title_asc",
          "books40k_title_desc",
          "books40k_date_desc",
          "books40k_date_asc",
        ],
      },
    });

    console.log("✅ Main index configured");

    // Configure replica: Title A-Z
    await client.setSettings({
      indexName: "books40k_title_asc",
      indexSettings: {
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
      },
    });

    console.log("✅ Replica 'books40k_title_asc' configured");

    // Configure replica: Title Z-A
    await client.setSettings({
      indexName: "books40k_title_desc",
      indexSettings: {
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

    console.log("✅ Replica 'books40k_title_desc' configured");

    // Configure replica: Publication Date (Newest)
    await client.setSettings({
      indexName: "books40k_date_desc",
      indexSettings: {
        ranking: [
          "desc(publicationDate)",
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

    console.log("✅ Replica 'books40k_date_desc' configured");

    // Configure replica: Publication Date (Oldest)
    await client.setSettings({
      indexName: "books40k_date_asc",
      indexSettings: {
        ranking: [
          "asc(publicationDate)",
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

    console.log("✅ Replica 'books40k_date_asc' configured");

    console.log("\n🎉 All replicas configured successfully!");
    console.log("\nAvailable sort options:");
    console.log("  - books40k (default/relevance)");
    console.log("  - books40k_title_asc (Title A-Z)");
    console.log("  - books40k_title_desc (Title Z-A)");
    console.log("  - books40k_date_desc (Publication Date - Newest)");
    console.log("  - books40k_date_asc (Publication Date - Oldest)");
  } catch (error) {
    console.error("❌ Error setting up replicas:", error);
    process.exit(1);
  }
}

setupReplicas();
