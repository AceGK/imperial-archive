import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    domains: ["cdn.sanity.io"],
  },
  productionBrowserSourceMaps: false,
  // Keep every non-production deployment (dev.imperialarchive.com, previews)
  // out of search results — the header covers pages, images and files alike
  // the Reading Guides placeholder was first published at /guides
  async redirects() {
    return [{ source: "/guides/:path*", destination: "/reading-guides/:path*", permanent: true }];
  },
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
    // Convex Auth's client provider, which the package only exposes through
    // ConvexAuthNextjsServerProvider. That wrapper reads the auth cookies, so
    // in the root layout it made every page render per request (no edge cache).
    // ConvexClientProvider renders the client half itself; see AuthSessionSync.
    // A package update that moves this file fails the build here.
    config.resolve.alias["@convex-dev/auth/nextjs/client$"] = path.join(
      path.dirname(require.resolve("@convex-dev/auth/nextjs")),
      "client.js"
    );

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
