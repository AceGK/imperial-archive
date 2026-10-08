import { pageMetadata } from "@/lib/seo";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata = pageMetadata({
  title: "Warhammer 40k Reading Tracker",
  description:
    "Track your Warhammer 40k reading: mark Black Library books as read, reading, or want to read, follow series progress, and keep a purchase list. Coming soon to Imperial Archive.",
  path: "/track",
  // placeholder until the page has real content
  noindex: true,
});

export default function TrackPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · Logistics"
      title="Track"
      description="Reading trackers, purchase lists, and progress logs are being assembled. Soon you'll be able to chart your journey through the Black Library."
    />
  );
}
