import {groq} from 'next-sanity'

export const postsQuery = groq`
  *[_type == "post"] | order(publishedAt desc)[0...20]{
    _id, title, slug, mainImage, publishedAt,
    "authorName": author->name,
    categories[]-> {title}
  }
`

export const all40kAuthorsQuery = groq`
  *[_type == "author40k"] | order(name asc) {
    _id, name, slug, image,
    bio,
    links[]{type, url}
  }
`

export const single40kAuthorQuery = groq`
  *[_type == "author40k" && slug.current == $slug][0]{
    _id,
    name,
    slug,
    image,
    bio,
    links[]{type, url}
  }
`
