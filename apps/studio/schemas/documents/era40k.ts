// /schemas/documents/era40k.ts
import { defineType, defineField } from "sanity"
import { ClockIcon, ImageIcon } from "@sanity/icons"
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list"

export default defineType({
  name: "era40k",
  title: "40k Era",
  type: "document",
  icon: ClockIcon,
  orderings: [orderRankOrdering],
  fields: [
    // Enables drag-and-drop ordering
    orderRankField({ type: "era40k" }),

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
      name: "period",
      title: "Chronological Period",
      type: "string",
      description: "Example: M30–M31",
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),

    defineField({
      name: "image",
      title: "Era Image",
      type: "image",
      icon: ImageIcon,
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "Important for accessibility and SEO.",
        }),
      ],
    }),
  ],

  preview: {
    select: {
      title: "title",
      subtitle: "period",
      media: "image",
    },
    prepare: ({ title, subtitle, media }) => ({
      title: title || "Untitled Era",
      subtitle: subtitle || "",
      media,
    }),
  },
})
