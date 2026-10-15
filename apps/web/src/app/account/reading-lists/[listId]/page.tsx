import type { Metadata } from "next";
import ReadingListDetail from "@/components/modules/ReadingLists/ReadingListDetail";

export const metadata: Metadata = { title: "Reading List | Account" };

export default async function ReadingListPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = await params;
  return <ReadingListDetail listId={listId} />;
}
