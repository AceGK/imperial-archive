import type { Metadata } from "next";
import ComingSoon from "@/components/modules/ComingSoon";

export const metadata: Metadata = {
  title: "Support | Imperial Archive",
  description: "Ways to support Imperial Archive.",
};

export default function SupportPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · Tithe"
      title="Support"
      description="Ways to support the upkeep of this archive are being prepared. Check back soon."
    />
  );
}
