// /schemas/documents/faction40k.ts
import {defineType, defineField} from 'sanity'
import {UserIcon} from '@sanity/icons'

export default defineType({
  name: 'faction40k',
  title: '40k Faction',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'group',
      title: 'Group',
      type: 'reference',
      to: [{type: 'factionGroup40k'}],
      validation: R => R.required(),
    }),
    defineField({name: 'title', type: 'string', validation: R => R.required()}),
    defineField({
      name: 'slug',
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
  ],
preview: {
    select: {t: 'title', s: 'slug.current'},
    prepare: ({t, s}) => ({
      title: t || 'Untitled Faction',
      subtitle: s || '',
    }),
  },
})
