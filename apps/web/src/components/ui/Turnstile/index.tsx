"use client";

import { ConvexError } from "convex/values";
import { useTheme } from "next-themes";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { TURNSTILE_FAILED } from "@convex/turnstile";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type TurnstileHandle = {
  /** Tokens are single-use, so get a fresh one after every submit */
  reset: () => void;
};

/** A token once the check passes; "error" when it can't run (bad site key, blocked script) */
export type TurnstileState = { token: string } | "pending" | "error";

type Props = {
  ref?: Ref<TurnstileHandle>;
  onChange: (state: TurnstileState) => void;
};

/** Field name the token is submitted under; the server reads the same param */
export const TURNSTILE_FIELD = "turnstileToken";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile() {
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject());
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load Turnstile"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function isTurnstileError(err: unknown) {
  return err instanceof ConvexError && err.data === TURNSTILE_FAILED;
}

/** For a submit the server rejected with isTurnstileError */
export const TURNSTILE_FAILED_MESSAGE =
  "The security check failed. Try again, or refresh the page if it keeps failing.";

/** Why the form can't be submitted yet, or null once there's a token */
export function turnstileBlockedMessage(state: TurnstileState) {
  if (state === "pending") return "The security check is still running. Try again in a moment.";
  if (state === "error") return "The security check couldn't load. Refresh the page and try again.";
  return null;
}

/**
 * Cloudflare Turnstile bot check. Place it inside a <form>: the widget adds a hidden
 * `turnstileToken` input, so the token is submitted with the form data. It only takes
 * up space when Cloudflare asks the visitor to interact.
 */
export default function Turnstile({ ref, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";

  useImperativeHandle(ref, () => ({
    reset: () => {
      onChangeRef.current("pending");
      if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
    },
  }));

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
      onChangeRef.current("error");
      return;
    }
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          size: "flexible",
          appearance: "interaction-only",
          "response-field-name": TURNSTILE_FIELD,
          callback: (token: string) => onChangeRef.current({ token }),
          // Expired tokens refresh on their own; errors (like a bad site key) don't
          "expired-callback": () => onChangeRef.current("pending"),
          "error-callback": () => onChangeRef.current("error"),
        });
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) onChangeRef.current("error");
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
      onChangeRef.current("pending");
    };
  }, [theme]);

  return <div ref={containerRef} />;
}
