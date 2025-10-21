"use client";

import React, { type ElementType, type ReactNode } from "react";
import styles from "./styles.module.scss";

type Variant = "default" | "secondary" | "outline" | "destructive";
type Size = "sm" | "md";

/**
 * Polymorphic Badge with `as` prop.
 * - Renders a <span> by default.
 * - Use `as="a"` / `as="div"` / custom components if you need.
 * - Variants: "default" | "secondary" | "outline" | "destructive"
 * - Sizes: "sm" | "md"
 */
export type BadgeProps<C extends ElementType = "span"> = {
  as?: C;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<C>, "as" | "children" | "className">;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function Badge<C extends ElementType = "span">({
  as,
  children,
  variant = "default",
  size = "md",
  className,
  ...rest
}: BadgeProps<C>) {
  const Comp = (as ?? "span") as ElementType;
  return (
    <Comp className={cx(styles.badge, styles[variant], styles[size], className)} {...rest}>
      {children}
    </Comp>
  );
}

/* ------------------------------------------------------------------
   Usage examples

   import Badge from "@/components/ui/Badge";

   // 1) Basic badge
   <Badge>Completed</Badge>

   // 2) Variants
   <Badge variant="secondary">Draft</Badge>
   <Badge variant="outline">New</Badge>
   <Badge variant="destructive">Overdue</Badge>

   // 3) Sizes
   <Badge size="sm">Small</Badge>
   <Badge size="md">Medium</Badge>

   // 4) Polymorphic "as" prop (renders an anchor)
   <Badge as="a" href="/lists" aria-label="Go to lists">
     All Lists
   </Badge>

   // 5) In your ListView row (category-aware tag)
   //    Assume `row.completed` and `list.category` exist in scope:
   {row.completed && (
     <Badge size="sm">
       {list.category === "books"
         ? "Read"
         : list.category === "movies" || list.category === "shows"
         ? "Watched"
         : "Completed"}
     </Badge>
   )}

------------------------------------------------------------------- */
