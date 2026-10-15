// components/ui/Dropdown/index.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  cloneElement,
  isValidElement,
} from "react";
import { createPortal } from "react-dom";
import styles from "./styles.module.scss";

/** ---------- Focus helpers ---------- */

const ITEM_SELECTOR = '[role^="menuitem"]:not([disabled])';
const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** The menu's enabled items, in order, read from the menu itself. Menus built
 * from plain buttons or inputs (sort, filters) use whatever can take focus. */
function menuItems(menu: HTMLElement | null) {
  if (!menu) return [];
  const items = menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR);
  return [...(items.length ? items : menu.querySelectorAll<HTMLElement>(TABBABLE))];
}

/** The element that actually takes focus for a trigger (the button inside an asChild wrapper) */
function focusableIn(el: HTMLElement | null) {
  if (!el) return null;
  return el.matches(TABBABLE) ? el : el.querySelector<HTMLElement>(TABBABLE);
}

/** The next tabbable element on the page after `from`, ignoring anything inside `skip` */
function tabbableAfter(from: HTMLElement, skip: HTMLElement | null) {
  const all = [...document.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => !skip?.contains(el) && el.offsetParent !== null
  );
  return all[all.indexOf(from) + 1] ?? null;
}

/** ---------- Context & Types ---------- */

type Align = "start" | "end";

type DropdownContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  onMenuKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  isMobile: boolean;
  modalTitle?: string;
};

const DropdownCtx = createContext<DropdownContextValue | null>(null);
const useDropdown = () => {
  const ctx = useContext(DropdownCtx);
  if (!ctx)
    throw new Error("Dropdown components must be used inside <Dropdown.Root>");
  return ctx;
};

/** ---------- Root ---------- */

function Root({ 
  children,
  mobileBreakpoint = 576, // modal dropdown breakpoint
  modalTitle = "Select an option"
}: { 
  children: React.ReactNode;
  mobileBreakpoint?: number;
  modalTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [labelId, setLabelId] = useState<string | undefined>(undefined);

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= mobileBreakpoint);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mobileBreakpoint]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  // close on outside click / focus (desktop only)
  useEffect(() => {
    if (!open || isMobile) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t))
        setOpen(false);
    };
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open, isMobile]);

  // keyboard nav inside menu
  const onMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const items = menuItems(menuRef.current);

      const currentIndex = items.findIndex(
        (el) => el === document.activeElement
      );

      const focusIndex = (idx: number) => {
        if (!items.length) return;
        const clamped = (idx + items.length) % items.length;
        items[clamped]?.focus();
      };

      // leave typing keys alone in a text field (a filter's search box)
      const typing = (document.activeElement as HTMLElement | null)?.matches("input:not([type=checkbox]):not([type=radio]), textarea");
      if (typing && ["Home", "End", "Enter", " "].includes(e.key)) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          focusIndex(currentIndex + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          focusIndex(currentIndex - 1);
          break;
        case "Home":
          e.preventDefault();
          focusIndex(0);
          break;
        case "End":
          e.preventDefault();
          focusIndex(items.length - 1);
          break;

        // Tab moves through the items like the arrow keys, then leaves the menu:
        // past the last item to whatever follows the trigger, back from the
        // first item to the trigger
        case "Tab": {
          e.preventDefault();
          const trigger = focusableIn(triggerRef.current);
          if (e.shiftKey) {
            if (currentIndex > 0) focusIndex(currentIndex - 1);
            else {
              setOpen(false);
              trigger?.focus();
            }
          } else if (currentIndex < items.length - 1) {
            focusIndex(currentIndex + 1);
          } else {
            setOpen(false);
            const next = trigger ? tabbableAfter(trigger, menuRef.current) : null;
            (next ?? trigger)?.focus();
          }
          break;
        }

        // Activate the focused item
        case "Enter":
        case " ":
          e.preventDefault(); // prevent scroll on Space
          (document.activeElement as HTMLElement | null)?.click();
          break;

        case "Escape":
          e.preventDefault();
          setOpen(false);
          focusableIn(triggerRef.current)?.focus();
          break;
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      open,
      setOpen,
      triggerRef,
      menuRef,
      labelId,
      setLabelId,
      onMenuKeyDown,
      isMobile,
      modalTitle,
    }),
    [open, labelId, onMenuKeyDown, isMobile, modalTitle]
  );

  return (
    <DropdownCtx.Provider value={value}>
      <div className={styles.root}>{children}</div>
    </DropdownCtx.Provider>
  );
}

/** ---------- Trigger (asChild) ---------- */

