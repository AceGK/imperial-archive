import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import type { ReportType } from "@convex/reportFields";
import Card from "@/components/ui/Card";
import InfoHeader from "@/components/modules/InfoHeader";
import ReportForm from ".";
import type { ArchiveAuthor } from "./AuthorInput";
import BugIcon from "@/components/icons/bug.svg";
import BookQuestionIcon from "@/components/icons/book-question.svg";
import FeedbackIcon from "@/components/icons/feedback.svg";
import styles from "./page.module.scss";

type ReportPageInfo = {
  href: string;
  title: string;
  /** The Administratum office in the page header, e.g. "IA-009" and "Errata" */
  section: string;
  office: string;
  /** The card's reference code and record name, e.g. "ER-01" and "Erratum" */
  code: string;
  record: string;
  blurb: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const REPORT_PAGES: Record<ReportType, ReportPageInfo> = {
  siteIssue: {
    href: "/report/site-issue",
    title: "Report a site issue",
    section: "IA-009",
    office: "Errata",
    code: "ER-01",
    record: "Erratum",
    blurb: "Something broken, confusing, or hard to use",
    icon: BugIcon,
  },
  missingBook: {
    href: "/report/missing",
    title: "Report something missing",
    section: "IA-010",
    office: "Petitions",
    code: "PT-01",
    record: "Petition",
    blurb: "A book, author, or series the Archive doesn't have yet",
    icon: BookQuestionIcon,
  },
  feedback: {
    href: "/feedback",
    title: "Send feedback",
    section: "IA-008",
    office: "Requisitions",
    code: "RQ-01",
    record: "Requisition",
    blurb: "Ideas, requests, suggestions, or anything else",
    icon: FeedbackIcon,
  },
};

/** Page layout shared by the report and feedback forms */
export default function ReportPage({
  type,
  intro,
  authors,
}: {
  type: ReportType;
  intro: ReactNode;
  /** The Archive's authors, suggested in the missing book form */
  authors?: ArchiveAuthor[];
}) {
  const page = REPORT_PAGES[type];
  const others = (Object.keys(REPORT_PAGES) as ReportType[]).filter((t) => t !== type);

  return (
    <main>
      <section className="container row__md">
        <div className={styles.page}>
          <InfoHeader label={`Adeptus Administratum · ${page.section} // ${page.office}`} title={page.title} />

          <Card eyebrow={<span className={styles.eyebrow}>{page.code} · {page.record}</span>}>
            <div className={styles.intro}>{intro}</div>
            <ReportForm type={type} authors={authors} />
          </Card>

          <nav className={styles.others} aria-label="Other forms">
            {others.map((t) => {
              const { href, title, blurb, icon: Icon } = REPORT_PAGES[t];
              return (
                <Link key={t} href={href} className={styles.other}>
                  <Icon className={styles.otherIcon} aria-hidden="true" />
                  <span className={styles.otherTitle}>{title}</span>
                  <span className={styles.otherBlurb}>{blurb}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>
    </main>
  );
}
