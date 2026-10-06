'use client';

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OAuthButtons from "./OAuthButtons";
import VerifyEmailStep from "./VerifyEmailStep";
import styles from "./styles.module.scss";

type AuthFormProps = {
  mode: "signIn" | "signUp";
};

// Server error messages are redacted in production, so these are best-effort
// matches with a sensible fallback per flow.
function getErrorMessage(err: unknown, mode: AuthFormProps["mode"]) {
  const message = err instanceof Error ? err.message : "";
  if (message.includes("TooManyFailedAttempts")) {
    return "Too many failed attempts. Try again later.";
  }
  if (mode === "signUp") {
    if (message.includes("already exists")) {
      return "An account with that email already exists.";
    }
    return "Could not create account. That email may already be registered.";
  }
  return "Invalid email or password.";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Set when the account needs its email verified before a session is created
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const isSignIn = mode === "signIn";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    if (!isSignIn && formData.get("password") !== formData.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    formData.delete("confirmPassword");
    // Emails are stored lowercase; the verification step also compares against this value
    const email = String(formData.get("email")).trim().toLowerCase();
    formData.set("email", email);

    setLoading(true);
    try {
      const { signingIn } = await signIn("password", formData);
      if (signingIn) {
        router.push("/account");
      } else {
        // Unverified email: a code was sent, so ask for it
        setPendingVerification({ email, password: String(formData.get("password")) });
        setLoading(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, mode));
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <VerifyEmailStep
        {...pendingVerification}
        isNewAccount={!isSignIn}
        onBack={() => setPendingVerification(null)}
      />
    );
  }

  return (
    <div className={styles.authForm}>
      <div className={styles.header}>
        <h1>{isSignIn ? "Login" : "Create Account"}</h1>
        <p>
          {isSignIn
            ? "Sign in to continue to your account"
            : "Sign up to get started"}
        </p>
      </div>

      <OAuthButtons disabled={loading} />

      <form onSubmit={handleSubmit} className={styles.form}>
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

        <div className={styles.inputGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="password">Password</label>
            {isSignIn && (
              <Link href="/reset-password" className={styles.textLink}>
                Forgot password?
              </Link>
            )}
          </div>
          <input
            id="password"
            name="password"
            placeholder={isSignIn ? "Enter your password" : "At least 8 characters"}
            type="password"
            autoComplete={isSignIn ? "current-password" : "new-password"}
            minLength={isSignIn ? undefined : 8}
            required
            disabled={loading}
          />
        </div>

        {!isSignIn && (
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter your password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={loading}
            />
          </div>
        )}

        <input name="flow" type="hidden" value={mode} />

        {error && <p className={styles.error}>{error}</p>}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? "Loading..." : isSignIn ? "Sign In" : "Sign Up"}
        </button>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <Link
          href={isSignIn ? "/signup" : "/login"}
          className={styles.switchButton}
        >
          {isSignIn
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </Link>
      </form>
    </div>
  );
}
