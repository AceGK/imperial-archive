'use client';

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import styles from "./styles.module.scss";

export default function AuthForm() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      await signIn("password", formData);
    } catch (err) {
      setError("Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authForm}>
      <div className={styles.header}>
        <h1>{step === "signIn" ? "Login" : "Create Account"}</h1>
        <p>
          {step === "signIn"
            ? "Sign in to continue to your account"
            : "Sign up to get started"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            placeholder="Enter your email"
            type="email"
            required
            disabled={loading}
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            placeholder="Enter your password"
            type="password"
            required
            disabled={loading}
          />
        </div>

        <input name="flow" type="hidden" value={step} />

        {error && <p className={styles.error}>{error}</p>}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? "Loading..." : step === "signIn" ? "Sign In" : "Sign Up"}
        </button>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <button
          type="button"
          className={styles.switchButton}
          onClick={() => {
            setStep(step === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
          disabled={loading}
        >
          {step === "signIn"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}