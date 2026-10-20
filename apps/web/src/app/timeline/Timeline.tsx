"use client";

import { useEffect, useRef, useState } from "react";
import ChevronLeft from "@/components/icons/chevron-left.svg";
import ChevronRight from "@/components/icons/chevron-right.svg";
import ChevronDown from "@/components/icons/chevron-down.svg";
import IconToggle from "@/components/ui/IconToggle";
import {
  SOURCE_ORDER,
  eraOf,
  millenniumLabel,
  timelineItems,
  type Entry,
  type SourceKey,
} from "./data";
import { EXTERNAL_REL } from "@/lib/links";
import styles from "./styles.module.scss";

type View = "vertical" | "horizontal";

const VIEW_KEY = "timeline-view";

// drawn like the catalog's grid/list icons: the axis joins square markers,
// which fill in once chosen, with each entry's text beside them
const VerticalIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M4 5v1.5M4 9.5V11" />
    <rect x="2.5" y="2" width="3" height="3" />
    <path d="M8 3.5h6.5" />
    <rect x="2.5" y="6.5" width="3" height="3" />
    <path d="M8 8h6.5" />
    <rect x="2.5" y="11" width="3" height="3" />
    <path d="M8 12.5h6.5" />
  </svg>
);

const HorizontalIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M5 4h1.5M9.5 4H11" />
    <rect x="2" y="2.5" width="3" height="3" />
    <path d="M3.5 8v6.5" />
    <rect x="6.5" y="2.5" width="3" height="3" />
    <path d="M8 8v6.5" />
    <rect x="11" y="2.5" width="3" height="3" />
    <path d="M12.5 8v6.5" />
  </svg>
);
const ITEMS = timelineItems();
const ALL_MILLENNIA = ITEMS.flatMap((i) => (i.kind === "entry" ? [i.entry.millennium] : []));

/** Each source's number in the list under the timeline */
const sourceNumber = (key: SourceKey) => SOURCE_ORDER.indexOf(key) + 1;

const anchorId = (millennium: number) => (millennium === 0 ? "ancient" : `m${millennium}`);

/**
 * The millennia as one list: a vertical column by default, or a track that
 * scrolls sideways. Runs of millennia with nothing recorded show as a single
 * gap marker.
 */
