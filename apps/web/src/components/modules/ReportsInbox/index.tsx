"use client";

import { useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import {
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  type ReportStatus,
  type ReportType,
} from "@convex/reportFields";
import Button from "@/components/ui/Button";
import styles from "./styles.module.scss";

const STATUSES = Object.keys(REPORT_STATUS_LABELS) as ReportStatus[];
const TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[];
const PAGE_SIZE = 20;

const DETAIL_LABELS: [keyof Doc<"reports">, string][] = [
  ["bookTitle", "Title"],
  ["bookAuthor", "Author"],
  ["series", "Series"],
  ["format", "Format"],
  ["releaseYear", "Release year"],
  ["isbn", "ISBN"],
  ["link", "Link"],
  ["pageUrl", "Page"],
  ["os", "OS"],
  ["browser", "Browser"],
];

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function isUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function ReportItem({ report }: { report: Doc<"reports"> }) {
  const setStatus = useMutation(api.reports.setStatus);
  const details = DETAIL_LABELS.filter(([key]) => report[key]);

  return (
    <li className={styles.report}>
      <div className={styles.reportHead}>
        <span className={styles.type}>{REPORT_TYPE_LABELS[report.type]}</span>
        <time className={styles.date} dateTime={new Date(report._creationTime).toISOString()}>
          {dateFormat.format(report._creationTime)}
        </time>
        <label className={styles.statusLabel}>
          <span className={styles.visuallyHidden}>Status</span>
          <select
            className={styles.status}
            data-status={report.status}
            value={report.status}
            onChange={(e) => setStatus({ id: report._id, status: e.target.value as ReportStatus })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {REPORT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {details.length > 0 && (
        <dl className={styles.details}>
          {details.map(([key, label]) => {
            const value = String(report[key]);
            return (
              <div key={key}>
                <dt>{label}</dt>
                <dd>
                  {isUrl(value) ? (
                    <a href={value} target="_blank" rel="noopener noreferrer">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      {report.message && <p className={styles.message}>{report.message}</p>}

      <p className={styles.sender}>
        {report.name || report.email ? (
          <>
            From {report.name || "someone"}
            {report.email && (
              <>
                {" "}
                · <a href={`mailto:${report.email}`}>{report.email}</a>
              </>
            )}
          </>
        ) : (
          "Anonymous"
        )}
        {report.userId && <span className={styles.account}> · signed in</span>}
      </p>
    </li>
  );
}

/** The report and feedback tickets, for the Archive's admins */
export default function ReportsInbox() {
  const isAdmin = useQuery(api.reports.isAdmin);
  const [status, setStatus] = useState<ReportStatus | "all">("new");
  const [type, setType] = useState<ReportType | "all">("all");

  const { results, status: loadStatus, loadMore } = usePaginatedQuery(
    api.reports.list,
    isAdmin
      ? { status: status === "all" ? undefined : status, type: type === "all" ? undefined : type }
      : "skip",
    { initialNumItems: PAGE_SIZE },
  );

  if (isAdmin === undefined) return <p className={styles.note}>Loading…</p>;
  if (!isAdmin) return <p className={styles.note}>This page is only available to the Archive&apos;s admins.</p>;

  return (
    <div className={styles.inbox}>
      <div className={styles.filters}>
        <div className={styles.tabs} role="group" aria-label="Status">
          {(["new", "inProgress", "done", "declined", "all"] as const).map((s) => (
            <button key={s} type="button" className={styles.tab} aria-pressed={status === s} onClick={() => setStatus(s)}>
              {s === "all" ? "All" : REPORT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <label className={styles.typeFilter}>
          <span className={styles.visuallyHidden}>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as ReportType | "all")}>
            <option value="all">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {REPORT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loadStatus === "LoadingFirstPage" ? (
        <p className={styles.note}>Loading…</p>
      ) : results.length === 0 ? (
        <p className={styles.note}>Nothing here.</p>
      ) : (
        <ul className={styles.list}>
          {results.map((report) => (
            <ReportItem key={report._id} report={report} />
          ))}
        </ul>
      )}

      {loadStatus === "CanLoadMore" && (
        <Button variant="secondary" onClick={() => loadMore(PAGE_SIZE)}>
          Load more
        </Button>
      )}
    </div>
  );
}
