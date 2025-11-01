// /sanity/schemas/documents/series40k.ts
import { defineType, defineField } from "sanity";
import { TagIcon } from "@sanity/icons";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

export default defineType({
  name: "series40k",
  title: "Series",
  type: "document",
  icon: TagIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "series40k" }),

    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (R) => R.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (R) => R.required(),
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),

    defineField({
      name: "image",
      title: "Hero / Banner Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt Text", type: "string" }),
        defineField({ name: "credit", title: "Credit", type: "string" }),
      ],
    }),

    defineField({
      name: "lists",
      title: "Reading Lists",
      type: "array",
      of: [
        {
          type: "object",
          name: "seriesList40k",
          title: "Reading List",
          fields: [
            defineField({
              name: "title",
              title: "List Title",
              type: "string",
              validation: (R) => R.required(),
            }),
            defineField({
              name: "key",
              title: "List Key",
              type: "slug",
              options: { source: "title", maxLength: 96 },
              description: "Stable key for anchors/links (optional).",
            }),
            defineField({
              name: "description",
              title: "List Description",
              type: "text",
              rows: 2,
            }),
            defineField({
              name: "items",
              title: "Books in Order",
              type: "array",
              of: [
                {
                  type: "object",
                  name: "seriesContentItem",
                  fields: [
                    defineField({
                      name: "work",
                      title: "Work",
                      type: "reference",
                      to: [{ type: "book40k" }],
                      validation: (R) => R.required(),
                    }),
                  ],
                  preview: {
                    select: {
                      title: "work.title",
                      media: "work.image",
                    },
                    prepare: ({ title, media }) => ({
                      title: title || "(Untitled work)",
                      media,
                    }),
                  },
                },
              ],
              options: { sortable: true },
              validation: (R) => R.min(1),
            }),
          ],
          preview: {
            select: { title: "title", cnt: "items.length" },
            prepare: ({ title, cnt }) => ({
              title: title || "Untitled List",
              subtitle: `${cnt ?? 0} work${(cnt ?? 0) === 1 ? "" : "s"}`,
            }),
          },
        },
      ],
    }),

    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [{ type: "seriesLink" }],
    }),
  ],

  preview: {
    select: { title: "title", media: "image", listCount: "lists.length" },
    prepare: ({ title, media, listCount }) => ({
      title: title || "Untitled Series",
      subtitle: `${listCount ?? 0} list${(listCount ?? 0) === 1 ? "" : "s"}`,
      media,
    }),
  },
});
