import type { Metadata } from "next";
import Link from "next/link";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata: Metadata = {
  title: "Attribution | Imperial Archive",
  description: "Credits and sourcing for Imperial Archive.",
};

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
