// /schemas/documents/book40k.ts
import { defineType, defineField, defineArrayMember } from "sanity";
import { BookIcon } from "@sanity/icons";
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import BelongsToSeries from "../parts/BelongsToSeries";

export default defineType({
  name: "book40k",
  title: "Book",
  type: "document",
  icon: BookIcon,
  orderings: [orderRankOrdering],

  fields: [
    // Must match this document's name
    orderRankField({ type: "book40k" }),

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

    // Authors as references
    defineField({
      name: "authors",
      title: "Authors",
      description: "References to 40k authors (order matters).",
      type: "array",
      of: [{ type: "reference", to: [{ type: "author40k" }] }],
      validation: (R) => R.min(1).error("Add at least one author."),
    }),

    // Optional helper for previews/search
    defineField({
      name: "authorNames",
      title: "Author Names (helper)",
      type: "array",
      of: [{ type: "string" }],
      hidden: true,
      description:
        "Optional denormalized names to power previews/filters. Keep authors[] (refs) as the source of truth.",
    }),

    defineField({
      name: "seriesMembership",
      title: "Belongs to series",
      type: "string",
      readOnly: true,
      components: { field: BelongsToSeries },
      description:
        "This book appears in the following series (from series40k.items). Reading order is managed on the series documents.",
    }),

    defineField({
      name: "format",
      title: "Format / Type",
      type: "string",
      description: "Primary format of this release.",
      initialValue: "novel",
      options: {
        list: [
          { title: "Novel", value: "novel" },
          { title: "Novella", value: "novella" },
          { title: "Short Story", value: "short_story" },
          { title: "Audio Drama", value: "audio_drama" },
          { title: "Anthology", value: "anthology" },
          { title: "Omnibus", value: "omnibus" },
          { title: "Graphic Novel", value: "graphic_novel" },
          { title: "Audio Anthology", value: "audio_anthology" },
          { title: "Other", value: "other" },
        ],
        layout: "dropdown",
      },
      validation: (R) => R.required(),
    }),

        defineField({
      name: "contents",
      title: "Contents",
      type: "array",
      description:
        "For anthologies/omnibuses: ordered list of included works (short stories, novellas, novels, etc.)",
      hidden: (ctx) => {
        const fmt = (ctx as any)?.document?.format as string | undefined;
        const showFor = new Set(["anthology", "omnibus", "audio_anthology"]);
        return !(fmt && showFor.has(fmt));
      },
      validation: (Rule) =>
        Rule.custom((val, ctx) => {
          const fmt = (ctx?.document as { format?: string } | undefined)
            ?.format;
          if (
            ["anthology", "omnibus", "audio_anthology"].includes(fmt ?? "") &&
            (!val || val.length === 0)
          ) {
            return "Consider adding contents for this collection (you can still publish).";
          }
          return true;
        }).warning(),
      of: [
        {
          type: "object",
          name: "contentItem",
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
              titleOverride: "titleOverride",
              role: "role",
              pages: "pageRange",
              media: "work.image",
            },
            prepare({ title, titleOverride, role, pages, media }) {
              const t = titleOverride || title || "(Untitled work)";
              const bits = [role, pages].filter(Boolean).join(" • ");
              return { title: t, subtitle: bits, media };
            },
          },
        },
      ],
    }),

    // ERA (reference)
    defineField({
      name: "era",
      title: "Era",
      description: "The chronological era for this book.",
      type: "reference",
      to: [{ type: "era40k" }],
      validation: (R) => R.required().warning("Choose an era."),
    }),

    defineField({
      name: "eraName",
      title: "Era (Search Helper)",
      type: "string",
      hidden: true,
      description:
        "Optional denormalized field for search/filters. Not source of truth.",
    }),

    // IMAGE
    defineField({
      name: "image",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt Text", type: "string" }),
        defineField({ name: "credit", title: "Credit", type: "string" }),
      ],
    }),

    // LINKS
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [{ type: "bookLink" }],
    }),

    // COPY
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),

    defineField({
      name: "story",
      title: "Story / Back Cover",
      type: "text",
      rows: 6,
    }),

    // META
    defineField({
      name: "publicationDate",
      title: "Publication Date",
      type: "date",
    }),

    defineField({
      name: "pageCount",
      title: "Page Count",
      type: "number",
    }),

    // EDITIONS
    defineField({
      name: "editions",
      title: "Editions / ISBN Variants",
      type: "array",
      of: [
        defineArrayMember({
          name: "edition",
          title: "Edition",
          type: "object",
          fields: [
            defineField({
              name: "isbn",
              title: "ISBN",
              type: "string",
              validation: (R) => R.required(),
            }),
            defineField({
              name: "note",
              title: "Edition Note",
              type: "string",
              description: `E.g., "2010 paperback", "2010 ebook", "2020 reprint"`,
            }),
          ],
          preview: { select: { title: "isbn", subtitle: "note" } },
        }),
      ],
    }),
  ],

  preview: {
    select: {
      title: "title",
      authorNames: "authorNames",
      media: "image",
    },
    prepare({ title, authorNames, media }) {
      const subtitle =
        Array.isArray(authorNames) && authorNames.length
          ? `by ${authorNames[0]}${authorNames.length > 1 ? `, +${authorNames.length - 1}` : ""}`
          : "";
      return { title: title || "Untitled Book", subtitle, media };
    },
  },
});
