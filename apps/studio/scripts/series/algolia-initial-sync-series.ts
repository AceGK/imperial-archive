// scripts/series/algolia-initial-sync-series.ts
// Run: npx sanity exec scripts/series/algolia-initial-sync-series.ts --with-user-token

import { env } from "node:process";
import path from "node:path";
import dotenv from "dotenv";
import { algoliasearch } from "algoliasearch";
import { getCliClient } from "sanity/cli";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

/* --------------------------- env & constants --------------------------- */
const { ALGOLIA_APP_ID = "", ALGOLIA_WRITE_API_KEY = "" } = env;
const ALGOLIA_INDEX_NAME = "series40k";
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
type ImageRef = {
  asset?: { _ref: string } | null;
  hotspot?: { x: number; y: number; width: number; height: number } | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  alt?: string | null;
};

type AlgoliaSeries = {
  objectID: string;
  title: string;
  slug: string;
  subtitle: string;
  image: ImageRef;

  // Denormalized book data for filtering (consistent naming with books/authors)
  format: string[];
  "authors.slug": string[];
  "authors.name": string[];
  "factions.slug": string[];
  "factions.name": string[];
  "era.slug": string[];
  "era.name": string[];
  bookCount: number;

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

  // Fetch all series with their basic info - include full image data for urlFor()
const seriesList = await sanity.fetch<any[]>(`
  *[_type == "series40k" && !(_id in path("drafts.**"))]{
    _id,
    title,
    "slug": slug.current,
    subtitle,
    "image": select(
      defined(image.asset._ref) => {
        "asset": { "_ref": image.asset._ref },
        "hotspot": image.hotspot,
        "crop": image.crop,
        "alt": image.alt
      },
      null
    ),
    _createdAt,
    _updatedAt
  }
`);

  console.log(`Found ${seriesList.length} series to sync`);
  if (!seriesList.length) return;

  // For each series, fetch all books and aggregate data
  const records: AlgoliaSeries[] = await Promise.all(
    seriesList.map(async (series) => {
      // Fetch all books in this series with denormalized data
      const books = await sanity.fetch<any[]>(
        `
        *[_type == "book40k" && !(_id in path("drafts.**")) && _id in *[_type == "series40k" && _id == $seriesId].lists[].items[].work._ref]{
          format,
          "authors": authors[]->{
            "name": coalesce(name, title),
            "slug": slug.current
          },
          "era": era->{ "name": coalesce(title, name), "slug": slug.current },
          "factions": factions[]->{
            "name": coalesce(title, name),
            "slug": slug.current
          }
        }
      `,
        { seriesId: series._id }
      );

      // Aggregate unique values
      const formats = new Set<string>();
      const authorSlugs = new Set<string>();
      const authorNames = new Set<string>();
      const factionSlugs = new Set<string>();
      const factionNames = new Set<string>();
      const eraSlugs = new Set<string>();
      const eraNames = new Set<string>();

      books.forEach((book) => {
        if (book.format) {
          formats.add(formatBookType(book.format));
        }

        if (Array.isArray(book.authors)) {
          book.authors.forEach((author: any) => {
            if (author?.slug && author?.name) {
              authorSlugs.add(author.slug);
              authorNames.add(author.name);
            }
          });
        }

        if (book.era?.slug && book.era?.name) {
          eraSlugs.add(book.era.slug);
          eraNames.add(book.era.name);
        }

        if (Array.isArray(book.factions)) {
          book.factions.forEach((faction: any) => {
            if (faction?.slug && faction?.name) {
              factionSlugs.add(faction.slug);
              factionNames.add(faction.name);
            }
          });
        }
      });

    // Keep full Sanity image structure for urlFor() to work with hotspot/crop
    const image: ImageRef = series?.image ? {
      asset: series.image.asset ?? null,
      hotspot: series.image.hotspot ?? null,
      crop: series.image.crop ?? null,
      alt: series.image.alt ?? null,
    } : {
      asset: null,
      hotspot: null,
      crop: null,
      alt: null,
    };

      const doc: AlgoliaSeries = {
        objectID: series._id,
        title: series.title || "",
        slug: series.slug || "",
        subtitle: hardTrim(series.subtitle, 500),
        image,

        // Consistent field names with books/authors indices
        format: Array.from(formats),
        "authors.slug": Array.from(authorSlugs),
        "authors.name": Array.from(authorNames),
        "factions.slug": Array.from(factionSlugs),
        "factions.name": Array.from(factionNames),
        "era.slug": Array.from(eraSlugs),
        "era.name": Array.from(eraNames),
        bookCount: books.length,

        _createdAt: series._createdAt,
        _updatedAt: series._updatedAt,
      };

      const size = JSON.stringify(doc).length;
      if (size > 9000) {
        console.warn(`Record ${series._id} is ${size} bytes (close to Algolia 10KB limit).`);
      }

      return doc;
    })
  );

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