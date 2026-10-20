import ComingSoon from "@/components/modules/ComingSoon";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Reading Guides",
  description:
    "Warhammer 40k reading guides: reading orders and paths through the Horus Heresy and other Black Library series. Coming soon to Imperial Archive.",
  path: "/guides",
  // placeholder until the page has real content
  noindex: true,
});

export default function GuidesPage() {
  return (
    <ComingSoon
      title="Reading Guides"
      description="Reading orders and paths through the Horus Heresy and the Archive's other series. The guides are being written. Check back soon."
    />
  );
}
