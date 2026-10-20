"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  BROWSER_OPTIONS,
  FORMAT_OPTIONS,
  HONEYPOT_FIELD,
  MAX_LENGTH,
  MISSING_KINDS,
  MISSING_KIND_LABELS,
  MONTH_NAMES,
  OS_OPTIONS,
  daysInMonth,
  type MissingKind,
  type ReportType,
} from "@convex/reportFields";
import { submitReport } from "@/lib/reports/submit";
import Button from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import Turnstile, { turnstileBlockedMessage, type TurnstileHandle, type TurnstileState } from "@/components/ui/Turnstile";
import BookIcon from "@/components/icons/book-spine.svg";
import QuillPenIcon from "@/components/icons/quill-pen.svg";
import BooksIcon from "@/components/icons/books.svg";
import styles from "./styles.module.scss";

// the Browse menu's icons for books, authors and series
const MISSING_KIND_ICONS: Record<MissingKind, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  book: BookIcon,
  author: QuillPenIcon,
  series: BooksIcon,
};

const SUBMIT_LABELS: Record<ReportType, string> = {
  siteIssue: "Send report",
  missingBook: "Send report",
  feedback: "Send feedback",
};

/** Best guess at the visitor's OS and browser, to prefill the site issue form */
function detectPlatform() {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
    ? "iOS / iPadOS"
    : /Android/.test(ua)
      ? "Android"
      : /CrOS/.test(ua)
        ? "ChromeOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Macintosh/.test(ua)
            ? "macOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "";
  // order matters: most browsers also claim to be Chrome and Safari
  const browser = /SamsungBrowser/.test(ua)
    ? "Samsung Internet"
    : /Edg\//.test(ua)
      ? "Edge"
      : /OPR\/|Opera/.test(ua)
        ? "Opera"
        : /Firefox|FxiOS/.test(ua)
          ? "Firefox"
          : /Chrome|CriOS/.test(ua)
            ? "Chrome"
            : /Safari/.test(ua)
              ? "Safari"
              : "";
  return { os, browser };
}

type FieldProps = {
  name: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
};

