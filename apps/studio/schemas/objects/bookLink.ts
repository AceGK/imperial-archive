// /schemas/objects/bookLink.ts
import {defineType, defineField} from "sanity";

export default defineType({
  name: "bookLink",
  title: "Book Link",
  type: "object",
  fields: [
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          {title: "Black Library", value: "black_library"},
          {title: "Lexicanum", value: "lexicanum"},
          {title: "Goodreads", value: "goodreads"},
          {title: "Amazon", value: "amazon"},
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      validation: (Rule) => Rule.uri({allowRelative: false}).required(),
    }),
    defineField({
      name: "sourceFor",
      title: "Source for",
      type: "array",
      of: [{type: "string"}],
      description:
        "Which text on the book page came from this link; it's cited there as [1], [2]… Leave it empty on every link to cite all of them for both.",
      options: {
        list: [
          {title: "Description", value: "description"},
          {title: "Story / Back Cover", value: "story"},
        ],
        layout: "grid",
      },
    }),
  ],
  preview: {
    select: {type: "type", url: "url", sourceFor: "sourceFor"},
    prepare: ({type, url, sourceFor}) => ({
      title: type || "Link",
      subtitle: [url, sourceFor?.length ? `Source for: ${sourceFor.join(", ")}` : null].filter(Boolean).join(" · "),
    }),
  },
});
