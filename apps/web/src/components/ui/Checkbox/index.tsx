"use client";

import * as React from "react";
import styles from "./styles.module.scss";

type CheckedState = boolean | "indeterminate";

export type CheckboxProps = {
  id?: string;
  name?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;

  /** Controlled checked state (true | false | "indeterminate") */
  checked?: CheckedState;

  /** Uncontrolled initial state */
  defaultChecked?: CheckedState;

  /** Fires on any state change (true | false | "indeterminate") */
  onCheckedChange?: (state: CheckedState) => void;

  /** Size token */
  size?: "sm" | "md" | "lg";

  /** Extra class on the root label */
  className?: string;

  /** Optional visible label (you can also pair with a separate <label htmlFor=...>) */
  children?: React.ReactNode;

  /** Accessible name if no children/label is present */
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      name,
      value,
      required,
      disabled,
      checked,
      defaultChecked,
      onCheckedChange,
      size = "md",
      className,
      children,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledby,
    },
    forwardedRef
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    // merge refs
    React.useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

    const isControlled = checked !== undefined;

    // normalize default
    const [internal, setInternal] = React.useState<CheckedState>(() => {
      return defaultChecked ?? false;
    });

    const current: CheckedState = isControlled ? checked! : internal;

    // reflect "indeterminate" to the native input property
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = current === "indeterminate";
      }
    }, [current]);

    const stateForBox =
      current === "indeterminate" ? "indeterminate" : current ? "checked" : "unchecked";

    const handleToggle = (next: boolean) => {
      const nextState: CheckedState = next;
      if (!isControlled) setInternal(nextState);
      onCheckedChange?.(nextState);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // if we were 'indeterminate', browsers typically flip to checked on first click
      // We emulate the same: use the input's boolean checked.
      handleToggle(e.target.checked);
    };

    // Keyboard: Enter/Space handled by native input automatically when focused.
    // ARIA: expose 'mixed' when indeterminate.
    return (
      <label
        className={cx(styles.root, styles[size], disabled && styles.disabled, className)}
        data-disabled={disabled || undefined}
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          value={value}
          type="checkbox"
          className={styles.input}
          checked={current === true}
          onChange={onChange}
          required={required}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-checked={current === "indeterminate" ? "mixed" : (current as boolean)}
        />
        <span
          className={styles.box}
          data-state={stateForBox}
          data-size={size}
          aria-hidden="true"
        />
        {children && <span className={styles.text}>{children}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
