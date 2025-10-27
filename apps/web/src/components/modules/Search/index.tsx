'use client'

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./styles.module.scss";
import { useRouter } from "next/navigation";

/** BOOKS **/
export type Book = {
  id: string | number;
  title: string;
  slug: string;                 // e.g. "horus-rising"
  author?: string[] | string;
  authors?: string[];
  factions?: string[];
};

/** FACTIONS **/
export type Faction = {
  id?: string | number;
  title: string;                // e.g. "Blood Angels"
  slug: string;                 // e.g. "blood-angels"
  iconId?: string;
  group?: string;               // e.g. "Space Marines"
  groupSlug?: string;           // e.g. "space-marines"  <-- critical for routing
};

type Props = {
  books: Book[];
  placeholder?: string;
  maxResults?: number;
  onSelectBook?: (book: Book) => void;
};

type Hit =
  | {
      kind: "book";
      score: number;
      book: Book;
      title: string;
      authorsLine: string;
      factionsLine: string;
    }
  | {
      kind: "faction";
      score: number;
      faction: Faction;
      title: string;
      groupLine: string;
    };

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function joinAuthors(b: Book): string {
  const a = Array.isArray(b.authors)
    ? b.authors
    : Array.isArray(b.author)
    ? b.author
    : typeof b.author === "string"
    ? [b.author]
    : [];
  return a.join(", ");
}

function joinFactions(b: Book): string {
  return Array.isArray(b.factions) ? b.factions.join(", ") : "";
}

/** scoring **/
function scoreText(text: string, qn: string, tokens: string[]): number {
  let s = 0;
  if (!text) return s;
  if (text.startsWith(qn)) s += 8;
  if (text.includes(qn)) s += 5;
  for (const t of tokens) {
    if (text.startsWith(t)) s += 3;
    else if (text.includes(t)) s += 2;
  }
  return s;
}

function scoreBook(book: Book, q: string): number {
  const qn = normalize(q);
  const tokens = qn.split(/\s+/).filter(Boolean);
  const title = normalize(book.title || "");
  const authors = normalize(joinAuthors(book));
  const factions = normalize(joinFactions(book));

  let score = 0;
  score += scoreText(title, qn, tokens) * 2.2;     // title weight
  score += scoreText(authors, qn, tokens) * 1.4;   // authors weight
  score += scoreText(factions, qn, tokens) * 1.1;
  score += Math.max(0, 2 - Math.log10((book.title?.length || 30))); // tiny bias for shorter titles
  return score;
}

function scoreFaction(f: Faction, q: string): number {
  const qn = normalize(q);
  const tokens = qn.split(/\s+/).filter(Boolean);
  const title = normalize(f.title || "");
  const group = normalize(f.group || "");

  let score = 0;
  score += scoreText(title, qn, tokens) * 2.0;
  score += scoreText(group, qn, tokens) * 1.1;
  return score;
}

/** highlight **/
function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const qn = normalize(query);
  if (!qn) return text;
  const raw = text;
  const lower = normalize(text);
  const parts: React.ReactNode[] = [];
  let i = 0;
  let idx = lower.indexOf(qn);
  while (idx !== -1) {
    if (idx > i) parts.push(raw.slice(i, idx));
    parts.push(<mark key={idx}>{raw.slice(idx, idx + qn.length)}</mark>);
    i = idx + qn.length;
    idx = lower.indexOf(qn, i);
  }
  if (i < raw.length) parts.push(raw.slice(i));
  return parts;
}

export default function Search({
  books,
  placeholder = "Search books and factions…",
  maxResults = 10,
  onSelectBook,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // debounce
  const [q, setQ] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setQ(value.trim()), 120);
    return () => clearTimeout(id);
  }, [value]);

  // compute hits from both sources
  const hits: Hit[] = useMemo(() => {
    if (!q) return [];
    const bookHits: Hit[] = books.map((b) => ({
      kind: "book",
      score: scoreBook(b, q),
      book: b,
      title: b.title ?? "",
      authorsLine: joinAuthors(b),
      factionsLine: joinFactions(b),
    }));
  
    return [...bookHits]
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }, [books, q, maxResults]);

  useEffect(() => setActive(0), [q]);

  // outside click to close
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function goTo(hit: Hit) {
    setOpen(false);
    if (hit.kind === "book") {
      if (onSelectBook) return onSelectBook(hit.book);
      router.push(`/books/${hit.book.slug}`);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, hits.length - 1));
      listRef.current?.children?.[Math.min(active + 1, hits.length - 1)]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      listRef.current?.children?.[Math.max(active - 1, 0)]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      const h = hits[active];
      if (h) goTo(h);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className={styles.searchBox} ref={boxRef}>
      {/* <label className="sr-only" htmlFor="hero-search">Search</label> */}
      <input
        id="hero-search"
        className={styles.input}
        type="search"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { setValue(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && hits.length > 0 && (
        <ul className={styles.list} ref={listRef} role="listbox" aria-label="Search suggestions">
          {hits.map((h, i) => {
            const key = h.kind === "book" ? `b-${h.book.id}` : `f-${h.faction.slug}`;
            return (
              <li
                key={key}
                className={`${styles.item} ${i === active ? styles.active : ""}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); goTo(h); }}
              >
                <div className={styles.rowTitle}>
                  {highlight(h.title, q)}
                  <span className={styles.kind}>
                    {h.kind === "book" ? "Book" : "Faction"}
                  </span>
                </div>

                <div className={styles.rowMeta}>
                  {h.kind === "book" ? (
                    <>
                      {h.authorsLine && <span>{highlight(h.authorsLine, q)}</span>}
                      {h.factionsLine && <span className={styles.dot}>·</span>}
                      {h.factionsLine && <span>{highlight(h.factionsLine, q)}</span>}
                    </>
                  ) : (
                    <>
                      {h.groupLine && <span>{highlight(h.groupLine, q)}</span>}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
