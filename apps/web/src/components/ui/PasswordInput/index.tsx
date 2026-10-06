"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import EyeIcon from "@/components/icons/eye.svg";
import EyeSlashIcon from "@/components/icons/eye-slash.svg";
import styles from "./styles.module.scss";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Password field with a show/hide toggle. Takes the same props as <input>;
 * the field's look comes from the surrounding form styles as before.
 */
export default function PasswordInput({ className, disabled, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrap}>
      <input
        {...props}
        disabled={disabled}
        type={visible ? "text" : "password"}
        className={`${styles.input} ${className ?? ""}`}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
      </button>
    </div>
  );
}