function Field({ name, label, required, hint, error, children }: FieldProps) {
  const id = `report-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`${styles.field} ${error ? styles.invalid : ""}`}>
      <label htmlFor={id}>
        {label}
        {required ? <span className={styles.required}> *</span> : <span className={styles.optional}> (optional)</span>}
      </label>
      {children(id, describedBy)}
      {hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className={styles.fieldError}>
          {error}
        </span>
      )}
    </div>
  );
}

/**
 * A dropdown drawn in the page rather than the browser's native one (Chrome on
 * Windows drew a stray white box around the native list). The hidden input
 * sends the choice with the form.
 */
function FormSelect({
  id,
  name,
  label,
  value,
  onChange,
  options,
  optionLabel = (option) => option,
  placeholder = "Not sure",
  disabled,
  describedBy,
}: {
  id: string;
  /** Leave off for a part of a field that's sent some other way (the release date's month and day) */
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  /** Shown for each option, e.g. a month's name for "03"; the option itself by default */
  optionLabel?: (option: string) => string;
  /** Shown on the button while nothing is chosen */
  placeholder?: string;
  disabled?: boolean;
  describedBy?: string;
}) {
  return (
    <>
      <Select.Root value={value} onValueChange={onChange} className={styles.select}>
        <Select.Trigger asChild id={id} aria-label={label}>
          <button type="button" className={styles.selectTrigger} aria-describedby={describedBy} disabled={disabled}>
            {value ? optionLabel(value) : placeholder}
          </button>
        </Select.Trigger>
        <Select.Content className={styles.selectList}>
          <Select.Item value="">Not sure</Select.Item>
          {options.map((option) => (
            <Select.Item key={option} value={option}>
              {optionLabel(option)}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      {name && <input type="hidden" name={name} value={value} />}
    </>
  );
}

type ReleaseParts = { year: string; month: string; day: string };
const NO_RELEASE: ReleaseParts = { year: "", month: "", day: "" };
const MONTHS = MONTH_NAMES.map((_, i) => String(i + 1).padStart(2, "0"));
const monthName = (month: string) => MONTH_NAMES[Number(month) - 1];

/**
 * A missing book's release date as a year, with the month and day optional,
 * since readers often know only the year. Sent as one value: "2024",
 * "2024-03" or "2024-03-15".
 */
function ReleaseDate({
  id,
  parts,
  onChange,
  describedBy,
  invalid,
}: {
  id: string;
  parts: ReleaseParts;
  onChange: (parts: ReleaseParts) => void;
  describedBy?: string;
  invalid: boolean;
}) {
  const { year, month, day } = parts;
  const hasYear = /^\d{4}$/.test(year);
  const dayCount = hasYear && month ? daysInMonth(Number(year), Number(month)) : 31;
  const days = Array.from({ length: dayCount }, (_, i) => String(i + 1).padStart(2, "0"));
  // a month or day only counts once the parts before it are filled in
  const value = !year ? "" : !hasYear || !month ? year : day ? `${year}-${month}-${day}` : `${year}-${month}`;

  // a day the new month or year doesn't have (Feb 30) is cleared
  const set = (next: Partial<ReleaseParts>) => {
    const merged = { ...parts, ...next };
    const max = /^\d{4}$/.test(merged.year) && merged.month ? daysInMonth(Number(merged.year), Number(merged.month)) : 31;
    onChange(Number(merged.day) > max ? { ...merged, day: "" } : merged);
  };

  return (
    <div className={styles.dateParts}>
      <input
        id={id}
        value={year}
        onChange={(e) => set({ year: e.target.value.replace(/\D/g, "").slice(0, 4) })}
        inputMode="numeric"
        autoComplete="off"
        placeholder="Year"
        aria-describedby={describedBy}
        aria-invalid={invalid}
      />
      <FormSelect
        id={`${id}-month`}
        label="Release month"
        value={hasYear ? month : ""}
        onChange={(m) => set({ month: m, ...(m ? {} : { day: "" }) })}
        options={MONTHS}
        optionLabel={monthName}
        placeholder="Month"
        disabled={!hasYear}
        describedBy={describedBy}
      />
      <FormSelect
        id={`${id}-day`}
        label="Release day"
        value={hasYear && month ? day : ""}
        onChange={(d) => set({ day: d })}
        options={days}
        optionLabel={(d) => String(Number(d))}
        placeholder="Day"
        disabled={!hasYear || !month}
        describedBy={describedBy}
      />
      <input type="hidden" name="releaseDate" value={value} />
    </div>
  );
}

/** One of the site's report or feedback forms, chosen by `type` */
export default function ReportForm({ type }: { type: ReportType }) {
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [turnstile, setTurnstile] = useState<TurnstileState>("pending");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [platform, setPlatform] = useState({ os: "", browser: "" });
  const [pageUrl, setPageUrl] = useState("");
  const [email, setEmail] = useState("");
  const [format, setFormat] = useState("");
  const [release, setRelease] = useState(NO_RELEASE);
  const [missingKind, setMissingKind] = useState<MissingKind>("book");
  const statusId = useId();

  const { isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");

  // prefill what can be guessed, once the page is in the browser
  useEffect(() => {
    if (type === "missingBook") {
      // links can open the form on an author or series: /report/missing?kind=author
      const kind = new URLSearchParams(window.location.search).get("kind");
      if (MISSING_KINDS.includes(kind as MissingKind)) setMissingKind(kind as MissingKind);
      return;
    }
    if (type !== "siteIssue") return;
    setPlatform(detectPlatform());
    // only from an explicit ?from= (a "report this page" link): document.referrer
    // isn't updated by in-app navigation, and a refresh makes it this form
    const from = new URLSearchParams(window.location.search).get("from");
    if (!from) return;
    const url = new URL(from, window.location.origin);
    if (url.origin === window.location.origin && !/^\/(report|feedback)(\/|$)/.test(url.pathname)) {
      setPageUrl(url.href);
    }
  }, [type]);

  useEffect(() => {
    if (viewer?.email) setEmail((current) => current || viewer.email!);
  }, [viewer?.email]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const blocked = turnstileBlockedMessage(turnstile);
    if (blocked) {
      setError(blocked);
      return;
    }
    setPending(true);
    setError(null);
    setFieldErrors({});
    const result = await submitReport(type, new FormData(e.currentTarget));
    setPending(false);
    // tokens are single-use, so get a fresh one whatever happened
    turnstileRef.current?.reset();
    if (result.ok) {
      setSent(true);
      formRef.current?.reset();
      setFormat("");
      setRelease(NO_RELEASE);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setError(result.message);
      setFieldErrors(result.fieldErrors ?? {});
    }
  };

  if (sent) {
    return (
      <div className={styles.sent} role="status">
        <p className={styles.sentTitle}>Received. Thank you.</p>
        <p>
          {type === "feedback"
            ? "Your feedback has been logged with the Archivist."
            : "Your report has been logged and will be looked into."}{" "}
          {email ? "If a reply is needed, it will come to the email you gave." : ""}
        </p>
        <Button variant="secondary" onClick={() => setSent(false)}>
          Send another
        </Button>
      </div>
    );
  }

  const err = (name: string) => fieldErrors[name];
  const counted = (name: keyof typeof MAX_LENGTH) => ({ name, maxLength: MAX_LENGTH[name] });

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate aria-describedby={error ? statusId : undefined}>
      {type === "missingBook" && (
        <>
          <fieldset className={styles.kinds}>
            <legend>What&apos;s missing?</legend>
            <div className={styles.kindOptions}>
              {MISSING_KINDS.map((kind) => {
                const Icon = MISSING_KIND_ICONS[kind];
                return (
                  <label key={kind} className={styles.kind}>
                    <input
                      type="radio"
                      name="missingKind"
                      value={kind}
                      checked={missingKind === kind}
                      onChange={() => {
                        setMissingKind(kind);
                        setFieldErrors({});
                      }}
                    />
                    <span>
                      <Icon aria-hidden="true" />
                      {MISSING_KIND_LABELS[kind]}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {missingKind === "book" && (
            <>
              <div className={styles.row}>
                <Field name="bookTitle" label="Title" required error={err("bookTitle")}>
                  {(id, d) => <input id={id} {...counted("bookTitle")} required aria-describedby={d} aria-invalid={!!err("bookTitle")} />}
                </Field>
                <Field name="bookAuthor" label="Author" required error={err("bookAuthor")}>
                  {(id, d) => <input id={id} {...counted("bookAuthor")} required aria-describedby={d} aria-invalid={!!err("bookAuthor")} />}
                </Field>
              </div>
              <div className={styles.row}>
                <Field name="series" label="Series" error={err("series")}>
                  {(id, d) => <input id={id} {...counted("series")} aria-describedby={d} />}
                </Field>
                <Field name="format" label="Format" error={err("format")}>
                  {(id, d) => (
                    <FormSelect id={id} name="format" label="Format" value={format} onChange={setFormat} options={FORMAT_OPTIONS} describedBy={d} />
                  )}
                </Field>
              </div>
              <div className={styles.row}>
                <Field name="releaseDate" label="Release date" hint="Just the year is fine" error={err("releaseDate")}>
                  {(id, d) => <ReleaseDate id={id} parts={release} onChange={setRelease} describedBy={d} invalid={!!err("releaseDate")} />}
                </Field>
                <Field name="isbn" label="ISBN" error={err("isbn")}>
                  {(id, d) => <input id={id} {...counted("isbn")} aria-describedby={d} />}
                </Field>
              </div>
            </>
          )}

          {/* an author's name goes in bookAuthor, as it would on a book */}
          {missingKind === "author" && (
            <Field name="bookAuthor" label="Author's name" required error={err("bookAuthor")}>
              {(id, d) => <input id={id} {...counted("bookAuthor")} required aria-describedby={d} aria-invalid={!!err("bookAuthor")} />}
            </Field>
          )}

          {missingKind === "series" && (
            <div className={styles.row}>
              <Field name="series" label="Series name" required error={err("series")}>
                {(id, d) => <input id={id} {...counted("series")} required aria-describedby={d} aria-invalid={!!err("series")} />}
              </Field>
              <Field name="bookAuthor" label="Author" hint="Or authors, for a shared series" error={err("bookAuthor")}>
                {(id, d) => <input id={id} {...counted("bookAuthor")} aria-describedby={d} />}
              </Field>
            </div>
          )}

          <Field name="link" label="Link" hint={`Black Library, Lexicanum, or any page about the ${missingKind}`} error={err("link")}>
            {(id, d) => <input id={id} type="url" {...counted("link")} placeholder="https://" aria-describedby={d} aria-invalid={!!err("link")} />}
          </Field>
          <Field
            name="message"
            label="Anything else"
            hint={
              missingKind === "author"
                ? "Books they've written, for example"
                : missingKind === "series"
                  ? "The books in it, for example"
                  : undefined
            }
            error={err("message")}
          >
            {(id, d) => <textarea id={id} {...counted("message")} rows={4} aria-describedby={d} />}
          </Field>
        </>
      )}

      {type === "siteIssue" && (
        <>
          <Field name="message" label="What went wrong?" required hint="What you did, what you expected, and what happened instead" error={err("message")}>
            {(id, d) => <textarea id={id} {...counted("message")} rows={6} required aria-describedby={d} aria-invalid={!!err("message")} />}
          </Field>
          <Field name="pageUrl" label="Page" hint="The address of the page with the problem" error={err("pageUrl")}>
            {(id, d) => (
              <input id={id} {...counted("pageUrl")} value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} placeholder="https://imperialarchive.com/..." aria-describedby={d} />
            )}
          </Field>
          <div className={styles.row}>
            <Field name="os" label="Operating system" error={err("os")}>
              {(id, d) => (
                <FormSelect
                  id={id}
                  name="os"
                  label="Operating system"
                  value={platform.os}
                  onChange={(os) => setPlatform((p) => ({ ...p, os }))}
                  options={OS_OPTIONS}
                  describedBy={d}
                />
              )}
            </Field>
            <Field name="browser" label="Browser" error={err("browser")}>
              {(id, d) => (
                <FormSelect
                  id={id}
                  name="browser"
                  label="Browser"
                  value={platform.browser}
                  onChange={(browser) => setPlatform((p) => ({ ...p, browser }))}
                  options={BROWSER_OPTIONS}
                  describedBy={d}
                />
              )}
            </Field>
          </div>
        </>
      )}

      {type === "feedback" && (
        <Field name="message" label="Your feedback" required error={err("message")}>
          {(id, d) => <textarea id={id} {...counted("message")} rows={7} required aria-describedby={d} aria-invalid={!!err("message")} />}
        </Field>
      )}

      <fieldset className={styles.contact}>
        <legend>Your details</legend>
        <p className={styles.hint}>
          {viewer ? "Signed in, so this will be linked to your account. " : ""}Only needed if you&apos;d like a reply.
        </p>
        <div className={styles.row}>
          <Field name="name" label="Name" error={err("name")}>
            {(id, d) => <input id={id} {...counted("name")} autoComplete="name" aria-describedby={d} />}
          </Field>
          <Field name="email" label="Email" error={err("email")}>
            {(id, d) => (
              <input
                id={id}
                type="email"
                {...counted("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                aria-describedby={d}
                aria-invalid={!!err("email")}
              />
            )}
          </Field>
        </div>
      </fieldset>

      {/* honeypot: hidden from people and screen readers, filled in by bots */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="report-website">Website</label>
        <input id="report-website" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </div>

      <Turnstile ref={turnstileRef} onChange={setTurnstile} />

      {error && (
        <p id={statusId} className={styles.error} role="alert">
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" className={styles.submit} disabled={pending}>
        {pending ? "Sending…" : SUBMIT_LABELS[type]}
      </Button>
    </form>
  );
}
