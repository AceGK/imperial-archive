// /schemas/documents/factionGroup40k.ts
import {defineType, defineField} from 'sanity'
import {FolderIcon} from '@sanity/icons'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'

export default defineType({
  name: 'factionGroup40k',
  title: '40k Faction Group',
  type: 'document',
  icon: FolderIcon,

  // enables sorting by orderRank (used by the plugin + GROQ)
  orderings: [orderRankOrdering],

  fields: [
    // must come first
    orderRankField({type: 'factionGroup40k'}),

    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: R => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: R => R.required(),
    }),
    defineField({name: 'iconId', title: 'Icon ID', type: 'string'}),
    defineField({name: 'description', type: 'text'}),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [{type: 'factionLink'}],
    }),
    // remove your old numeric `order` field
  ],

  preview: {
    select: {title: 'title', subtitle: 'slug.current'},
    prepare: ({title, subtitle}) => ({
      title: title || 'Untitled Group',
      subtitle: subtitle || '',
    }),
  },
})
