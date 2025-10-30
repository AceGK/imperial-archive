#!/usr/bin/env node
/**
 * Remove a bad image asset from all documents, then delete the asset.
 *
 * Usage examples:
 *   SANITY_PROJECT_ID=xxx SANITY_DATASET=production SANITY_TOKEN=sk_... \
 *   node remove-asset-and-unlink.mjs --asset image-abc123-800x1200-jpg
 *
 *   # Or target by original filename (wildcards allowed with *):
 *   node remove-asset-and-unlink.mjs --filename "*open-book*.jpg"
 *
 *   # Dry run (recommended first):
 *   node remove-asset-and-unlink.mjs --asset image-abc123 --dry
 *
 * Notes:
 * - This will UNSET `image` on book40k docs that reference the asset.
 * - It then attempts to DELETE the asset. Deletion fails if it’s still referenced.
 */

import sanityClient from "@sanity/client";

const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--")) {
    const key = a.replace(/^--/, "");
    const val = process.argv[i + 1]?.startsWith("--") || process.argv[i + 1] == null ? true : process.argv[++i];
    args.set(key, val);
  }
}

const ASSET_ID = args.get("asset") || null;          // e.g., "image-abc123-800x1200-jpg"
const FILENAME = args.get("filename") || null;       // e.g., "*open-book*.jpg"
const URLMATCH = args.get("url") || null;            // e.g., "*somepath*"
const DRY = !!args.get("dry");

if (!ASSET_ID && !FILENAME && !URLMATCH) {
  console.error("Provide --asset <id> OR --filename \"*pattern*\" OR --url \"*pattern*\"  (use --dry to preview).");
  process.exit(1);
}

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET = "production";
const TOKEN = process.env.SANITY_TOKEN;

if (!PROJECT_ID || !TOKEN) {
  console.error("Missing SANITY_PROJECT_ID or SANITY_TOKEN.");
  process.exit(1);
}

const client = sanityClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2025-01-01",
  token: TOKEN,
  useCdn: false,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findTargetAssets() {
  if (ASSET_ID) {
    const a = await client.fetch(
      `*[_type == "sanity.imageAsset" && _id == $id][0]{_id, originalFilename, url, mimeType, size}`,
      { id: ASSET_ID }
    );
    return a ? [a] : [];
  }
  if (FILENAME) {
    return client.fetch(
      `*[_type == "sanity.imageAsset" && defined(originalFilename) && originalFilename match $pat]{
        _id, originalFilename, url, mimeType, size
      }`,
      { pat: FILENAME }
    );
  }
  if (URLMATCH) {
    return client.fetch(
      `*[_type == "sanity.imageAsset" && defined(url) && url match $pat]{
        _id, originalFilename, url, mimeType, size
      }`,
      { pat: URLMATCH }
    );
  }
  return [];
}

async function findReferencingDocs(assetId) {
  // All docs that reference this asset anywhere
  const docs = await client.fetch(
    `*[references($aid)]{_id, _type, title, image{asset->{_id}}}`,
    { aid: assetId }
  );
  return docs;
}

async function unlinkFromDocs(assetId, docs) {
  let patched = 0;

  for (const d of docs) {
    // For your schema: if the book's main image points at this asset, unset it.
    const shouldUnsetBookImage =
      d._type === "book40k" && d?.image?.asset?._id === assetId;

    if (shouldUnsetBookImage) {
      if (DRY) {
        console.log(`[dry] would unset image on ${d._type} ${d._id} (${d.title || ""})`);
      } else {
        await client.patch(d._id).unset(["image"]).commit();
        console.log(`[✓] unset image on ${d._type} ${d._id} (${d.title || ""})`);
        patched++;
      }
      continue;
    }

    // Fallback: if other doc types reference asset in the `image` field the same way
    const hasDirectImage = d?.image?.asset?._id === assetId;
    if (hasDirectImage) {
      if (DRY) {
        console.log(`[dry] would unset image on ${d._type} ${d._id}`);
      } else {
        await client.patch(d._id).unset(["image"]).commit();
        console.log(`[✓] unset image on ${d._type} ${d._id}`);
        patched++;
      }
      continue;
    }

    // If you suspect the asset might appear inside portable text or other fields,
    // you could fetch full doc & strip occurrences programmatically here.
    // (Not implemented because your schema only uses book40k.image.)
  }

  return patched;
}

async function deleteAsset(assetId) {
  if (DRY) {
    console.log(`[dry] would delete asset ${assetId}`);
    return;
  }
  try {
    await client.delete(assetId);
    console.log(`[✓] deleted asset ${assetId}`);
  } catch (e) {
    console.warn(`[!] could not delete asset ${assetId}: ${e.message}`);
  }
}

async function main() {
  const assets = await findTargetAssets();
  if (!assets.length) {
    console.log("No matching assets found.");
    return;
  }

  console.log(`Found ${assets.length} asset(s):`);
  assets.forEach((a) =>
    console.log(` - ${a._id}  ${a.originalFilename || ""}  ${a.url || ""}`)
  );

  for (const a of assets) {
    console.log(`\nProcessing ${a._id} …`);
    const refs = await findReferencingDocs(a._id);
    console.log(` ↳ referenced by ${refs.length} document(s)`);

    const n = await unlinkFromDocs(a._id, refs);
    if (n > 0 && !DRY) {
      // wait a moment so references are fully updated
      await sleep(150);
    }

    await deleteAsset(a._id);
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
