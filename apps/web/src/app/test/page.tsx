import Link from "next/link";

// Add new test pages here so they show up in the index
const TEST_PAGES = [
  {
    href: "/test/grain-test",
    title: "Grain overlay",
    description: "Checks the global grain texture renders above different backgrounds.",
  },
];

export default function TestIndexPage() {
  return (
    <main>
      <div className="container" style={{ paddingBlock: "2rem" }}>
        <h1>Test pages</h1>
        <p>Only available locally and on non-production deployments.</p>
        <ul style={{ display: "grid", gap: "0.75rem", paddingLeft: "1.25rem" }}>
          {TEST_PAGES.map((page) => (
            <li key={page.href}>
              <Link href={page.href}>{page.title}</Link>
              <p style={{ margin: 0 }}>{page.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
