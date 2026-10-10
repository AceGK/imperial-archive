"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ShareIcon from "@/components/icons/share.svg";
import ShareLinks, { type ShareLinksProps } from "./ShareLinks";
import styles from "./styles.module.scss";

type ShareButtonProps = Omit<ShareLinksProps, "className"> & {
  /** "overlay" for placement on top of hero images, like FavoriteButton */
  variant?: "default" | "overlay";
  /** which part of the button the pop-up lines up with */
  align?: "start" | "center";
};

// gap kept between the pop-up and the edges of the screen
const EDGE = 16;

/**
 * "Share" button that opens the share links in a small pop-up, sized to sit
 * beside FavoriteButton. The pop-up renders at the end of <body> so cards that
 * clip their overflow, or sections stacked above them, can't hide it; focus
 * moves into it on open and back to the button on Escape.
 */
export default function ShareButton({ variant = "default", align = "start", ...share }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  };

  // follow the button and stay clear of the screen edges
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const place = () => {
      const button = buttonRef.current?.getBoundingClientRect();
      const width = panelRef.current?.offsetWidth ?? 0;
      if (!button) return;
      const preferred = align === "center" ? button.left + button.width / 2 - width / 2 : button.left;
      const left = Math.max(EDGE, Math.min(preferred, window.innerWidth - width - EDGE));
      setPosition({ top: button.bottom + 8, left });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align]);

  // move focus in once the pop-up is placed (it can't take focus while hidden)
  const placed = position !== null;
  useEffect(() => {
    if (placed) panelRef.current?.querySelector<HTMLElement>("a, button")?.focus({ preventScroll: true });
  }, [placed]);

  useEffect(() => {
    if (!open) return;

    const isInside = (node: EventTarget | null) =>
      node instanceof Node && (panelRef.current?.contains(node) || buttonRef.current?.contains(node));

    const onPointerDown = (e: PointerEvent) => {
      if (!isInside(e.target)) close(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close(true);
        return;
      }
      // the pop-up sits at the end of <body>, so tabbing out of either end
      // returns to the Share button instead of the end of the page
      if (e.key === "Tab" && panelRef.current?.contains(document.activeElement)) {
        const items = panelRef.current.querySelectorAll<HTMLElement>("a, button");
        const leavingEnd = e.shiftKey
          ? document.activeElement === items[0]
          : document.activeElement === items[items.length - 1];
        if (leavingEnd) {
          e.preventDefault();
          close(true);
        }
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      if (!isInside(e.target)) close(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.trigger} ${variant === "overlay" ? styles.overlay : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        <ShareIcon className={styles.triggerIcon} aria-hidden="true" />
        <span>Share</span>
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            className={styles.panel}
            // hidden until measured, so it never flashes in the wrong spot
            style={position ? { top: position.top, left: position.left } : { visibility: "hidden" }}
          >
            <ShareLinks {...share} />
          </div>,
          document.body,
        )}
    </>
  );
}
