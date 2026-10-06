'use client';

import { useAction, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import { providerMeta } from "@/components/modules/AuthForm/providers";
import Button from "@/components/ui/Button";
import SectionHeader from "./SectionHeader";
import { getErrorMessage, type FormStatus } from "./utils";
import styles from "./styles.module.scss";
import PasswordInput from "@/components/ui/PasswordInput";

export default function SecuritySettings() {
  const viewer = useQuery(api.users.viewer);

  return (
    <>
      <SectionHeader
        title="Security"
        description="Manage how you sign in, your password, and signed-in devices."
      />
      <SignInMethodsCard providers={viewer?.providers} />
      {viewer && (viewer.hasPassword ? <UpdatePasswordForm /> : <SetPasswordForm />)}
      <SessionsCard />
    </>
  );
}

function SignInMethodsCard({ providers }: { providers?: string[] }) {
  const enabled = useQuery(api.oauth.enabledProviders);
  const enabledIds: string[] = enabled?.map((p) => p.id) ?? [];
  // Email & password, plus any OAuth provider that's turned on or already linked
  const shown = Object.entries(providerMeta).filter(
    ([id]) => id === "password" || enabledIds.includes(id) || providers?.includes(id),
  );

  return (
    <section className={styles.card}>
      <h2>Sign-in Methods</h2>
      {enabledIds.length > 0 && (
        <p className={styles.cardDescription}>
          To add another sign-in method, sign out and sign in with that provider using the same
          verified email. It will be linked to this account automatically.
        </p>
      )}
      {providers === undefined ? (
        <p className={styles.muted}>Loading...</p>
      ) : (
        <ul className={styles.methodList}>
          {shown.map(([id, { label, icon: Icon }]) => {
            const connected = providers.includes(id);
            return (
              <li key={id} className={styles.method}>
                <span className={styles.methodIcon}>{Icon && <Icon aria-hidden="true" />}</span>
                <span>{label}</span>
                <span className={connected ? styles.verified : styles.methodOff}>
                  {connected ? "Connected" : "Not connected"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** For accounts that only sign in with Google/GitHub/Discord. */
function SetPasswordForm() {
  const setPassword = useAction(api.users.setPassword);
  const [status, setStatus] = useState<FormStatus>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus(null);

    if (formData.get("newPassword") !== formData.get("confirmPassword")) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      await setPassword({ newPassword: String(formData.get("newPassword")) });
      form.reset();
      setStatus({ type: "success", message: "Password set. You can now sign in with your email too." });
    } catch (err) {
      setStatus({ type: "error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.card}>
      <h2>Set a Password</h2>
      <p className={styles.cardDescription}>
        Add a password so you can also sign in with your email. Required to change your email or
        phone number.
      </p>
      <form onSubmit={handleSubmit} className={styles.form}>
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
          <label htmlFor="confirmPassword">Confirm Password</label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            minLength={8}
            required
            disabled={loading}
          />
        </div>
        {status && <p className={styles[status.type]}>{status.message}</p>}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Saving..." : "Set Password"}
        </Button>
      </form>
    </section>
  );
}

function UpdatePasswordForm() {
  const updatePassword = useAction(api.users.updatePassword);
  const [status, setStatus] = useState<FormStatus>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus(null);

    if (formData.get("newPassword") !== formData.get("confirmPassword")) {
      setStatus({ type: "error", message: "New passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      await updatePassword({
        currentPassword: String(formData.get("currentPassword")),
        newPassword: String(formData.get("newPassword")),
      });
      form.reset();
      setStatus({
        type: "success",
        message: "Password updated. Other devices have been signed out.",
      });
    } catch (err) {
      setStatus({ type: "error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.card}>
      <h2>Change Password</h2>
      <p className={styles.cardDescription}>
        Forgot your current password?{" "}
        <Link href="/reset-password" className={styles.textLink}>
          Reset it by email
        </Link>
        .
      </p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="currentPassword">Current Password</label>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            autoComplete="current-password"
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
            autoComplete="new-password"
            minLength={8}
            required
            disabled={loading}
          />
        </div>
        {status && <p className={styles[status.type]}>{status.message}</p>}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Saving..." : "Update Password"}
        </Button>
      </form>
    </section>
  );
}

function SessionsCard() {
  const signOutOtherSessions = useAction(api.users.signOutOtherSessions);
  const [status, setStatus] = useState<FormStatus>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setStatus(null);
    setLoading(true);
    try {
      await signOutOtherSessions();
      setStatus({ type: "success", message: "Signed out of all other devices." });
    } catch (err) {
      setStatus({ type: "error", message: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.card}>
      <h2>Devices</h2>
      <p className={styles.cardDescription}>
        Signed in somewhere you don&apos;t recognize? Sign out everywhere except this device.
      </p>
      <div className={styles.form}>
        {status && <p className={styles[status.type]}>{status.message}</p>}
        <Button variant="secondary" onClick={handleClick} disabled={loading}>
          {loading ? "Signing out..." : "Sign Out Other Devices"}
        </Button>
      </div>
    </section>
  );
}
