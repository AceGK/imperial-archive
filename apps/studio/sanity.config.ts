import { defineConfig } from "sanity";
import { visionTool } from "@sanity/vision";
import { structureTool } from "sanity/structure";
import { media } from "sanity-plugin-media";
import { deskStructure } from "./deskStructure";
import { schemaTypes } from "./schemas";

// replace [] with imports from @ac/schemas when ready
export default defineConfig({
  name: "studio",
  title: "Imperial Archive Studio",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
  plugins: [
    structureTool({
      structure: deskStructure,
    }),
    visionTool(),
    media(),
  ],
  schema: {types: schemaTypes},
});
