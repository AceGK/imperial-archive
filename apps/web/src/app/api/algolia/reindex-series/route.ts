// apps/web/src/app/api/algolia/reindex-series/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { algoliasearch } from 'algoliasearch';
import { createClient as createSanity } from '@sanity/client';

export const runtime = 'nodejs';

const algolia = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_WRITE_API_KEY || process.env.ALGOLIA_ADMIN_API_KEY!
);
const INDEX_NAME = (process.env.ALGOLIA_INDEX_PREFIX || '') + 'books40k';

const sanity = createSanity({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false,
  perspective: 'published',
});

// Any book that references the seriesId (works if your series schema stores refs to books)
const BOOKS_BY_SERIES = `
*[_type == "book40k" && references($seriesId)]{
  _id,
  "slug": slug.current,
  title,
  "authors": coalesce(authors[]->name, []),
  "era": era->title,
  format,
  publicationDate,
  "coverUrl": image.asset->url,
  description, story
}
`;

function map(b: any) {
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
    objectID: b._id,
    slug: b.slug ?? null,
    title: b.title ?? '',
    authors: Array.isArray(b.authors) ? b.authors : [],
    era: b.era ?? null,
    format: b.format ?? null,
    publicationDate: b.publicationDate ?? null,
    publicationYear: Number.isFinite(year) ? year : null,
    coverUrl: b.coverUrl ?? null,
    excerpt: excerptSrc.slice(0, 200),
  };
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get('secret') !== process.env.SANITY_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const seriesId = body?._id || body?.documentId || body?.id;
  if (!seriesId) return NextResponse.json({ ok: true, skipped: true });

  const books = await sanity.fetch(BOOKS_BY_SERIES, { seriesId });
  if (!Array.isArray(books) || books.length === 0) {
    return NextResponse.json({ ok: true, reindexed: 0 });
  }

  await algolia.saveObjects({ indexName: INDEX_NAME, objects: books.map(map) });
  return NextResponse.json({ ok: true, reindexed: books.length });
}
