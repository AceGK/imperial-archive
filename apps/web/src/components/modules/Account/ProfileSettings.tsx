'use client';

import { useAction, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import PhoneInput, { formatPhoneNumberIntl, isValidPhoneNumber } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { api } from "@convex/_generated/api";
import Button from "@/components/ui/Button";
import SectionHeader from "./SectionHeader";
import { formatDate, getErrorMessage, type FormStatus } from "./utils";
import styles from "./styles.module.scss";

export default function ProfileSettings() {
  const viewer = useQuery(api.users.viewer);

  return (
    <>
      <SectionHeader title="Profile" description="Your account details and email address." />

      {viewer && !viewer.emailVerified && <VerifyEmailCard email={viewer.email} />}

      <section className={styles.card}>
        <h2>Account Details</h2>
        <dl className={styles.details}>
          <div>
            <dt>Email</dt>
            <dd>
              {viewer === undefined ? "Loading..." : (viewer?.email ?? "—")}
              {viewer && (
                <span className={viewer.emailVerified ? styles.verified : styles.unverified}>
                  {viewer.emailVerified ? "Verified" : "Not verified"}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{viewer === undefined ? "Loading..." : (viewer?.phone ? formatPhoneNumberIntl(viewer.phone) : "Not added")}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>{viewer ? formatDate(viewer.createdAt) : "—"}</dd>
          </div>
        </dl>
      </section>

      {viewer && !viewer.hasPassword ? (
        <section className={styles.card}>
          <h2>Change Email or Phone</h2>
          <p className={styles.cardDescription}>
            Changing your email or phone number requires a password.{" "}
            <Link href="/account/security" className={styles.textLink}>
              Set a password
            </Link>{" "}
            on the Security page first.
          </p>
        </section>
      ) : (
        <>
          <UpdateEmailForm />
          <UpdatePhoneForm currentPhone={viewer?.phone ?? null} />
        </>
      )}
    </>
  );
}

function VerifyEmailCard({ email }: { email: string | null }) {
  const startEmailVerification = useAction(api.users.startEmailVerification);
  const [codeSent, setCodeSent] = useState(false);
  const [status, setStatus] = useState<FormStatus>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setStatus(null);
    setLoading(true);
    try {
      await startEmailVerification();
      setCodeSent(true);
    } catch (err) {
      setStatus({ type: "error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`${styles.card} ${styles.callout}`}>
      <h2>Verify Your Email</h2>
      <p className={styles.cardDescription}>
        Confirm that {email ?? "your email"} belongs to you. This keeps password resets
        working and lets you link other sign-in methods later.
      </p>
      {codeSent ? (
        <EmailCodeForm email={email ?? ""} onResend={sendCode} />
      ) : (
        <div className={styles.form}>
          {status && <p className={styles[status.type]}>{status.message}</p>}
          <Button variant="primary" onClick={sendCode} disabled={loading}>
            {loading ? "Sending..." : "Send Code"}
          </Button>
        </div>
      )}
    </section>
  );
}

function UpdateEmailForm() {
  const startEmailChange = useAction(api.users.startEmailChange);
  // The new address a code was sent to, while waiting for the code
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus(null);
    setLoading(true);
    try {
      const { email } = await startEmailChange({
        newEmail: String(formData.get("newEmail")),
        currentPassword: String(formData.get("currentPassword")),
      });
      setPendingEmail(email);
    } catch (err) {
      setStatus({ type: "error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.card}>
      <h2>Change Email</h2>
      {pendingEmail ? (
        <>
          <p className={styles.cardDescription}>
            Enter the code we sent to your new address. Your email won&apos;t change until you confirm.
          </p>
          <EmailCodeForm
            email={pendingEmail}
            onCancel={() => setPendingEmail(null)}
            onConfirmed={(email) => {
              setPendingEmail(null);
              setStatus({ type: "success", message: `Email changed to ${email}. Use it next time you sign in.` });
            }}
          />
        </>
      ) : (
        <>
          <p className={styles.cardDescription}>
            We&apos;ll email a code to the new address to confirm it. Enter your current password to continue.
          </p>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="newEmail">New Email</label>
              <input
                id="newEmail"
                name="newEmail"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>
            {status && <p className={styles[status.type]}>{status.message}</p>}
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Sending code..." : "Send Code"}
            </Button>
          </form>
        </>
      )}
    </section>
  );
}

/** Code entry shared by "verify your email" and "change email". */
function EmailCodeForm({
  email,
  onConfirmed,
  onCancel,
  onResend,
}: {
  email: string;
  onConfirmed?: (email: string) => void;
  onCancel?: () => void;
  onResend?: () => Promise<void>;
}) {
  const confirmEmailCode = useAction(api.users.confirmEmailCode);
  const [status, setStatus] = useState<FormStatus>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code"));
    setStatus(null);
    setLoading(true);
    try {
      const result = await confirmEmailCode({ code });
      onConfirmed?.(result.email);
    } catch (err) {
      setStatus({ type: "error", message: getErrorMessage(err) });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <p className={styles.success}>We sent an 8-digit code to {email}.</p>
      <div className={styles.inputGroup}>
        <label htmlFor={`code-${email}`}>Code</label>
        <input
          id={`code-${email}`}
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="8-digit code"
          required
          disabled={loading}
        />
      </div>
      {status && <p className={styles[status.type]}>{status.message}</p>}
      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Confirming..." : "Confirm"}
        </Button>
        {onResend && (
          <Button variant="secondary" onClick={onResend} disabled={loading}>
            Send a new code
          </Button>
        )}
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function UpdatePhoneForm({ currentPhone }: { currentPhone: string | null }) {
  const updatePhone = useAction(api.users.updatePhone);
  // E.164 string (e.g. "+15551234567") or undefined while empty
  const [phone, setPhone] = useState<string | undefined>();
  const [status, setStatus] = useState<FormStatus>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const isRemove = submitter?.name === "remove";
    const currentPassword = String(formData.get("currentPassword") ?? "");

    setStatus(null);
    if (!isRemove && !(phone && isValidPhoneNumber(phone))) {
      setStatus({ type: "error", message: "Enter a valid phone number." });
      return;
    }
    if (!currentPassword) {
      setStatus({ type: "error", message: "Enter your current password to confirm." });
      return;
    }

    setLoading(true);
    try {
      await updatePhone({ phone: isRemove ? null : phone!, currentPassword });
      form.reset();
      setPhone(undefined);
      setStatus({ type: "success", message: isRemove ? "Phone number removed." : "Phone number saved." });
    } catch (err) {
      setStatus({ type: "error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.card}>
      <h2>Phone Number</h2>
      <p className={styles.cardDescription}>
        {currentPhone
          ? `Your current number is ${formatPhoneNumberIntl(currentPhone)}. Enter a new one to replace it.`
          : "Add a phone number to your account."}
      </p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="phone">{currentPhone ? "New Phone Number" : "Phone Number"}</label>
          <PhoneInput
            id="phone"
            name="phone"
            className={styles.phoneInput}
            defaultCountry="US"
            flags={flags}
            placeholder="(201) 555-0123"
            autoComplete="tel"
            value={phone}
            onChange={setPhone}
            disabled={loading}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="phoneCurrentPassword">Current Password</label>
          <input
            id="phoneCurrentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            disabled={loading}
          />
        </div>
        {status && <p className={styles[status.type]}>{status.message}</p>}
        <div className={styles.actions}>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Saving..." : currentPhone ? "Update Phone" : "Add Phone"}
          </Button>
          {currentPhone && (
            // formNoValidate skips the password field's `required` check so we can show our own message
            <button
              type="submit"
              name="remove"
              formNoValidate
              className={styles.removeButton}
              disabled={loading}
            >
              Remove Phone
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
