import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'factionLink',
  title: 'Faction Link',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Black Library', value: 'black_library'},
          {title: 'Lexicanum', value: 'lexicanum'},
          {title: 'Wikipedia', value: 'wikipedia'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) => Rule.uri({allowRelative: false}).required(),
    }),
  ],
})
