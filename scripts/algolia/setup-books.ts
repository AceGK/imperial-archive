// scripts/algolia/setup-books.ts
// Sets the index's search settings and creates its sort replicas.
// Run from the repo root: npx tsx scripts/algolia/setup-books.ts

import { env } from "node:process";
import { algoliasearch } from "algoliasearch";
import "./lib"; // loads the repo root's .env.local

const { ALGOLIA_APP_ID = "", ALGOLIA_WRITE_API_KEY = "" } = env;
const ALGOLIA_INDEX_NAME = "books40k";

// What the catalog search box matches, most important first. Every index needs
// it: a replica without its own list searches every field, descriptions and all
const SEARCHABLE_ATTRIBUTES = [
  "title",
  "authors.name",
  "factions.name",
  "era.name",
  "series.title",
];

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
        searchableAttributes: SEARCHABLE_ATTRIBUTES,
        attributesForFaceting: [
          "searchable(format)",
          "searchable(authors.name)",
          "searchable(factions.name)",
          "searchable(era.name)",
          "searchable(series.title)",
        ],
        // ties after text relevance go to the newest book in Sanity, so the
        // unfiltered list (no search text) reads as "Recently Added"
        customRanking: ["desc(_createdAt)"],
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
        searchableAttributes: SEARCHABLE_ATTRIBUTES,
        attributesForFaceting: [
          "searchable(format)",
          "searchable(authors.name)",
          "searchable(factions.name)",
          "searchable(era.name)",
          "searchable(series.title)",
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
      },
    });

    // Configure replica: Title Z-A
    await client.setSettings({
      indexName: "books40k_title_desc",
      indexSettings: {
        searchableAttributes: SEARCHABLE_ATTRIBUTES,
        attributesForFaceting: [
          "searchable(format)",
          "searchable(authors.name)",
          "searchable(factions.name)",
          "searchable(era.name)",
          "searchable(series.title)",
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

    // Configure replica: Publication Date (Newest)
    await client.setSettings({
      indexName: "books40k_date_desc",
      indexSettings: {
        searchableAttributes: SEARCHABLE_ATTRIBUTES,
        attributesForFaceting: [
          "searchable(format)",
          "searchable(authors.name)",
          "searchable(factions.name)",
          "searchable(era.name)",
          "searchable(series.title)",
        ],
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

    // Configure replica: Publication Date (Oldest)
    await client.setSettings({
      indexName: "books40k_date_asc",
      indexSettings: {
        searchableAttributes: SEARCHABLE_ATTRIBUTES,
        attributesForFaceting: [
          "searchable(format)",
          "searchable(authors.name)",
          "searchable(factions.name)",
          "searchable(era.name)",
          "searchable(series.title)",
        ],
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

    console.log("\n🎉 All replicas configured successfully!");
    console.log("\nAvailable sort options:");
    console.log("  - books40k (default: relevance, then recently added)");
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
