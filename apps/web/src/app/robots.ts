import type { MetadataRoute } from "next";
import { isProduction } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // dev/preview deployments: ask every crawler (search engines, AI scrapers) to stay out
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/*?",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
