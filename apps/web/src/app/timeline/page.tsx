import ComingSoon from "@/components/modules/ComingSoon";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Timeline",
  description:
    "A Warhammer 40,000 timeline: the key events of the setting, from the Age of Terra and the Horus Heresy to the Era Indomitus. Coming soon to Imperial Archive.",
  path: "/timeline",
  // placeholder until the page has real content
  noindex: true,
});

export default function TimelinePage() {
  return (
    <ComingSoon
      title="Timeline"
      description="The key events of the Warhammer 40,000 setting, from the Age of Terra and the Horus Heresy to the Era Indomitus. The timeline is being assembled. Check back soon."
    />
  );
}
