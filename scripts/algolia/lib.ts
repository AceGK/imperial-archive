// scripts/algolia/lib.ts
//
// Shared by the Algolia scripts: env from the repo root's .env.local, the
// Sanity and Algolia clients, and the preview-then-write flow of the full
// index rebuilds (sync-*.ts).
import path from "node:path";
import { config } from "dotenv";
import { createClient } from "@sanity/client";
import { algoliasearch } from "algoliasearch";

config({ path: path.resolve(__dirname, "../../.env.local"), quiet: true });

export const need = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set in .env.local`);
  return value;
};

export const sanityClient = () =>
  createClient({
    projectId: need("SANITY_STUDIO_PROJECT_ID"),
    dataset: need("SANITY_STUDIO_DATASET"),
    apiVersion: "2024-01-01",
    useCdn: false,
    token: need("SANITY_API_TOKEN"),
  });

export const algoliaWriter = () => algoliasearch(need("ALGOLIA_APP_ID"), need("ALGOLIA_WRITE_API_KEY"));

type IndexRecord = { objectID: string } & Record<string, unknown>;

// arrays of plain values compare as sets: the aggregated fields have no meaningful order
const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const items = value.map(normalize);
    return items.every((v) => typeof v !== "object" || v === null) ? [...items].map(String).sort() : items;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([k]) => !k.startsWith("_highlight") && !k.startsWith("_snippet") && k !== "objectID")
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, normalize(v)])
    );
  }
  // floats can differ in their last digit between Sanity and Algolia
  if (typeof value === "number" && !Number.isInteger(value)) return Number(value.toPrecision(12));
  return value;
};
const same = (a: unknown, b: unknown) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));

/**
 * Compares the rebuilt records with what the index holds now and prints what
 * would change. With --write on the command line, saves them all and
 * removes records the source no longer has; settings and replicas are untouched.
 */
export async function rebuildIndex(
  indexName: string,
  records: IndexRecord[],
  label: (r: IndexRecord) => string,
  source = "Sanity"
) {
  const write = process.argv.includes("--write");
  const algolia = algoliaWriter();

  const current = new Map<string, IndexRecord>();
  await algolia.browseObjects<IndexRecord>({
    indexName,
    aggregator: (res) => res.hits.forEach((hit) => current.set(hit.objectID, hit)),
  });

  const added = records.filter((r) => !current.has(r.objectID));
  const changed = records
    .filter((r) => current.has(r.objectID))
    .map((r) => {
      const before = current.get(r.objectID)!;
      const keys = [...new Set([...Object.keys(r), ...Object.keys(before)])].filter(
        (k) => k !== "objectID" && !k.startsWith("_highlight") && !k.startsWith("_snippet") && !same(r[k], before[k])
      );
      return { record: r, keys };
    })
    .filter((c) => c.keys.length > 0);
  const ids = new Set(records.map((r) => r.objectID));
  const removed = [...current.keys()].filter((id) => !ids.has(id));

  console.log(`${indexName}: ${records.length} records from ${source}, ${current.size} in the index`);
  console.log(`  ${added.length} new, ${changed.length} changed, ${removed.length} to remove, ${records.length - added.length - changed.length} unchanged`);
  for (const r of added.slice(0, 10)) console.log(`  + ${label(r)}`);
  for (const c of changed.slice(0, 20)) console.log(`  ~ ${label(c.record)}: ${c.keys.join(", ")}`);
  if (changed.length > 20) console.log(`  … and ${changed.length - 20} more changed`);
  for (const id of removed.slice(0, 10)) console.log(`  - ${id}`);

  for (const r of records) {
    const size = JSON.stringify(r).length;
    if (size > 9000) console.warn(`  ⚠️  ${label(r)} is ${size} bytes (close to Algolia's 10KB limit)`);
  }

  if (!write) {
    console.log("\nPreview only. Run with --write to apply.");
    return;
  }
  // saved and deleted in place, not replaceAllObjects: that swaps in a temporary
  // index, which doesn't sit well with an index that has replicas
  await algolia.saveObjects({ indexName, objects: records, waitForTasks: true });
  if (removed.length) await algolia.deleteObjects({ indexName, objectIDs: removed, waitForTasks: true });
  console.log(`\n✅ ${indexName}: saved ${records.length} records, removed ${removed.length}`);
}
