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

function formatBookType(format: string | null): string {
  if (!format) return "Book";
  
  const formatMap: Record<string, string> = {
    novel: "Novel",
    novella: "Novella",
    short_story: "Short Story",
    audio_drama: "Audio Drama",
    anthology: "Anthology",
    omnibus: "Omnibus",
    graphic_novel: "Graphic Novel",
    audio_anthology: "Audio Anthology",
    other: "Other",
  };
  
  return formatMap[format] || format;
}

/* --------------------------- Algolia types ---------------------------- */
type AuthorRef = {
  name: string;
  slug: string;
};

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

  // authors (with name and slug for linking)
  authors: AuthorRef[];

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

  // GROQ: includes author name AND slug, faction.iconId, nested image, and reverse lookup for series
  const books = await sanity.fetch<any[]>(`
    *[_type == "book40k" && !(_id in path("drafts.**")) ]{
      _id,
      title,
      "slug": slug.current,
      format,
      publicationDate,
      description,
      story,
      "authors": authors[]->{
        "name": coalesce(name, title),
        "slug": slug.current
      },
      "era": era->{ "name": coalesce(title, name), "slug": slug.current },
      "factions": factions[]->{
        "name": coalesce(title, name),
        "slug": slug.current,
        "iconId": iconId
      },
      "image": {
        "url": image.asset->url,
        "alt": image.alt
      },
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

    const authors: AuthorRef[] = Array.isArray(b.authors)
      ? b.authors
          .map((a: any) => ({
            name: a?.name ?? "",
            slug: a?.slug ?? "",
          }))
          .filter((a: AuthorRef) => a.name && a.slug)
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
      format: formatBookType(b.format), // ✨ Format transformation
      publicationDate: b.publicationDate ?? null,

      image,
      description,
      story,

      series,
      era,
      factions,

      authors,
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