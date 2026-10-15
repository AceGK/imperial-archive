'use client';

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import styles from "./styles.module.scss";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import Turnstile, {
  isTurnstileError,
  TURNSTILE_FAILED_MESSAGE,
  turnstileBlockedMessage,
  type TurnstileHandle,
  type TurnstileState,
} from "@/components/ui/Turnstile";

export default function ResetPasswordForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [step, setStep] = useState<"request" | { email: string }>("request");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [turnstile, setTurnstile] = useState<TurnstileState>("pending");

  const handleRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const blocked = turnstileBlockedMessage(turnstile);
    if (blocked) {
      setError(blocked);
      return;
    }
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    // Emails are stored lowercase; the code step compares against this value
    const email = String(formData.get("email")).trim().toLowerCase();
    formData.set("email", email);

    try {
      await signIn("password", formData);
    } catch (err) {
      if (isTurnstileError(err)) {
        setError(TURNSTILE_FAILED_MESSAGE);
        setLoading(false);
        turnstileRef.current?.reset();
        return;
      }
      // Don't reveal whether an account exists for this email.
      console.error(err);
    }
    setStep({ email });
    setLoading(false);
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    if (formData.get("newPassword") !== formData.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    formData.delete("confirmPassword");

    setLoading(true);
    try {
      await signIn("password", formData);
      router.push("/account");
    } catch {
      setError("Invalid or expired code. Check the code or request a new one.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.authForm}>
      <div className={styles.header}>
        <h1>Reset Password</h1>
        <p>
          {step === "request"
            ? "Enter your email and we'll send you a reset code"
            : "Enter the code from your email and choose a new password"}
        </p>
      </div>

      {step === "request" ? (
        <form onSubmit={handleRequest} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              placeholder="Enter your email"
              type="email"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <input name="flow" type="hidden" value="reset" />

          <Turnstile ref={turnstileRef} onChange={setTurnstile} />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" variant="primary" size="lg" className={styles.fullWidth} disabled={loading}>
            {loading ? "Sending..." : "Send Code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className={styles.form}>
          <p className={styles.success}>
            If an account exists for {step.email}, we&apos;ve sent it a reset code.
          </p>

          <div className={styles.inputGroup}>
            <label htmlFor="code">Code</label>
            <input
              id="code"
              name="code"
              placeholder="8-digit code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">New Password</label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={loading}
            />
          </div>

          <input name="email" type="hidden" value={step.email} />
          <input name="flow" type="hidden" value="reset-verification" />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" variant="primary" size="lg" className={styles.fullWidth} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>

          <Button
            variant="tertiary"
            size="lg"
            className={styles.fullWidth}
            onClick={() => {
              setStep("request");
              setError(null);
            }}
            disabled={loading}
          >
            Use a different email
          </Button>
        </form>
      )}

      <div className={styles.footerLink}>
        <Link href="/login" className={styles.textLink}>
          Back to login
        </Link>
      </div>
    </div>
  );
}
