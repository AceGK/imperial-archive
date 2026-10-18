"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { ConvexError } from "convex/values";
import { fetchMutation } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { z } from "zod";
import { api } from "@convex/_generated/api";
import {
  BROWSER_OPTIONS,
  FORMAT_OPTIONS,
  HONEYPOT_FIELD,
  MAX_LENGTH,
  OS_OPTIONS,
  REPORT_RATE_LIMITED,
  type ReportType,
} from "@convex/reportFields";

// Runs on the site's server before anything reaches Convex: the honeypot,
// validation and Turnstile all reject here, so bots don't use Convex calls.
// Requires TURNSTILE_SECRET_KEY and REPORTS_SECRET (the same value as on the
// Convex deployment).

export type ReportResult = { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string> };

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const optional = (max: number) =>
  text(max)
    .optional()
    .transform((value) => value || undefined);
const oneOf = (options: readonly string[]) =>
  z
    .string()
    .optional()
    .transform((value) => (value && options.includes(value) ? value : undefined));

const contact = {
  name: optional(MAX_LENGTH.name),
  email: optional(MAX_LENGTH.email).refine((value) => !value || z.email().safeParse(value).success, "Enter a valid email address, or leave it blank."),
};

const schemas = {
  siteIssue: z.object({
    ...contact,
    message: text(MAX_LENGTH.message).min(1, "Describe the issue."),
    pageUrl: optional(MAX_LENGTH.pageUrl),
    os: oneOf(OS_OPTIONS),
    browser: oneOf(BROWSER_OPTIONS),
  }),
  missingBook: z.object({
    ...contact,
    bookTitle: text(MAX_LENGTH.bookTitle).min(1, "Enter the book's title."),
    bookAuthor: text(MAX_LENGTH.bookAuthor).min(1, "Enter the author."),
    series: optional(MAX_LENGTH.series),
    format: oneOf(FORMAT_OPTIONS),
    releaseYear: optional(MAX_LENGTH.releaseYear).refine((value) => !value || /^\d{4}$/.test(value), "Use a four-digit year."),
    isbn: optional(MAX_LENGTH.isbn),
    link: optional(MAX_LENGTH.link).refine((value) => !value || /^https?:\/\/\S+$/i.test(value), "Enter a full link starting with http:// or https://."),
    message: optional(MAX_LENGTH.message),
  }),
  feedback: z.object({
    ...contact,
    message: text(MAX_LENGTH.message).min(1, "Write your feedback."),
  }),
} satisfies Record<ReportType, z.ZodType>;

const GENERIC_ERROR = "Your report couldn't be sent. Please try again in a moment.";

export async function submitReport(type: ReportType, formData: FormData): Promise<ReportResult> {
  // a filled honeypot is a bot: answer as if it worked, so it learns nothing
  if (String(formData.get(HONEYPOT_FIELD) ?? "")) return { ok: true };

  const parsed = schemas[type].safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: "Check the highlighted fields.", fieldErrors };
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0].trim() || requestHeaders.get("x-real-ip") || undefined;

  if (!(await passesTurnstile(formData.get("turnstileToken"), ip))) {
    return { ok: false, message: "The security check failed. Try again, or refresh the page if it keeps failing." };
  }

  const secret = process.env.REPORTS_SECRET;
  if (!secret) {
    console.error("REPORTS_SECRET is not set");
    return { ok: false, message: GENERIC_ERROR };
  }

  try {
    await fetchMutation(
      api.reports.submit,
      {
        secret,
        type,
        ipHash: ip ? createHash("sha256").update(`${secret}:${ip}`).digest("hex") : undefined,
        ...parsed.data,
      },
      // links the report to the sender's account when they're signed in
      { token: await convexAuthNextjsToken() },
    );
    return { ok: true };
  } catch (err) {
    if (err instanceof ConvexError && err.data === REPORT_RATE_LIMITED) {
      return { ok: false, message: "You've sent a lot of reports in a short time. Please try again in an hour." };
    }
    console.error("Could not save a report:", err);
    return { ok: false, message: GENERIC_ERROR };
  }
}

async function passesTurnstile(token: FormDataEntryValue | null, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not set");
    return false;
  }
  if (typeof token !== "string" || !token) return false;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });
  const result = (await response.json()) as { success: boolean };
  return result.success;
}
