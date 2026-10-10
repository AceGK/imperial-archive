"use client";

import { useEffect, useRef, useState } from "react";
import LinkIcon from "@/components/icons/link.svg";
import CheckIcon from "@/components/icons/check.svg";
import ShareIcon from "@/components/icons/share.svg";
import { absoluteUrl } from "@/lib/seo";
import { PLATFORMS } from "./platforms";
import styles from "./styles.module.scss";

export type ShareLinksProps = {
  /** path on this site ("/books/eisenhorn") or a full URL */
  url: string;
  /** page title, used as the post title (Reddit) or email subject */
  title: string;
  /** message that goes with the link; defaults to the title */
  text?: string;
  className?: string;
};

// clipboard API needs a secure context; fall back for plain-http previews
async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

/** A row of share buttons: one per platform, copy link, and the device share sheet where available */
export default function ShareLinks({ url, title, text = title, className }: ShareLinksProps) {
  const fullUrl = url.startsWith("http") ? url : absoluteUrl(url);
  const target = { url: fullUrl, title, text };

  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // checked after mount so the server and first client render match
  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
    return () => clearTimeout(resetTimer.current);
  }, []);

  const handleCopy = async () => {
    try {
      await copyText(fullUrl);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text, url: fullUrl });
    } catch {
      // the reader closed the share sheet
    }
  };

  // a plain group rather than a list, so list styles from cards and rich text don't apply
  return (
    <div className={`${styles.links} ${className ?? ""}`} role="group" aria-label="Share this page">
      <button
        type="button"
        className={`${styles.iconButton} ${copied ? styles.copied : ""}`}
        onClick={handleCopy}
        aria-label="Copy link"
        title={copied ? "Link copied" : "Copy link"}
      >
        {copied ? (
          <CheckIcon className={styles.icon} aria-hidden="true" />
        ) : (
          <LinkIcon className={styles.icon} aria-hidden="true" />
        )}
      </button>

      {canNativeShare && (
        <button
          type="button"
          className={styles.iconButton}
          onClick={handleNativeShare}
          aria-label="More sharing options"
          title="More sharing options"
        >
          <ShareIcon className={styles.icon} aria-hidden="true" />
        </button>
      )}

      {PLATFORMS.map(({ id, label, icon: Icon, href }) => (
        <a
          key={id}
          href={href(target)}
          className={styles.iconButton}
          aria-label={`Share on ${label}`}
          title={`Share on ${label}`}
          {...(id === "email" ? {} : { target: "_blank", rel: "noopener noreferrer" })}
        >
          <Icon className={styles.icon} aria-hidden="true" />
        </a>
      ))}

      <span className={styles.status} role="status">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}
