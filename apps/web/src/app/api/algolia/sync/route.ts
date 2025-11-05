// apps/web/src/app/api/algolia/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSanity } from "@sanity/client";
import { algoliasearch, type SearchClient } from "algoliasearch";
import indexer from "sanity-algolia";

export const runtime = "nodejs";

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID!;
const ALGOLIA_API_KEY =
  process.env.ALGOLIA_WRITE_API_KEY || process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = `${process.env.ALGOLIA_INDEX_PREFIX || ""}books40k`;
const WEBHOOK_SECRET = process.env.ALGOLIA_SECRET!;

const sanity = createSanity({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: process.env.NEXT_PUBLIC_SANITY_API_READ_TOKEN,
  useCdn: false,
});

const client: SearchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

/**
 * v5 → v4 "index" shim for sanity-algolia
 * Implements only the methods sanity-algolia uses.
 */
function indexShim(indexName: string) {
  return {
    // v4 signature: saveObjects(objects, opts?)
    saveObjects(objects: any[]) {
      return client.saveObjects({ indexName, objects });
    },
    // v4: partialUpdateObjects(objects, opts?)
    partialUpdateObjects(objects: any[]) {
      return client.partialUpdateObjects({ indexName, objects });
    },
    // v4: deleteObjects(objectIDs, opts?)
    deleteObjects(objectIDs: string[]) {
      return client.deleteObjects({ indexName, objectIDs });
    },
    // Some versions might call saveObject/deleteObject
    saveObject(object: any) {
      return client.saveObjects({ indexName, objects: [object] });
    },
    deleteObject(objectID: string) {
      return client.deleteObjects({ indexName, objectIDs: [objectID] });
    },
  };
}

const index = indexShim(INDEX_NAME);

const BOOK_PROJECTION = `
{
  "objectID": _id,
  _type,
  _rev,
  "slug": slug.current,
  title,
  "authors": authors[]->name,
  "era": era->title,
  "factions": factions[]->title,
  format,
  publicationDate,
  "coverUrl": image.asset->url,
  description,
  story
}
`;

function mapToAlgolia(doc: any) {
  const year =
    typeof doc.publicationDate === "string" ? doc.publicationDate.slice(0, 4) : null;
  const excerpt = (doc.description || doc.story || "") as string;

  return {
    objectID: doc.objectID,
    slug: doc.slug || null,
    title: doc.title || null,
    authors: Array.isArray(doc.authors) ? doc.authors.filter(Boolean) : [],
    era: doc.era || null,
    factions: Array.isArray(doc.factions) ? doc.factions.filter(Boolean) : [],
    format: doc.format || null,
    publicationDate: doc.publicationDate || null,
    publicationYear: year ? parseInt(year, 10) : null,
    coverUrl: doc.coverUrl || null,
    excerpt: excerpt.slice(0, 200),
  };
}

function isVisible(doc: any) {
  const isDraft =
    typeof doc.objectID === "string" && doc.objectID.startsWith("drafts.");
  return Boolean(doc.slug) && !isDraft;
}

const sanityAlgolia = indexer(
  {
    book40k: { index: index as any, projection: BOOK_PROJECTION },
  },
  mapToAlgolia,
  isVisible
);

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    if (!secret || secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await sanityAlgolia.webhookSync(sanity as any, body);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Algolia webhook sync failed:", err);
    return NextResponse.json(
      { error: "Sync failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    if (!secret || secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ALL_BOOKS_QUERY = `
      *[
        _type == "book40k" &&
        !(_id in path("drafts.**")) &&
        defined(slug.current)
      ] ${BOOK_PROJECTION}
    `;

    const docs = await sanity.fetch(ALL_BOOKS_QUERY);
    const objects = (Array.isArray(docs) ? docs : [])
      .filter(isVisible)
      .map(mapToAlgolia);

    if (!objects.length) {
      return NextResponse.json({ ok: true, indexed: 0 });
    }

    await client.saveObjects({ indexName: INDEX_NAME, objects });
    return NextResponse.json({ ok: true, indexed: objects.length, index: INDEX_NAME });
  } catch (err: any) {
    console.error("Algolia reindex failed:", err);
    return NextResponse.json(
      { error: "Reindex failed", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
