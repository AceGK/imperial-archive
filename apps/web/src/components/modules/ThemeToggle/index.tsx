"use client";

import { useTheme } from "next-themes";
import Button from "@/components/ui/Button";
import ThemeIcon from "@/components/icons/half-circle.svg";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      title="switch theme"
      aria-pressed={isDark}
      onClick={() => setTheme(next)}
    >
      <ThemeIcon aria-hidden style={{fontSize:'1.25rem'}}/>
    </Button>
  );
}
