import ReportPage from "@/components/modules/ReportForm/ReportPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Send Feedback",
  description: "Send feedback, ideas, or suggestions for Imperial Archive, the Warhammer 40k book catalog and reading tracker.",
  path: "/feedback",
});

export default function FeedbackPage() {
  return (
    <ReportPage
      type="feedback"
      intro={
        <p>
          Ideas for features, thoughts on what works and what doesn&apos;t, or just a hail to the Archivist. Every
          message is read.
        </p>
      }
    />
  );
}
