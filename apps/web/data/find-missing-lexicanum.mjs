#!/usr/bin/env node
// find-missing-lexicanum.mjs
// Usage:
//   node find-missing-lexicanum.mjs ./data/40k-books.json
// Optional flags:
//   --csv   also writes missing-lexicanum.csv
//   --out <basename>  change output base name (default: "missing-lexicanum")

import fs from "node:fs/promises";
import path from "node:path";

// --- helpers ---
const isHttpUrl = (v) => typeof v === "string" && /^https?:\/\//i.test(v.trim());
const hasLexFromLinksArray = (links) =>
  Array.isArray(links) &&
  links.some((l) => {
    if (!l) return false;
    const url = (l.url || l.href || l.link || "").toString();
    const type = (l.type || l.rel || l.kind || "").toString().toLowerCase();
    return (type.includes("lexicanum") || url.includes("lexicanum")) && isHttpUrl(url);
  });

const hasLexicanum = (book) => {
  // Old field
  if (isHttpUrl(book?.lexicanum_link)) return true;
  // New array field
  if (hasLexFromLinksArray(book?.links)) return true;
  return false;
};

const toCSV = (rows) => {
  const esc = (s) =>
    `"${String(s ?? "").replaceAll(`"`, `""`).replaceAll(`\n`, ` `).replaceAll(`\r`, ``)}"`;
  const head = ["id", "title", "author_joined", "series_name", "series_number", "slug", "era"];
  const lines = [head.map(esc).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id ?? "",
        r.title ?? "",
        (Array.isArray(r.author) ? r.author.join("; ") : r.author) ?? "",
        (Array.isArray(r.series) ? r.series[0]?.name : r.series?.name ?? r.series) ?? "",
        (Array.isArray(r.series) ? r.series[0]?.number : r.series?.number ?? r.series_number) ?? "",
        r.slug ?? "",
        r.era ?? "",
      ]
        .map(esc)
        .join(",")
    );
  }
  return lines.join("\n") + "\n";
};

// --- main ---
async function main() {
  const [, , inputPathArg, ...rest] = process.argv;
  if (!inputPathArg) {
    console.error("Please pass the path to 40k-books.json");
    process.exit(1);
  }

  // flags
  let writeCSV = false;
  let outBase = "missing-lexicanum";
  for (let i = 0; i < rest.length; i++) {
    const tok = rest[i];
    if (tok === "--csv") writeCSV = true;
    if (tok === "--out") {
      outBase = rest[i + 1] ?? outBase;
      i++;
    }
  }

  const inputPath = path.resolve(process.cwd(), inputPathArg);
  const raw = await fs.readFile(inputPath, "utf8");

  // tolerate either an array of books or an object { books: [...] }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error("Could not parse JSON:", e.message);
    process.exit(1);
  }

  const books = Array.isArray(data) ? data : Array.isArray(data?.books) ? data.books : [];
  if (!Array.isArray(books) || books.length === 0) {
    console.error("No books found. Expected an array or an object with a 'books' array.");
    process.exit(1);
  }

  const missing = books.filter((b) => !hasLexicanum(b));

  // sort nicely for scanning
  missing.sort((a, b) => String(a.title).localeCompare(String(b.title)));

  // write JSON
  const outJsonPath = path.resolve(process.cwd(), `${outBase}.json`);
  await fs.writeFile(outJsonPath, JSON.stringify(missing, null, 2), "utf8");

  // optionally write CSV
  if (writeCSV) {
    const outCsvPath = path.resolve(process.cwd(), `${outBase}.csv`);
    await fs.writeFile(outCsvPath, toCSV(missing), "utf8");
  }

  // console report
  console.log(`Scanned ${books.length} book(s).`);
  console.log(`Missing Lexicanum link: ${missing.length}`);
  console.log(`→ Wrote ${outBase}.json${writeCSV ? ` and ${outBase}.csv` : ""}`);

  // print a quick preview to stdout (first 20)
  const preview = missing.slice(0, 20);
  if (preview.length) {
    console.log("\nFirst few without Lexicanum links:");
    for (const b of preview) {
      const seriesLabel = Array.isArray(b.series)
        ? b.series[0]?.name
        : typeof b.series === "object"
        ? b.series?.name
        : b.series;
      console.log(
        `- ${b.title}${seriesLabel ? `  (${seriesLabel}${b.series_number ? ` #${b.series_number}` : ""})` : ""}`
      );
    }
    if (missing.length > preview.length) {
      console.log(`…and ${missing.length - preview.length} more`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
