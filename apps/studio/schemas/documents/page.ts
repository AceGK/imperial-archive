// /schemas/documents/page.ts
// A standalone page on the website, shown at /<slug> (e.g. /terms, /privacy).
import { defineType, defineField } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

// Paths the website already uses for its own pages; a page with one of these
// slugs would never be shown, because the built-in page takes priority
const RESERVED = [
  "about", "account", "api", "authors", "blog", "books", "characters", "eras",
  "factions", "faq", "login", "reset-password", "resources", "series", "signup",
  "support", "test", "track",
];

export default defineType({
  name: "page",
  title: "Page",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
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
      description: "The page's address: \"terms\" is shown at imperialarchive.com/terms.",
      options: { source: "title", maxLength: 96 },
      validation: (R) =>
        R.required().custom((slug) =>
          slug?.current && RESERVED.includes(slug.current)
            ? `"/${slug.current}" is already a page on the site; choose another slug.`
            : true,
        ),
    }),

    defineField({
      name: "label",
      title: "Header label",
      type: "string",
      description: 'Small label above the title, e.g. "Adeptus Administratum · IA-007 // Edicts".',
    }),

    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      description: "Shown in search results and link previews. About 150 characters works best.",
      validation: (R) => R.max(200).warning("Search engines cut descriptions off at around 160 characters."),
    }),

    defineField({
      name: "updated",
      title: "Last updated",
      type: "date",
      description: 'Optional. Shown under the title as "Last updated …", e.g. for legal pages.',
    }),

    defineField({
      name: "body",
      title: "Body",
      type: "blockContent",
      description: "H1 and H2 headings become the page's sections; with two or more, a contents list is shown beside the text.",
    }),

    defineField({
      name: "noindex",
      title: "Hide from search engines",
      type: "boolean",
      description: "Keeps the page out of Google and the sitemap, e.g. while it's a work in progress.",
      initialValue: false,
    }),
  ],

  preview: {
    select: { title: "title", slug: "slug.current" },
    prepare: ({ title, slug }) => ({
      title: title || "Untitled page",
      subtitle: slug ? `/${slug}` : "No slug",
    }),
  },
});
