// scripts/authors/algolia-initial-sync-authors.ts
// Run: npx sanity exec scripts/authors/algolia-initial-sync-authors.ts --with-user-token

import { env } from "node:process";
import path from "node:path";
import dotenv from "dotenv";
import { algoliasearch } from "algoliasearch";
import { getCliClient } from "sanity/cli";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

/* --------------------------- env & constants --------------------------- */
const { ALGOLIA_APP_ID = "", ALGOLIA_WRITE_API_KEY = "" } = env;
const ALGOLIA_INDEX_NAME = "authors40k";
const sanity = getCliClient();

/* ------------------------------ helpers ------------------------------- */
const hardTrim = (str: unknown, max = 8000): string =>
  typeof str === "string" ? (str.length > max ? str.slice(0, max) : str) : "";

function extractLastName(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1]; // Gets the last word as last name
}

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
type ImageRef = { url: string | null; alt: string | null };

type AlgoliaAuthor = {
  objectID: string;
  name: string;
  lastName: string;
  slug: string;
  bio: string;
  image: ImageRef;

  // Denormalized book data for filtering
  bookFormats: string[];
  seriesSlugs: string[];
  seriesTitles: string[];
  factionSlugs: string[];
  factionNames: string[];
  eraSlugs: string[];
  eraNames: string[];
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

  // Fetch all authors with their basic info
  const authors = await sanity.fetch<any[]>(`
    *[_type == "author40k" && !(_id in path("drafts.**"))]{
      _id,
      name,
      "slug": slug.current,
      "bio": pt::text(bio),
      "image": {
        "url": image.asset->url,
        "alt": image.alt
      },
      _createdAt,
      _updatedAt
    }
  `);

  console.log(`Found ${authors.length} authors to sync`);
  if (!authors.length) return;

  // For each author, fetch their books and aggregate data
  const records: AlgoliaAuthor[] = await Promise.all(
    authors.map(async (author) => {
      // Fetch all books by this author with denormalized data
      const books = await sanity.fetch<any[]>(
        `
        *[_type == "book40k" && !(_id in path("drafts.**")) && references($authorId)]{
          format,
          "series": *[
            _type == "series40k" && ^._id in lists[].items[].work._ref
          ]{ "title": title, "slug": slug.current }[0],
          "era": era->{ "name": coalesce(title, name), "slug": slug.current },
          "factions": factions[]->{
            "name": coalesce(title, name),
            "slug": slug.current
          }
        }
      `,
        { authorId: author._id }
      );

      // Aggregate unique values
      const bookFormats = new Set<string>();
      const seriesSlugs = new Set<string>();
      const seriesTitles = new Set<string>();
      const factionSlugs = new Set<string>();
      const factionNames = new Set<string>();
      const eraSlugs = new Set<string>();
      const eraNames = new Set<string>();

      books.forEach((book) => {
        if (book.format) {
          bookFormats.add(formatBookType(book.format));
        }

        if (book.series?.slug && book.series?.title) {
          seriesSlugs.add(book.series.slug);
          seriesTitles.add(book.series.title);
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

      const image: ImageRef = {
        url: author?.image?.url ?? null,
        alt: author?.image?.alt ?? null,
      };

      const doc: AlgoliaAuthor = {
        objectID: author._id,
        name: author.name || "",
        lastName: extractLastName(author.name || ""),
        slug: author.slug || "",
        bio: hardTrim(author.bio, 6000),
        image,

        // Denormalized arrays for faceting
        bookFormats: Array.from(bookFormats),
        seriesSlugs: Array.from(seriesSlugs),
        seriesTitles: Array.from(seriesTitles),
        factionSlugs: Array.from(factionSlugs),
        factionNames: Array.from(factionNames),
        eraSlugs: Array.from(eraSlugs),
        eraNames: Array.from(eraNames),
        bookCount: books.length,

        _createdAt: author._createdAt,
        _updatedAt: author._updatedAt,
      };

      const size = JSON.stringify(doc).length;
      if (size > 9000) {
        console.warn(`Record ${author._id} is ${size} bytes (close to Algolia 10KB limit).`);
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