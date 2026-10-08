import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";

// page.tsx is a client component, so its metadata lives here
export const metadata = pageMetadata({
  title: "Warhammer 40k Series & Reading Orders",
  description:
    "Every Warhammer 40,000 book series from Black Library, including the Horus Heresy, with reading orders so you know where to start and what comes next.",
  path: "/series",
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
