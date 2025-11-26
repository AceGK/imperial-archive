// functions/algolia-document-sync-authors/index.ts
// npx sanity blueprints deploy
import { env } from "node:process";
import { documentEventHandler } from "@sanity/functions";
import { algoliasearch } from "algoliasearch";
import { createClient } from "@sanity/client";

const {
  ALGOLIA_APP_ID = "",
  ALGOLIA_WRITE_API_KEY = "",
  SANITY_STUDIO_PROJECT_ID = "",
  SANITY_STUDIO_DATASET = "",
} = env;

const ALGOLIA_INDEX_NAME = "authors40k";

/* ------------------------------ helpers ------------------------------- */
const hardTrim = (str: unknown, max = 8000): string =>
  typeof str === "string" ? (str.length > max ? str.slice(0, max) : str) : "";

function extractLastName(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
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
  name: string;
  lastName: string;
  slug: string;
  bio: string;
  image: ImageRef;

  // Consistent field names with books index
  format: string[];
  "series.title": string[];
  "series.slug": string[];
  "factions.name": string[];
  "factions.slug": string[];
  "era.name": string[];
  "era.slug": string[];
  bookCount: number;

  _createdAt: string;
  _updatedAt: string;
};

export const handler = documentEventHandler(async ({ event, context }) => {
  const { _id, operation } = event.data;

  console.log("🚀 Function triggered for author:", _id, "Operation:", operation);

  const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  if (operation === "delete") {
    try {
      await algolia.deleteObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
      });
      console.log(`✅ Successfully deleted author ${_id} from Algolia`);
    } catch (error) {
      console.error("❌ Error deleting from Algolia:", error);
      throw error;
    }
  } else {
    try {
      const { name, slug, bio, image, _createdAt, _updatedAt } = event.data;

      console.log("📦 Processing author:", _id);
      console.log("  - Name:", name);

      const sanityClient = createClient({
        projectId: SANITY_STUDIO_PROJECT_ID,
        dataset: SANITY_STUDIO_DATASET,
        apiVersion: "2024-01-01",
        useCdn: false,
        token: (context as any).token,
      });

      console.log("🔍 Fetching author's books and aggregating data...");

      const authorData = await sanityClient.fetch(
        `{
          "books": *[_type == "book40k" && !(_id in path("drafts.**")) && references($authorId)]{
            format,
            "series": *[
              _type == "series40k" && ^._id in lists[].items[].work._ref
            ]{ "title": title, "slug": slug.current }[0],
            "era": era->{ "name": coalesce(title, name), "slug": slug.current },
            "factions": factions[]->{
              "name": coalesce(title, name),
              "slug": slug.current
            }
          },
          "imageUrl": select(
            defined($imageAssetId) => *[_id == $imageAssetId][0].url,
            null
          ),
          "bioText": select(
            defined($bio) => pt::text($bio),
            ""
          )
        }`,
        {
          authorId: _id,
          imageAssetId: image?.asset?._ref || null,
          bio: bio || null,
        }
      );

      console.log("  ✓ Found books:", authorData?.books?.length || 0);

      // Aggregate unique values from books
      const formats = new Set<string>();
      const seriesSlugs = new Set<string>();
      const seriesTitles = new Set<string>();
      const factionSlugs = new Set<string>();
      const factionNames = new Set<string>();
      const eraSlugs = new Set<string>();
      const eraNames = new Set<string>();

      const books = authorData?.books || [];
      books.forEach((book: any) => {
        if (book.format) {
          formats.add(formatBookType(book.format));
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

      console.log("  ✓ Aggregated data:");
      console.log("    - Formats:", Array.from(formats).join(", ") || "none");
      console.log("    - Series:", Array.from(seriesTitles).join(", ") || "none");
      console.log("    - Factions:", Array.from(factionNames).join(", ") || "none");
      console.log("    - Eras:", Array.from(eraNames).join(", ") || "none");

      const processedImage: ImageRef = {
        url: authorData?.imageUrl ?? image?.asset?.url ?? null,
        alt: image?.alt ?? null,
      };

      console.log("  ✓ Processed image:", processedImage.url ? "✓" : "✗");

      const processedBio = hardTrim(authorData?.bioText || "", 6000);

      const document: AlgoliaAuthor = {
        name: name || "",
        lastName: extractLastName(name || ""),
        slug: typeof slug === "object" ? slug?.current || "" : slug || "",
        bio: processedBio,
        image: processedImage,

        // Consistent field names with books index
        format: Array.from(formats),
        "series.title": Array.from(seriesTitles),
        "series.slug": Array.from(seriesSlugs),
        "factions.name": Array.from(factionNames),
        "factions.slug": Array.from(factionSlugs),
        "era.name": Array.from(eraNames),
        "era.slug": Array.from(eraSlugs),
        bookCount: books.length,

        _createdAt,
        _updatedAt,
      };

      const documentSize = JSON.stringify(document).length;
      if (documentSize > 9000) {
        console.warn(
          `⚠️  Author ${_id} is ${documentSize} bytes (close to 10KB limit)`
        );
      }

      console.log("\n📤 Sending to Algolia:");
      console.log("  - Name:", document.name);
      console.log("  - Last Name:", document.lastName);
      console.log("  - Slug:", document.slug);
      console.log("  - Book count:", document.bookCount);
      console.log("  - Formats:", document.format.join(", ") || "none");
      console.log("  - Series:", document["series.title"].join(", ") || "none");
      console.log("  - Factions:", document["factions.name"].join(", ") || "none");
      console.log("  - Eras:", document["era.name"].join(", ") || "none");
      console.log("  - Image:", processedImage.url ? "✓" : "✗");
      console.log("  - Bio length:", processedBio.length, "chars");

      await algolia.addOrUpdateObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
        body: document,
      });

      console.log(`\n✅ Synced author ${_id} ("${document.name}") to Algolia`);
    } catch (error) {
      console.error("\n❌ Error syncing to Algolia:");
      console.error("Error:", error);
      if (error instanceof Error) {
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
      }
      throw error;
    }
  }
});