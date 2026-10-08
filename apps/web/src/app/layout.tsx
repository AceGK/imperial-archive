import type { Metadata } from "next";
import { Barlow, Geist_Mono, Barlow_Condensed, Archivo_Black } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { cookies } from "next/headers";
import "@/styles/reset.scss";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "@/styles/globals.scss";
import "@/styles/utils.scss";
import Nav from "@/components/modules/Nav";
import Footer from "@/components/modules/Footer";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/context/ConvexClientProvider";
import { isProduction } from "@/lib/env";
import { authHintScript } from "@/components/modules/Nav/authHint";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

// display "optional": the fonts are preloaded, so they're nearly always ready
// for first paint; if one isn't, the size-matched fallback is kept for that
// page instead of visibly swapping fonts mid-load
const barlow = Barlow({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "optional",
});

// only used for <code>; not worth preloading on every page
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "optional",
});

const archivoBlack = Archivo_Black({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400"],
  display: "optional",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  category: "books",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image" },
  // non-production deployments are also noindexed via robots.ts and an X-Robots-Tag header
  robots: isProduction ? undefined : { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const layoutCookie = cookieStore.get("site-layout")?.value;
  const initialLayout =
    layoutCookie === "full" || layoutCookie === "boxed"
      ? layoutCookie
      : "boxed";

  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" data-layout={initialLayout} suppressHydrationWarning>
        <head>
          {/* sets data-auth before first paint so the nav's auth controls don't shift */}
          <script dangerouslySetInnerHTML={{ __html: authHintScript }} />
        </head>
        <body
          className={`${barlow.variable} ${geistMono.variable} ${barlowCondensed.variable} ${archivoBlack.variable} antialiased`}
        >
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <Nav />
              {children}
              <Footer />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}