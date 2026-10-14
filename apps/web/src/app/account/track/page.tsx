import type { Metadata } from "next";
import Track from "@/components/modules/Account/Track";

export const metadata: Metadata = { title: "Track | Account" };

export default function TrackPage() {
  return <Track />;
}
