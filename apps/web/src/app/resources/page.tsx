import type { Metadata } from "next";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata: Metadata = {
  title: "Resources | Imperial Archive",
  description: "Reading order guides and community resources.",
};

export default function ResourcesPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · Codex"
      title="Resources"
      description="Reading-order guides, community flowcharts, and other resources are being catalogued. Check back soon."
    />
  );
}
