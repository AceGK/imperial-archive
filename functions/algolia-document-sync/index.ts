import { env } from "node:process";
import { documentEventHandler } from "@sanity/functions";
import { algoliasearch } from "algoliasearch";
import { buildImageUrl, parseImageAssetId, isImageAssetId } from "@sanity/asset-utils";

const {
  ALGOLIA_APP_ID = "",
  ALGOLIA_WRITE_API_KEY = "",
  SANITY_STUDIO_PROJECT_ID = "",
  SANITY_STUDIO_DATASET = "",
} = env;

const ALGOLIA_INDEX_NAME = "books40k";

const trim = (x: unknown, max = 8000) =>
  typeof x === "string" ? (x.length > max ? x.slice(0, max) : x) : "";

// Build CDN URL from asset ref (works in Functions)
const urlFromAssetRef = (assetRef?: string | null) => {
  if (!assetRef || !isImageAssetId(assetRef)) return null;
  const parts = parseImageAssetId(assetRef);
  return buildImageUrl({ ...parts, projectId: SANITY_STUDIO_PROJECT_ID, dataset: SANITY_STUDIO_DATASET });
};

// Fetch exactly the shape you used in the initial seed, for ONE doc
const EXPAND_GROQ = `
*[_id == $id][0]{
  "authorNames": authors[]->coalesce(name, title),
  "era": era->{ "name": coalesce(title, name), "slug": slug.current },
  "factions": factions[]->{ "name": coalesce(title, name), "slug": slug.current }
}
`;

export const handler = documentEventHandler(async ({ event, context }: { event: any; context: any }) => {
  const {
    _id,
    title,
    slug,
    format,
    publicationDate,
    description,
    story,
    seriesMembership,
    imageAssetRef,
    imageAlt,
    _createdAt,
    _updatedAt,
    operation,
  } = event.data;

  const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  if (operation === "delete") {
    await algolia.deleteObject({ indexName: ALGOLIA_INDEX_NAME, objectID: _id });
    console.log(`Deleted ${_id} (${title}) from Algolia`);
    return;
  }

  // Auth'ed client from function context
  const client = context.getClient ? context.getClient({ apiVersion: "2025-01-01" }) : context.client;

  // Expand refs safely here (no deref in projection)
  const expanded = (await client.fetch(EXPAND_GROQ, { id: _id }).catch(() => ({}))) || {};

  const authorNames: string[] = Array.isArray(expanded.authorNames) ? expanded.authorNames.filter(Boolean) : [];
  const factions: Array<{ name?: string; slug?: string }> = Array.isArray(expanded.factions) ? expanded.factions : [];
  const factionNames = factions.map((f) => f?.name).filter(Boolean) as string[];
  const factionSlugs = factions.map((f) => f?.slug).filter(Boolean) as string[];

  const eraName = expanded?.era?.name ?? null;
  const eraSlug = expanded?.era?.slug ?? null;

  const imageUrl = urlFromAssetRef(imageAssetRef);

  const record = {
    objectID: _id,
    title: trim(title, 500),
    slug: slug || "",
    format: format ?? null,
    publicationDate: publicationDate ?? null,

    description: trim(description, 6000),
    story: trim(story, 2000),

    // facets / filters (same shape as your initial seed)
    eraName,
    eraSlug,
    factionNames,
    factionSlugs,
    authorNames,

    imageUrl: imageUrl ?? null,
    imageAlt: imageAlt ?? null,

    // optional: keep your read-only series string if helpful
    series: seriesMembership ?? null,

    _createdAt,
    _updatedAt,
  };

  const size = JSON.stringify(record).length;
  if (size > 9000) console.warn(`Record ${_id} is ${size} bytes (close to Algolia 10KB limit).`);

  await algolia.addOrUpdateObject({
    indexName: ALGOLIA_INDEX_NAME,
    objectID: _id,
    body: record,
  });

  console.log(`Synced ${_id} (“${record.title}”) ${imageUrl ? "with image" : "no image"}`);
});
