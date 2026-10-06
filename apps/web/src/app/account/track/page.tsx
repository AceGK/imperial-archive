import type { Metadata } from "next";
import ComingSoon from "@/components/modules/Account/ComingSoon";
import TrackIcon from "@/components/icons/account/track.svg";

export const metadata: Metadata = { title: "Track | Account" };

export default function TrackPage() {
  return (
    <ComingSoon
      title="Track"
      description="Log what you've read, are reading, and want to read."
      icon={TrackIcon}
      features={[
        "Mark books as Read, Reading, or Want to Read",
        "See your progress through each series",
        "Reading stats by faction, era, and author",
      ]}
    />
  );
}
