"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import XmarkIcon from "@/components/icons/xmark.svg";
import AuthForm from "./index";
import styles from "./AuthModal.module.scss";

/**
 * The login/signup form in a modal over the current page, shown when a link to
 * /login or /signup is followed inside the site (app/@modal intercepts it).
 * Closing steps back to the page underneath, and signing in goes to the
 * dashboard; visiting /login directly still shows the full page.
 */
export default function AuthModal({ mode }: { mode: "signIn" | "signUp" }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  // a native modal dialog: traps focus, closes on Escape, sits above everything
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // start in the email field (showModal would otherwise focus the close button)
    dialog?.querySelector<HTMLInputElement>("input[type=email]")?.focus();
    // the page behind shouldn't scroll while the modal is up
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  const close = () => router.back();
  // replace, not push: Back from the dashboard returns to the page the modal
  // was opened over, rather than reopening the modal
  const goToDashboard = () => router.replace("/account");

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="auth-heading"
      // Escape: go back instead of only hiding the dialog
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      // a click on the backdrop lands on the dialog itself
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={close} aria-label="Close">
          <XmarkIcon aria-hidden="true" />
        </button>
        <AuthForm mode={mode} inModal onSuccess={goToDashboard} />
      </div>
    </dialog>
  );
}
