'use client';

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import { providerMeta } from "./providers";
import styles from "./styles.module.scss";

/** "Continue with Google/GitHub/Discord" buttons. Renders nothing until a provider is configured. */
export default function OAuthButtons({ disabled = false }: { disabled?: boolean }) {
  const { signIn } = useAuthActions();
  const providers = useQuery(api.oauth.enabledProviders);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!providers?.length) return null;

  const handleClick = async (id: string) => {
    setError(null);
    setPending(id);
    try {
      // Redirects to the provider, then back to /account
      await signIn(id, { redirectTo: "/account" });
    } catch {
      setError("Couldn't start sign-in. Please try again.");
      setPending(null);
    }
  };

  return (
    <div className={styles.oauth}>
      {providers.map(({ id, label }) => {
        const Icon = providerMeta[id]?.icon;
        return (
          <button
            key={id}
            type="button"
            className={styles.oauthButton}
            onClick={() => handleClick(id)}
            disabled={disabled || pending !== null}
          >
            {Icon && <Icon className={styles.oauthIcon} aria-hidden="true" />}
            {pending === id ? "Redirecting..." : `Continue with ${label}`}
          </button>
        );
      })}
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.divider}>
        <span>or use email</span>
      </div>
    </div>
  );
}
