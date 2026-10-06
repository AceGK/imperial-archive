import type { Metadata } from "next";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata: Metadata = {
  title: "Privacy | Imperial Archive",
  description: "Privacy policy for Imperial Archive.",
};

export default function PrivacyPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · Privacy"
      title="Privacy"
      description="A full privacy policy is being drafted. Check back soon."
    />
  );
}
