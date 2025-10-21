import createImageUrlBuilder from "@sanity/image-url";
import type { Image } from "sanity";
import { dataset, projectId } from "./sanity.config";

const builder = createImageUrlBuilder({ projectId, dataset });
export const urlFor = (source: Image | any) => builder.image(source);
