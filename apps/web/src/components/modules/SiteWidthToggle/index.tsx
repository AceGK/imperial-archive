"use client";
import { useEffect, useState } from "react";
import Interface from "@/components/icons/interface.svg";
import Button from "@/components/ui/Button";
import styles from "./styles.module.scss";

type LayoutMode = "boxed" | "full";

export default function SiteWidthToggle() {
  const [layout, setLayout] = useState<LayoutMode>(() => {
    if (typeof document !== "undefined") {
      const v = document.documentElement.getAttribute("data-layout");
      if (v === "boxed" || v === "full") return v;
    }
    return "boxed";
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("site-layout") as LayoutMode | null;
      if (saved && saved !== layout) {
        setLayout(saved);
        document.documentElement.setAttribute("data-layout", saved);
      }
    } catch {}
  }, []); // don't change DOM if it already matches

  const toggle = () => {
    const next: LayoutMode = layout === "boxed" ? "full" : "boxed";
    document.documentElement.setAttribute("data-layout", next);
    try {
      localStorage.setItem("site-layout", next);
      document.cookie = `site-layout=${next}; Max-Age=31536000; Path=/; SameSite=Lax`;
    } catch {}
    setLayout(next);
  };

  return (
    <div className={styles.interface}>
      <Button variant="ghost" size="icon" title="switch layout" onClick={toggle}>
        <Interface />
      </Button>
    </div>
  );
}
