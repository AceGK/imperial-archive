import fs from "node:fs";
import path from "node:path";
import IconBrowser, { type IconEntry } from "./IconBrowser";

// read from the source tree, so render once at build time while it's there
export const dynamic = "force-static";

const SRC = path.join(process.cwd(), "src");
const ICONS = path.join(SRC, "components", "icons");

function walk(dir: string, keep: (file: string) => boolean): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : walk(full, keep);
    return keep(entry.name) ? [full] : [];
  });
}

const toPosix = (p: string) => p.split(path.sep).join("/");

/** Each imported .svg (resolved to its file) -> the source files importing it */
function svgImports(): Map<string, string[]> {
  const users = new Map<string, string[]>();
  for (const file of walk(SRC, (name) => /\.tsx?$/.test(name))) {
    const text = fs.readFileSync(file, "utf8");
    for (const [, spec] of text.matchAll(/["']([^"']+\.svg)["']/g)) {
      const target = spec.startsWith("@/")
        ? path.join(SRC, spec.slice(2))
        : spec.startsWith(".")
          ? path.resolve(path.dirname(file), spec)
          : null;
      if (!target) continue;
      const list = users.get(target) ?? [];
      list.push(toPosix(path.relative(SRC, file)));
      users.set(target, list);
    }
  }
  return users;
}

function loadIcons(): IconEntry[] {
  const users = svgImports();

  return walk(ICONS, (name) => name.endsWith(".svg"))
    .map((file) => {
      const rel = toPosix(path.relative(ICONS, file));
      return {
        name: path.basename(rel, ".svg"),
        folder: path.dirname(rel) === "." ? "" : path.dirname(rel),
        importPath: `@/components/icons/${rel}`,
        svg: fs.readFileSync(file, "utf8"),
        usedBy: [...new Set(users.get(file) ?? [])],
      };
    })
    .sort((a, b) => a.folder.localeCompare(b.folder) || a.name.localeCompare(b.name));
}

export default function IconsTestPage() {
  return (
    <main>
      <div className="container" style={{ paddingBlock: "2rem" }}>
        <h1>Icons</h1>
        <p>
          Every SVG in components/icons. Hover an icon to see the files that import it; click to copy its import line.
        </p>
        <IconBrowser icons={loadIcons()} />
      </div>
    </main>
  );
}
