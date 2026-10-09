// /schemas/documents/faqCategory.ts
import { defineType, defineField } from "sanity";
import { TagIcon } from "@sanity/icons";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

export default defineType({
  name: "faqCategory",
  title: "FAQ Category",
  type: "document",
  icon: TagIcon,
  // drag-and-drop order in the studio; the FAQ page shows categories in this order
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "faqCategory" }),

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
      description: "Used for links to this section of the FAQ page, e.g. /faq#accounts",
      options: { source: "title", maxLength: 96 },
      validation: (R) => R.required(),
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
      description: "Optional intro shown under the category heading.",
    }),
  ],

  preview: {
    select: { title: "title", subtitle: "description" },
  },
});
