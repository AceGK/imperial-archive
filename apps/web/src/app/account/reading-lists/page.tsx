import type { Metadata } from "next";
import ComingSoon from "@/components/modules/Account/ComingSoon";
import ReadingListsIcon from "@/components/icons/account/reading-lists.svg";

export const metadata: Metadata = { title: "Reading Lists | Account" };

export default function ReadingListsPage() {
  return (
    <ComingSoon
      title="Reading Lists"
      description="Curate your own reading lists and reading orders."
      icon={ReadingListsIcon}
      features={[
        "Create lists of books in your own order",
        "Build custom reading orders across series",
        "Share your lists with other readers",
      ]}
    />
  );
}
