"use client";

import { useMemo, useState } from "react";
import styles from "./styles.module.scss";

export type IconEntry = {
  name: string;
  /** subfolder of components/icons, "" for the top level */
  folder: string;
  importPath: string;
  /** the file's markup, inlined so every icon shows without an import each */
  svg: string;
  /** source files (relative to src) that import it */
  usedBy: string[];
};

/** "book-spine" -> "BookSpineIcon" */
function componentName(name: string) {
  return (
    name
      .split(/[^a-z0-9]+/i)
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join("") + "Icon"
  );
}

export default function IconBrowser({ icons }: { icons: IconEntry[] }) {
  const [query, setQuery] = useState("");
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const groups = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const shown = icons.filter((icon) => {
      if (unusedOnly && icon.usedBy.length > 0) return false;
      const haystack = `${icon.folder}/${icon.name}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
    const byFolder = new Map<string, IconEntry[]>();
    for (const icon of shown) byFolder.set(icon.folder, [...(byFolder.get(icon.folder) ?? []), icon]);
    return [...byFolder.entries()];
  }, [icons, query, unusedOnly]);

  const count = groups.reduce((n, [, list]) => n + list.length, 0);

  const copy = async (icon: IconEntry) => {
    const line = `import ${componentName(icon.name)} from "${icon.importPath}";`;
    try {
      await navigator.clipboard.writeText(line);
      setCopied(icon.importPath);
      setTimeout(() => setCopied((c) => (c === icon.importPath ? null : c)), 1500);
    } catch {
      // clipboard blocked (e.g. not a secure context); the import path is on the card anyway
    }
  };

  return (
    <>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.visuallyHidden}>Search icons</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or folder, e.g. book or factions"
            autoFocus
          />
        </label>
        <label className={styles.toggle}>
          <input type="checkbox" checked={unusedOnly} onChange={(e) => setUnusedOnly(e.target.checked)} />
          Unused only
        </label>
        <span className={styles.count} aria-live="polite">
          {count} of {icons.length}
        </span>
      </div>

      {groups.length === 0 && <p>No icons match &ldquo;{query}&rdquo;.</p>}

      {groups.map(([folder, list]) => (
        <section key={folder} className={styles.group}>
          <h2>
            {folder || "icons"} <span className={styles.groupCount}>{list.length}</span>
          </h2>
          <ul className={styles.grid}>
            {list.map((icon) => (
              <li key={icon.importPath}>
                <button
                  type="button"
                  className={styles.card}
                  onClick={() => copy(icon)}
                  title={icon.usedBy.length ? `Used by:\n${icon.usedBy.join("\n")}` : "Not imported anywhere"}
                >
                  <span className={styles.previews} aria-hidden="true">
                    <span className={styles.large} dangerouslySetInnerHTML={{ __html: icon.svg }} />
                    <span className={styles.small} dangerouslySetInnerHTML={{ __html: icon.svg }} />
                  </span>
                  <span className={styles.name}>{icon.name}</span>
                  <span className={icon.usedBy.length ? styles.uses : styles.unused}>
                    {copied === icon.importPath
                      ? "Import copied"
                      : icon.usedBy.length
                        ? `${icon.usedBy.length} ${icon.usedBy.length === 1 ? "use" : "uses"}`
                        : "Unused"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
