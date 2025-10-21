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

/** ---------- Context & Types ---------- */

type Align = "start" | "end";

type DropdownContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  itemsRef: React.MutableRefObject<HTMLElement[]>;
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  onMenuKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
};

const DropdownCtx = createContext<DropdownContextValue | null>(null);
const useDropdown = () => {
  const ctx = useContext(DropdownCtx);
  if (!ctx)
    throw new Error("Dropdown components must be used inside <Dropdown.Root>");
  return ctx;
};

/** ---------- Root ---------- */

function Root({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<HTMLElement[]>([]);
  const [labelId, setLabelId] = useState<string | undefined>(undefined);

  // close on outside click / focus
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  // keyboard nav inside menu
  const onMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Only consider enabled items
      const items = itemsRef.current.filter(
        (el) => el && !(el as HTMLButtonElement).disabled
      ) as HTMLElement[];

      const currentIndex = items.findIndex(
        (el) => el === document.activeElement
      );

      const focusIndex = (idx: number) => {
        if (!items.length) return;
        const clamped = (idx + items.length) % items.length;
        items[clamped]?.focus();
      };

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

        // Let Tab move through items instead of leaving the menu
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            focusIndex((currentIndex === -1 ? 0 : currentIndex) - 1);
          } else {
            focusIndex((currentIndex === -1 ? -1 : currentIndex) + 1);
          }
          break;

        // Activate the focused item
        case "Enter":
        case " ":
          e.preventDefault(); // prevent scroll on Space
          (document.activeElement as HTMLElement | null)?.click();
          break;

        case "Escape":
          e.preventDefault();
          setOpen(false);
          (triggerRef.current as HTMLElement | null)?.focus();
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
      itemsRef,
      labelId,
      setLabelId,
      onMenuKeyDown,
    }),
    [open, labelId, onMenuKeyDown]
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

/** ---------- Content (portalled & fixed-position) ---------- */

function Content({
  children,
  align = "end",
  sideOffset = 6,
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
    itemsRef,
    labelId,
    onMenuKeyDown,
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
    // compute left based on alignment (menuEl has size now)
    let left = t.left;
    if (align === "end") {
      left = Math.max(0, t.right - menuEl.offsetWidth);
    }
    const top = t.bottom + sideOffset;
    setPos({ top, left });
  }, [align, sideOffset, triggerRef, menuRef]);

  // Focus first item and position on open
  useLayoutEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      const first = itemsRef.current.find(
        (el) => el && !(el as HTMLButtonElement).disabled
      );
      first?.focus();
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
  }, [open, itemsRef, updatePosition]);

  if (!open) return null;

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
        zIndex: 1000, // ensure above transformed/dragging rows
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
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const { setOpen, triggerRef, itemsRef } = useDropdown();
  const ref = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (ref.current) itemsRef.current.push(ref.current);
    return () => {
      itemsRef.current = itemsRef.current.filter((el) => el !== ref.current);
    };
  }, []);

  const run = () => {
    if (disabled) return;
    onSelect?.();
    setOpen(false);
    (triggerRef.current as HTMLElement | null)?.focus();
  };

  return (
    <button
      role="menuitem"
      ref={ref}
      className={[
        styles.item,
        disabled ? styles.disabled : "",
        destructive ? styles.destructive : "",
      ].join(" ")}
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
