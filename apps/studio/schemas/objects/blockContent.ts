// /schemas/objects/blockContent.ts
import {defineArrayMember, defineField, defineType} from 'sanity'
import {BookIcon, ThListIcon} from '@sanity/icons'

export default defineType({
  name: 'blockContent',
  title: 'Body',
  type: 'array',
  of: [
    // Portable Text blocks
    {
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H1', value: 'h1'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Numbered', value: 'number'},
      ],
      marks: {
        // (optional) add bold/italic/etc. decorators explicitly if you want
        // decorators: [
        //   {title: 'Strong', value: 'strong'},
        //   {title: 'Emphasis', value: 'em'},
        // ],
        annotations: [
          // a book, series, author, faction or era in the catalog; stays
          // correct if its slug changes, unlike a typed /books/... path
          {
            name: 'internalLink',
            type: 'object',
            title: 'Archive link',
            icon: BookIcon,
            fields: [
              {
                name: 'reference',
                type: 'reference',
                title: 'Links to',
                to: [{type: 'book40k'}, {type: 'series40k'}, {type: 'author40k'}, {type: 'faction40k'}, {type: 'era40k'}],
                validation: (Rule) => Rule.required(),
              },
            ],
          },
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {
                name: 'href',
                type: 'url',
                title: 'URL',
                description:
                  'A full URL for other sites (https://…), or a path for pages on this site (e.g. /support or /series/horus-heresy).',
                validation: (Rule) =>
                  Rule.required().uri({allowRelative: true, scheme: ['http', 'https', 'mailto']}),
              },
              {
                // no longer used: the site opens external links in a new tab and
                // keeps its own pages in the same tab automatically (RichText in
                // apps/web); hidden but kept so existing links stay valid
                name: 'openInNewTab',
                type: 'boolean',
                title: 'Open in new tab',
                hidden: true,
              },
            ],
          },
        ],
      },
    },

    // Inline image with alt/caption
    {
      type: 'image',
      options: {hotspot: true},
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt',
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
        },
      ],
    },

    // book cards from the catalog, as a slider or a grid
    defineArrayMember({
      name: 'bookShelf',
      title: 'Books',
      type: 'object',
      icon: BookIcon,
      fields: [
        defineField({
          name: 'books',
          title: 'Books',
          type: 'array',
          of: [{type: 'reference', to: [{type: 'book40k'}]}],
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
          name: 'layout',
          title: 'Layout',
          type: 'string',
          description: 'Grid shows every book at once; a slider scrolls sideways, for longer lists.',
          options: {
            list: [
              {title: 'Grid', value: 'grid'},
              {title: 'Slider', value: 'slider'},
            ],
            layout: 'radio',
            direction: 'horizontal',
          },
          initialValue: 'grid',
        }),
      ],
      preview: {
        select: {first: 'books.0.title', second: 'books.1.title', layout: 'layout'},
        prepare: ({first, second, layout}) => ({
          title: [first, second].filter(Boolean).join(', ') || 'Books',
          subtitle: `Books · ${layout === 'slider' ? 'Slider' : 'Grid'}`,
        }),
      },
    }),

    // series cards from the catalog
    defineArrayMember({
      name: 'seriesShelf',
      title: 'Series',
      type: 'object',
      icon: ThListIcon,
      fields: [
        defineField({
          name: 'series',
          title: 'Series',
          type: 'array',
          of: [{type: 'reference', to: [{type: 'series40k'}]}],
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
          name: 'layout',
          title: 'Layout',
          type: 'string',
          options: {
            list: [
              {title: 'Grid', value: 'grid'},
              {title: 'Slider', value: 'slider'},
            ],
            layout: 'radio',
            direction: 'horizontal',
          },
          initialValue: 'grid',
        }),
      ],
      preview: {
        select: {first: 'series.0.title', second: 'series.1.title', layout: 'layout'},
        prepare: ({first, second, layout}) => ({
          title: [first, second].filter(Boolean).join(', ') || 'Series',
          subtitle: `Series · ${layout === 'slider' ? 'Slider' : 'Grid'}`,
        }),
      },
    }),
  ],
})
