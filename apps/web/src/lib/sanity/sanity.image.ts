// sanity.image.ts
import createImageUrlBuilder from "@sanity/image-url";
import type { Image } from "sanity";
import { dataset, projectId } from "./sanity.config";

const builder = createImageUrlBuilder({ projectId, dataset });
export const urlFor = (source: Image | any) => builder.image(source);

// helper: build a sane, display-ready URL
export const sanityImageUrl = (img: Image | any, w = 1200) =>
  urlFor(img).width(w).fit("max").auto("format").url();
