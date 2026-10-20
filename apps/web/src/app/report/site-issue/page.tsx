import ReportPage from "@/components/modules/ReportForm/ReportPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Report a Site Issue",
  description: "Report a bug, a broken page, or something hard to use on Imperial Archive.",
  path: "/report/site-issue",
});

export default function SiteIssuePage() {
  return (
    <ReportPage
      type="siteIssue"
      intro={
        <p>
          Found a broken page, a layout problem, or something that&apos;s hard to use? Describe what happened and,
          if you can, where. Your device and browser are filled in where they can be guessed.
        </p>
      }
    />
  );
}
