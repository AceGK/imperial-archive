import fs from "node:fs";
import path from "node:path";

// -------- CONFIG --------
const INPUT_PATH = path.resolve("./40k-books.json"); // source file
const OUTPUT_PATH = path.resolve("./40k-books.reindexed.json"); // output file

// -------- MAIN FUNCTION --------
function main() {
  const raw = fs.readFileSync(INPUT_PATH, "utf8");
  const books = JSON.parse(raw);

  // Sort optional — if you want to preserve the current order, comment out this line
  // books.sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }));

  const reindexed = books.map((book, index) => ({
    ...book,
    id: index + 1,
  }));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(reindexed, null, 2));
  console.log(`✅ Reindexed ${reindexed.length} books → ${OUTPUT_PATH}`);
}

main();
