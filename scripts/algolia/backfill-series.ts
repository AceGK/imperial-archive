// scripts/algolia/backfill-series.ts
//
// Rewrites the series fields in Algolia from Sanity, listing every series a
// record belongs to:
// - books40k: `series`, each series the book is in
// - authors40k: `series.title` / `series.slug`, each series any of their books is in
// Run it after deploying the sync changes that store all series, or whenever
// the indexes drift. Only those fields are touched; records missing from an
// index are skipped.
//
//   npx tsx scripts/algolia/backfill-series.ts           preview what would change
//   npx tsx scripts/algolia/backfill-series.ts --write   apply it
//
// Reads ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY, ALGOLIA_SEARCH_API_KEY,
// SANITY_STUDIO_PROJECT_ID, SANITY_STUDIO_DATASET and SANITY_API_TOKEN from .env.local.
import type { createClient } from "@sanity/client";
import { algoliasearch } from "algoliasearch";
import { seriesOf } from "../../functions/algolia-document-sync/record";
import { algoliaWriter, need, sanityClient } from "./lib";

const write = process.argv.includes("--write");

type Series = { title: string; slug: string };
type Algolia = ReturnType<typeof algoliasearch>;

// the same series list the book sync stores
const SERIES_OF = seriesOf("^._id");

const valid = (series: Series[] | null) => (series || []).filter((s) => s?.title && s?.slug);
const sameSet = (a: unknown[], b: unknown[]) =>
  a.length === b.length && [...a].map(String).sort().join("|") === [...b].map(String).sort().join("|");

/** Each record's current fields, keyed by objectID; ids missing from the index are left out */
async function currentRecords(reader: Algolia, indexName: string, ids: string[], attributes: string[]) {
  const found = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < ids.length; i += 1000) {
    const batch = ids.slice(i, i + 1000);
    const { results } = await reader.getObjects({
      requests: batch.map((objectID) => ({ indexName, objectID, attributesToRetrieve: attributes })),
    });
    results.forEach((r: any, j) => {
      if (r) found.set(batch[j], r);
    });
  }
  return found;
}

type Change = { objectID: string; name: string; before: string; after: string; update: Record<string, unknown> };

async function bookChanges(sanity: ReturnType<typeof createClient>, reader: Algolia): Promise<Change[]> {
  const books: { _id: string; title: string; series: Series[] }[] = await sanity.fetch(
    `*[_type == "book40k" && !(_id in path("drafts.**"))]{ _id, title, "series": ${SERIES_OF} }`
  );
  const current = await currentRecords(reader, "books40k", books.map((b) => b._id), ["series"]);
  console.log(`books40k: ${books.length} books in Sanity, ${current.size} in the index`);

  return books.flatMap((b) => {
    const record = current.get(b._id);
    if (!record) return [];
    const series = valid(b.series);
    const was = record.series;
    const wasList = (Array.isArray(was) ? was : was ? [was] : []) as Series[];
    if (sameSet(wasList.map((s) => s?.slug), series.map((s) => s.slug))) return [];
    return [
      {
        objectID: b._id,
        name: b.title,
        before: wasList.map((s) => s?.title).join(", ") || "none",
        after: series.map((s) => s.title).join(", ") || "none",
        update: { objectID: b._id, series },
      },
    ];
  });
}

async function authorChanges(sanity: ReturnType<typeof createClient>, reader: Algolia): Promise<Change[]> {
  // as the author sync builds it: the series of every published book that references the author
  const authors: { _id: string; name: string; series: Series[] }[] = await sanity.fetch(
    `*[_type == "author40k" && !(_id in path("drafts.**"))]{
      _id,
      "name": coalesce(name, title),
      "series": *[_type == "series40k" && !(_id in path("drafts.**")) &&
        count(*[_type == "book40k" && !(_id in path("drafts.**")) && references(^.^._id) && _id in ^.lists[].items[].work._ref]) > 0
      ] | order(title asc){ title, "slug": slug.current }
    }`
  );
  const current = await currentRecords(reader, "authors40k", authors.map((a) => a._id), ["series.title", "series.slug"]);
  console.log(`authors40k: ${authors.length} authors in Sanity, ${current.size} in the index`);

  return authors.flatMap((a) => {
    const record = current.get(a._id);
    if (!record) return [];
    const series = valid(a.series);
    const titles = series.map((s) => s.title);
    const slugs = series.map((s) => s.slug);
    const wasTitles = (record["series.title"] as string[] | undefined) ?? [];
    const wasSlugs = (record["series.slug"] as string[] | undefined) ?? [];
    if (sameSet(wasSlugs, slugs) && sameSet(wasTitles, titles)) return [];
    return [
      {
        objectID: a._id,
        name: a.name,
        before: wasTitles.join(", ") || "none",
        after: titles.join(", ") || "none",
        update: { objectID: a._id, "series.title": titles, "series.slug": slugs },
      },
    ];
  });
}

async function main() {
  const sanity = sanityClient();
  const reader = algoliasearch(need("ALGOLIA_APP_ID"), need("ALGOLIA_SEARCH_API_KEY"));

  const plans: [string, Change[]][] = [
    ["books40k", await bookChanges(sanity, reader)],
    ["authors40k", await authorChanges(sanity, reader)],
  ];

  for (const [indexName, changes] of plans) {
    console.log(`\n${indexName}: ${changes.length} records with out-of-date series`);
    for (const c of changes) console.log(`  ${c.name}: ${c.before} -> ${c.after}`);
  }

  if (!write) {
    console.log("\nPreview only. Run with --write to apply.");
    return;
  }

  const writer = algoliaWriter();
  for (const [indexName, changes] of plans) {
    if (changes.length === 0) continue;
    await writer.partialUpdateObjects({
      indexName,
      createIfNotExists: false,
      waitForTasks: true,
      objects: changes.map((c) => c.update),
    });
    console.log(`Updated ${changes.length} ${indexName} records.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
