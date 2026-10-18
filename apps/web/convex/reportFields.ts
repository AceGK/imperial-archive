// Shared by the report forms (the site) and the reports functions (Convex): no
// server-only imports here.

export type ReportType = "siteIssue" | "missingBook" | "feedback";
export type ReportStatus = "new" | "inProgress" | "done" | "declined";

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  siteIssue: "Site issue",
  missingBook: "Missing book",
  feedback: "Feedback",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  new: "New",
  inProgress: "In progress",
  done: "Done",
  declined: "Declined",
};

export const OS_OPTIONS = ["Windows", "macOS", "iOS / iPadOS", "Android", "Linux", "ChromeOS", "Other"] as const;
export const BROWSER_OPTIONS = ["Chrome", "Safari", "Firefox", "Edge", "Samsung Internet", "Opera", "Brave", "Other"] as const;
export const FORMAT_OPTIONS = ["Novel", "Novella", "Short Story", "Anthology", "Omnibus", "Audio Drama", "Other"] as const;

/** Longest accepted value per field, checked by the form and again by Convex */
export const MAX_LENGTH = {
  name: 100,
  email: 200,
  message: 5000,
  pageUrl: 500,
  os: 50,
  browser: 50,
  bookTitle: 200,
  bookAuthor: 200,
  series: 200,
  format: 50,
  releaseYear: 4,
  isbn: 20,
  link: 500,
} as const;

export type ReportField = keyof typeof MAX_LENGTH;

/** Hidden form field real visitors never fill in; bots that fill every input do */
export const HONEYPOT_FIELD = "website";

/** Error codes the submit function throws as ConvexError data */
export const REPORT_RATE_LIMITED = "ReportRateLimited";
