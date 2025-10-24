import { groq } from "next-sanity";

//todo consolidate faction queries

export const testPostsQuery = groq`
  *[_type == "post" && !(_id match "drafts.*")] 
    | order(publishedAt desc)[0...20]{
      _id,
      title,
      slug,
      publishedAt,
      mainImage{asset->{url}},
      "authorName": author->name,
      categories[]->{title}
    }
`;
export const postsQuery = groq`
  *[_type == "post"] | order(publishedAt desc)[0...20]{
    _id, title, slug, mainImage, publishedAt,
    "authorName": author->name,
    categories[]-> {title}
  }
`;

export const all40kAuthorsQuery = groq`
  *[_type == "author40k"] | order(name asc) {
    _id, 
    name, 
    "slug": slug.current,
    image{
      ...,
      "url": asset->url,
      "lqip": asset->metadata.lqip,
      "aspect": asset->metadata.dimensions.aspectRatio
    },
    bio,
    links[]{type, url}
  }
`;

export const single40kAuthorQuery = groq`
  *[_type == "author40k" && slug.current == $slug][0]{
    _id,
    name,
    slug,
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
      ...,
      "url": asset->url,
      "lqip": asset->metadata.lqip,
      "aspect": asset->metadata.dimensions.aspectRatio
    }
  }
`;

// Pass the list of names in $names
export const featuredAuthors40kQuery = groq`
*[
  _type == "author40k" 
  && !(_id match "drafts.*") 
  && name in $names
]{
  _id,
  name,
  "slug": slug.current,
  image{
    ...,
    "url": asset->url,
    "lqip": asset->metadata.lqip,
    "aspect": asset->metadata.dimensions.aspectRatio
  },
  "count": count(*[_type == "book40k" && references(^._id)])
}
`;

// All groups with nested factions, ordered
export const groupedFactions40kQuery = groq`
  *[
    _type == "factionGroup40k"
    && !(_id match "drafts.*")
  ] | order(orderRank asc){
    _id,
    title,
    "slug": slug.current,
    iconId,
    description,
    links[]{type, url},

    "items": *[
      _type == "faction40k"
      && !(_id match "drafts.*")
      && references(^._id)
    ] | order(orderRank asc){
      _id,
      title,
      "slug": slug.current,
      iconId,
      description,
      links[]{type, url}
    }
  }
`

// Flat list for cards, with group key
export const factions40kForCardsQuery = groq`
  *[
    _type == "faction40k"
    && !(_id match "drafts.*")
  ] | order(orderRank asc){
    _id,
    title,
    "slug": slug.current,
    iconId,
    description,
    "groupKey": group->slug.current,
    "groupTitle": group->title
  }
`


// Single faction (by slug) including its group
export const singleFaction40kQuery = groq`
  *[
    _type == "faction40k"
    && slug.current == $slug
  ][0]{
    _id,
    title,
    "slug": slug.current,
    iconId,
    description,
    links[]{type, url},
    "group": group->{
      _id, title, "slug": slug.current, iconId
    }
  }
`;

// All groups only (no nesting), ordered
export const factionGroups40kQuery = groq`
  *[
    _type == "factionGroup40k"
    && !(_id match "drafts.*")
  ] | order(orderRank asc){
    _id,
    title,
    "slug": slug.current,
    iconId,
    description,
    links[]{type, url}
  }
`

// All [group]/[slug] pairs for SSG
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

// Single faction by group+slug
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
    links
  }
}
`;

export const all40kErasQuery = groq`
  *[_type == "era40k" && !(_id match "drafts.*")] 
    | order(orderRank) {
      _id,
      title,
      "slug": slug.current,
      period,
      description, 
      image{
        ...,
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
    description
  }
`;

