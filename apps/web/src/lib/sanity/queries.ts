import { groq } from "next-sanity";

/* -------------------------------------------------------------
   Shared format projection — "format" is pretty for UI, and
   "formatValue" keeps the raw stored value if you still need it.
-------------------------------------------------------------- */
const formatProjection = groq`
  "formatValue": format,
  "format": select(
    format == "novel" => "Novel",
    format == "novella" => "Novella",
    format == "short_story" => "Short Story",
    format == "audio_drama" => "Audio Drama",
    format == "anthology" => "Anthology",
    format == "omnibus" => "Omnibus",
    format == "graphic_novel" => "Graphic Novel",
    format == "audio_anthology" => "Audio Anthology",
    format == "other" => "Other",
    format
  )
`;

/* -------------------------------------------------------------
   Reusable book fields for cards/lists
   NOTE:
   - authors are returned as [{ name, slug }]
   - format is already pretty ("Short Story", etc.)
   - formatValue keeps raw ("short_story")
-------------------------------------------------------------- */
const bookCardFields = groq`
  _id,
  title,
  "slug": slug.current,

  // Authors with slug for linking
  "authors": coalesce(
    authors[]->{
      "name": name,
      "slug": slug.current
    },
    []
  ),

  // Pretty + raw format
  ${formatProjection},

  "publication_date": publicationDate,

  // Simple faction titles (cards usually don't need deep linking)
  "factions": coalesce(factions[]->title, []),

  // Image (card-size decisions are made in the component)
  image{
    alt, credit, crop, hotspot,
    asset->{ _id, url, metadata{ lqip, dimensions } }
  },

  description,
  story,

  // Series preview for chips
  "series": coalesce(
    *[_type == "series40k" && references(^._id)]{
      "name": title,
      "slug": slug.current,
      "number": items[work._ref == ^._id][0].number
    }, []
  )
`;

/* -------------------------------------------------------------
   POSTS
-------------------------------------------------------------- */
export const testPostsQuery = groq`
*[_type == "post" && !(_id match "drafts.*")]
| order(publishedAt desc)[0...20]{
  _id, title, slug, publishedAt,
  mainImage{asset->{url}},
  "authorName": author->name,
  categories[]->{title}
}
`;

export const postsQuery = groq`
*[_type == "post"] | order(publishedAt desc)[0...20]{
  _id, title, slug, mainImage, publishedAt,
  "authorName": author->name,
  categories[]->{title}
}
`;

/* -------------------------------------------------------------
   AUTHORS
-------------------------------------------------------------- */
export const all40kAuthorsQuery = groq`
*[_type == "author40k"] | order(name asc){
  _id,
  name,
  "slug": slug.current,
  image{
    "url": asset->url,
    "lqip": asset->metadata.lqip,
    "aspect": asset->metadata.dimensions.aspectRatio
  },
  bio,
  links[]{type,url}
}
`;

export const single40kAuthorQuery = groq`
*[_type == "author40k" && slug.current == $slug][0]{
  _id,
  name,
  "slug": slug.current,
  image{
    ...,
    "lqip": asset->metadata.lqip,
    "aspect": asset->metadata.dimensions.aspectRatio
  },
  bio,
  links[]{type, url}
}
`;

export const authors40kForCardsQuery = groq`
*[_type == "author40k" && !(_id match "drafts.*")]{
  name,
  "slug": slug.current,
  image{
    "url": asset->url,
    "lqip": asset->metadata.lqip,
    "aspect": asset->metadata.dimensions.aspectRatio
  }
}
`;

export const featuredAuthors40kQuery = groq`
*[_type == "author40k" && !(_id match "drafts.*") && name in $names]{
  _id,
  name,
  "slug": slug.current,
  image{
    "url": asset->url,
    "lqip": asset->metadata.lqip,
    "aspect": asset->metadata.dimensions.aspectRatio
  },
  "count": count(*[_type == "book40k" && references(^._id)])
}
`;

/* -------------------------------------------------------------
   FACTIONS & ERAS
-------------------------------------------------------------- */
export const groupedFactions40kQuery = groq`
*[_type == "factionGroup40k" && !(_id match "drafts.*")]
| order(orderRank asc){
  _id,
  title,
  "slug": slug.current,
  iconId,
  description,
  links[]{type,url},

  "items": *[_type == "faction40k" && !(_id match "drafts.*") && references(^._id)]
    | order(orderRank asc){
      _id,
      title,
      "slug": slug.current,
      iconId,
      description,
      links[]{type,url}
    }
}
`;

export const factions40kForCardsQuery = groq`
*[_type == "faction40k" && !(_id match "drafts.*")]
| order(orderRank asc){
  _id,
  title,
  "slug": slug.current,
  iconId,
  description,
  "groupKey": group->slug.current,
  "groupTitle": group->title
}
`;

export const singleFaction40kQuery = groq`
*[_type == "faction40k" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  iconId,
  description,
  links[]{type,url},
  "group": group->{
    _id,
    title,
    "slug": slug.current,
    iconId
  }
}
`;

export const factionGroups40kQuery = groq`
*[_type == "factionGroup40k" && !(_id match "drafts.*")]
| order(orderRank asc){
  _id,
  title,
  "slug": slug.current,
  iconId,
  description,
  links[]{type,url}
}
`;

export const factionPairs40kQuery = groq`
*[
  _type == "faction40k"
  && defined(slug.current)
  && defined(group->slug.current)
]{
  "group": group->slug.current,
  "slug": slug.current
}
`;