export default function Timeline() {
  const [view, setView] = useState<View>("vertical");
  // cards start collapsed to their era and title
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const trackRef = useRef<HTMLOListElement>(null);

  const toggle = (millennium: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(millennium)) next.delete(millennium);
      else next.add(millennium);
      return next;
    });
  const allOpen = open.size === ALL_MILLENNIA.length;

  // horizontal: a mouse wheel scrolls the track sideways. Trackpads already send
  // sideways scrolling, so only mostly-vertical wheel movement is turned; at
  // either end of the track the wheel scrolls the page again, so it never traps
  useEffect(() => {
    const track = trackRef.current;
    if (view !== "horizontal" || !track) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      // line- and page-based wheels report in lines or pages, not pixels
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? track.clientWidth : 1);
      const max = track.scrollWidth - track.clientWidth;
      const atEnd = delta > 0 ? track.scrollLeft >= max - 1 : track.scrollLeft <= 0;
      if (atEnd) return;
      e.preventDefault();
      track.scrollLeft += delta;
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
  }, [view]);

  // horizontal: how far the content column sits from each screen edge, so the
  // track can reach both edges exactly while its cards line up with the page
  useEffect(() => {
    const track = trackRef.current;
    const column = track?.parentElement;
    if (view !== "horizontal" || !track || !column) return;
    const measure = () => {
      const { left, right } = column.getBoundingClientRect();
      track.style.setProperty("--bleed-left", `${left}px`);
      track.style.setProperty("--bleed-right", `${document.documentElement.clientWidth - right}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    return () => {
      observer.disconnect();
      track.style.removeProperty("--bleed-left");
      track.style.removeProperty("--bleed-right");
    };
  }, [view]);

  // the reader's last choice; storage can be blocked, so it's only a convenience
  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === "horizontal") setView("horizontal");
    } catch {}
  }, []);

  const chooseView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  };

  const scrollTrack = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <div className={`${styles.timeline} ${styles[view]}`}>
      <div className={styles.controls}>
        <IconToggle
          label="Timeline layout"
          value={view}
          onChange={chooseView}
          options={[
            { value: "vertical", label: "Vertical timeline", icon: <VerticalIcon /> },
            { value: "horizontal", label: "Horizontal timeline", icon: <HorizontalIcon /> },
          ]}
        />

        <button
          type="button"
          className={styles.expandAll}
          onClick={() => setOpen(allOpen ? new Set() : new Set(ALL_MILLENNIA))}
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>

        {view === "horizontal" && (
          <div className={styles.trackButtons}>
            <button type="button" onClick={() => scrollTrack(-1)} aria-label="Scroll back in time">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" onClick={() => scrollTrack(1)} aria-label="Scroll forward in time">
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <ol
        ref={trackRef}
        className={styles.track}
        aria-label="Timeline of the Warhammer 40,000 galaxy"
        // the sideways track scrolls with the arrow keys once focused
        tabIndex={view === "horizontal" ? 0 : undefined}
      >
        {ITEMS.map((item) =>
          item.kind === "entry" ? (
            <EntryItem
              key={item.entry.millennium}
              entry={item.entry}
              open={open.has(item.entry.millennium)}
              onToggle={() => toggle(item.entry.millennium)}
            />
          ) : (
            <li key={`gap-${item.from}`} className={styles.gap} id={anchorId(item.from)}>
              <span className={styles.gapLabel}>
                {item.from === item.to ? `M${item.from}` : `M${item.from}–M${item.to}`}
              </span>
              <span className={styles.gapText}>No recorded events</span>
            </li>
          ),
        )}
      </ol>
    </div>
  );
}

function EntryItem({ entry, open, onToggle }: { entry: Entry; open: boolean; onToggle: () => void }) {
  const era = eraOf(entry.millennium);
  const id = anchorId(entry.millennium);
  return (
    <li className={styles.entry} id={id}>
      <div className={styles.label}>{millenniumLabel(entry.millennium)}</div>
      <div className={styles.marker} aria-hidden="true" />

      <article className={`${styles.card} ${open ? styles.open : ""}`} aria-labelledby={`${id}-title`}>
        {/* era and title on the left, the chevron centred beside both */}
        <div className={styles.cardHeader}>
          <span className={styles.era}>{era.name}</span>
          <h2 className={styles.title}>
            {/* this button's click area spans the whole header strip, open or closed */}
            <button
              type="button"
              className={styles.toggle}
              id={`${id}-title`}
              aria-expanded={open}
              aria-controls={`${id}-more`}
              onClick={onToggle}
            >
              {entry.title}
            </button>
          </h2>
          <ChevronDown className={styles.chevron} aria-hidden="true" />
        </div>
        <div id={`${id}-more`} hidden={!open}>
          <p className={styles.blurb}>{entry.blurb}</p>

          {entry.events && (
            <dl className={styles.events}>
              {entry.events.map(({ date, text }) => (
                <div key={date + text}>
                  <dt>{date}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
          )}

          {entry.note && <p className={styles.note}>{entry.note}</p>}

          {entry.more && (
            <p className={styles.more}>
              <a href={entry.more.href} target="_blank" rel={EXTERNAL_REL}>
                {entry.more.label} →
              </a>
            </p>
          )}

          <p className={styles.cite}>
            Sources:{" "}
            {[...entry.sources].sort((a, b) => sourceNumber(a) - sourceNumber(b)).map((key, i) => (
              <span key={key}>
                {i > 0 && " "}
                <a href={`#source-${key}`} aria-label={`Source ${sourceNumber(key)}`}>
                  [{sourceNumber(key)}]
                </a>
              </span>
            ))}
          </p>
        </div>
      </article>
    </li>
  );
}
