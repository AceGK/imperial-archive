// apps/web/src/app/api/algolia/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { algoliasearch } from 'algoliasearch';
import { createClient as createSanity } from '@sanity/client';

export const runtime = 'nodejs';

/* ----------------------------- env ----------------------------- */
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID!;
const ALGOLIA_API_KEY =
  process.env.ALGOLIA_WRITE_API_KEY || process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = (process.env.ALGOLIA_INDEX_PREFIX || '') + 'books40k';

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID!;            // <-- server vars
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';   // <-- server vars
const SANITY_API_VERSION = process.env.SANITY_API_VERSION || '2024-01-01';
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

/* ----------------------------- utils --------------------------- */
const stripDraft = (id?: string) => id?.startsWith('drafts.') ? id.slice(7) : id;

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
  // Secret check
  const secret = new URL(req.url).searchParams.get('secret');
  if (!SANITY_WEBHOOK_SECRET || secret !== SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const op: string | undefined = body?.operation;
  const rawId: string | undefined = body?._id || body?.documentId || body?.id;
  const id = stripDraft(rawId);
  const type = body?._type;

  // Process ONLY book40k
  if (type && type !== 'book40k') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'non-book40k' });
  }

  // Explicit deletes/unpublish: delete published ID (not draft)
  if (op === 'delete' || op === 'unpublish') {
    if (id) await algolia.deleteObject({ indexName: INDEX_NAME, objectID: id });
    return NextResponse.json({ ok: true, action: 'delete', id });
  }

  // Upsert (create/update). If id is draft-only (no published), do NOT delete.
  if (id) {
    const doc = await sanity.fetch(BOOK_BY_ID, { id });
    if (!doc) {
      // No published doc found. Skip delete; it might be an unpublished draft save.
      return NextResponse.json({ ok: true, action: 'skip-no-published', id });
    }
    const obj = mapToAlgolia(doc);
    if (!obj) {
      // Mapping failed. Do not delete; just skip.
      return NextResponse.json({ ok: true, action: 'skip-null-map', id });
    }
    await algolia.saveObjects({ indexName: INDEX_NAME, objects: [obj] });
    return NextResponse.json({ ok: true, action: 'upsert', id });
  }

  // Batch form (mutations feed)
  const updatedIds: string[] = body?.ids?.updated || body?.ids?.created || [];
  const deletedIds: string[] = body?.ids?.deleted || [];

  const toUpsert: AlgoliaBook[] = [];
  for (const rid of updatedIds) {
    const pid = stripDraft(rid);
    const d = await sanity.fetch(BOOK_BY_ID, { id: pid });
    const m = mapToAlgolia(d);
    if (m) toUpsert.push(m);
  }
  if (toUpsert.length) {
    await algolia.saveObjects({ indexName: INDEX_NAME, objects: toUpsert });
  }
  for (const rid of deletedIds) {
    const pid = stripDraft(rid);
    await algolia.deleteObject({ indexName: INDEX_NAME, objectID: pid! });
  }

  return NextResponse.json({ ok: true, upserted: toUpsert.length, deleted: deletedIds.length });
}