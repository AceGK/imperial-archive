import { pageMetadata } from "@/lib/seo";
import PageHeader from "@/components/modules/PageHeader";
import TrackGuide from "@/components/modules/TrackGuide";

export const metadata = pageMetadata({
  title: "Warhammer 40k Reading Tracker",
  description:
    "Track your Warhammer 40k reading for free: mark Black Library books as want to read, reading, read, or owned, straight from any book card or book page.",
  path: "/track",
});

export default function TrackPage() {
  return (
    <main>
      <PageHeader
        title="Track Your Reading"
        subtitle="Log every book you want to read, are reading, have finished, and own, across the whole Black Library."
        align="center"
        strongOverlay
        height="sm"
        priority
        image="/images/Inquisitor-Arch-vukasin-ivkovic.jpg"
        credit="Inquisitor Arch by Vukasin Ivkovic"
      />
      <div className="container">
        <TrackGuide />
      </div>
    </main>
  );
}
