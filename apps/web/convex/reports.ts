import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { internalAction, internalQuery, mutation, query, type QueryCtx } from "./_generated/server";
import { sendEmail } from "./emails";
import {
  MAX_LENGTH,
  REPORT_RATE_LIMITED,
  REPORT_TYPE_LABELS,
  formatReleaseDate,
  isValidReleaseDate,
  type ReportField,
} from "./reportFields";

// Report and feedback tickets from the site's forms.
//
// Submissions arrive from the site's server action, which has already checked
// the honeypot and Turnstile, and carry REPORTS_SECRET so the public can't call
// `submit` directly. Requires on the deployment:
//   REPORTS_SECRET         shared with the site (Vercel env)
//   ADMIN_EMAILS           comma-separated account emails that can read and triage reports
//   REPORTS_NOTIFY_EMAIL   optional; where each new report is emailed

const PER_IP_PER_HOUR = 5;
const PER_USER_PER_HOUR = 10;
// a ceiling for everyone together, so a flood can't run up the bill
const ALL_PER_HOUR = 100;
const HOUR = 60 * 60 * 1000;

const reportType = v.union(v.literal("siteIssue"), v.literal("missingBook"), v.literal("feedback"));
const reportStatus = v.union(v.literal("new"), v.literal("inProgress"), v.literal("done"), v.literal("declined"));

const optionalFields = {
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  message: v.optional(v.string()),
  pageUrl: v.optional(v.string()),
  os: v.optional(v.string()),
  browser: v.optional(v.string()),
  bookTitle: v.optional(v.string()),
  bookAuthor: v.optional(v.string()),
  series: v.optional(v.string()),
  format: v.optional(v.string()),
  releaseDate: v.optional(v.string()),
  isbn: v.optional(v.string()),
  link: v.optional(v.string()),
};

export const submit = mutation({
  args: { secret: v.string(), type: reportType, ipHash: v.optional(v.string()), ...optionalFields },
  handler: async (ctx, { secret, type, ipHash, ...fields }) => {
    const expected = process.env.REPORTS_SECRET;
    if (!expected) throw new Error("Reports are not configured: set REPORTS_SECRET");
    if (secret !== expected) throw new Error("Not allowed");

    // the site validates these too; this keeps oversized values out regardless
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value.length > MAX_LENGTH[key as ReportField]) {
        throw new Error(`${key} is too long`);
      }
    }
    if (fields.releaseDate !== undefined && !isValidReleaseDate(fields.releaseDate)) {
      throw new Error("releaseDate is not a valid date");
    }
    if (type === "missingBook" && (!fields.bookTitle?.trim() || !fields.bookAuthor?.trim())) {
      throw new Error("A missing book needs a title and author");
    }
    if (type !== "missingBook" && !fields.message?.trim()) {
      throw new Error("A message is required");
    }

    const userId = await getAuthUserId(ctx);
    const since = Date.now() - HOUR;
    const recent = await ctx.db
      .query("reports")
      .withIndex("by_creation_time", (q) => q.gt("_creationTime", since))
      .take(ALL_PER_HOUR);
    const limited =
      recent.length >= ALL_PER_HOUR ||
      (ipHash && recent.filter((r) => r.ipHash === ipHash).length >= PER_IP_PER_HOUR) ||
      (userId && recent.filter((r) => r.userId === userId).length >= PER_USER_PER_HOUR);
    if (limited) throw new ConvexError(REPORT_RATE_LIMITED);

    const id = await ctx.db.insert("reports", {
      type,
      status: "new",
      ...fields,
      userId: userId ?? undefined,
      ipHash,
      updatedAt: Date.now(),
    });
    if (process.env.REPORTS_NOTIFY_EMAIL) {
      await ctx.scheduler.runAfter(0, internal.reports.notify, { id });
    }
  },
});

/** Emails a new report's contents, so most can be read without opening the inbox */
export const notify = internalAction({
  args: { id: v.id("reports") },
  handler: async (ctx, { id }) => {
    const to = process.env.REPORTS_NOTIFY_EMAIL;
    if (!to) return;
    const report = await ctx.runQuery(internal.reports.getForEmail, { id });
    if (!report) return;

    const subject = `[${REPORT_TYPE_LABELS[report.type]}] ${
      report.type === "missingBook" ? `${report.bookTitle} by ${report.bookAuthor}` : firstLine(report.message)
    }`;
    await sendEmail({ to, subject, text: describe(report) });
  },
});

export const getForEmail = internalQuery({
  args: { id: v.id("reports") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

const FIELD_LABELS: [keyof Doc<"reports">, string][] = [
  ["bookTitle", "Title"],
  ["bookAuthor", "Author"],
  ["series", "Series"],
  ["format", "Format"],
  ["releaseDate", "Release date"],
  ["releaseYear", "Release year"],
  ["isbn", "ISBN"],
  ["link", "Link"],
  ["pageUrl", "Page"],
  ["os", "OS"],
  ["browser", "Browser"],
  ["name", "Name"],
  ["email", "Email"],
];

function firstLine(text?: string) {
  const line = (text ?? "").split("\n")[0].trim();
  return line.length > 70 ? `${line.slice(0, 70)}…` : line || "(no message)";
}

function describe(report: Doc<"reports">) {
  const lines = FIELD_LABELS.flatMap(([key, label]) => {
    if (!report[key]) return [];
    const value = key === "releaseDate" ? formatReleaseDate(String(report[key])) : report[key];
    return [`${label}: ${value}`];
  });
  if (report.userId) lines.push(`Account: ${report.userId}`);
  return [
    `New ${REPORT_TYPE_LABELS[report.type].toLowerCase()} report`,
    lines.join("\n"),
    report.message ? `Message:\n${report.message}` : "",
    `Triage it at ${process.env.SITE_URL ?? "https://imperialarchive.com"}/admin/reports`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function isAdminUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const user = await ctx.db.get(userId);
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return !!user?.email && admins.includes(user.email.toLowerCase());
}

/** Whether the signed-in user can see the reports inbox */
export const isAdmin = query({
  args: {},
  handler: async (ctx) => isAdminUser(ctx),
});

/** Newest first, a page at a time, optionally one status and/or type */
export const list = query({
  args: {
    status: v.optional(reportStatus),
    type: v.optional(reportType),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { status, type, paginationOpts }) => {
    if (!(await isAdminUser(ctx))) throw new Error("Not allowed");
    const base = status
      ? ctx.db.query("reports").withIndex("by_status", (q) => q.eq("status", status))
      : ctx.db.query("reports");
    const ordered = base.order("desc");
    return (type ? ordered.filter((q) => q.eq(q.field("type"), type)) : ordered).paginate(paginationOpts);
  },
});

export const setStatus = mutation({
  args: { id: v.id("reports"), status: reportStatus },
  handler: async (ctx, { id, status }) => {
    if (!(await isAdminUser(ctx))) throw new Error("Not allowed");
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
  },
});

