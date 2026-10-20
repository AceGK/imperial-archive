import ComingSoon from "@/components/modules/ComingSoon";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Contact Imperial Archive, the fan-made Warhammer 40k book catalog and reading tracker. Coming soon.",
  path: "/contact",
  // placeholder until the page has real content
  noindex: true,
});

export default function ContactPage() {
  return (
    <ComingSoon
      eyebrow="Adeptus Administratum · IA-006 // Vox"
      title="Contact"
      description="A direct line to the Archivist is being set up. Until then, the feedback and report forms reach the Archive."
    />
  );
}
