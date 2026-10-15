"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import HeartIcon from "@/components/icons/account/favorites.svg";
import ListIcon from "@/components/icons/account/reading-lists.svg";
import AddToListDialog from "@/components/modules/ReadingLists/AddToListDialog";
import { useReadingLists } from "@/components/modules/ReadingLists/useReadingLists";
import BookIcon from "@/components/icons/book.svg";
import PlusIcon from "@/components/icons/plus.svg";
import { STATUS_STEPS, type ReadingStatus } from "@/components/modules/TrackButtons/steps";
import { useBookLibrary } from "./useBookLibrary";
import styles from "./styles.module.scss";

// gap kept between the menu and the edges of the screen
const EDGE = 12;

const STATUS_OPTIONS = STATUS_STEPS.filter(
  (s): s is (typeof STATUS_STEPS)[number] & { status: Exclude<ReadingStatus, null> } => s.status !== null,
);

type Props = {
  bookId: string;
  title: string;
  /** "overlay" sits on a cover and appears on hover; "inline" is an ordinary, always-visible button */
  variant?: "overlay" | "inline";
  /** Called as the menu opens and closes, e.g. to keep a hover-only button showing */
  onOpenChange?: (open: boolean) => void;
};

/**
 * A "Track" button opening a small menu: reading status (Want to read,
 * Reading, Read; picking the current one clears it), Owned, and Favorite.
 * The menu renders at the end of <body> so carousels that clip their slides
 * can't cut it off.
 */
export default function TrackMenu({ bookId, title, variant = "overlay", onOpenChange }: Props) {
  const { favorite, status, owned, ready, error, toggleFavorite, chooseStatus, toggleOwned } =
    useBookLibrary(bookId);
  const [open, setOpenState] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const router = useRouter();
  const [listDialogOpen, setListDialogOpen] = useState(false);
  // the reader's lists load only once the menu opens: most catalog visits never
  // open it, and each load counts against the Convex plan
  const readingLists = useReadingLists(open);
  const inLists = readingLists.lists.filter((l) => l.bookIds.includes(bookId)).length;

  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };

  // the menu closes and the list picker opens in its place
  const openListDialog = () => {
    setOpen(false);
    if (!readingLists.isAuthenticated) {
      router.push("/login");
      return;
    }
    setListDialogOpen(true);
  };

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  // below the button, lined up with its right edge; above it when there's only
  // room there (decided once on opening, so it doesn't flip while scrolling);
  // inside the screen horizontally. Positioned in page coordinates, so the page
  // scrolling carries it along with the button rather than it trailing a frame behind.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    let above: boolean | null = null;
    const place = () => {
      const button = triggerRef.current?.getBoundingClientRect();
      const menu = menuRef.current;
      if (!button || !menu) return;
      const { offsetWidth: width, offsetHeight: height } = menu;
      above ??= button.bottom + 6 + height > window.innerHeight - EDGE && button.top - 6 - height >= EDGE;
      const top = (above ? button.top - 6 - height : button.bottom + 6) + window.scrollY;
      const left = Math.max(EDGE, Math.min(button.right - width, window.innerWidth - width - EDGE)) + window.scrollX;
      setPosition({ top, left });
    };
    // the page's own scrolling needs no update; scrolling inside an element
    // (e.g. a scrollable panel holding the card) moves the button relative to the page
    const onScroll = (e: Event) => {
      if (e.target !== document) place();
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  // focus the first option once the menu is placed (it's hidden, and so can't
  // take focus, until then); only on opening, not every time it moves
  const placed = position !== null;
  useEffect(() => {
    if (open && placed) menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open, placed]);

  // close on Escape or a click elsewhere
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // up/down arrows move between the options, as in other menus
  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={variant === "inline" ? styles.trackButtonInline : styles.trackButton}
        onClick={() => setOpen(!open)}
        disabled={!ready}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Track ${title}`}
      >
        <PlusIcon className={styles.trackIcon} aria-hidden="true" />
        <span>Track</span>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={`Track ${title}`}
            className={styles.trackMenu}
            onKeyDown={onMenuKey}
            // hidden until measured, so it never flashes in the wrong spot
            style={position ?? { visibility: "hidden" }}
          >
            <p className={styles.menuHeading}>Reading status</p>
            {STATUS_OPTIONS.map(({ status: s, label, icon: Icon }) => (
              <button
                key={s}
                type="button"
                role="menuitemradio"
                aria-checked={status === s}
                className={styles.menuItem}
                onClick={() => chooseStatus(s)}
              >
                <Icon className={styles.menuIcon} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
            <hr className={styles.menuDivider} />
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={owned}
              className={styles.menuItem}
              onClick={toggleOwned}
            >
              <BookIcon className={styles.menuIcon} aria-hidden="true" />
              <span>Owned</span>
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={favorite}
              className={`${styles.menuItem} ${styles.menuFavorite}`}
              onClick={toggleFavorite}
            >
              <HeartIcon className={styles.menuIcon} aria-hidden="true" />
              <span>Favorite</span>
            </button>
            <hr className={styles.menuDivider} />
            <button
              type="button"
              role="menuitem"
              aria-haspopup="dialog"
              className={styles.menuItem}
              onClick={openListDialog}
            >
              <ListIcon className={styles.menuIcon} aria-hidden="true" />
              <span>Add to list</span>
              {inLists > 0 && <span className={styles.menuCount}>{inLists}</span>}
            </button>
            {error && <p className={styles.menuError}>Couldn&apos;t save. Try again.</p>}
          </div>,
          document.body,
        )}

      {listDialogOpen && (
        <AddToListDialog
          bookId={bookId}
          bookTitle={title}
          onClose={() => {
            setListDialogOpen(false);
            triggerRef.current?.focus();
          }}
        />
      )}
    </>
  );
}
