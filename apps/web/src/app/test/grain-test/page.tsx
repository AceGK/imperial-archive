// Temporary QA page for the global body::after grain overlay.
// Confirms the grain renders above <main>'s own background (var(--bg-gradient))
// and above solid/near-black/near-white blocks. Safe to delete once verified.
export const metadata = {
  robots: { index: false, follow: false },
};

const blocks: { label: string; style: React.CSSProperties }[] = [
  { label: "var(--bg) — near black", style: { background: "var(--bg)" } },
  { label: "var(--bg-card)", style: { background: "var(--bg-card)" } },
  { label: "var(--primary) — brass", style: { background: "var(--primary)", color: "var(--on-primary)" } },
  { label: "white", style: { background: "#ffffff", color: "#111" } },
  { label: "mid gray #808080", style: { background: "#808080" } },
];

export default function GrainTestPage() {
  return (
    <main>
      <div className="container" style={{ paddingBlock: "2rem" }}>
        <h1>Grain overlay test</h1>
        <p>
          Each block below is a plain, opaque background — same as any card,
          nav bar, or <code>&lt;main&gt;</code> section on the real site. The
          global grain (<code>body::after</code>) should be visible on top of
          every one of them, since it&apos;s <code>position: fixed</code> with{" "}
          <code>z-index: 9999</code>, independent of DOM nesting.
        </p>
      </div>

      {blocks.map((b) => (
        <div
          key={b.label}
          style={{
            ...b.style,
            height: "220px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontSize: "0.875rem",
          }}
        >
          {b.label}
        </div>
      ))}
    </main>
  );
}
