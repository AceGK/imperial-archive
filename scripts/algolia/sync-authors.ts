// scripts/algolia/sync-authors.ts
//
// Rebuilds the whole authors40k index from Sanity, building each record with
// the live sync function's own code (functions/algolia-document-sync-authors/record.ts).
// Day-to-day edits sync on their own; use this to fill a new index or repair
// drift. Previews by default:
//
//   npx tsx scripts/algolia/sync-authors.ts           what would change
//   npx tsx scripts/algolia/sync-authors.ts --write   apply it
import {
  ALL_AUTHORS_QUERY,
  AUTHORS_INDEX,
  toAuthorRecord,
  type AuthorDoc,
} from "../../functions/algolia-document-sync-authors/record";
import { rebuildIndex, sanityClient } from "./lib";

async function main() {
  const authors = await sanityClient().fetch<(AuthorDoc & { _id: string; bioText: string | null; books: any[] })[]>(
    ALL_AUTHORS_QUERY
  );
  const records = authors.map((a) => ({ objectID: a._id, ...toAuthorRecord(a, a.books, a.bioText) }));
  await rebuildIndex(AUTHORS_INDEX, records, (r) => String(r.name));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
