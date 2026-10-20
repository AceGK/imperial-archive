import ComingSoon from "@/components/modules/ComingSoon";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Where to Start",
  description:
    "Where to start reading Warhammer 40,000: first books and series for new Black Library readers. Coming soon to Imperial Archive.",
  path: "/where-to-start",
  // placeholder until the page has real content
  noindex: true,
});

export default function WhereToStartPage() {
  return (
    <ComingSoon
      title="Where to Start"
      description="Good first books and series for new readers, whatever drew you to the 41st millennium. This guide is being written. Check back soon."
    />
  );
}
