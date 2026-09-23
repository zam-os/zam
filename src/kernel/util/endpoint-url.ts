/**
 * Build a route on a model endpoint's base URL (issue #363).
 *
 * A stored base may carry a query — the Azure-style `…/openai/v1?api-version=…`
 * — and plain concatenation (`${base}/chat/completions`) would put the route
 * inside that query value. These helpers rewrite the URL's *path* and keep its
 * query, merging any parameters of their own into it.
 *
 * A base that is not an http(s) URL is joined as a plain string, with its
 * query split off first so the route still lands in the path. That includes a
 * scheme-less `localhost:11434/v1`, which parses as a `localhost:` URL whose
 * opaque path ignores any `pathname` assignment.
 *
 * Pure string work, no HTTP, so it lives in the kernel beside
 * `embeddingsEndpointUrl` and mobile can share it.
 */

/**
 * Rewrite the path of `base` with `mapPath`, which receives the path without
 * trailing slashes (`""` for a bare origin) and returns the new path.
 */
export function mapEndpointPath(
  base: string,
  mapPath: (path: string) => string,
  query: Record<string, string> = {},
): string {
  let parsed: URL | undefined;
  try {
    parsed = new URL(base);
  } catch {
    parsed = undefined;
  }
  if (!parsed || !/^https?:$/i.test(parsed.protocol)) {
    // Split the query off by hand so the route still lands in the path.
    const mark = base.indexOf("?");
    const head = mark < 0 ? base : base.slice(0, mark);
    const params = new URLSearchParams(mark < 0 ? "" : base.slice(mark + 1));
    for (const [key, value] of Object.entries(query)) params.set(key, value);
    const search = params.toString();
    return `${mapPath(head.replace(/\/+$/, ""))}${search ? `?${search}` : ""}`;
  }
  parsed.pathname = mapPath(parsed.pathname.replace(/\/+$/, ""));
  for (const [key, value] of Object.entries(query)) {
    parsed.searchParams.set(key, value);
  }
  return parsed.toString();
}

/** `{base}/{route}`, with the base's query kept and `query` merged into it. */
export function endpointUrl(
  base: string,
  route: string,
  query: Record<string, string> = {},
): string {
  const suffix = route.replace(/^\/+/, "");
  return mapEndpointPath(base, (path) => `${path}/${suffix}`, query);
}
