// /schemas/parts/BelongsToSeries.tsx
import React, { useEffect, useState } from "react";
import { useClient } from "sanity";
import { useFormValue } from "sanity";
import { useIntentLink } from "sanity/router";

type Row = {
  _id: string;
  title: string;
  number?: number | null;
  label?: string | null;
};

const BelongsToSeries: React.FC = () => {
  const client = useClient({ apiVersion: "2025-01-01" });
  const rawId = (useFormValue(["_id"]) as string) || "";
  const bookId = rawId.replace(/^drafts\./, ""); // make sure we match published refs

  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const link = useIntentLink({ intent: "edit", params: { type: "series40k" } });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!bookId) return;
      try {
        const q = `
          *[_type=="series40k" && references($bookId)]{
            _id,
            title,
            // pull the membership row for this book
            "number": items[book._ref==$bookId][0].number,
            "label":  items[book._ref==$bookId][0].label,
            // make a sortable key (fallback pushes nulls to the end)
            "ord": coalesce(items[book._ref==$bookId][0].number, 999999)
          } | order(ord asc, title asc){
            _id, title, number, label
          }
        `;
        const res = await client.fetch<Row[]>(q, { bookId });
        if (!cancelled) setRows(res);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load series.");
      }
    }
    run();
    return () => { cancelled = true; };
  }, [client, bookId]);

  if (!bookId) {
    return <div style={{ padding: "0.5rem 0", color: "var(--card-muted-fg-color)" }}>
      Save the document to view series memberships.
    </div>;
  }

  if (error) {
    return <div style={{ color: "var(--card-danger-fg-color)" }}>{error}</div>;
  }

  if (!rows) {
    return <div style={{ opacity: 0.7 }}>Loading…</div>;
  }

  if (rows.length === 0) {
    return <div style={{ opacity: 0.7 }}>This book is not in any series.</div>;
  }

  return (
    <ul style={{ margin: 0, paddingLeft: "1rem", lineHeight: 1.5 }}>
      {rows.map(({ _id, title, number, label }) => {
        const intent = useIntentLink({
          intent: "edit",
          params: { id: _id, type: "series40k" },
        });
        const badge = label || (Number.isFinite(number as number) ? `#${number}` : null);
        return (
          <li key={_id}>
            <a {...intent} style={{ textDecoration: "none" }}>
              {title}
            </a>
            {badge ? <span style={{ opacity: 0.7 }}> — {badge}</span> : null}
          </li>
        );
      })}
    </ul>
  );
};

export default BelongsToSeries;
