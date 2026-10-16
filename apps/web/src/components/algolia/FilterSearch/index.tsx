// components/algolia/FilterSearch/index.tsx
import MagnifyingGlass from "@/components/icons/magnifying-glass.svg";
import styles from "./styles.module.scss";

/** The search box above a filter's options (desktop dropdowns and the mobile filter panel) */
export function FilterSearch({
  label,
  value,
  onChange,
}: {
  /** The filter's name, e.g. "Author"; used for the placeholder and the accessible name */
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const name = label.toLowerCase();
  return (
    <div className={styles.search}>
      <MagnifyingGlass className={styles.icon} aria-hidden="true" />
      <input
        type="search"
        placeholder={`Search ${name}...`}
        aria-label={`Search ${name}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.input}
      />
    </div>
  );
}
