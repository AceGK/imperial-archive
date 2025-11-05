// apps/web/scripts/seedAlgolia.js
require('dotenv').config({ path: '.env.local' });

const { algoliasearch } = require('algoliasearch');
const { createClient } = require('@sanity/client');

const algolia = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_WRITE_API_KEY // or ADMIN
);

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.NEXT_PUBLIC_SANITY_API_READ_TOKEN, // optional if dataset public
  useCdn: false,
});

const INDEX = `${process.env.ALGOLIA_INDEX_PREFIX}books40k`;

// GROQ query
const QUERY = `
*[_type == "book40k" && !(_id match "drafts.*")]{
  _id,
  "slug": slug.current,
  title,
  "authors": authors[]->name,
  "era": era->title,
  format,
  publicationDate,
  "coverUrl": image.asset->url,
  description,
  story
}
`;

function mapAlgolia(b) {
  const year = b.publicationDate?.slice(0, 4);
  const excerpt = b.description || b.story || '';

  return {
    objectID: b._id,
    slug: b.slug,
    title: b.title,
    authors: b.authors || [],
    era: b.era,
    format: b.format,
    publicationDate: b.publicationDate,
    publicationYear: year ? parseInt(year, 10) : null,
    coverUrl: b.coverUrl,
    excerpt: excerpt.slice(0, 200),
  };
}

(async () => {
  console.log('📚 Fetching books from Sanity...');
  const docs = await sanity.fetch(QUERY);
  const objects = docs.map(mapAlgolia);

  console.log(`🚀 Sending ${objects.length} docs to Algolia index "${INDEX}"...`);
  await algolia.saveObjects({ indexName: INDEX, objects });

  console.log(`✅ Synced ${objects.length} books`);
})();
