import type { Metadata } from "next";
import ReadingListsOverview from "@/components/modules/ReadingLists/ReadingListsOverview";

export const metadata: Metadata = { title: "Reading Lists | Account" };

export default function ReadingListsPage() {
  return <ReadingListsOverview />;
}
