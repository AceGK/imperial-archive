// apps/web/src/app/api/algolia/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { algoliasearch } from 'algoliasearch';
import { createClient as createSanity } from '@sanity/client';

export const runtime = 'nodejs';

/* ----------------------------- env ----------------------------- */
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID!;
const ALGOLIA_API_KEY = process.env.ALGOLIA_WRITE_API_KEY || process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = (process.env.ALGOLIA_INDEX_PREFIX || '') + 'books40k';

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID!;
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_API_VERSION = process.env.SANITY_API_VERSION || '2024-01-01';
const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET!;
const SYNC_DEBUG = process.env.SYNC_DEBUG === '1';

/* --------------------------- clients --------------------------- */
const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

// Gatekeeper: is there a published doc with this id?
const sanityPublished = createSanity({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  perspective: 'published',
  useCdn: false,
});

// Full payload for indexing (resolves refs reliably while you edit)
const sanityPreview = createSanity({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  perspective: 'previewDrafts',
  useCdn: false,
});

/* ----------------------------- GROQ ---------------------------- */
const BOOK_PUBLISHED_CHECK = `*[_id == $id && _type == "book40k"][0]._id`;

const BOOK_FOR_INDEX = `
*[_id == $id && _type == "book40k"][0]{
  _id,
  "slug": slug.current,
  title,
  // produce a clean array of strings with no nulls
  "authors": array::compact(authors[]->coalesce(name, title)),
  "era": era->title,
  format,
  publicationDate,
  "coverUrl": image.asset->url,
  description,
  story
}
`;

/* ----------------------------- utils --------------------------- */
const stripDraft = (id?: string) => (id?.startsWith('drafts.') ? id.slice(7) : id);

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

  const publicationYear =
    typeof b.publicationDate === 'string' && b.publicationDate.length >= 4
      ? Number.parseInt(b.publicationDate.slice(0, 4), 10)
      : null;

  const authors: string[] = Array.isArray(b.authors)
    ? b.authors
        .map((a: any) => (typeof a === 'string' ? a : a?.name ?? a?.title ?? null))
        .filter(Boolean)
    : [];

  const excerptSrc =
    typeof b.description === 'string' && b.description.length
      ? b.description
      : typeof b.story === 'string' && b.story.length
      ? b.story
      : '';

  return {
    objectID: String(b._id),
    slug: b.slug ?? null,
    title: b.title ?? '',
    authors,
    era: b.era ?? null,
    format: b.format ?? null,
    publicationDate: b.publicationDate ?? null,
    publicationYear: Number.isFinite(publicationYear) ? publicationYear : null,
    coverUrl: b.coverUrl ?? null,
    excerpt: excerptSrc.slice(0, 200),
  };
}

async function upsertBook(publishedId: string) {
  const doc = await sanityPreview.fetch(BOOK_FOR_INDEX, { id: publishedId });
  if (SYNC_DEBUG) console.log('[sync] fetched for index:', JSON.stringify(doc));
  const obj = mapToAlgolia(doc);
  if (!obj) return { ok: true, action: 'skip-null-map', id: publishedId };

  await algolia.saveObjects({
    indexName: INDEX_NAME,
    objects: [obj] as unknown as Record<string, unknown>[],
  });
  return { ok: true, action: 'upsert', id: publishedId };
}

/* ---------------------------- handler -------------------------- */
export async function POST(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (!SANITY_WEBHOOK_SECRET || secret !== SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const op: string | undefined = body?.operation;               // may be undefined depending on webhook config
  const rawId: string | undefined = body?._id || body?.documentId || body?.id;
  const id = stripDraft(rawId);
  const typ: string | undefined = body?._type;

  if (SYNC_DEBUG) {
    console.log('[sync] payload:', JSON.stringify(body));
    console.log('[sync] derived:', { op, id, typ });
  }

  // Only process book docs; if _type missing, we'll infer via a quick fetch
  let effectiveType = typ;
  if (!effectiveType && id) {
    // Ask Sanity what type this id is (published perspective)
    effectiveType = await sanityPublished.fetch<string | null>(
      `*[_id == $id][0]._type`,
      { id }
    ) || undefined;
    if (SYNC_DEBUG) console.log('[sync] inferred _type:', effectiveType);
  }

  if (effectiveType && effectiveType !== 'book40k') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'non-book40k' });
  }

  // Explicit deletion/unpublish
  if ((op === 'delete' || op === 'unpublish') && id) {
    if (SYNC_DEBUG) console.log('[sync] delete', id);
    await algolia.deleteObject({ indexName: INDEX_NAME, objectID: id });
    return NextResponse.json({ ok: true, action: 'delete', id });
  }

  // Upsert path: if we have an id, only upsert when a published doc exists
  if (id) {
    const publishedId = await sanityPublished.fetch<string | null>(BOOK_PUBLISHED_CHECK, { id });
    if (SYNC_DEBUG) console.log('[sync] published check', { id, publishedId });
    if (!publishedId) {
      // Likely a draft save on a not-yet-published book: do nothing
      return NextResponse.json({ ok: true, action: 'skip-no-published', id });
    }
    const result = await upsertBook(publishedId);
    return NextResponse.json(result);
  }

  // Mutations feed batch fallback
  const updatedIds: string[] = body?.ids?.updated || body?.ids?.created || [];
  const deletedIds: string[] = body?.ids?.deleted || [];

  let upserted = 0;

  for (const rid of updatedIds) {
    const pid = stripDraft(rid);
    if (!pid) continue;
    const publishedId = await sanityPublished.fetch<string | null>(BOOK_PUBLISHED_CHECK, { id: pid });
    if (!publishedId) continue;
    const res = await upsertBook(publishedId);
    if (res.action === 'upsert') upserted += 1;
  }

  for (const rid of deletedIds) {
    const pid = stripDraft(rid);
    if (pid) await algolia.deleteObject({ indexName: INDEX_NAME, objectID: pid });
  }

  return NextResponse.json({ ok: true, upserted, deleted: deletedIds.length });
}
