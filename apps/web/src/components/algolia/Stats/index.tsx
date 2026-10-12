// components/algolia/Stats/index.tsx
"use client";

import { useStats } from "react-instantsearch";
import { useAwaitingFirstResults } from "@/lib/algolia/useAwaitingFirstResults";
import { StatsPlaceholder } from "./StatsPlaceholder";
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
  const awaitingFirstResults = useAwaitingFirstResults();

  if (awaitingFirstResults) return <StatsPlaceholder />;

  return (
    <div className={styles.stats}>
      {nbHits.toLocaleString()} {nbHits === 1 ? singularLabel : pluralLabel}
    </div>
  );
}
