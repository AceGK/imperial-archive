import type { MetadataRoute } from "next";
import { isProduction } from "@/lib/env";

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
  };
}
