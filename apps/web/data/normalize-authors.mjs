#!/usr/bin/env node
// normalize-authors.mjs
// Usage: node normalize-authors.mjs ./data/40k-books.json

import fs from "node:fs/promises";
import path from "node:path";

function normalizeToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === "string") return [value.trim()];
  return [];
}

function pickBetterAuthor(book) {
  const authorArr = normalizeToArray(book.author);
  const authorsArr = normalizeToArray(book.authors);

  // trust `author` if it's valid and not empty
  if (authorArr.length > 0) return authorArr;

  // otherwise fallback to `authors` unless it's unreliable
  const joined = authorsArr.join(" ").toLowerCase();
  const unreliable =
    joined.includes("various") ||
    joined.includes("multiple") ||
    joined.includes("unknown");

  return unreliable ? [] : authorsArr;
}

async function main() {
  const [, , inputPathArg] = process.argv;
  if (!inputPathArg) {
    console.error("Usage: node normalize-authors.mjs <path-to-40k-books.json>");
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), inputPathArg);
  const raw = await fs.readFile(inputPath, "utf8");

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse JSON:", err.message);
    process.exit(1);
  }

  const books = Array.isArray(data) ? data : data.books;
  if (!Array.isArray(books)) {
    console.error("Expected an array of books or an object with a 'books' array");
    process.exit(1);
  }

  const updated = books.map((book) => {
    const normalized = { ...book };
    normalized.author = pickBetterAuthor(book);
    delete normalized.authors;
    return normalized;
  });

  const outPath = inputPath.replace(/\.json$/i, ".normalized.json");
  await fs.writeFile(outPath, JSON.stringify(updated, null, 2), "utf8");

  console.log(
    `Processed ${books.length} book(s). Wrote normalized version to:\n${outPath}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
