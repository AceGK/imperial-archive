"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";

const SANITY_CDN = "https://cdn.sanity.io/images/";

/**
 * Asks Sanity's CDN for each srcset width, in WebP or AVIF where the browser
 * takes it. The resizing is free on Sanity's side and skips Vercel's image
 * optimizer; before this, covers were sent at full size (1400px wide for a
 * 190px card). A fixed crop (w and h both set) keeps its shape.
 */
function sanityLoader({ src, width, quality }: ImageLoaderProps) {
  const url = new URL(src);
  const w = Number(url.searchParams.get("w"));
  const h = Number(url.searchParams.get("h"));
  if (w && h) url.searchParams.set("h", String(Math.round((h * width) / w)));
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  // never upscale past the original
  if (!url.searchParams.has("fit")) url.searchParams.set("fit", "max");
  return url.toString();
}

/**
 * next/image for Sanity images, sized through Sanity's CDN. Any other source
 * is shown as is, as these images were before. A client component, since a
 * loader function can't be passed from a server component.
 */
export default function SanityImage(props: ImageProps) {
  const isSanity = typeof props.src === "string" && props.src.startsWith(SANITY_CDN);
  return isSanity ? <Image {...props} loader={sanityLoader} /> : <Image {...props} unoptimized />;
}
