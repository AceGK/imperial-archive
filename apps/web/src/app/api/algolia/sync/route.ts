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

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID!;
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
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

// All published books that reference an author
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

  // Handle author edits by re-indexing all related books
  if (type === 'author40k') {
    if (!id) return NextResponse.json({ ok: true, skipped: true, reason: 'no-author-id' });

    // Fetch all published books that reference this author
    const books = await sanity.fetch(BOOKS_BY_AUTHOR, { authorId: id });
    if (!Array.isArray(books) || books.length === 0) {
      return NextResponse.json({ ok: true, action: 'reindex-author', upserted: 0 });
    }

    const objects = books.map(mapToAlgolia).filter(Boolean) as AlgoliaBook[];
    if (objects.length) {
      await algolia.saveObjects({
        indexName: INDEX_NAME,
        objects: objects as unknown as Record<string, unknown>[],
      });
    }
    return NextResponse.json({
      ok: true,
      action: 'reindex-author',
      authorId: id,
      upserted: objects.length,
    });
  }

  // Only process individual book changes here
  if (type && type !== 'book40k') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'non-book40k' });
  }

  // Explicit delete/unpublish for a book
  if ((op === 'delete' || op === 'unpublish') && id) {
    await algolia.deleteObject({ indexName: INDEX_NAME, objectID: id });
    return NextResponse.json({ ok: true, action: 'delete', id });
  }

  // Upsert a single book
  if (id) {
    const doc = await sanity.fetch(BOOK_BY_ID, { id });
    if (!doc) {
      // No published doc found; skip delete (could be draft save)
      return NextResponse.json({ ok: true, action: 'skip-no-published', id });
    }
    const obj = mapToAlgolia(doc);
    if (!obj) {
      return NextResponse.json({ ok: true, action: 'skip-null-map', id });
    }
    await algolia.saveObjects({
      indexName: INDEX_NAME,
      objects: [obj] as unknown as Record<string, unknown>[],
    });
    return NextResponse.json({ ok: true, action: 'upsert', id });
  }

  // Batch (mutations feed) fallback
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
    await algolia.saveObjects({
      indexName: INDEX_NAME,
      objects: toUpsert as unknown as Record<string, unknown>[],
    });
  }
  for (const rid of deletedIds) {
    const pid = stripDraft(rid);
    if (pid) await algolia.deleteObject({ indexName: INDEX_NAME, objectID: pid });
  }

  return NextResponse.json({ ok: true, upserted: toUpsert.length, deleted: deletedIds.length });
}