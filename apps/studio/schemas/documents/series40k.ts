import { defineType, defineField } from "sanity";
import { TagIcon, ListIcon } from "@sanity/icons";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

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
      name: "items",
      title: "Books in Order",
      type: "array",
      of: [
        {
          type: "object",
          icon: ListIcon,
          fields: [
            // Book ref must use your book type name
            defineField({
              name: "book",
              title: "Book",
              type: "reference",
              to: [{ type: "book40k" }],
              validation: (R) => R.required(),
            }),
            defineField({
              name: "number",
              title: "Series Number",
              type: "number",
              description: "Use simple integers where possible.",
              validation: (R) => R.min(0),
            }),
            defineField({
              name: "label",
              title: "Display Label (optional)",
              type: "string",
              description:
                'Label for special ordering like "0.5", "Prologue", "Interlude".',
            }),
            defineField({
              name: "note",
              title: "Note (optional)",
              type: "string",
              description:
                "Editorial guidance, e.g., 'Read after Book 5 if following character X'.",
            }),
            
          ],
          preview: {
            select: {
              title: "book.title",
              number: "number",
              label: "label",
              role: "role",
              media: "book.image",
            },
            prepare({ title, number, label, role, media }) {
              const badge = label || (Number.isFinite(number) ? `#${number}` : "");
              const subtitle = [badge, role].filter(Boolean).join(" • ");
              return { title: title || "(Untitled book)", subtitle, media };
            },
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
    select: { title: "title", subtitle: "group", media: "image" },
    prepare: ({ title, subtitle, media }) => ({
      title: title || "Untitled Series",
      subtitle: subtitle || "",
      media,
    }),
  },
});
