import { groq } from "next-sanity";

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
