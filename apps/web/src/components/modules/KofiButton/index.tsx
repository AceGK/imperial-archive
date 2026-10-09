"use client";

import { useRef, useState } from "react";
import Button from "@/components/ui/Button";
import styles from "./styles.module.scss";

type Props = {
  /** Ko-fi page name, e.g. "imperialarchive" */
  username: string;
  label?: string;
  className?: string;
};

/**
 * Opens Ko-fi's donation panel in a pop-up, so supporters pay without leaving
 * the site. Uses the native <dialog>, which handles focus, Esc to close, and
 * the backdrop. The panel only loads once the pop-up is first opened.
 */
export default function KofiButton({ username, label = "Support on Ko-fi", className }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);

  const kofiUrl = `https://ko-fi.com/${username}`;
  const panelUrl = `${kofiUrl}/?hidefeed=true&widget=true&embed=true&preview=true`;

  const open = () => {
    setLoaded(true);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <Button variant="primary" size="lg" className={className} onClick={open}>
        {label}
      </Button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="kofi-dialog-title"
        // a click on the dialog element itself (not its contents) is the backdrop
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className={styles.header}>
          <h2 id="kofi-dialog-title" className={styles.title}>
            Offer a tithe
          </h2>
          <button type="button" className={styles.close} onClick={close} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.panel}>
          {loaded && (
            <iframe src={panelUrl} title="Support Imperial Archive on Ko-fi" className={styles.frame} />
          )}
        </div>

        <p className={styles.footer}>
          Form not loading?{" "}
          <a href={kofiUrl} target="_blank" rel="noopener noreferrer">
            Open on Ko-fi
          </a>
        </p>
      </dialog>
    </>
  );
}
