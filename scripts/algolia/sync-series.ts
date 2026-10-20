// scripts/algolia/sync-series.ts
//
// Rebuilds the whole series40k index from Sanity, building each record with
// the live sync function's own code (functions/algolia-document-sync-series/record.ts).
// Day-to-day edits sync on their own; use this to fill a new index or repair
// drift. Previews by default:
//
//   npx tsx scripts/algolia/sync-series.ts           what would change
//   npx tsx scripts/algolia/sync-series.ts --write   apply it
import {
  ALL_SERIES_QUERY,
  SERIES_INDEX,
  toSeriesRecord,
  type SeriesDoc,
} from "../../functions/algolia-document-sync-series/record";
import { rebuildIndex, sanityClient } from "./lib";

async function main() {
  const seriesList = await sanityClient().fetch<(SeriesDoc & { _id: string; books: any[] })[]>(ALL_SERIES_QUERY);
  const records = seriesList.map((s) => ({ objectID: s._id, ...toSeriesRecord(s, s.books) }));
  await rebuildIndex(SERIES_INDEX, records, (r) => String(r.title));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
