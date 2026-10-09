import ComingSoon from "@/components/modules/ComingSoon";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Warhammer 40k Books by Character",
  description:
    "Find Warhammer 40,000 books by character: primarchs, inquisitors, commissars, and heroes and villains across the Black Library catalog. Coming soon to Imperial Archive.",
  path: "/characters",
  // placeholder until the page has real content
  noindex: true,
});

export default function CharactersPage() {
  return (
    <ComingSoon
      title="Characters"
      description="Browse books by the characters who appear in them, from primarchs and inquisitors to commissars and Guardsmen. Character records are being compiled. Check back soon."
    />
  );
}
