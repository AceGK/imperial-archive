// functions/algolia-document-sync/index.ts
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

const ALGOLIA_INDEX_NAME = "books40k";

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
  title: string;
  slug: string;
  format: string | null;
  publicationDate: string | null;
  image: ImageRef;
  description: string;
  story: string;
  series: SeriesMini | null;
  era: EraRef | null;
  factions: FactionRef[];
  authors: AuthorRef[];
  _createdAt: string;
  _updatedAt: string;
};

export const handler = documentEventHandler(async ({ event, context }) => {
  const { _id, operation } = event.data;

  console.log("🚀 Function triggered for book:", _id, "Operation:", operation);

  const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  if (operation === "delete") {
    try {
      await algolia.deleteObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
      });
      console.log(`✅ Successfully deleted book ${_id} from Algolia`);
    } catch (error) {
      console.error("❌ Error deleting from Algolia:", error);
      throw error;
    }
  } else {
    try {
      const {
        title,
        slug,
        format,
        publicationDate,
        description,
        story,
        authors,
        era,
        factions,
        image,
        _createdAt,
        _updatedAt,
      } = event.data;

      console.log("📦 Processing book:", _id);
      console.log("  - Title:", title);

      // Create Sanity client
      const sanityClient = createClient({
        projectId: SANITY_STUDIO_PROJECT_ID,
        dataset: SANITY_STUDIO_DATASET,
        apiVersion: "2024-01-01",
        useCdn: false,
        token: (context as any).token,
      });

      console.log("🔍 Fetching references by ID...");

      // Extract reference IDs
      const authorIds = Array.isArray(authors) 
        ? authors.map((a: any) => a._ref).filter(Boolean) 
        : [];
      const eraId = era?._ref;
      const factionIds = Array.isArray(factions)
        ? factions.map((f: any) => f._ref).filter(Boolean)
        : [];

      console.log("  - Author IDs:", authorIds);
      console.log("  - Era ID:", eraId);
      console.log("  - Faction IDs:", factionIds);

      // Fetch all referenced documents in one query
      const bookData = await sanityClient.fetch(
        `{
          "authors": *[_id in $authorIds]{
            _id,
            name,
            title,
            "displayName": coalesce(name, title),
            slug
          },
          "era": *[_id == $eraId][0]{
            _id,
            name,
            title,
            "displayName": coalesce(title, name),
            slug
          },
          "factions": *[_id in $factionIds]{
            _id,
            name,
            title,
            "displayName": coalesce(title, name),
            slug,
            iconId
          },
          "imageUrl": *[_id == $imageAssetId][0].url,
          "series": *[_type == "series40k" && references($bookId)][0]{
            _id,
            title,
            slug
          }
        }`,
        { 
          authorIds,
          eraId,
          factionIds,
          imageAssetId: image?.asset?._ref,
          bookId: _id
        }
      );

      console.log("  ✓ Query result:");
      console.log(JSON.stringify(bookData, null, 2));

      // Process authors (return full objects with name and slug)
      const processedAuthors: AuthorRef[] = Array.isArray(bookData?.authors)
        ? bookData.authors
            .map((a: any) => ({
              name: a?.displayName || a?.name || a?.title || "",
              slug: typeof a?.slug === 'object' ? a.slug?.current : a?.slug || "",
            }))
            .filter((a: AuthorRef) => a.name && a.slug)
        : [];

      console.log("  ✓ Processed authors:", processedAuthors);

      // Process factions
      const processedFactions: FactionRef[] = Array.isArray(bookData?.factions)
        ? bookData.factions
            .map((f: any) => ({
              name: f?.displayName || f?.title || f?.name || "",
              slug: typeof f?.slug === 'object' ? f.slug?.current : f?.slug || "",
              iconId: f?.iconId ?? null,
            }))
            .filter((f: FactionRef) => f.name && f.slug)
        : [];

      console.log("  ✓ Processed factions:", processedFactions);

      // Process era
      const processedEra: EraRef | null =
        bookData?.era
          ? {
              name: bookData.era.displayName || bookData.era.title || bookData.era.name || "",
              slug: typeof bookData.era.slug === 'object' 
                ? bookData.era.slug?.current || ""
                : bookData.era.slug || "",
            }
          : null;

      console.log("  ✓ Processed era:", processedEra);

      // Process series
      const processedSeries: SeriesMini | null =
        bookData?.series?.title && bookData?.series?.slug
          ? {
              title: bookData.series.title,
              slug: typeof bookData.series.slug === 'object'
                ? bookData.series.slug?.current || ""
                : bookData.series.slug || "",
            }
          : null;

      console.log("  ✓ Processed series:", processedSeries);

      // Process image
      const processedImage: ImageRef = {
        url: bookData?.imageUrl ?? image?.asset?.url ?? null,
        alt: image?.alt ?? null,
      };

      console.log("  ✓ Processed image:", processedImage);

      // Truncate text fields
      const limitedDescription = hardTrim(description, 6000);
      const limitedStory = hardTrim(story, 2000);
      const limitedTitle = title ? title.slice(0, 500) : "";

      const document: AlgoliaBook = {
        title: limitedTitle,
        slug: slug || "",
        format: formatBookType(format), // ✨ Format transformation
        publicationDate: publicationDate ?? null,
        image: processedImage,
        description: limitedDescription,
        story: limitedStory,
        series: processedSeries,
        era: processedEra,
        factions: processedFactions,
        authors: processedAuthors,
        _createdAt,
        _updatedAt,
      };

      // Check document size
      const documentSize = JSON.stringify(document).length;
      if (documentSize > 9000) {
        console.warn(`⚠️  Book ${_id} is ${documentSize} bytes (close to 10KB limit)`);
      }

      // Log what we're sending
      console.log("\n📤 Sending to Algolia:");
      console.log("  - Title:", limitedTitle);
      console.log("  - Format:", formatBookType(format));
      console.log("  - Authors:", processedAuthors.map(a => a.name).join(", ") || "none");
      console.log("  - Era:", processedEra?.name || "none");
      console.log("  - Factions:", processedFactions.map(f => f.name).join(", ") || "none");
      console.log("  - Image:", processedImage.url ? "✓" : "✗");
      console.log("  - Series:", processedSeries?.title || "none");

      await algolia.addOrUpdateObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
        body: document,
      });

      console.log(`\n✅ Synced book ${_id} ("${limitedTitle}") to Algolia`);
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