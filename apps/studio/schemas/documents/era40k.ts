// /schemas/documents/era40k.ts
import {defineType, defineField} from 'sanity'
import {ClockIcon} from '@sanity/icons'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'

export default defineType({
  name: 'era40k',
  title: '40k Era',
  type: 'document',
  icon: ClockIcon,
  orderings: [orderRankOrdering], // enables “Order by →”
  fields: [
    orderRankField({type: 'era40k'}), // drag-and-drop rank (hidden by default)

    defineField({name: 'title', type: 'string', validation: R => R.required()}),
    defineField({
      name: 'slug', type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: R => R.required(),
    }),
    defineField({name: 'period', type: 'string', description: 'Example: M30–M31'}),
    defineField({name: 'description', type: 'text', rows: 3}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'period'},
    prepare: ({title, subtitle}) => ({title: title || 'Untitled Era', subtitle: subtitle || ''}),
  },
})
