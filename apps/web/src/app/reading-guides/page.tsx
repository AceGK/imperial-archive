import ComingSoon from "@/components/modules/ComingSoon";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Reading Guides",
  description:
    "Warhammer 40k reading guides: where to start, series guides and reading orders for Black Library fiction. Coming soon to Imperial Archive.",
  path: "/reading-guides",
  // placeholder until the page has real content
  noindex: true,
});

export default function ReadingGuidesPage() {
  return (
    <ComingSoon
      title="Reading Guides"
      description="Where to start, series guides and reading orders for the Black Library. The guides are being written. Check back soon."
    />
  );
}
