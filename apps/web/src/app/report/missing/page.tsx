import ReportPage from "@/components/modules/ReportForm/ReportPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Report Something Missing",
  description:
    "Tell Imperial Archive about a Warhammer 40,000 Black Library book, author, or series that isn't in the catalog yet.",
  path: "/report/missing",
});

export default function MissingPage() {
  return (
    <ReportPage
      type="missingBook"
      intro={
        <p>
          The Archive is compiled by hand, so some books, authors and series are still missing. A name is enough;
          anything else you know helps the record get added sooner.
        </p>
      }
    />
  );
}
