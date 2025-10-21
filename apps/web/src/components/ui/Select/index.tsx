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
import styles from "./styles.module.scss";

/**
 * Dependency-free Select component with a shadcn-like API.
 *
 * Namespace API:
 *   <Select.Root value defaultValue onValueChange onOpenChange>
 *     <Select.Trigger asChild>
 *       <Button>...</Button>
 *     </Select.Trigger>
 *     <Select.Content align="start|end" sideOffset={6}>
 *       <Select.Label>Fruits</Select.Label>
 *       <Select.Item value="apple">Apple</Select.Item>
 *       <Select.Separator />
 *       <Select.Group>
 *         <Select.Label>Citrus</Select.Label>
 *         <Select.Item value="orange">Orange</Select.Item>
 *       </Select.Group>
 *     </Select.Content>
 *   </Select.Root>
 *
 * Features:
 * - Keyboard navigation (↑/↓/Home/End)
 * - Typeahead search
 * - Focus management, Escape/Tab close
 * - Click/focus outside to close
 * - asChild trigger support
 * - Disabled items
 */

/** ---------------- Types ---------------- */

type Align = "start" | "end";

type SelectContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  listRef: React.MutableRefObject<HTMLDivElement | null>;
  itemsRef: React.MutableRefObject<Array<HTMLElement | null>>;
  labelId?: string;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  value?: string;
  setValue: (v: string) => void;
  onValueChange?: (v: string) => void;
  typeahead: (key: string) => void;
};

const SelectCtx = createContext<SelectContextValue | null>(null);
const useSelect = () => {
  const ctx = useContext(SelectCtx);
  if (!ctx) throw new Error("Select components must be used inside <Select.Root>");
  return ctx;
};

/** ---------------- Root ---------------- */

function Root({
  value,
  defaultValue,
  onValueChange,
  onOpenChange,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  onOpenChange?: (o: boolean) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const isControlled = value !== undefined;
  const selected = isControlled ? value : internal;

  // refs & state buckets
  const triggerRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<Array<HTMLElement | null>>([]);
  const [labelId, setLabelId] = useState<string | undefined>();

  // propagate open state
  useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

  // click/focus outside to close
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!listRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false);
    };
    const onFocus = (e: FocusEvent) => {
      const t = e.target as Node;
      if (!listRef.current?.contains(t) && !triggerRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  // selection setter
  const setValue = useCallback((v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
    setOpen(false);
    triggerRef.current?.focus();
  }, [isControlled, onValueChange]);

  // simple typeahead buffer
  const typeaheadBuffer = useRef("");
  const typeaheadTimer = useRef<number | null>(null);
  const typeahead = useCallback((key: string) => {
    const char = key.length === 1 ? key : "";
    if (!char) return;
    const next = (typeaheadBuffer.current + char).toLowerCase();
    typeaheadBuffer.current = next;

    const items = itemsRef.current.filter(Boolean) as HTMLElement[];
    const idx = items.findIndex((el) => el === document.activeElement);

    const matchIndex = (() => {
      const list = [...items.slice(idx + 1), ...items.slice(0, idx + 1)];
      const m = list.findIndex((el) =>
        (el.dataset.label || el.textContent || "").trim().toLowerCase().startsWith(next)
      );
      if (m === -1) return -1;
      return (idx + 1 + m) % items.length;
    })();

    if (matchIndex > -1) items[matchIndex]?.focus();

    if (typeaheadTimer.current) window.clearTimeout(typeaheadTimer.current);
    typeaheadTimer.current = window.setTimeout(() => {
      typeaheadBuffer.current = "";
      typeaheadTimer.current = null;
    }, 500);
  }, []);

  const valueObj = useMemo(
    () => ({
      open, setOpen,
      triggerRef, listRef, itemsRef,
      labelId, setLabelId,
      value: selected, setValue, onValueChange,
      typeahead,
    }),
    [open, selected, onValueChange, typeahead]
  );

  return (
    <SelectCtx.Provider value={valueObj}>
      <div className={styles.root}>{children}</div>
    </SelectCtx.Provider>
  );
}

/** ---------------- Trigger ---------------- */

function Trigger({
  asChild = false,
  children,
  placeholder = "Select an option",
  "aria-label": ariaLabel = "Select",
}: {
  asChild?: boolean;
  // Accept any element props to satisfy cloneElement typing
  children: React.ReactElement<any>;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const { open, setOpen, triggerRef, value } = useSelect();
  const btnId = useId();

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
      case "Enter":
      case " ":
        e.preventDefault();
        setOpen(true);
        break;
      default:
        break;
    }
  };

  const commonProps = {
    id: btnId,
    role: "combobox" as const,
    "aria-haspopup": "listbox" as const,
    "aria-expanded": open,
    "aria-controls": `${btnId}-listbox`,
    "aria-label": ariaLabel,
    onClick: () => setOpen((v) => !v),
    onKeyDown,
  };

  const valueNode = <span className={styles.value}>{value ?? placeholder}</span>;

  if (asChild && isValidElement(children)) {
    const childChildren = (children.props as any)?.children;

    return (
      <span
        className={styles.triggerWrap}
        ref={(el) => {
          (triggerRef as any).current = el;
        }}
      >
        {cloneElement(
          children as React.ReactElement<any>,
          commonProps as any, // <-- relax typing for cloneElement
          <span className={styles.triggerInner}>
            {childChildren ?? valueNode}
          </span>
        )}
      </span>
    );
  }

  return (
    <button
      className={styles.trigger}
      ref={(el) => {
        (triggerRef as any).current = el;
      }}
      {...commonProps}
    >
      {valueNode}
      <span className={styles.chevron} aria-hidden>
        ▾
      </span>
    </button>
  );
}



