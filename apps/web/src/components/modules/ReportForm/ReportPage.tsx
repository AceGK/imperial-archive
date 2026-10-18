import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import type { ReportType } from "@convex/reportFields";
import Card from "@/components/ui/Card";
import InfoHeader from "@/components/modules/InfoHeader";
import ReportForm from ".";
import BugIcon from "@/components/icons/bug.svg";
import BookQuestionIcon from "@/components/icons/book-question.svg";
import FeedbackIcon from "@/components/icons/feedback.svg";
import styles from "./page.module.scss";

type ReportPageInfo = {
  href: string;
  title: string;
  code: string;
  blurb: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const REPORT_PAGES: Record<ReportType, ReportPageInfo> = {
  siteIssue: {
    href: "/report/site-issue",
    title: "Report a site issue",
    code: "VX-01",
    blurb: "Something broken, confusing, or hard to use",
    icon: BugIcon,
  },
  missingBook: {
    href: "/report/missing-book",
    title: "Report a missing book",
    code: "VX-02",
    blurb: "A Black Library title the Archive doesn't have yet",
    icon: BookQuestionIcon,
  },
  feedback: {
    href: "/feedback",
    title: "Send feedback",
    code: "VX-03",
    blurb: "Ideas, requests, suggestions, or anything else",
    icon: FeedbackIcon,
  },
};

/** Page layout shared by the report and feedback forms */
export default function ReportPage({ type, intro }: { type: ReportType; intro: ReactNode }) {
  const page = REPORT_PAGES[type];
  const others = (Object.keys(REPORT_PAGES) as ReportType[]).filter((t) => t !== type);

  return (
    <main>
      <section className="container row__md">
        <div className={styles.page}>
          <InfoHeader label="Adeptus Administratum · IA-006 // Vox" title={page.title} />

          <Card eyebrow={<span className={styles.eyebrow}>{page.code} · Vox-channel</span>}>
            <div className={styles.intro}>{intro}</div>
            <ReportForm type={type} />
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
