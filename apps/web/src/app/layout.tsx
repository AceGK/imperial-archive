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

const barlow = Barlow({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "40k Books",
  description: "A catalog of Warhammer 40,000 books from Black Library.",
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