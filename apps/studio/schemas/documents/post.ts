// /schemas/documents/post.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        // Optional: custom slugify
        // slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'Appears in the browser tab and search engine result titles.',
      validation: (Rule) =>
        Rule.required()
          .min(40).warning('Meta title should be at least 40 characters.')
          .max(60).warning('Meta title should not exceed 60 characters.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 3,
      description: 'Appears in search engine results. Keep it concise and compelling.',
      validation: (Rule) =>
        Rule.required()
          .min(50).warning('Meta description should be at least 50 characters.')
          .max(160).warning('Meta description should not exceed 160 characters.'),
    }),

    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
      description: 'Optional – select an author if applicable.',
    }),

    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{type: 'reference', to: {type: 'category'}}],
      validation: (Rule) => Rule.required().min(1),
      // ⚠️ Consider removing hard-coded refs to keep datasets portable
      // initialValue: [
      //   {_type: 'reference', _ref: '6969cb31-ad5f-4a94-900c-a0c78efa0e3a'}
      // ],
    }),

    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),

    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
    }),
  ],

  orderings: [
    {
      title: 'Published, New → Old',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
    {
      title: 'Published, Old → New',
      name: 'publishedAtAsc',
      by: [{field: 'publishedAt', direction: 'asc'}],
    },
  ],

  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare({author, ...rest}) {
      return {
        ...rest,
        subtitle: author ? `by ${author}` : undefined,
      }
    },
  },
})
