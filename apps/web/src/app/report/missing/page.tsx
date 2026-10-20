import ReportPage from "@/components/modules/ReportForm/ReportPage";
import type { ArchiveAuthor } from "@/components/modules/ReportForm/AuthorInput";
import { client } from "@/lib/sanity/sanity.client";
import { authorNames40kQuery } from "@/lib/sanity/queries";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Report Something Missing",
  description:
    "Tell Imperial Archive about a Warhammer 40,000 Black Library book, author, or series that isn't in the catalog yet.",
  path: "/report/missing",
});

export default async function MissingPage() {
  // suggested in the Author field; small enough to send whole
  const authors = await client.fetch<ArchiveAuthor[]>(authorNames40kQuery, {}, { next: { revalidate: 60 } });

  return (
    <ReportPage
      type="missingBook"
      authors={authors}
      intro={
        <p>
          The Archive is compiled by hand, so some books, authors and series are still missing. A name is enough;
          anything else you know helps the record get added sooner.
        </p>
      }
    />
  );
}
