// apps/web/src/app/api/algolia/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSanity } from "@sanity/client";
import { algoliasearch } from "algoliasearch";

export const runtime = "nodejs";

/* ----------------------------- env ----------------------------- */
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID!;
const ALGOLIA_API_KEY =
  process.env.ALGOLIA_WRITE_API_KEY || process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = (process.env.ALGOLIA_INDEX_PREFIX || "") + "books40k";

// Keep the same secret name you were using before so your existing webhook keeps working
const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET!;

// Prefer the same SANITY_* envs you used previously
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const SANITY_DATASET = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const SANITY_API_VERSION = process.env.SANITY_API_VERSION || "2024-01-01";

// Optional token (only needed for private dataset)
const SANITY_TOKEN =
  process.env.SANITY_API_READ_TOKEN || process.env.NEXT_PUBLIC_SANITY_API_READ_TOKEN;

/* --------------------------- clients --------------------------- */
const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
const sanity = createSanity({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  token: SANITY_TOKEN,
  perspective: "published",
  useCdn: false,
});

/* ----------------------------- GROQ ---------------------------- */
const BOOK_BY_ID = `
*[
  _id == $id &&
  _type == "book40k"
][0]{
  _id,
  "slug": slug.current,
  title,
  "authors": coalesce(authors[]->name, []),
  "era": era->title,
  format,
  publicationDate,
  "coverUrl": image.asset->url,
  description,
  story
}
`;

const BOOKS_BY_AUTHOR = `
*[
  _type == "book40k" &&
  references($authorId)
]{
  _id,
  "slug": slug.current,
  title,
  "authors": coalesce(authors[]->name, []),
  "era": era->title,
  format,
  publicationDate,
  "coverUrl": image.asset->url,
  description,
  story
}
`;

const BOOKS_BY_FACTION = `
*[
  _type == "book40k" &&
  references($factionId)
]{
  _id,
  "slug": slug.current,
  title,
  "authors": coalesce(authors[]->name, []),
  "era": era->title,
  format,
  publicationDate,
  "coverUrl": image.asset->url,
  description,
  story
}
`;

const ALL_PUBLISHED_BOOKS = `
*[
  _type == "book40k" &&
  !(_id in path("drafts.**")) &&
  defined(slug.current)
]{
  _id,
  "slug": slug.current,
  title,
  "authors": coalesce(authors[]->name, []),
  "era": era->title,
  format,
  publicationDate,
  "coverUrl": image.asset->url,
  description,
  story
}
`;

/* ----------------------------- utils --------------------------- */
const stripDraft = (id?: string) =>
  id?.startsWith("drafts.") ? id.slice(7) : id;

type AlgoliaBook = {
  objectID: string;
  slug: string | null;
  title: string;
  authors: string[];
  era: string | null;
  format: string | null;
  publicationDate: string | null;
  publicationYear: number | null;
  coverUrl: string | null;
  excerpt: string;
};

function mapToAlgolia(b: any): AlgoliaBook | null {
  if (!b) return null;

  const year =
    typeof b.publicationDate === "string" && b.publicationDate.length >= 4
      ? parseInt(b.publicationDate.slice(0, 4), 10)
      : null;

  const excerptSrc =
    typeof b.description === "string" && b.description.length
      ? b.description
      : typeof b.story === "string" && b.story.length
      ? b.story
      : "";

  return {
    objectID: String(b._id),
    slug: b.slug ?? null,
    title: b.title ?? "",
    authors: Array.isArray(b.authors) ? (b.authors as string[]).filter(Boolean) : [],
    era: b.era ?? null,
    format: b.format ?? null,
    publicationDate: b.publicationDate ?? null,
    publicationYear: Number.isFinite(year) ? year : null,
    coverUrl: b.coverUrl ?? null,
    excerpt: excerptSrc.slice(0, 200),
  };
}

async function upsertBooks(objs: AlgoliaBook[]) {
  if (!objs.length) return { upserted: 0 };
  console.log(`[Algolia] saveObjects x${objs.length} → ${INDEX_NAME}`);
  await algolia.saveObjects({ indexName: INDEX_NAME, objects: objs as any[] });
  return { upserted: objs.length };
}

async function deleteBooks(ids: string[]) {
  const clean = ids.map(stripDraft).filter(Boolean) as string[];
  if (!clean.length) return { deleted: 0 };
  console.log(`[Algolia] deleteObjects x${clean.length} → ${INDEX_NAME}`);
  await algolia.deleteObjects({ indexName: INDEX_NAME, objectIDs: clean });
  return { deleted: clean.length };
}

