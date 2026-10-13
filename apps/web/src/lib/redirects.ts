// Redirects managed in Sanity (the "Redirects" section of the studio), looked
// up by middleware on every page request. Plain fetch rather than the shared
// Sanity client, which is server-only and can't load in middleware.

type Redirect = { destination: string; permanent: boolean };

const TTL_MS = 60_000;

const query = `*[_type == "redirect" && defined(source) && defined(destination)]{ source, destination, permanent }`;

let cache: { map: Map<string, Redirect>; expires: number } | null = null;
let inflight: Promise<Map<string, Redirect>> | null = null;

async function load(): Promise<Map<string, Redirect>> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const url =
    `https://${projectId}.apicdn.sanity.io/v2025-01-01/data/query/${dataset}` +
    `?perspective=published&query=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.SANITY_API_READ_TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Sanity redirects query failed: ${res.status}`);

  const { result } = (await res.json()) as {
    result: { source: string; destination: string; permanent?: boolean | null }[];
  };
  return new Map(
    result.map((r) => [
      normalize(r.source),
      { destination: r.destination, permanent: r.permanent !== false },
    ])
  );
}

function normalize(path: string) {
  const p = path.trim().toLowerCase();
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

/** The redirect for a request path, if one is published in Sanity */
export async function findRedirect(pathname: string): Promise<Redirect | undefined> {
  if (!cache || Date.now() > cache.expires) {
    inflight ??= load()
      .then((map) => {
        cache = { map, expires: Date.now() + TTL_MS };
        return map;
      })
      // a Sanity outage must never take the site down: keep serving the last
      // good list (or none) and try again after the TTL
      .catch((err) => {
        console.error(err);
        cache = { map: cache?.map ?? new Map(), expires: Date.now() + TTL_MS };
        return cache.map;
      })
      .finally(() => {
        inflight = null;
      });
    await inflight;
  }
  return cache?.map.get(normalize(pathname));
}
