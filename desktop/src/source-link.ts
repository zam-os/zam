/**
 * A card's web source as a link the learner can open (ADR 2026-10-19,
 * Decision 6). Studio's review, the card editor, the MCP Apps recall panel
 * and Mobile all label it the same way.
 *
 * Only `http:` and `https:` qualify; a local path stays as it was. The
 * label is the host and the path, with the host in its ASCII form, which
 * `URL.hostname` already gives for an international domain. The link is
 * untrusted library content, so a look-alike host must not pass as a known
 * one. The full URL goes into the title.
 *
 * Mobile imports this module: no Node built-ins.
 */

export const ACADEMY_HOST = "academy.zam-os.org";

/** Longer decoded paths are shortened in the middle. */
const MAX_PATH_CHARS = 48;

/** Bidirectional controls could reorder what the learner reads. */
const BIDI_CONTROLS = /[‎‏‪-‮⁦-⁩]/g;

export interface WebSourceLink {
  href: string;
  label: string;
  title: string;
  /** A lesson of a ZAM Academy app. */
  academy: boolean;
}

/**
 * The link for a stored source, or null when it is not an http(s) URL.
 * `lessonLabel` is the translated „Lektion öffnen ↗“ for academy links.
 */
export function webSourceLink(
  raw: string | null | undefined,
  lessonLabel: string,
): WebSourceLink | null {
  if (!raw?.trim()) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!url.hostname) return null;
  const href = url.toString();
  if (url.hostname === ACADEMY_HOST) {
    return { href, label: lessonLabel, title: href, academy: true };
  }
  return {
    href,
    label: `${url.hostname}${displayPath(url.pathname)} ↗`,
    title: href,
    academy: false,
  };
}

function displayPath(pathname: string): string {
  let path = pathname.replace(/\/+$/, "");
  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep the encoded form of a malformed escape.
  }
  path = path.replace(BIDI_CONTROLS, "");
  if (path.length <= MAX_PATH_CHARS) return path;
  const keep = Math.floor((MAX_PATH_CHARS - 1) / 2);
  return `${path.slice(0, keep)}…${path.slice(-keep)}`;
}
