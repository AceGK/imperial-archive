import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    domains: ["cdn.sanity.io"],
  },
  productionBrowserSourceMaps: false,
  // Keep every non-production deployment (dev.imperialarchive.com, previews)
  // out of search results — the header covers pages, images and files alike
  async headers() {
    if (process.env.VERCEL_ENV === "production") return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" }],
      },
    ];
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      // leave app/icon.svg to Next's metadata loader, which needs the raw file
      resourceQuery: { not: [/__next_metadata__/] },
      use: [{ loader: "@svgr/webpack", options: { icon: true } }],
    });

    return config;
  },
};

export default nextConfig;
