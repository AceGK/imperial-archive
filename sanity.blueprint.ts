// sanity.blueprint.ts
// npx sanity blueprints deploy
import { defineBlueprint, defineDocumentFunction } from "@sanity/blueprints";
import "dotenv/config";
import process from "node:process";

const {
  ALGOLIA_APP_ID,
  ALGOLIA_WRITE_API_KEY,
  SANITY_STUDIO_PROJECT_ID,
  SANITY_STUDIO_DATASET,
} = process.env;

if (typeof ALGOLIA_APP_ID !== "string" || typeof ALGOLIA_WRITE_API_KEY !== "string") {
  throw new Error("ALGOLIA_APP_ID and ALGOLIA_WRITE_API_KEY must be set");
}

if (typeof SANITY_STUDIO_PROJECT_ID !== "string" || typeof SANITY_STUDIO_DATASET !== "string") {
  throw new Error("SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET must be set");
}

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      type: "sanity.function.document",
      name: "algolia-document-sync",
      memory: 1,
      timeout: 10,
      src: "./functions/algolia-document-sync",
      event: {
        on: ["create", "update", "delete"],
        filter: '_type == "book40k"',
        projection: `{
          _id,
          title,
          "slug": slug.current,
          format,
          publicationDate,
          description,
          story,
          authors,
          era,
          factions,
          image,
          _createdAt,
          _updatedAt,
          "operation": delta::operation()
        }`,
      },
      env: {
        COMMENT:
          "ALGOLIA_APP_ID and ALGOLIA_WRITE_API_KEY env variables are required to sync documents to Algolia",
        ALGOLIA_APP_ID,
        ALGOLIA_WRITE_API_KEY,
        SANITY_STUDIO_PROJECT_ID,
        SANITY_STUDIO_DATASET,
      },
    }),
  ],
});