function Trigger({
  asChild = false,
  children,
  "aria-label": ariaLabel = "Open menu",
}: {
  asChild?: boolean;
  children: React.ReactElement;
  "aria-label"?: string;
}) {
  const { open, setOpen, triggerRef } = useDropdown();
  const btnId = useId();

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const commonProps = {
    id: btnId,
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    "aria-label": ariaLabel,
    onKeyDown,
    onClick: () => setOpen((v) => !v),
  };

  if (asChild && isValidElement(children)) {
    return (
      <span
        className={styles.triggerWrap}
        ref={(el) => {
          triggerRef.current = el;
        }}
      >
        {cloneElement(children, commonProps)}
      </span>
    );
  }

  // Fallback: plain button if not asChild
  return (
    <button
      ref={(el) => {
        triggerRef.current = el;
      }}
      className={styles.trigger}
      {...commonProps}
    >
      ⋯
    </button>
  );
}

/** ---------- Content (portalled & fixed-position OR modal) ---------- */

function Content({
  children,
  align = "end",
  sideOffset = 10,
  className,
}: {
  children: React.ReactNode;
  align?: Align;
  sideOffset?: number;
  className?: string;
}) {
  const {
    open,
    setOpen,
    triggerRef,
    menuRef,
    labelId,
    onMenuKeyDown,
    isMobile,
    modalTitle,
  } = useDropdown();

  const popId = useId();
  const [pos, setPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const menuEl = menuRef.current;
    if (!triggerEl || !menuEl) return;

    const t = triggerEl.getBoundingClientRect();
    let left = t.left;
    if (align === "end") {
      left = Math.max(0, t.right - menuEl.offsetWidth);
    }
    const top = t.bottom + sideOffset;
    setPos({ top, left });
  }, [align, sideOffset, triggerRef, menuRef]);

  // Focus first item and position on open (desktop only)
  useLayoutEffect(() => {
    if (!open || isMobile) return;
    const raf = requestAnimationFrame(() => {
      menuItems(menuRef.current)[0]?.focus();
      updatePosition();
    });

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [open, isMobile, menuRef, updatePosition]);

  if (!open) return null;

  // Mobile: Render as bottom sheet modal
  if (isMobile) {
    const modal = (
      <>
        {/* Backdrop */}
        <div className={styles.backdrop} onClick={() => setOpen(false)} />

        {/* Modal */}
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <span>{modalTitle}</span>
            <button
              onClick={() => setOpen(false)}
              className={styles.closeButton}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div
            ref={menuRef}
            className={styles.modalContent}
            onKeyDown={onMenuKeyDown}
            onClick={(e) => {
              // Close modal when any button inside is clicked
              const target = e.target as HTMLElement;
              if (target.tagName === 'BUTTON' && target.getAttribute('role') !== 'menuitem') {
                setOpen(false);
              }
            }}
          >
            {children}
          </div>
        </div>
      </>
    );

    return createPortal(modal, document.body);
  }

  // Desktop: Render as dropdown
  const menu = (
    <div
      id={popId}
      ref={menuRef}
      role="menu"
      aria-labelledby={labelId}
      className={[
        styles.content,
        align === "end" ? styles.alignEnd : styles.alignStart,
        className || "",
      ].join(" ")}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 1000,
      }}
      onKeyDown={onMenuKeyDown}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        const inMenu = next && menuRef.current?.contains(next);
        const inTrigger = next && triggerRef.current?.contains(next as Node);
        if (!inMenu && !inTrigger) setOpen(false);
      }}
      data-portal
    >
      {children}
      <span className={styles.arrow} aria-hidden="true" />
    </div>
  );

  return createPortal(menu, document.body);
}

/** ---------- Item / Separator / Label ---------- */

function Item({
  children,
  onSelect,
  disabled = false,
  destructive = false,
  active = false,
  className,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  /** the item for the page being viewed (marked aria-current="page") */
  active?: boolean;
  className?: string;
}) {
  const { setOpen, triggerRef } = useDropdown();

  const run = () => {
    if (disabled) return;
    onSelect?.();
    setOpen(false);
    focusableIn(triggerRef.current)?.focus();
  };

  return (
    <button
      role="menuitem"
      className={[
        styles.item,
        disabled ? styles.disabled : "",
        destructive ? styles.destructive : "",
        className || "",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
      tabIndex={-1}
      type="button"
      disabled={disabled}
      onClick={run}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className={styles.separator} aria-hidden="true" />;
}

function Label({ children }: { children: React.ReactNode }) {
  const { setLabelId } = useDropdown();
  const id = useId();
  useEffect(() => {
    setLabelId(id);
    return () => setLabelId(undefined);
  }, [id, setLabelId]);

  return (
    <div id={id} role="presentation" className={styles.label}>
      {children}
    </div>
  );
}

function Arrow() {
  return <span className={styles.arrow} aria-hidden="true" />;
}

/** ---------- Namespace export ---------- */
export const Dropdown = {
  Root,
  Trigger,
  Content,
  Item,
  Separator,
  Label,
  Arrow,
};