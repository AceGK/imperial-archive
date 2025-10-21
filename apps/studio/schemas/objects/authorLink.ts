import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'authorLink',
  title: 'Author Link',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Website', value: 'website'},
          {title: 'Black Library', value: 'black_library'},
          {title: 'Lexicanum', value: 'lexicanum'},
          {title: 'Wikipedia', value: 'wikipedia'},
          {title: 'X (Twitter)', value: 'x'},
          {title: 'Facebook', value: 'facebook'},
          {title: 'Instagram', value: 'instagram'},
          {title: 'YouTube', value: 'youtube'},
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
