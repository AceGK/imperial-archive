import type { ReactNode } from "react";
import styles from "./styles.module.scss";

export type IconToggleOption<T extends string> = {
  value: T;
  /** Read out and shown as a tooltip, since the button itself is only an icon */
  label: string;
  /** A 16×16 line icon (stroked by the toggle; its <rect>s fill in when chosen) */
  icon: ReactNode;
};

/**
 * A segmented control of icon buttons: one bordered box split into its
 * options, with the hover corner marks around the whole box. Used for the
 * catalogs' grid/list and width choices, and the timeline's layout.
 */
export default function IconToggle<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  /** What the group chooses, e.g. "Layout" */
  label: string;
  options: IconToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={className ? `${styles.toggle} ${className}` : styles.toggle} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.button}
          aria-pressed={value === option.value}
          aria-label={option.label}
          title={option.label}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
