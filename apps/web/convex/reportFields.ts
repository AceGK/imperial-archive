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
  releaseDate: 10,
  isbn: 20,
  link: 500,
} as const;

export type ReportField = keyof typeof MAX_LENGTH;

/**
 * A missing book's release date, as much of it as the reader knows: "2024",
 * "2024-03" or "2024-03-15"
 */
const RELEASE_DATE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

/** Black Library's earliest books are from the late 1980s; announced titles can be a few years out */
export const RELEASE_YEAR_MIN = 1980;
export const releaseYearMax = () => new Date().getFullYear() + 3;

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** True for a year, year-month or full date that exists on the calendar, within the accepted years */
export function isValidReleaseDate(value: string): boolean {
  const match = RELEASE_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map((part) => (part ? Number(part) : undefined));
  if (year! < RELEASE_YEAR_MIN || year! > releaseYearMax()) return false;
  if (month === undefined) return true;
  if (month < 1 || month > 12) return false;
  return day === undefined || (day >= 1 && day <= daysInMonth(year!, month));
}

/** "March 15, 2024", "March 2024" or "2024", for the inbox and emails */
export function formatReleaseDate(value: string): string {
  const match = RELEASE_DATE.exec(value);
  if (!match) return value;
  const [year, month, day] = match.slice(1);
  if (!month) return year;
  const name = MONTH_NAMES[Number(month) - 1] ?? month;
  return day ? `${name} ${Number(day)}, ${year}` : `${name} ${year}`;
}

/** Hidden form field real visitors never fill in; bots that fill every input do */
export const HONEYPOT_FIELD = "website";

/** Error codes the submit function throws as ConvexError data */
export const REPORT_RATE_LIMITED = "ReportRateLimited";
