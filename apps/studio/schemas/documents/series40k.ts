import { defineType, defineField } from "sanity";
import { TagIcon, ListIcon } from "@sanity/icons";
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";

export default defineType({
  name: "series40k",
  title: "Series",
  type: "document",
  icon: TagIcon,
  orderings: [orderRankOrdering],
  fields: [
    // MUST match this document's name
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
          name: "seriesList40k", // still name it for clarity
          title: "Reading List",
          fields: [
            { name: "title", type: "string", validation: (R) => R.required() },
            {
              name: "key",
              type: "slug",
              options: { source: "title", maxLength: 96 },
            },
            { name: "description", type: "text", rows: 2 },
            {
              name: "items",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    {
                      name: "book",
                      type: "reference",
                      to: [{ type: "book40k" }],
                      validation: (R) => R.required(),
                    },
                    {
                      name: "number",
                      type: "number",
                      validation: (R) => R.min(0),
                    },
                    { name: "label", type: "string" },
                    { name: "note", type: "string" },
                  ],
                },
              ],
            },
          ],
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
    select: { title: "title", subtitle: "group", media: "image" },
    prepare: ({ title, subtitle, media }) => ({
      title: title || "Untitled Series",
      subtitle: subtitle || "",
      media,
    }),
  },
});
