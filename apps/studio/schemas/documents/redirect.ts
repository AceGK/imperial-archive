// /schemas/documents/redirect.ts
// Read by the website's middleware; published changes go live within about a
// minute, no redeploy needed
import { defineType, defineField } from "sanity";
import { LinkIcon } from "@sanity/icons";

const isSitePath = (v: string) => v.startsWith("/") && !v.startsWith("//");

export default defineType({
  name: "redirect",
  title: "Redirect",
  type: "document",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "source",
      title: "From",
      type: "string",
      description: "The old path, e.g. /series/horus-heresy-primarchs",
      validation: (R) =>
        R.required().custom(async (value, context) => {
          if (!value) return true;
          if (!isSitePath(value)) return "Must be a path starting with /";
          if (/[?#\s]/.test(value)) return "Path only: no query string, # or spaces";
          if (value !== "/" && value.endsWith("/")) return "Remove the trailing /";

          const id = (context.document?._id ?? "").replace(/^drafts\./, "");
          const taken = await context
            .getClient({ apiVersion: "2025-01-01" })
            .fetch<number>(
              `count(*[_type == "redirect" && source == $value && !(_id in [$id, "drafts." + $id])])`,
              { value, id }
            );
          return taken ? "Another redirect already uses this path" : true;
        }),
    }),

    defineField({
      name: "destination",
      title: "To",
      type: "string",
      description: "The new path (/series/horus-heresy-the-primarchs) or a full https:// URL",
      validation: (R) =>
        R.required().custom((value, context) => {
          if (!value) return true;
          if (!isSitePath(value) && !/^https?:\/\//.test(value))
            return "Must be a path starting with / or a full URL";
          if (value === context.document?.source) return "Can't redirect a path to itself";
          return true;
        }),
    }),

    defineField({
      name: "permanent",
      title: "Permanent",
      type: "boolean",
      description:
        "On (308) for moved or renamed pages, so search engines transfer the old URL's ranking. Off (307) for temporary redirects.",
      initialValue: true,
    }),

    defineField({
      name: "note",
      title: "Note",
      type: "string",
      description: "Optional: why this redirect exists",
    }),
  ],

  preview: {
    select: { source: "source", destination: "destination", permanent: "permanent" },
    prepare: ({ source, destination, permanent }) => ({
      title: source || "(no path)",
      subtitle: `→ ${destination || "?"}${permanent === false ? "  (temporary)" : ""}`,
    }),
  },
});
