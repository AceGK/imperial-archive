// /components/modules/FactionTheme/index.tsx
import React from "react";

type Props = {
  /** e.g. "blood-angels" or an iconId that matches your :root vars */
  slugOrIconId: string;
  /** Polymorphic wrapper element/component */
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  fallbackPrimary?: string;
  fallbackSecondary?: string;
} & Omit<React.ComponentPropsWithoutRef<any>, "as" | "children" | "className">;

/**
 * Provides --faction-primary/secondary from your :root variables:
 *   --<key>-primary / --<key>-secondary
 */
export default function FactionTheme({
  slugOrIconId,
  as,
  className,
  children,
  fallbackPrimary = "#0f0f10",
  fallbackSecondary = "#dfe3e6",
  ...rest
}: Props) {
  const Tag: React.ElementType = as || "div";
  const key = String(slugOrIconId).toLowerCase();

  const style: React.CSSProperties = {
    ["--faction-primary" as any]: `var(--${key}-primary, ${fallbackPrimary})`,
    ["--faction-secondary" as any]: `var(--${key}-secondary, ${fallbackSecondary})`,
    ...(rest as any).style, // allow caller to pass additional style
  };

  // Use createElement to avoid JSX generic issues with <Tag />
  return React.createElement(Tag, { className, style, ...rest }, children);
}
