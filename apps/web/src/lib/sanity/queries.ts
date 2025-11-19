import { groq } from "next-sanity";

/* -------------------------------------------------------------
   Shared format projection — pretty & raw format
-------------------------------------------------------------- */
const formatProjection = `
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
-------------------------------------------------------------- */
const bookCardFields = `
  _id,
  title,
  "slug": slug.current,

  "authors": coalesce(
    authors[]->{
      "name": coalesce(name, title),
      "slug": slug.current
    },
    []
  ),

  ${formatProjection},

  "publication_date": publicationDate,
  "factions": coalesce(factions[]->title, []),

  image{
    alt,
    credit,
    crop,
    hotspot,
    asset->{ _id, url, metadata{ lqip, dimensions } }
  },

  description,
  story,

  "series": coalesce(
    *[_type == "series40k" && references(^._id)]{
      "name": title,
      "slug": slug.current,
      "number": items[work._ref == ^._id][0].number
    },
    []
  )
`;

/* -------------------------------------------------------------
   POSTS
-------------------------------------------------------------- */
export const testPostsQuery = groq`
*[_type == "post" && !(_id match "drafts.*")]
| order(publishedAt desc)[0...20]{
  _id,
  title,
  slug,
  publishedAt,
  mainImage{ asset->{ url } },
  "authorName": author->name,
  categories[]->{ title }
}
`;

export const postsQuery = groq`
*[_type == "post"]
| order(publishedAt desc)[0...20]{
  _id,
  title,
  slug,
  mainImage,
  publishedAt,
  "authorName": author->name,
  categories[]->{ title }
}
`;

/* -------------------------------------------------------------
   AUTHORS
-------------------------------------------------------------- */
export const all40kAuthorsQuery = groq`
*[_type == "author40k"]
| order(name asc){
  _id,
  name,
  "slug": slug.current,
  image{
    "url": asset->url,
    "lqip": asset->metadata.lqip,
    "aspect": asset->metadata.dimensions.aspectRatio
  },
  bio,
  links[]{ type, url },
  "bookCount": count(*[_type == "book40k" && references(^._id)])
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
  links[]{ type, url }
}
`;

export const authors40kForCardsQuery = groq`
*[_type == "author40k" && !(_id match "drafts.*")]
{
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
   FACTIONS
-------------------------------------------------------------- */
export const groupedFactions40kQuery = groq`
*[_type == "factionGroup40k" && !(_id match "drafts.*")]
| order(orderRank asc){
  _id,
  title,
  "slug": slug.current,
  iconId,
  description,
  links[]{ type, url },

  "items": *[
    _type == "faction40k" &&
    !(_id match "drafts.*") &&
    references(^._id)
  ]
  | order(orderRank asc){
    _id,
    title,
    "slug": slug.current,
    iconId,
    description,
    links[]{ type, url }
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

export const singleFaction40kBySlugsQuery = groq`
*[
  _type == "faction40k" &&
  slug.current == $slug &&
  group->slug.current == $group
][0]{
  _id,
  title,
  "slug": slug.current,
  iconId,
  description,
  links[]{ type, url },

  "group": {
    "title": group->title,
    "slug": group->slug.current,
    "iconId": group->iconId,
    "links": group->links
  }
}
`;

/* -------------------------------------------------------------
   ERA
-------------------------------------------------------------- */
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
  ${bookCardFields}
}
`;

export const bookSlugs40kQuery = groq`
*[_type == "book40k" && defined(slug.current)]
[]{
  "slug": slug.current
}
`;

export const bookBySlug40kQuery = groq`
*[_type == "book40k" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,

  "authors": coalesce(
    authors[]->{
      _id,
      "name": coalesce(name, title),
      "slug": slug.current,
      "bio": pt::text(bio)
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

  "editions": coalesce(editions[]{ isbn, note }, []),
  "links": coalesce(links[]{ type, url }, []),

  image{
    alt,
    credit,
    asset->{ _id, url, metadata{ dimensions } }
  },

  "contents": coalesce(
    contents[]{
      "book": work->{
        _id,
        title,
        "slug": slug.current,
        "authors": coalesce(
          authors[]->{
            "name": coalesce(name, title),
            "slug": slug.current
          },
          []
        )
      }
    }.book,
    []
  ),
  
  "seriesNavigation": *[_type == "series40k" && references(^._id)]{
    "seriesSlug": slug.current,
    "seriesName": title,
    "lists": lists[]{
      "listName": title,
      "ordered": select(
        defined(ordered) => ordered,
        true
      ),
      "allBooks": items[]{
        "bookData": work->{
          _id,
          title,
          "slug": slug.current,
          image{
            asset->{ url },
            alt
          }
        }
      }.bookData
    }
  },
  
  "series": coalesce(
    *[_type == "series40k" && references(^._id)]{
      "name": title,
      "slug": slug.current,
      "number": items[work._ref == ^._id][0].number
    },
    []
  )
}
`;

export const booksByAuthorSlug40kQuery = groq`
*[
  _type == "book40k" &&
  references(*[_type == "author40k" && slug.current == $authorSlug]._id)
]
| order(publicationDate desc, title asc)[0...12]{
  ${bookCardFields}
}
`;

export const booksByEraSlug40kQuery = groq`
*[
  _type == "book40k" &&
  !(_id match "drafts.*") &&
  era->slug.current == $slug
]
| order(publicationDate asc, title asc){
  ${bookCardFields}
}
`;

export const featuredBooks40kQuery = groq`
*[
  _type == "book40k" &&
  !(_id match "drafts.*") &&
  title in $titles
]{
  ${bookCardFields}
}
`;

export const allSeries40kQuery = groq`
*[_type == "series40k"]
| order(orderRank asc, title asc){
  _id,
  title,
  "slug": slug.current,
  description,
  image{
    alt,
    credit,
    crop,
    hotspot,
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

export const booksBySeriesSlug40kQuery = groq`
*[
  _type == "series40k" && 
  slug.current == $seriesSlug
][0]{
  title,
  "slug": slug.current,
  "books": lists[].items[].work->{
    ${bookCardFields}
  }
}
`;

export const series40kBySlugQuery = groq`
*[_type == "series40k" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  subtitle, 
  description,  
  image{
    alt,
    credit,
    crop,
    hotspot,
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
  _type == "book40k" &&
  !(_id match "drafts.*") &&
  references($factionId)
]
| order(publicationDate asc, title asc){
  ${bookCardFields}
}
`;

export const booksByFactionGroupSlug40kQuery = groq`
*[
  _type == "book40k"
  && !(_id match "drafts.*")
  && references(
    *[_type == "faction40k" && group->slug.current == $group]._id
  )
]
| order(publicationDate asc, title asc){
  ${bookCardFields}
}
`;

export const factionPairs40kQuery = groq`
*[
  _type == "faction40k" &&
  defined(slug.current) &&
  defined(group->slug.current)
]{
  "group": group->slug.current,
  "slug": slug.current
}
`;
