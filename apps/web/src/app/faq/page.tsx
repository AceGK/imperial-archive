import type { Metadata } from "next";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata: Metadata = {
  title: "FAQ | Imperial Archive",
  description: "Frequently asked questions about Imperial Archive.",
};

export default function FaqPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · Inquiry"
      title="FAQ"
      description="Answers to common questions about the Archive are being compiled. Check back soon."
    />
  );
}
