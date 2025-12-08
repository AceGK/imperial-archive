import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { cookies } from "next/headers";
import "@/styles/reset.scss";
import "@/styles/globals.scss";
import "@/styles/utils.scss";
import Nav from "@/components/modules/Nav";
import Footer from "@/components/modules/Footer";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/context/ConvexClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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

  const hasAccess = cookieStore.get("site-access")?.value === "granted";

  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" data-layout={initialLayout} suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              {hasAccess && <Nav />}
              {children}
              {hasAccess && <Footer />}
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}