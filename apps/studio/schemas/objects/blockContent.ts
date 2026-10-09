// /schemas/objects/blockContent.ts
import {defineType} from 'sanity'

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
  ],
})
