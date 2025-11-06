// scripts/algolia-initial-sync.ts
// Run: npx sanity exec scripts/algolia-initial-sync.ts --with-user-token

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
const hardTrim = (str: unknown, max = 8000): string =>
  typeof str === "string" ? (str.length > max ? str.slice(0, max) : str) : "";

/* --------------------------- Algolia types ---------------------------- */
type FactionRef = {
  name: string;
  slug: string;
  iconId?: string | null;
};

type SeriesMini = { title: string; slug: string };
type EraRef = { name: string; slug: string };
type ImageRef = { url: string | null; alt: string | null };

type AlgoliaBook = {
  objectID: string;
  title: string;
  slug: string;
  format: string | null;
  publicationDate: string | null;

  // nested image
  image: ImageRef;

  // text
  description: string;
  story: string;

  // consolidated objects
  series: SeriesMini | null;
  era: EraRef | null;
  factions: FactionRef[];

  // authors (flat)
  authorNames: string[];

  // meta
  _createdAt: string;
  _updatedAt: string;
};

/* --------------------------------- main -------------------------------- */
async function initialSync() {
  console.log(`Starting initial sync to Algolia (index: ${ALGOLIA_INDEX_NAME})`);

  if (!ALGOLIA_APP_ID || !ALGOLIA_WRITE_API_KEY) {
    console.error("Missing required env: ALGOLIA_APP_ID / ALGOLIA_WRITE_API_KEY");
    process.exit(1);
  }

  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  // GROQ: includes faction.iconId, nested image, and reverse lookup for series
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

      // era normalized to object
      "era": era->{ "name": coalesce(title, name), "slug": slug.current },

      // factions normalized to [{name, slug, iconId}]
      "factions": factions[]->{
        "name": coalesce(title, name),
        "slug": slug.current,
        "iconId": iconId
      },

      // nested image
      "image": {
        "url": image.asset->url,
        "alt": image.alt
      },

      // series (reverse lookup)
      "series": *[
        _type == "series40k" && references(^._id)
      ]{ "title": title, "slug": slug.current }[0],

      _createdAt,
      _updatedAt
    }
  `);

  console.log(`Found ${books.length} books to sync`);
  if (!books.length) return;

  const records: AlgoliaBook[] = books.map((b) => {
    const description = hardTrim(b.description, 6000);
    const story = hardTrim(b.story, 2000);

    const authorNames: string[] = Array.isArray(b.authorNames)
      ? b.authorNames.filter(Boolean)
      : [];

    const factions: FactionRef[] = Array.isArray(b.factions)
      ? b.factions
          .map((f: any) => ({
            name: f?.name ?? "",
            slug: f?.slug ?? "",
            iconId: f?.iconId ?? null,
          }))
          .filter((f: FactionRef) => f.name && f.slug)
      : [];

    const era: EraRef | null =
      b?.era && b.era.name && b.era.slug ? { name: b.era.name, slug: b.era.slug } : null;

    const series: SeriesMini | null =
      b?.series && b.series.title && b.series.slug
        ? { title: b.series.title, slug: b.series.slug }
        : null;

    const image: ImageRef = {
      url: b?.image?.url ?? null,
      alt: b?.image?.alt ?? null,
    };

    const doc: AlgoliaBook = {
      objectID: b._id,
      title: (b.title || "").slice(0, 500),
      slug: b.slug || "",
      format: b.format ?? null,
      publicationDate: b.publicationDate ?? null,

      image,
      description,
      story,

      series,
      era,
      factions,

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
