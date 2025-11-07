// components/algolia/Stats/index.tsx
"use client";

import { useStats } from "react-instantsearch";
import styles from "./styles.module.scss";

type StatsProps = {
  singularLabel?: string;
  pluralLabel?: string;
};

export function Stats({ 
  singularLabel = "result", 
  pluralLabel = "results" 
}: StatsProps) {
  const { nbHits } = useStats();
  
  return (
    <div className={styles.stats}>
      {nbHits.toLocaleString()} {nbHits === 1 ? singularLabel : pluralLabel}
    </div>
  );
}