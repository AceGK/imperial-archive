"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./styles.module.scss";
import MagnifyingGlassIcon from "@/components/icons/magnifying-glass.svg";
import { SUGGESTED_SEARCHES } from "./terms";

export type { SearchShortcut } from "./types";

// The live search (InstantSearch and Algolia, ~37KB gzipped) loads the first
// time a reader points at, touches or focuses the box, like the nav search.
// Until then the box is plain HTML that looks the same, so it's in the
// server-rendered page and costs the homepage no JavaScript.
const loadLiveSearch = () => import("./LiveSearch");
type LiveSearchComponent = Awaited<ReturnType<typeof loadLiveSearch>>["default"];

function SuggestedSearches() {
  return (
    <div className={styles.suggestions}>
      <span className={styles.suggestionsLabel}>Popular:</span>
      {SUGGESTED_SEARCHES.map((term) => (
        <Link
          key={term}
          href={`/books?q=${encodeURIComponent(term)}`}
          className={styles.suggestionChip}
        >
          {term}
        </Link>
      ))}
    </div>
  );
}

export default function Search() {
  const router = useRouter();
  // the live search once its code has arrived; the plain box stays until then
  const [LiveSearch, setLiveSearch] = useState<LiveSearchComponent | null>(null);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const goLive = () => {
    loadLiveSearch().then((m) => setLiveSearch(() => m.default));
  };

  const plainBox = (
    <form
      className={styles.searchBox}
      role="search"
      onPointerEnter={goLive}
      onSubmit={(e) => {
        // Enter before the live search arrives still searches
        e.preventDefault();
        router.push(`/books?q=${encodeURIComponent(value.trim())}`);
      }}
    >
      <MagnifyingGlassIcon className={styles.searchIcon} aria-hidden="true" />
      <input
        id="hero-search"
        className={styles.input}
        type="search"
        autoComplete="off"
        placeholder="Search the Archive…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => {
          setFocused(true);
          goLive();
        }}
        onBlur={() => setFocused(false)}
      />
    </form>
  );

  return (
    <>
      {LiveSearch ? <LiveSearch initialQuery={value} autoFocus={focused} /> : plainBox}
      <SuggestedSearches />
    </>
  );
}
