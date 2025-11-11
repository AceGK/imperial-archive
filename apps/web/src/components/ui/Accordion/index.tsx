"use client";

import React, { createContext, useContext, useState } from "react";
import ChevronDown from "@/components/icons/chevron-down.svg";
import styles from "./styles.module.scss";

// Context for accordion state management
type AccordionContextValue = {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
  type?: "single" | "multiple";
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within Accordion");
  }
  return context;
}

// Context for item value
const AccordionItemContext = createContext<string | null>(null);

function useAccordionItem() {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error("AccordionTrigger and AccordionContent must be used within AccordionItem");
  }
  return context;
}

// Root Accordion component
type AccordionProps = {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
};

export function Accordion({
  type = "single",
  defaultValue,
  children,
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => {
    if (!defaultValue) return new Set();
    if (Array.isArray(defaultValue)) return new Set(defaultValue);
    return new Set([defaultValue]);
  });

  const toggleItem = (value: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        if (type === "single") {
          next.clear();
        }
        next.add(value);
      }
      return next;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={`${styles.accordion} ${className || ""}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// AccordionItem component
type AccordionItemProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

export function AccordionItem({
  value,
  children,
  className,
}: AccordionItemProps) {
  const { openItems } = useAccordionContext();
  const isOpen = openItems.has(value);

  return (
    <AccordionItemContext.Provider value={value}>
      <div
        className={`${styles.item} ${isOpen ? styles.open : ""} ${className || ""}`}
        data-state={isOpen ? "open" : "closed"}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// AccordionTrigger component
type AccordionTriggerProps = {
  children: React.ReactNode;
  className?: string;
};

export function AccordionTrigger({
  children,
  className,
}: AccordionTriggerProps) {
  const { openItems, toggleItem } = useAccordionContext();
  const value = useAccordionItem();
  const isOpen = openItems.has(value);

  return (
    <button
      type="button"
      className={`${styles.trigger} ${className || ""}`}
      onClick={() => toggleItem(value)}
      aria-expanded={isOpen}
    >
      <span className={styles.triggerText}>{children}</span>
      <ChevronDown 
        className={styles.chevron} 
        aria-hidden="true"
      />
    </button>
  );
}

// AccordionContent component
type AccordionContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function AccordionContent({
  children,
  className,
}: AccordionContentProps) {
  const { openItems } = useAccordionContext();
  const value = useAccordionItem();
  const isOpen = openItems.has(value);
  const contentRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={contentRef}
      className={`${styles.content} ${isOpen ? styles.open : ""} ${className || ""}`}
      style={{
        maxHeight: isOpen ? contentRef.current?.scrollHeight : 0,
      }}
    >
      <div className={styles.contentInner}>{children}</div>
    </div>
  );
}