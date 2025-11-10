// /components/modules/ProfileCard/Clamp.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import ChevronDown from "@/components/icons/chevron-down.svg";
import styles from "./styles.module.scss";

type ClampProps = {
  children: React.ReactNode;
  maxLines?: number; // default 3
  labelMore?: string;
  labelLess?: string;
};

export default function Clamp({
  children,
  maxLines = 3,
  labelMore = "Read more",
  labelLess = "Show less",
}: ClampProps) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false); // NEW
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const style = window.getComputedStyle(el);
      let lineHeight = parseFloat(style.lineHeight);
      if (Number.isNaN(lineHeight) || lineHeight <= 0) {
        // fallback if line-height is "normal"
        lineHeight = parseFloat(style.fontSize || "16") * 1.4;
      }
      const totalLines = Math.round(el.scrollHeight / lineHeight);
      const shouldClamp = totalLines > maxLines;
      setIsClamped(shouldClamp);
    };

    measure();

    // Re-measure on element size changes (content, fonts, etc.)
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [maxLines, children]);

  return (
    <>
      <div
        ref={ref}
        className={[
          styles.clamp,
          expanded ? styles.expanded : "",
          !isClamped ? styles.unclamped : "",
        ].join(" ")}
        style={{ ["--max-lines" as any]: maxLines }}
      >
        {children}
      </div>

      {isClamped && (
        <Button
          variant="link"
          size="sm"
          className={styles.readMore}
          onClick={() => setExpanded((v) => !v)}
          title={expanded ? labelLess : labelMore}
        >
          {expanded ? labelLess : labelMore}
          <ChevronDown className={`${styles.chevron} ${expanded ? styles.expanded : ""}`} />
        </Button>
      )}
    </>
  );
}
