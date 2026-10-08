import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

// page.tsx is a client component, so its metadata lives here
export const metadata = pageMetadata({
  title: "Black Library Authors",
  description:
    "Browse Warhammer 40,000 authors from Black Library, from Dan Abnett and Aaron Dembski-Bowden to Graham McNeill, and see every 40k book each has written.",
  path: "/authors",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
