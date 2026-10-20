// functions/algolia-document-sync-series/index.ts
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

const ALGOLIA_INDEX_NAME = "series40k";

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
  title: string;
  slug: string;
  subtitle: string;
  image: ImageRef;

  // Denormalized book data for filtering (consistent naming)
  format: string[];
  "authors.slug": string[];
  "authors.name": string[];
  "factions.slug": string[];
  "factions.name": string[];
  "era.slug": string[];
  "era.name": string[];
  bookCount: number;

  _createdAt: string;
  _updatedAt: string;
};

const BOOKS_INDEX_NAME = "books40k";

type SanityClient = ReturnType<typeof createClient>;
type Algolia = ReturnType<typeof algoliasearch>;

/** Books the books index currently lists under this series title (including any just removed from it) */
async function booksListedUnder(algolia: Algolia, title: string | undefined): Promise<string[]> {
  if (!title) return [];
  try {
    const res = await algolia.searchSingleIndex({
      indexName: BOOKS_INDEX_NAME,
      searchParams: {
        query: "",
        facetFilters: [[`series.title:${title}`]],
        hitsPerPage: 1000,
        attributesToRetrieve: [],
      },
    });
    return res.hits.map((h) => h.objectID);
  } catch (error) {
    // only removed books depend on this; members are refreshed regardless
    console.warn("  ⚠️  Couldn't look up books listed under this series:", error);
    return [];
  }
}

/**
 * Rewrites the series list on each book's record, from Sanity. A book's
 * series live on the series documents, so editing a series doesn't trigger
 * the book sync; this keeps the books index in step.
 */
async function refreshBookSeries(algolia: Algolia, sanityClient: SanityClient, bookIds: string[]) {
  const ids = [...new Set(bookIds)];
  if (ids.length === 0) return;
  const books: { _id: string; series: { title: string; slug: string }[] }[] = await sanityClient.fetch(
    `*[_type == "book40k" && _id in $ids && !(_id in path("drafts.**"))]{
      _id,
      "series": *[_type == "series40k" && !(_id in path("drafts.**")) && ^._id in lists[].items[].work._ref] | order(title asc){
        title,
        "slug": slug.current
      }
    }`,
    { ids }
  );
  await algolia.partialUpdateObjects({
    indexName: BOOKS_INDEX_NAME,
    // only books already in the index; the book sync creates records
    createIfNotExists: false,
    objects: books.map((b) => ({
      objectID: b._id,
      series: (b.series || []).filter((x) => x?.title && x?.slug),
    })),
  });
  console.log(`  ✓ Refreshed the series on ${books.length} book record(s)`);
}

export const handler = documentEventHandler(async ({ event, context }) => {
  const { _id, operation } = event.data;

  console.log("🚀 Function triggered for series:", _id, "Operation:", operation);

  const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

  if (operation === "delete") {
    try {
      await algolia.deleteObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
      });
      console.log(`✅ Successfully deleted series ${_id} from Algolia`);

      // the deleted series' books lose it from their records
      const sanityClient = createClient({
        projectId: SANITY_STUDIO_PROJECT_ID,
        dataset: SANITY_STUDIO_DATASET,
        apiVersion: "2024-01-01",
        useCdn: false,
        token: context.clientOptions.token,
      });
      await refreshBookSeries(algolia, sanityClient, await booksListedUnder(algolia, event.data.title));
    } catch (error) {
      console.error("❌ Error deleting from Algolia:", error);
      throw error;
    }
  } else {
    try {
      const { title, slug, subtitle, image, _createdAt, _updatedAt } = event.data;

      console.log("📦 Processing series:", _id);
      console.log("  - Title:", title);

      // Create Sanity client
      const sanityClient = createClient({
        projectId: SANITY_STUDIO_PROJECT_ID,
        dataset: SANITY_STUDIO_DATASET,
        apiVersion: "2024-01-01",
        useCdn: false,
        // the runtime's credential lives in clientOptions; needed now the dataset is private
        token: context.clientOptions.token,
      });

      console.log("🔍 Fetching series books and aggregating data...");

      // Fetch all books in this series with denormalized data
      const seriesData = await sanityClient.fetch(
        `{
          "books": *[_type == "book40k" && !(_id in path("drafts.**")) && _id in *[_type == "series40k" && _id == $seriesId].lists[].items[].work._ref]{
            _id,
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
        }`,
        { seriesId: _id }
      );

      console.log("  ✓ Found books:", seriesData?.books?.length || 0);

      // Aggregate unique values from books
      const formats = new Set<string>();
      const authorSlugs = new Set<string>();
      const authorNames = new Set<string>();
      const factionSlugs = new Set<string>();
      const factionNames = new Set<string>();
      const eraSlugs = new Set<string>();
      const eraNames = new Set<string>();

      const books = seriesData?.books || [];
      books.forEach((book: any) => {
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

      console.log("  ✓ Aggregated data:");
      console.log("    - Formats:", Array.from(formats).join(", ") || "none");
      console.log("    - Authors:", Array.from(authorNames).join(", ") || "none");
      console.log("    - Factions:", Array.from(factionNames).join(", ") || "none");
      console.log("    - Eras:", Array.from(eraNames).join(", ") || "none");

      // Keep full Sanity image structure for urlFor() to work with hotspot/crop
      const processedImage: ImageRef = {
        asset: image?.asset ?? null,
        hotspot: image?.hotspot ?? null,
        crop: image?.crop ?? null,
        alt: image?.alt ?? null,
      };

      console.log("  ✓ Processed image:", processedImage.asset?._ref ? "✓" : "✗");

      // Build Algolia document
      const document: AlgoliaSeries = {
        title: title || "",
        slug: typeof slug === "object" ? slug?.current || "" : slug || "",
        subtitle: hardTrim(subtitle || "", 500),
        image: processedImage,

        // Consistent field names with books/authors indices
        format: Array.from(formats),
        "authors.slug": Array.from(authorSlugs),
        "authors.name": Array.from(authorNames),
        "factions.slug": Array.from(factionSlugs),
        "factions.name": Array.from(factionNames),
        "era.slug": Array.from(eraSlugs),
        "era.name": Array.from(eraNames),
        bookCount: books.length,

        _createdAt,
        _updatedAt,
      };

      // Check document size
      const documentSize = JSON.stringify(document).length;
      if (documentSize > 9000) {
        console.warn(
          `⚠️  Series ${_id} is ${documentSize} bytes (close to 10KB limit)`
        );
      }

      // Log what we're sending
      console.log("\n📤 Sending to Algolia:");
      console.log("  - Title:", document.title);
      console.log("  - Slug:", document.slug);
      console.log("  - Book count:", document.bookCount);
      console.log("  - Formats:", document.format.join(", ") || "none");
      console.log("  - Authors:", document["authors.name"].join(", ") || "none");
      console.log("  - Factions:", document["factions.name"].join(", ") || "none");
      console.log("  - Eras:", document["era.name"].join(", ") || "none");
      console.log("  - Image:", processedImage.asset?._ref ? "✓" : "✗");

      await algolia.addOrUpdateObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
        body: document,
      });

      console.log(`\n✅ Synced series ${_id} ("${document.title}") to Algolia`);

      // its books: current members, and any the books index still lists under it
      const memberIds: string[] = books.map((b: any) => b._id).filter(Boolean);
      await refreshBookSeries(algolia, sanityClient, [...memberIds, ...(await booksListedUnder(algolia, title))]);
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