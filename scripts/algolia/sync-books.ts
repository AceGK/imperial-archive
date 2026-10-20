// scripts/algolia/sync-books.ts
//
// Rebuilds the whole books40k index from Sanity, building each record with the
// live sync function's own code (functions/algolia-document-sync/record.ts).
// Day-to-day edits sync on their own; use this to fill a new index or repair
// drift. Previews by default:
//
//   npx tsx scripts/algolia/sync-books.ts           what would change
//   npx tsx scripts/algolia/sync-books.ts --write   apply it
import {
  BOOK_FIELDS,
  BOOK_REFS_PROJECTION,
  BOOKS_INDEX,
  toBookRecord,
  type BookDoc,
  type BookRefs,
} from "../../functions/algolia-document-sync/record";
import { rebuildIndex, sanityClient } from "./lib";

async function main() {
  const books = await sanityClient().fetch<(BookDoc & { refs: BookRefs | null })[]>(
    `*[_type == "book40k" && !(_id in path("drafts.**"))]{ ${BOOK_FIELDS}, "refs": ${BOOK_REFS_PROJECTION} }`
  );
  const records = books.map((b) => ({ objectID: b._id, ...toBookRecord(b, b.refs) }));
  await rebuildIndex(BOOKS_INDEX, records, (r) => String(r.title));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
