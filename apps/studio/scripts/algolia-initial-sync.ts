// scripts/algolia-initial-sync.ts
// run: npx sanity exec scripts/algolia-initial-sync.ts --with-user-token

import { env } from "node:process";
import path from "node:path";
import dotenv from "dotenv";
import { algoliasearch } from "algoliasearch";
import { getCliClient } from "sanity/cli";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

/* --------------------------- env & constants --------------------------- */
const { ALGOLIA_APP_ID = "", ALGOLIA_WRITE_API_KEY = "" } = env;
const ALGOLIA_INDEX_NAME = "books40k";
const sanity = getCliClient();

/* ------------------------------ helpers ------------------------------- */
const hardTrim = (str: unknown, max = 8000) =>
  typeof str === "string" ? (str.length > max ? str.slice(0, max) : str) : "";

// Define Algolia record structure
type AlgoliaBook = {
  objectID: string;
  title: string;
  slug: string;
  format: string | null;
  publicationDate: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  description: string;
  story: string;
  series: string | null;
  seriesTitle: string | null;
  seriesSlug: string | null;
  seriesList: { title: string; slug: string }[];
  eraName: string | null;
  eraSlug: string | null;
  factionNames: string[];
  factionSlugs: string[];
  authorNames: string[];
  _createdAt: string;
  _updatedAt: string;
};

/* --------------------------------- main -------------------------------- */
async function initialSync() {
  console.log("Starting initial sync to Algolia (index:", ALGOLIA_INDEX_NAME, ")");

  if (!ALGOLIA_APP_ID || !ALGOLIA_WRITE_API_KEY) {
    console.error("Missing required env: ALGOLIA_APP_ID / ALGOLIA_WRITE_API_KEY");
    process.exit(1);
  }

  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  // --- GROQ: includes reverse lookup for series40k ---
  const books = await sanity.fetch<any[]>(`
    *[_type == "book40k" && !(_id in path("drafts.**")) ]{
      _id,
      title,
      "slug": slug.current,
      format,
      publicationDate,

      // text
      description,
      story,

      // authors -> strings
      "authorNames": authors[]->{"n": coalesce(name, title)}.n,

      // era normalized to {name, slug}
      "era": era->{ "name": coalesce(title, name), "slug": slug.current },

      // factions normalized to [{name, slug}]
      "factions": factions[]->{ "name": coalesce(title, name), "slug": slug.current },

      // image
      "imageUrl": image.asset->url,
      "imageAlt": image.alt,

      // --- series ---
      // first series (if any) where this book is referenced
      "seriesObj": *[
        _type == "series40k" && references(^._id)
      ]{
        "title": title,
        "slug": slug.current
      }[0],

      // all series referencing this book
      "seriesAll": *[
        _type == "series40k" && references(^._id)
      ]{
        "title": title,
        "slug": slug.current
      },

      _createdAt,
      _updatedAt
    }
  `);

  console.log(`Found ${books.length} books to sync`);
  if (!books.length) return;

  const records: AlgoliaBook[] = books.map((b) => {
    const description = hardTrim(b.description, 6000);
    const story = hardTrim(b.story, 2000);

    const authorNames = Array.isArray(b.authorNames) ? b.authorNames.filter(Boolean) : [];
    const factions = Array.isArray(b.factions) ? b.factions : [];

    const factionNames = factions.map((f: any) => f?.name).filter(Boolean);
    const factionSlugs = factions.map((f: any) => f?.slug).filter(Boolean);

    const eraName = b?.era?.name ?? null;
    const eraSlug = b?.era?.slug ?? null;

    const seriesTitle = b?.seriesObj?.title ?? null;
    const seriesSlug = b?.seriesObj?.slug ?? null;
    const seriesList = Array.isArray(b.seriesAll)
      ? b.seriesAll.filter((s: any) => s?.title && s?.slug)
      : [];

    const doc: AlgoliaBook = {
      objectID: b._id,
      title: (b.title || "").slice(0, 500),
      slug: b.slug || "",
      format: b.format ?? null,
      publicationDate: b.publicationDate ?? null,
      imageUrl: b.imageUrl ?? null,
      imageAlt: b.imageAlt ?? null,

      description,
      story,

      // --- series fields ---
      series: seriesTitle,
      seriesTitle,
      seriesSlug,
      seriesList,

      // --- era & factions ---
      eraName,
      eraSlug,
      factionNames,
      factionSlugs,
      authorNames,

      _createdAt: b._createdAt,
      _updatedAt: b._updatedAt,
    };

    const size = JSON.stringify(doc).length;
    if (size > 9000) {
      console.warn(`Record ${b._id} is ${size} bytes (close to Algolia 10KB limit).`);
    }

    return doc;
  });

  await client.replaceAllObjects({
    indexName: ALGOLIA_INDEX_NAME,
    objects: records,
  });

  console.log(`✅ Synced ${records.length} records to "${ALGOLIA_INDEX_NAME}"`);
}

/* --------------------------------- run --------------------------------- */
initialSync().catch((err) => {
  console.error("❌ Error during initial sync:", err);
  process.exit(1);
});
