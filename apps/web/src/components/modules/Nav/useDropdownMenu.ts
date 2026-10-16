// components/modules/Nav/useDropdownMenu.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useNavPin } from "@/hooks/useScrollVisibility";

type IndicatorStyle = { opacity: number; width?: number; transform?: string };
type HighlightStyle = {
  opacity: number;
  width?: number;
  height?: number;
  transform?: string;
  skipTransition?: boolean;
};
type ViewportSize = { width: number; height: number; left: number };

const CLOSE_DELAY = 150;

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * State and behavior for the desktop dropdowns: which one is open, the arrow
 * under its trigger, the panel's size and position, the hover highlight behind
 * the top-level links, and keyboard and focus handling. Dropdowns are referred
 * to by their index in `dropdownItems`.
 */
export function useDropdownMenu() {
  const pathname = usePathname();

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({ opacity: 0 });
  const [viewportSize, setViewportSize] = useState<ViewportSize>({ width: 0, height: 0, left: 0 });
  const [highlightStyle, setHighlightStyle] = useState<HighlightStyle>({ opacity: 0 });
  const highlightVisible = useRef(false);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideHighlightTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rootRef = useRef<HTMLElement | null>(null);
  const menuListRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const isOpen = activeIndex !== null;
  useNavPin(isOpen);

  // slide direction for the content swap animation
  const getMotion = useCallback(
    (index: number) => {
      if (activeIndex !== index) return null;
      if (prevIndex === null) return null;
      return index > prevIndex ? "from-end" : "from-start";
    },
    [activeIndex, prevIndex]
  );

  // position the little arrow under the active trigger
  const updateIndicator = useCallback((index: number) => {
    const trigger = triggerRefs.current[index];
    const root = rootRef.current;
    if (!trigger || !root) return;

    const triggerRect = trigger.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();

    setIndicatorStyle({
      opacity: 1,
      width: triggerRect.width,
      transform: `translateX(${triggerRect.left - rootRect.left}px)`,
    });
  }, []);

  // measure content and center the panel under the active trigger, clamped
  // so it never overflows past the nav bar's own edges
  const updateViewportSize = useCallback((index: number) => {
    const content = contentRefs.current[index];
    const trigger = triggerRefs.current[index];
    const root = rootRef.current;
    if (!content || !trigger || !root) return;

    requestAnimationFrame(() => {
      const triggerRect = trigger.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const contentWidth = content.scrollWidth;
      const padding = 16;

      let left = triggerRect.left + triggerRect.width / 2 - rootRect.left;
      const minLeft = padding + contentWidth / 2;
      const maxLeft = rootRect.width - padding - contentWidth / 2;
      left = Math.max(minLeft, Math.min(maxLeft, left));

      setViewportSize({ width: contentWidth, height: content.scrollHeight, left });
    });
  }, []);

  const openDropdown = useCallback(
    (index: number) => {
      clearTimeout(closeTimer.current);
      if (activeIndex === index) return;

      const trigger = triggerRefs.current[index];
      const root = rootRef.current;
      if (trigger && root) {
        const triggerRect = trigger.getBoundingClientRect();
        const rootRect = root.getBoundingClientRect();
        const left = triggerRect.left + triggerRect.width / 2 - rootRect.left;
        setViewportSize((s) => ({ ...s, left }));
      }

      setPrevIndex(activeIndex);
      setActiveIndex(index);
      updateIndicator(index);
    },
    [activeIndex, updateIndicator]
  );

  const startCloseDropdown = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setPrevIndex(activeIndex);
      setActiveIndex(null);
      setIndicatorStyle((s) => ({ ...s, opacity: 0 }));
    }, CLOSE_DELAY);
  }, [activeIndex]);

  const closeDropdown = useCallback(() => {
    clearTimeout(closeTimer.current);
    setPrevIndex(activeIndex);
    setActiveIndex(null);
    setIndicatorStyle((s) => ({ ...s, opacity: 0 }));
  }, [activeIndex]);

  const cancelCloseDropdown = useCallback(() => {
    clearTimeout(closeTimer.current);
  }, []);

  const updateHighlight = useCallback((e: MouseEvent<HTMLLIElement>) => {
    clearTimeout(hideHighlightTimer.current);
    const el = e.currentTarget.querySelector("button, a");
    const list = menuListRef.current;
    if (!el || !list) return;

    const elRect = el.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const wasVisible = highlightVisible.current;
    highlightVisible.current = true;

    setHighlightStyle({
      opacity: 1,
      width: elRect.width,
      height: elRect.height,
      transform: `translate(${elRect.left - listRect.left}px, ${elRect.top - listRect.top}px)`,
      skipTransition: !wasVisible,
    });
  }, []);

  const hideHighlight = useCallback(() => {
    clearTimeout(hideHighlightTimer.current);
    hideHighlightTimer.current = setTimeout(() => {
      highlightVisible.current = false;
      setHighlightStyle((s) => ({ ...s, opacity: 0 }));
    }, 50);
  }, []);

  // measure the panel once React has rendered the active content
  useEffect(() => {
    if (activeIndex !== null) updateViewportSize(activeIndex);
  }, [activeIndex, updateViewportSize]);

  // close the open dropdown on Escape, returning focus to its trigger if it was in the panel
  useEffect(() => {
    if (activeIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (panelRef.current?.contains(document.activeElement)) triggerRefs.current[activeIndex]?.focus();
      setActiveIndex(null);
      setIndicatorStyle((s) => ({ ...s, opacity: 0 }));
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [activeIndex]);

  // close the open dropdown once keyboard focus moves somewhere other than its trigger or panel
  useEffect(() => {
    if (activeIndex === null) return;
    const handleFocus = (e: FocusEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRefs.current[activeIndex]?.contains(t)) return;
      closeDropdown();
    };
    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, [activeIndex, closeDropdown]);

  // close on route change
  useEffect(() => {
    setActiveIndex(null);
    setIndicatorStyle((s) => ({ ...s, opacity: 0 }));
  }, [pathname]);

  // the panel sits at the end of the nav in the DOM, so Tab is steered by hand:
  // from an open trigger into its links, and from the last link on to the
  // control after the trigger
  const panelLinks = (index: number) => [
    ...(contentRefs.current[index]?.querySelectorAll<HTMLElement>("a[href]") ?? []),
  ];

  const focusAfterTrigger = (index: number) => {
    const trigger = triggerRefs.current[index];
    const root = rootRef.current;
    if (!trigger || !root) return;
    const tabbable = [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
      (el) => !panelRef.current?.contains(el) && el.offsetParent !== null
    );
    (tabbable[tabbable.indexOf(trigger) + 1] ?? trigger).focus();
  };

  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const open = activeIndex === index;
    if ((e.key === "Tab" && !e.shiftKey && open) || e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openDropdown(index);
      // wait a frame when opening, so the links are displayed and can take focus
      requestAnimationFrame(() => panelLinks(index)[0]?.focus());
    }
  };

  const onPanelKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (activeIndex === null) return;
    const links = panelLinks(activeIndex);
    const current = links.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      links[(current + step + links.length) % links.length]?.focus();
    } else if (e.key === "Tab" && e.shiftKey && current === 0) {
      e.preventDefault();
      triggerRefs.current[activeIndex]?.focus();
    } else if (e.key === "Tab" && !e.shiftKey && current === links.length - 1) {
      e.preventDefault();
      const index = activeIndex;
      closeDropdown();
      focusAfterTrigger(index);
    }
  };

  return {
    activeIndex,
    prevIndex,
    isOpen,
    indicatorStyle,
    viewportSize,
    highlightStyle,
    triggerRefs,
    contentRefs,
    rootRef,
    menuListRef,
    panelRef,
    getMotion,
    openDropdown,
    startCloseDropdown,
    closeDropdown,
    cancelCloseDropdown,
    updateHighlight,
    hideHighlight,
    onTriggerKeyDown,
    onPanelKeyDown,
  };
}

export type DropdownMenu = ReturnType<typeof useDropdownMenu>;
