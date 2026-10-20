"use client";

import { useState } from "react";
import { normalize } from "@/components/modules/Search/rows";
import styles from "./styles.module.scss";

/** An author already in the Archive (Sanity's author40k), as the form needs it */
export type ArchiveAuthor = { id: string; name: string };

const MAX_SUGGESTIONS = 8;

/** Start of the name, then the start of a word (a surname), then anywhere; -1 for no match */
function rank(name: string, query: string) {
  if (name.startsWith(query)) return 0;
  if (name.includes(` ${query}`)) return 1;
  return name.includes(query) ? 2 : -1;
}

/**
 * The author of a missing book or series: suggests the Archive's authors as the
 * reader types, but takes any name, since the author may be missing too. A
 * name that matches an Archive author also sends that author's id (authorId),
 * so the new record can be linked to them.
 */
export default function AuthorInput({
  id,
  name,
  authors,
  maxLength,
  required,
  describedBy,
  invalid,
}: {
  id: string;
  name: string;
  authors: ArchiveAuthor[];
  maxLength: number;
  required?: boolean;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = `${id}-list`;
  const statusId = `${id}-status`;

  const query = normalize(value.trim());
  const suggestions = query
    ? authors
        .map((author) => ({ author, r: rank(normalize(author.name), query) }))
        .filter((m) => m.r >= 0)
        .sort((a, b) => a.r - b.r || a.author.name.localeCompare(b.author.name))
        .slice(0, MAX_SUGGESTIONS)
        .map((m) => m.author)
    : [];
  // typed in full counts the same as picked from the list
  const match = query ? authors.find((author) => normalize(author.name) === query) : undefined;
  const showList = open && suggestions.length > 0 && !(suggestions.length === 1 && suggestions[0] === match);

  const pick = (author: ArchiveAuthor) => {
    setValue(author.name);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const last = suggestions.length - 1;
      setActive((i) => (e.key === "ArrowDown" ? (i >= last ? 0 : i + 1) : i <= 0 ? last : i - 1));
    } else if (e.key === "Enter" && showList && active >= 0) {
      // picks the highlighted author rather than sending the form
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === "Escape" && showList) {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className={styles.combobox}>
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        maxLength={maxLength}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        aria-describedby={[describedBy, statusId].filter(Boolean).join(" ")}
        aria-invalid={invalid}
      />
      <input type="hidden" name="authorId" value={match?.id ?? ""} />

      <ul id={listId} role="listbox" aria-label="Authors in the Archive" className={styles.suggestions} hidden={!showList}>
        {showList &&
          suggestions.map((author, i) => (
            <li
              key={author.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? styles.suggestionActive : undefined}
              // mousedown, before the input's blur closes the list
              onMouseDown={(e) => {
                e.preventDefault();
                pick(author);
              }}
              onMouseEnter={() => setActive(i)}
            >
              {author.name}
            </li>
          ))}
      </ul>

      <span id={statusId} className={styles.hint} aria-live="polite">
        {match
          ? "In the Archive"
          : value.trim()
            ? "Not in the Archive yet, which is fine: it'll be added as a new author"
            : null}
      </span>
    </div>
  );
}
