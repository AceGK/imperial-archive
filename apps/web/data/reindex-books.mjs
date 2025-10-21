#!/usr/bin/env node
// reindex-books.mjs
// Usage:
//   node reindex-books.mjs <input.json> [output.json] [--start N]
//   - Reads an array of book objects from input.json
//   - Reassigns `id` fields sequentially starting from 1 (or N if provided)
//   - Writes to output.json if provided, otherwise overwrites input.json
//   - Preserves all other fields untouched

import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import process from 'process';

function printHelp() {
  console.log(`Usage:
  node reindex-books.mjs <input.json> [output.json] [--start N]

Options:
  --start N   Start ID numbering at N (default 1)

Behavior:
  - Expects the JSON file to contain an array of objects.
  - Reassigns obj.id in array order to sequential integers.
  - All other fields are left unchanged.
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(args.length < 1 ? 1 : 0);
  }

  let inputPath = args[0];
  let outputPath = null;
  let start = 1;

  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '--start') {
      const next = args[i + 1];
      if (!next || Number.isNaN(Number(next))) {
        console.error('Error: --start requires a numeric value.');
        process.exit(1);
      }
      start = Number(next);
      i++; // skip consumed value
    } else if (!outputPath) {
      outputPath = a;
    } else {
      console.error(`Unexpected argument: ${a}`);
      printHelp();
      process.exit(1);
    }
  }

  inputPath = resolve(process.cwd(), inputPath);
  outputPath = outputPath ? resolve(process.cwd(), outputPath) : inputPath;

  let raw;
  try {
    raw = await readFile(inputPath, 'utf8');
  } catch (e) {
    console.error(`Failed to read input file: ${inputPath}\n${e.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`Input is not valid JSON: ${e.message}`);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error('Input JSON must be an array of objects.');
    process.exit(1);
  }

  // Reassign ids sequentially, preserving order
  let id = start;
  const updated = data.map((entry) => {
    if (entry && typeof entry === 'object') {
      return { ...entry, id: id++ };
    }
    return entry;
  });

  const outText = JSON.stringify(updated, null, 2);
  try {
    await writeFile(outputPath, outText, 'utf8');
  } catch (e) {
    console.error(`Failed to write output file: ${outputPath}\n${e.message}`);
    process.exit(1);
  }

  console.log(`Reindexed ${updated.length} entries. Wrote: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
