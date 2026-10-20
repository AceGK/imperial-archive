// scripts/algolia/backup.ts
//
// Saves the records and settings of the Algolia indexes (and their replicas'
// settings) to JSON, and puts the records back from such a backup. Algolia
// keeps no history, so take one before a sync-*.ts --write.
//
//   npx tsx scripts/algolia/backup.ts                     back up to ../imperial-archive-backups/algolia-<time>
//   npx tsx scripts/algolia/backup.ts <dir>               back up to <dir>
//   npx tsx scripts/algolia/backup.ts --restore <dir>     preview restoring the records from <dir>
//   npx tsx scripts/algolia/backup.ts --restore <dir> --write   restore them
//
// A restore saves the backed-up records and removes ones added since; it
// doesn't change settings (the sync scripts never do).
import fs from "node:fs";
import path from "node:path";
import { algoliaWriter, rebuildIndex } from "./lib";

const INDEXES = ["books40k", "authors40k", "series40k"];

type IndexRecord = { objectID: string } & Record<string, unknown>;

async function backup(dir: string) {
  const algolia = algoliaWriter();
  fs.mkdirSync(dir, { recursive: true });
  for (const indexName of INDEXES) {
    const records: IndexRecord[] = [];
    await algolia.browseObjects<IndexRecord>({ indexName, aggregator: (res) => records.push(...res.hits) });
    const settings = await algolia.getSettings({ indexName });
    const replicas: Record<string, unknown> = {};
    for (const replica of settings.replicas ?? []) {
      const name = replica.replace(/^virtual\((.*)\)$/, "$1");
      replicas[name] = await algolia.getSettings({ indexName: name });
    }
    fs.writeFileSync(path.join(dir, `${indexName}.records.json`), JSON.stringify(records));
    fs.writeFileSync(path.join(dir, `${indexName}.settings.json`), JSON.stringify({ settings, replicas }, null, 2));
    console.log(`${indexName}: ${records.length} records, settings and ${Object.keys(replicas).length} replicas`);
  }
  console.log(`\nSaved to ${dir}`);
}

async function restore(dir: string) {
  for (const indexName of INDEXES) {
    const file = path.join(dir, `${indexName}.records.json`);
    const records: IndexRecord[] = JSON.parse(fs.readFileSync(file, "utf8"));
    await rebuildIndex(indexName, records, (r) => String(r.title ?? r.name ?? r.objectID), "the backup");
    console.log();
  }
}

const args = process.argv.slice(2).filter((a) => a !== "--write");
const restoreAt = args.indexOf("--restore");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

(restoreAt >= 0
  ? restore(path.resolve(args[restoreAt + 1] ?? ""))
  : backup(path.resolve(args[0] ?? path.join(__dirname, "../../../imperial-archive-backups", `algolia-${stamp}`)))
).catch((error) => {
  console.error(error);
  process.exit(1);
});
