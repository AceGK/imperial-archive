// apps/web/src/app/api/algolia/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { algoliasearch } from 'algoliasearch';
import { createClient as createSanity } from '@sanity/client';

/** Ensure Node runtime */
export const runtime = 'nodejs';

/* ----------------------------- env ----------------------------- */
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID!;
const ALGOLIA_API_KEY =
  process.env.ALGOLIA_WRITE_API_KEY || process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = (process.env.ALGOLIA_INDEX_PREFIX || '') + 'books40k'; // align with seeder

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const SANITY_API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';
const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET!;

/* --------------------------- clients --------------------------- */
const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);
const sanity = createSanity({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  perspective: 'published',
  useCdn: false,
});

/* ----------------------------- GROQ ---------------------------- */
const BOOK_BY_ID = `
*[_id == $id && _type == "book40k"][0]{
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

/* ---------------------------- types ---------------------------- */
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

/* ----------------------------- map ----------------------------- */
function mapToAlgolia(b: any): AlgoliaBook | null {
  if (!b) return null;
  const year =
    typeof b.publicationDate === 'string' && b.publicationDate.length >= 4
      ? parseInt(b.publicationDate.slice(0, 4), 10)
      : null;

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
    authors: Array.isArray(b.authors) ? (b.authors as string[]) : [],
    era: b.era ?? null,
    format: b.format ?? null,
    publicationDate: b.publicationDate ?? null,
    publicationYear: Number.isFinite(year) ? year : null,
    coverUrl: b.coverUrl ?? null,
    excerpt: excerptSrc.slice(0, 200),
  };
}

/* ---------------------------- handler -------------------------- */
export async function POST(req: NextRequest) {
  // Secret check (query param ?secret=...)
  const secret = new URL(req.url).searchParams.get('secret');
  if (!SANITY_WEBHOOK_SECRET || secret !== SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));

  // Common Sanity shapes
  const op: string | undefined = body?.operation;
  const docId: string | undefined = body?._id || body?.documentId || body?.id;

  // Delete/unpublish => remove from Algolia
  if (op === 'delete' || op === 'unpublish') {
    if (docId) await algolia.deleteObject({ indexName: INDEX_NAME, objectID: docId });
    return NextResponse.json({ ok: true, action: 'delete', id: docId });
  }

  // Single upsert (create/update)
  if (docId) {
    const doc = await sanity.fetch(BOOK_BY_ID, { id: docId });
    if (!doc) {
      await algolia.deleteObject({ indexName: INDEX_NAME, objectID: docId });
      return NextResponse.json({ ok: true, action: 'delete-missing', id: docId });
    }
    const obj = mapToAlgolia(doc);
    if (!obj) {
      await algolia.deleteObject({ indexName: INDEX_NAME, objectID: docId });
      return NextResponse.json({ ok: true, action: 'delete-null', id: docId });
    }
    await algolia.saveObjects({ indexName: INDEX_NAME, objects: [obj] });
    return NextResponse.json({ ok: true, action: 'upsert', id: docId });
  }

  // Batch (mutations feed)
  const updatedIds: string[] = body?.ids?.updated || body?.ids?.created || [];
  const deletedIds: string[] = body?.ids?.deleted || [];

  const toUpsert: AlgoliaBook[] = [];
  for (const id of updatedIds) {
    const d = await sanity.fetch(BOOK_BY_ID, { id });
    const m = mapToAlgolia(d);
    if (m) toUpsert.push(m);
  }
  if (toUpsert.length) {
    await algolia.saveObjects({ indexName: INDEX_NAME, objects: toUpsert });
  }
  for (const id of deletedIds) {
    await algolia.deleteObject({ indexName: INDEX_NAME, objectID: id });
  }

  return NextResponse.json({ ok: true, upserted: toUpsert.length, deleted: deletedIds.length });
}
