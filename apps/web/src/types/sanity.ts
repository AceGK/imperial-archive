// /apps/web/types/sanity.ts

export type Author40k = {
  _id: string
  name: string
  slug?: {current: string}
  image?: any
  bio?: any[]
  links?: {type: string; url: string}[]
}