/* ---------------------------- handlers ------------------------- */
export async function POST(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!SANITY_WEBHOOK_SECRET || secret !== SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Parse body but keep it permissive (Sanity can send different shapes)
  const body = await req.json().catch(() => ({} as any));
  const op: string | undefined = body?.operation; // "create" | "update" | "delete" | "publish" | "unpublish" | ...
  const rawId: string | undefined = body?._id || body?.documentId || body?.id;
  const type: string | undefined = body?._type;

  console.log("[Webhook] op=%s id=%s type=%s", op, rawId, type);

  // 1) Author or Faction changed → reindex all related books
  if (type === "author40k" || type === "faction40k") {
    const id = stripDraft(rawId);
    if (!id) return NextResponse.json({ ok: true, skipped: "no-id" });

    const query = type === "author40k" ? BOOKS_BY_AUTHOR : BOOKS_BY_FACTION;
    const key = type === "author40k" ? "authorId" : "factionId";

    const books = (await sanity.fetch(query, { [key]: id })) as any[];
    console.log(
      `[Reindex ${type}] related books=${books?.length ?? 0} for id=${id}`
    );

    const objects = (books || []).map(mapToAlgolia).filter(Boolean) as AlgoliaBook[];
    const res = await upsertBooks(objects);
    return NextResponse.json({ ok: true, action: `reindex-${type}`, ...res });
  }

  // 2) Explicit delete/unpublish for a book
  if ((op === "delete" || op === "unpublish") && rawId) {
    const id = stripDraft(rawId)!;
    const res = await deleteBooks([id]);
    return NextResponse.json({ ok: true, action: "delete", id, ...res });
  }

  // 3) Single-book upsert on create/update/publish
  if (rawId && (op === "create" || op === "update" || op === "publish")) {
    const id = stripDraft(rawId)!;
    const doc = await sanity.fetch(BOOK_BY_ID, { id });
    if (!doc) {
      console.log("[Upsert] no published doc for id=%s (skip)", id);
      return NextResponse.json({ ok: true, action: "skip-no-published", id });
    }
    const obj = mapToAlgolia(doc);
    if (!obj) return NextResponse.json({ ok: true, action: "skip-null-map", id });
    const res = await upsertBooks([obj]);
    return NextResponse.json({ ok: true, action: "upsert", id, ...res });
  }

  // 4) Batch mode (webhook set to “IDs”)
  const updatedIds: string[] = body?.ids?.updated || body?.ids?.created || [];
  const deletedIds: string[] = body?.ids?.deleted || [];

  if ((updatedIds?.length || 0) > 0 || (deletedIds?.length || 0) > 0) {
    console.log("[Batch] updated+created=%d deleted=%d", updatedIds.length, deletedIds.length);

    const toUpsert: AlgoliaBook[] = [];
    for (const rid of updatedIds) {
      const id = stripDraft(rid);
      if (!id) continue;
      const d = await sanity.fetch(BOOK_BY_ID, { id });
      const m = mapToAlgolia(d);
      if (m) toUpsert.push(m);
    }

    const up = await upsertBooks(toUpsert);
    const del = await deleteBooks(deletedIds);

    return NextResponse.json({ ok: true, action: "batch", ...up, ...del });
  }

  // 5) Nothing actionable
  console.log("[Webhook] no actionable change", body);
  return NextResponse.json({ ok: true, skipped: true });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const reindex = url.searchParams.get("reindex");

  if (!SANITY_WEBHOOK_SECRET || secret !== SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Manual full reindex if requested
  if (reindex === "1" || reindex === "true") {
    const docs = (await sanity.fetch(ALL_PUBLISHED_BOOKS)) as any[];
    const objects = (docs || []).map(mapToAlgolia).filter(Boolean) as AlgoliaBook[];

    if (!objects.length) {
      console.log("[Reindex] no documents to index");
      return NextResponse.json({ ok: true, indexed: 0, index: INDEX_NAME });
    }

    console.log(`[Reindex] saveObjects x${objects.length} → ${INDEX_NAME}`);
    await algolia.saveObjects({ indexName: INDEX_NAME, objects: objects as any[] });
    return NextResponse.json({ ok: true, indexed: objects.length, index: INDEX_NAME });
  }

  return NextResponse.json({ ok: true, message: "Pass ?reindex=1 to rebuild the index." });
}
