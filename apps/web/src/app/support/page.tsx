import { pageMetadata } from "@/lib/seo";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata = pageMetadata({
  title: "Support",
  description:
    "Ways to support Imperial Archive, the fan-made Warhammer 40k book catalog and reading tracker.",
  path: "/support",
  // placeholder until the page has real content
  noindex: true,
});

export default function SupportPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · Tithe"
      title="Support"
      description="Ways to support the upkeep of this archive are being prepared. Check back soon."
    />
  );
}
