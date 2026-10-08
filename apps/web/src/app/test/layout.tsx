import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isProduction } from "@/lib/env";

// Internal test pages (UI components, visual QA, ...). Available locally and on
// non-production deployments (dev.imperialarchive.com, previews); production
// gets a plain 404, so they're never public. Pages added under /test inherit this.
export const metadata: Metadata = {
  title: "Test",
  robots: { index: false, follow: false },
};

export default function TestLayout({ children }: { children: ReactNode }) {
  if (isProduction) notFound();
  return children;
}
