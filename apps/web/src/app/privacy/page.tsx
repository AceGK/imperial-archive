import { pageMetadata } from "@/lib/seo";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata = pageMetadata({
  title: "Privacy",
  description:
    "Privacy policy for Imperial Archive.",
  path: "/privacy",
  // placeholder until the page has real content
  noindex: true,
});

export default function PrivacyPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · IA-006 // Privacy"
      title="Privacy"
      description="A full privacy policy is being drafted. Check back soon."
    />
  );
}
