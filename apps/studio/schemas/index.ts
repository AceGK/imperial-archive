import post from './documents/post'
import author from './documents/author'
import category from './documents/category'
import author40k from './documents/author40k'
import authorLink from './objects/authorLink'
import blockContent from './objects/blockContent'
import faction40k from './documents/faction40k'
import factionGroup40k from './documents/factionGroup40k'
import factionLink from './objects/factionLink'
import era40k from './documents/era40k'
import book40k from './documents/book40k'
import bookLink from './objects/bookLink'
import series40k from './documents/series40k'
import seriesLink from './objects/seriesLink'

export const schemaTypes = [
  post,
  author, // blog authors (separate from 40k authors)
  category,
  author40k,
  authorLink,
  blockContent,
  faction40k,
  factionGroup40k,
  factionLink,
  era40k,
  book40k,
  bookLink,
  series40k,
  seriesLink,
]
