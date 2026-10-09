// /schemas/documents/faq.ts
import { defineType, defineField } from "sanity";
import { HelpCircleIcon } from "@sanity/icons";
import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";

export default defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  icon: HelpCircleIcon,
  // drag-and-drop order in the studio; questions appear in this order within each category
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: "faq" }),

    defineField({
      name: "question",
      title: "Question",
      type: "string",
      validation: (R) => R.required(),
    }),

    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      description: "A question can appear in more than one category.",
      of: [{ type: "reference", to: [{ type: "faqCategory" }] }],
      validation: (R) => R.required().min(1),
    }),

    defineField({
      name: "answer",
      title: "Answer",
      type: "blockContent",
      validation: (R) => R.required(),
    }),
  ],

  preview: {
    select: { title: "question", category: "categories.0.title" },
    prepare: ({ title, category }) => ({
      title: title || "Untitled question",
      subtitle: category || "No category selected",
    }),
  },
});
