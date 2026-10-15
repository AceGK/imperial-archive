'use client';

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import styles from "./styles.module.scss";
import Button from "@/components/ui/Button";

type VerifyEmailStepProps = {
  email: string;
  password: string;
  isNewAccount: boolean;
  onBack: () => void;
  /** Runs once verified and signed in */
  onSuccess: () => void;
};

/** Second step of sign up / sign in when the account's email isn't verified yet. */
export default function VerifyEmailStep({ email, password, isNewAccount, onBack, onSuccess }: VerifyEmailStepProps) {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const code = String(new FormData(event.currentTarget).get("code")).trim();

    setLoading(true);
    try {
      await signIn("password", { email, code, flow: "email-verification" });
      onSuccess();
    } catch {
      setError("Incorrect or expired code. Check the code or send a new one.");
      setLoading(false);
    }
  };

  // Signing in again while unverified sends a fresh code
  const handleResend = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      setNotice("We sent you a new code.");
    } catch {
      setError("Couldn't send a new code. Try again in a minute.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authForm}>
      <div className={styles.header}>
        <h1>Check Your Email</h1>
        <p>
          {isNewAccount
            ? "Enter the code we emailed you to finish creating your account"
            : "Verify your email to finish signing in"}
        </p>
      </div>

      <form onSubmit={handleVerify} className={styles.form}>
        <p className={styles.success}>We sent an 8-digit code to {email}.</p>

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

        {notice && <p className={styles.success}>{notice}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <Button type="submit" variant="primary" size="lg" className={styles.fullWidth} disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </Button>

        <Button variant="tertiary" size="lg" className={styles.fullWidth} onClick={handleResend} disabled={loading}>
          Send a new code
        </Button>
      </form>

      <div className={styles.footerLink}>
        <button type="button" className={styles.textLink} onClick={onBack} disabled={loading}>
          Use a different email
        </button>
      </div>
    </div>
  );
}
