import { NextRequest, NextResponse } from 'next/server';
import { algoliasearch } from 'algoliasearch';
import { createClient as createSanity } from '@sanity/client';

export const runtime = 'nodejs';

/* ---------- env ---------- */
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID!;
const ALGOLIA_API_KEY =
  process.env.ALGOLIA_WRITE_API_KEY || process.env.ALGOLIA_ADMIN_API_KEY!;
const INDEX_NAME = (process.env.ALGOLIA_INDEX_PREFIX || '') + 'books40k';

const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID!;
const SANITY_DATASET = process.env.SANITY_DATASET || 'production';
const SANITY_API_VERSION = process.env.SANITY_API_VERSION || '2024-01-01';
const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET!;

/* ---------- clients ---------- */
const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_API_KEY);

// Use `published` to gate that the book truly exists as published
const sanityPublished = createSanity({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  perspective: 'published',
  useCdn: false,
});

// Use `previewDrafts` to resolve referenced authors even if they currently have a draft
const sanityPreview = createSanity({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERSION,
  perspective: 'previewDrafts',
  useCdn: false,
});

/* ---------- GROQ ---------- */
// 1) Existence gate in published perspective
const BOOK_PUBLISHED_CHECK = `*[_id == $id && _type == "book40k"][0]._id`;

// 2) Payload for Algolia in previewDrafts (to resolve referenced drafts)
const BOOK_FOR_INDEX = `
*[_id == $id && _type == "book40k"][0]{
  _id,
  "slug": slug.current,
  title,
  "authors": array::compact(authors[]->coalesce(name, title)),
  "era": era->title,
  format,
  publicationDate,
  "coverUrl": image.asset->url,
  description,
  story
}
`;

// 3) When an author changes, reindex all published books that reference that author
const BOOKS_BY_AUTHOR_PUBLISHED = `
*[
  _type == "book40k" &&
  references($authorId)
]{
  _id
}
`;

/* ---------- utils ---------- */
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

  // Safety: ensure authors is an array of strings (no nulls)
  const authors: string[] = Array.isArray(b.authors)
    ? b.authors
        .map((x: any) => (typeof x === 'string' ? x : x?.name ?? x?.title ?? null))
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
  // Fetch payload with previewDrafts so referenced authors resolve even if author has a draft
  const doc = await sanityPreview.fetch(BOOK_FOR_INDEX, { id: publishedId });
  const obj = mapToAlgolia(doc);
  if (!obj) return { ok: true, action: 'skip-null-map', id: publishedId };

  await algolia.saveObjects({
    indexName: INDEX_NAME,
    objects: [obj] as unknown as Record<string, unknown>[],
  });
  return { ok: true, action: 'upsert', id: publishedId };
}

/* ---------- handler ---------- */
export async function POST(req: NextRequest) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (!SANITY_WEBHOOK_SECRET || secret !== SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const op: string | undefined = body?.operation;
  const type: string | undefined = body?._type;
  const rawId: string | undefined = body?._id || body?.documentId || body?.id;
  const id = stripDraft(rawId);

  // AUTHOR change → reindex all published books that reference that author
  if (type === 'author40k') {
    if (!id) return NextResponse.json({ ok: true, skipped: true, reason: 'no-author-id' });

    // Find the set of published book ids referencing this author (in published perspective)
    const bookIds: string[] = await sanityPublished.fetch(BOOKS_BY_AUTHOR_PUBLISHED, { authorId: id });
    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json({ ok: true, action: 'reindex-author', upserted: 0 });
    }

    let upserted = 0;
    for (const bid of bookIds) {
      const res = await upsertBook(bid);
      if (res.action === 'upsert') upserted += 1;
    }
    return NextResponse.json({ ok: true, action: 'reindex-author', authorId: id, upserted });
  }

  // Ignore other types except book40k
  if (type && type !== 'book40k') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'non-book40k' });
  }

  // Delete/unpublish a book → remove from Algolia
  if ((op === 'delete' || op === 'unpublish') && id) {
    await algolia.deleteObject({ indexName: INDEX_NAME, objectID: id });
    return NextResponse.json({ ok: true, action: 'delete', id });
  }

  // Create/update book → only index if published exists
  if (id) {
    const publishedId = await sanityPublished.fetch<string | null>(BOOK_PUBLISHED_CHECK, { id });
    if (!publishedId) {
      // Book is draft-only or unpublished: do nothing
      return NextResponse.json({ ok: true, action: 'skip-no-published', id });
    }
    const result = await upsertBook(publishedId);
    return NextResponse.json(result);
  }

  // Mutations feed fallback (batch)
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
