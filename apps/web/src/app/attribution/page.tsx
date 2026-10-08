import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata = pageMetadata({
  title: "Attribution",
  description:
    "Credits and sourcing for Imperial Archive.",
  path: "/attribution",
  // placeholder until the page has real content
  noindex: true,
});

export default function AttributionPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · Citation"
      title="Attribution"
      description={
        <>
          A full accounting of sources and credits is being prepared for this
          page. In the meantime, see the Attribution &amp; Credits section on
          the <Link href="/about">About</Link> page.
        </>
      }
    />
  );
}
