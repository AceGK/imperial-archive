import post from './documents/post'
import author from './documents/author'
import category from './documents/category'
import author40k from './documents/author40k'
import authorLink from './objects/authorLink'
import blockContent from './objects/blockContent'

export const schemaTypes = [
  post,
  author, // blog authors (separate from 40k authors)
  category,
  author40k,
  authorLink,
  blockContent,
]
