import { pageMetadata } from "@/lib/seo";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata = pageMetadata({
  title: "Resources",
  description:
    "Warhammer 40k reading order guides and community resources for Black Library readers.",
  path: "/resources",
  // placeholder until the page has real content
  noindex: true,
});

export default function ResourcesPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · IA-002 // Librarium"
      title="Resources"
      description="Reading-order guides, community flowcharts, and other resources are being catalogued. Check back soon."
    />
  );
}
