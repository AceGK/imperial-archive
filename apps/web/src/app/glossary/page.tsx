import ComingSoon from "@/components/modules/ComingSoon";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Glossary",
  description:
    "A Warhammer 40,000 glossary: the terms, titles and dates that come up in Black Library books. Coming soon to Imperial Archive.",
  path: "/glossary",
  // placeholder until the page has real content
  noindex: true,
});

export default function GlossaryPage() {
  return (
    <ComingSoon
      title="Glossary"
      description="The terms, titles and dates that come up in the books, from Astartes and primarchs to what M41 means. The glossary is being compiled. Check back soon."
    />
  );
}