/* fixed structure that caused the previous parse error */
export const singleFaction40kBySlugsQuery = groq`
*[
  _type == "faction40k"
  && slug.current == $slug
  && group->slug.current == $group
][0]{
  _id,
  title,
  "slug": slug.current,
  iconId,
  description,
  links[]{type, url},

  "group": {
    "title": group->title,
    "slug": group->slug.current,
    "iconId": group->iconId,
    "links": group->links
  }
}
`;

export const all40kErasQuery = groq`
*[_type == "era40k" && !(_id match "drafts.*")]
| order(orderRank){
  _id,
  title,
  "slug": slug.current,
  period,
  description,
  image{
    alt,
    credit,
    "url": asset->url,
    "lqip": asset->metadata.lqip,
    "aspect": asset->metadata.dimensions.aspectRatio
  }
}
`;

export const single40kEraQuery = groq`
*[_type == "era40k" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  period,
  description,
  image{
    alt,
    credit,
    "url": asset->url,
    "lqip": asset->metadata.lqip,
    "aspect": asset->metadata.dimensions.aspectRatio
  }
}
`;

/* -------------------------------------------------------------
   BOOKS
-------------------------------------------------------------- */
export const allBooks40kQuery = groq`
*[_type == "book40k" && !(_id match "drafts.*")]
| order(_createdAt asc){
  _id,
  _createdAt,
  title,
  "slug": slug.current,

  // author names only for large lists (keep payload small)
  "author": coalesce(authors[]->name, []),

  "era": era->title,
  "factions": coalesce(factions[]->title, []),

  description,
  story,

  "publication_date": publicationDate,

  ${formatProjection},

  image{
    alt,
    credit,
    asset->{ _id, url, metadata{ dimensions } }
  },

  "series": coalesce(
    *[_type == "series40k" && references(^._id)]{
      "name": title,
      "slug": slug.current,
      "number": items[work._ref == ^._id][0].number
    }, []
  )
}
`;

export const bookSlugs40kQuery = groq`
*[_type == "book40k" && defined(slug.current)][] {
  "slug": slug.current
}
`;

export const bookBySlug40kQuery = groq`
*[_type == "book40k" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,

  // Detailed authors with slug for linking
  "authors": coalesce(
    authors[]->{
      "name": coalesce(name, title),
      "slug": slug.current
    },
    []
  ),

  "authorLabel": select(
    !defined(authors) || count(authors) == 0 => "Unknown",
    count(authors) == 1 => authors[0]->name,
    "Various Authors"
  ),

  ${formatProjection},

  "era": era->{ title, "slug": slug.current },

  // Factions with group slug for nested routes
  "factions": coalesce(
    factions[]->{
      title,
      "slug": slug.current,
      "groupSlug": group->slug.current
    },
    []
  ),

  description,
  story,

  "publication_date": publicationDate,
  "page_count": pageCount,

  "editions": coalesce(editions[]{isbn, note}, []),
  "links": coalesce(links[]{type, url}, []),

  image{
    alt,
    credit,
    asset->{ _id, url, metadata{ dimensions } }
  },

  "series": coalesce(
    *[_type == "series40k" && references(^._id)]{
      "name": title,
      "slug": slug.current,
      "number": items[work._ref == ^._id][0].number
    }, []
  )
}
`;

export const booksByAuthorSlug40kQuery = groq`
*[
  _type == "book40k"
  && references(*[_type == "author40k" && slug.current == $slug]._id)
]
| order(title asc){
  _id,
  title,
  "slug": slug.current,

  // names-only here is fine, or switch to authors[] if you want links
  "author": coalesce(authors[]->name, []),

  "era": era->title,
  "factions": coalesce(factions[]->title, []),

  "publication_date": publicationDate,

  ${formatProjection},

  image{
    alt,
    credit,
    asset->{ _id, url, metadata{ dimensions } }
  },

  "series": coalesce(
    *[_type == "series40k" && references(^._id)]{
      "name": title,
      "slug": slug.current,
      "number": items[work._ref == ^._id][0].number
    }, []
  )
}
`;

export const featuredBooks40kQuery = groq`
*[
  _type == "book40k"
  && !(_id match "drafts.*")
  && title in $titles
]{
  _id,
  title,
  "slug": slug.current,

  "author": coalesce(authors[]->name, []),

  "publication_date": publicationDate,

  ${formatProjection},

  image{
    alt,
    credit,
    asset->{ _id, url, metadata{ dimensions } }
  },

  "series": coalesce(
    *[_type == "series40k" && references(^._id)]{
      "name": title,
      "slug": slug.current,
      "number": items[work._ref == ^._id][0].number
    }, []
  )
}
`;

export const allSeries40kQuery = groq`
*[_type == "series40k"] | order(orderRank asc, title asc){
  _id,
  title,
  "slug": slug.current,
  description,
  image{
    alt, credit, crop, hotspot,
    asset->{ _id, url, metadata{ lqip, dimensions } }
  },
  "totalCount": count(lists[].items[]),
  lists[]{
    title,
    "key": key.current,
    description,
    items[]{
      "work": work->{ ${bookCardFields} }
    }
  },
  links
}
`;

export const series40kBySlugQuery = groq`
*[_type == "series40k" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  description,
  image{
    alt, credit, crop, hotspot,
    asset->{ _id, url, metadata{ lqip, dimensions } }
  },
  "totalCount": count(lists[].items[]),
  lists[]{
    title,
    "key": key.current,
    description,
    items[]{
      "work": work->{ ${bookCardFields} }
    }
  },
  links
}
`;

export const booksByFactionId40kQuery = groq`
*[
  _type == "book40k"
  && !(_id match "drafts.*")
  && references($factionId)
]
| order(publicationDate asc, title asc){
  ${bookCardFields}
}
`;
