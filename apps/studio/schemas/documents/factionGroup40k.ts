// /schemas/documents/factionGroup40k.ts
import {defineType, defineField} from 'sanity'
import {FolderIcon} from '@sanity/icons'

export default defineType({
  name: 'factionGroup40k',
  title: '40k Faction Group',
  type: 'document',
  icon: FolderIcon,
  fields: [
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
    defineField({name: 'order', title: 'Order', type: 'number'}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'slug.current'},
    prepare: ({title, subtitle}) => ({
      title: title || 'Untitled Group',
      subtitle: subtitle || '',
    }),
  },
})
