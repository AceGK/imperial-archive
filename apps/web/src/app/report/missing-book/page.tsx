import ReportPage from "@/components/modules/ReportForm/ReportPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Report a Missing Book",
  description: "Tell Imperial Archive about a Warhammer 40,000 Black Library book that isn't in the catalog yet.",
  path: "/report/missing-book",
});

export default function MissingBookPage() {
  return (
    <ReportPage
      type="missingBook"
      intro={
        <p>
          The Archive is compiled by hand, so some books are still missing. A title and author are enough; anything
          else you know helps the record get added sooner.
        </p>
      }
    />
  );
}
