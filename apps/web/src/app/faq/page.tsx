import { pageMetadata } from "@/lib/seo";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata = pageMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions about Imperial Archive, the fan-made catalog of Warhammer 40,000 Black Library books.",
  path: "/faq",
  // placeholder until the page has real content
  noindex: true,
});

export default function FaqPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · Inquiry"
      title="FAQ"
      description="Answers to common questions about the Archive are being compiled. Check back soon."
    />
  );
}
