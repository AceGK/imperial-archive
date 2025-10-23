"use client";

import * as React from "react";
import Link from "next/link";
import styles from "./styles.module.scss";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "destructive" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  href?: string; // <— if present, renders a Link
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  title?: string;
  target?: string;
  rel?: string;
};

/**
 * A polymorphic Button:
 * - Renders <button> by default
 * - Renders <Link> when href is provided
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  href,
  onClick,
  type = "button",
  disabled = false,
  title,
  target,
  rel,
}: ButtonProps) {
  const classes = `
    ${styles.button}
    ${styles[variant]}
    ${styles[size]}
    ${disabled ? styles.disabled : ""}
    ${className || ""}
  `;

  if (href) {
    return (
      <Link href={href} className={classes} target={target} rel={rel} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={classes}
    >
      {children}
    </button>
  );
}
