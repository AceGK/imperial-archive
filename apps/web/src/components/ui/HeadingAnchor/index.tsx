"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import LinkIcon from "@/components/icons/link.svg";
import styles from "./styles.module.scss";

type Props = {
  /** The section's id, as used by the page's contents rail */
  id: string;
  /** The heading's text; clicking anywhere on it copies the link */
  children: ReactNode;
};

/**
 * A section heading's text as a button that copies the URL to that section.
 * A link icon follows the text, shown on hover or keyboard focus. Place it
 * inside the heading element: <h2 id="x"><HeadingAnchor id="x">Title</HeadingAnchor></h2>
 */
export default function HeadingAnchor({ id, children }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    // the address bar points at the section too, without jumping the page
    window.history.replaceState(null, "", `#${id}`);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked (e.g. an insecure context): the address bar still has the link
    }
  };

  return (
    <button
      type="button"
      className={`${styles.anchor} ${copied ? styles.copied : ""}`}
      onClick={copy}
      title={copied ? "Link copied" : "Copy link to this section"}
    >
      {children}
      {/* read after the heading text, e.g. "The Archive, copy link" */}
      <span className={styles.srOnly}>, copy link</span>
      <LinkIcon className={styles.icon} aria-hidden="true" />
      {/* announced to screen readers; sighted users see the icon stay lit */}
      <span className={styles.srOnly} role="status">
        {copied ? "Link copied" : ""}
      </span>
    </button>
  );
}
