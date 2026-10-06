import type { Metadata } from "next";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata: Metadata = {
  title: "Track | Imperial Archive",
  description: "Track your reading progress and purchase lists across the Black Library.",
};

export default function TrackPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · Logistics"
      title="Track"
      description="Reading trackers, purchase lists, and progress logs are being assembled. Soon you'll be able to chart your journey through the Black Library."
    />
  );
}