/** ---------------- Content ---------------- */

function Content({
  children,
  align = "start",
  sideOffset = 6,
  className,
}: {
  children: React.ReactNode;
  align?: Align;
  sideOffset?: number;
  className?: string;
}) {
  const { open, setOpen, triggerRef, listRef, itemsRef, labelId, typeahead } = useSelect(); // <-- grab typeahead here
  const listId = useId();

  useLayoutEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      // focus selected item or first item
      const items = itemsRef.current.filter(Boolean) as HTMLElement[];
      const selected = items.find((el) => el.getAttribute("aria-selected") === "true");
      (selected ?? items[0])?.focus();
    });
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="listbox"
      id={`${listId}-listbox`}
      aria-labelledby={labelId}
      ref={(el) => {
        (listRef as any).current = el;
      }}
      className={[
        styles.content,
        align === "end" ? styles.alignEnd : styles.alignStart,
        className || "",
      ].join(" ")}
      style={{ marginTop: sideOffset }}
      onKeyDown={(e) => {
        const items = itemsRef.current.filter(Boolean) as HTMLElement[];
        const currentIndex = items.findIndex((el) => el === document.activeElement);
        const move = (n: number) => {
          if (!items.length) return;
          const idx = (n + items.length) % items.length;
          items[idx]?.focus();
        };
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            move(currentIndex + 1);
            break;
          case "ArrowUp":
            e.preventDefault();
            move(currentIndex - 1);
            break;
          case "Home":
            e.preventDefault();
            move(0);
            break;
          case "End":
            e.preventDefault();
            move(items.length - 1);
            break;
          case "Escape":
            e.preventDefault();
            setOpen(false);
            (triggerRef.current as any)?.focus();
            break;
          case "Tab":
            setOpen(false);
            break;
          default:
            if (e.key.length === 1) {
              // use the provided typeahead function from context
              typeahead(e.key);
            }
        }
      }}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        const inMenu = next && listRef.current?.contains(next as Node);
        const inTrigger = next && triggerRef.current?.contains(next as Node);
        if (!inMenu && !inTrigger) setOpen(false);
      }}
    >
      {children}
    </div>
  );
}


/** ---------------- Item / Group / Label / Separator ---------------- */

function Item({ value, children, disabled = false, textValue, }: {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  /** Optional override for typeahead text */
  textValue?: string;
}) {
  const { value: selected, setValue, itemsRef } = useSelect();
  const ref = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    itemsRef.current.push(ref.current);
    return () => {
      itemsRef.current = itemsRef.current.filter((el) => el !== ref.current);
    };
  }, []);

  const selectedState = selected === value;

  return (
    <button
      ref={ref}
      role="option"
      aria-selected={selectedState}
      data-value={value}
      data-label={textValue || String(children)}
      className={[
        styles.item,
        disabled ? styles.disabled : "",
        selectedState ? styles.active : "",
      ].join(" ")}
      tabIndex={-1}
      type="button"
      disabled={disabled}
      onClick={() => !disabled && setValue(value)}
    >
      <span className={styles.itemLabel}>{children}</span>
      {selectedState && <span className={styles.check} aria-hidden>✓</span>}
    </button>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div role="group" className={styles.group}>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  const { setLabelId } = useSelect();
  const id = useId();
  useEffect(() => { setLabelId(id); return () => setLabelId(undefined); }, [id]);
  return <div id={id} className={styles.label}>{children}</div>;
}

function Separator() {
  return <div className={styles.separator} aria-hidden />;
}

/** ---------------- Value (for convenience) ---------------- */

function Value({ placeholder = "Select an option" }: { placeholder?: string }) {
  const { value } = useSelect();
  return <span className={styles.value}>{value ?? placeholder}</span>;
}

/** ---------------- Namespace export ---------------- */
export const Select = {
  Root,
  Trigger,
  Content,
  Item,
  Group,
  Label,
  Separator,
  Value,
};


/* ---------------------------- Usage example ----------------------------
import { Select } from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export default function Demo() {
  const [value, setValue] = React.useState<string | undefined>("orange");
  return (
    <Select.Root value={value} onValueChange={setValue}>
      <Select.Trigger asChild>
        <Button variant="outline" className="w-[220px]">
          <Select.Value placeholder="Choose a fruit" />
        </Button>
      </Select.Trigger>

      <Select.Content align="start">
        <Select.Label>Fruits</Select.Label>
        <Select.Item value="apple">Apple</Select.Item>
        <Select.Item value="banana">Banana</Select.Item>
        <Select.Separator />
        <Select.Group>
          <Select.Label>Citrus</Select.Label>
          <Select.Item value="orange">Orange</Select.Item>
          <Select.Item value="lemon">Lemon</Select.Item>
        </Select.Group>
      </Select.Content>
    </Select.Root>
  );
}
*/
