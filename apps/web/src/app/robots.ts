import type { MetadataRoute } from "next";
import { isProduction } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";

// Crawlers that only collect content for AI training or data resale. Search and
// answer bots (Googlebot, Bingbot, Applebot, OAI-SearchBot, ChatGPT-User,
// Claude-SearchBot, Claude-User, PerplexityBot…) aren't listed, so they keep
// the default rules and the site stays findable in search and AI answers.
// Google-Extended is left allowed: blocking it also drops the site from
// Gemini's answers, not just from training.
const TRAINING_AND_SCRAPER_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "meta-externalagent",
  "cohere-training-data-crawler",
  "cohere-ai",
  "Diffbot",
  "Omgilibot",
  "omgili",
  "ImagesiftBot",
  "Timpibot",
];

export default function robots(): MetadataRoute.Robots {
  // dev/preview deployments: ask every crawler (search engines, AI scrapers) to stay out
  if (!isProduction) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // query-string URLs are filtered views of the same pages; /api/ is the
        // search proxy, which crawlers have no use for
        disallow: ["/*?", "/api/"],
      },
      {
        userAgent: TRAINING_AND_SCRAPER_BOTS,
        disallow: "/",
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
