"use client";

import { useEffect, useState, type SVGProps } from "react";
import type { IconComponent } from "./index";
import { iconLoaders } from "./lazy";

// icons already loaded on this page, so a tab switched back to shows at once
const loaded = new Map<string, IconComponent>();

type Props = SVGProps<SVGSVGElement> & { id?: string };

/**
 * A faction icon for client components, downloaded on its own the first time
 * it's shown; until then an empty box of the same size holds its place.
 * Server components can use resolveIcon, which costs no client JS.
 */
export default function LazyFactionIcon({ id, width, height, ...props }: Props) {
  const [Icon, setIcon] = useState<IconComponent | null>(() => (id && loaded.get(id)) || null);

  useEffect(() => {
    if (!id) return;
    const ready = loaded.get(id);
    if (ready) {
      setIcon(() => ready);
      return;
    }
    let live = true;
    iconLoaders[id]?.()
      .then((mod) => {
        loaded.set(id, mod.default);
        if (live) setIcon(() => mod.default);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [id]);

  if (!id || !iconLoaders[id]) return null;
  if (!Icon) {
    return <span aria-hidden style={{ display: "inline-block", width, height }} className={props.className} />;
  }
  return <Icon width={width} height={height} {...props} />;
}
