/**
 * Decide whether a citation may be asked for at all (ADR 2026-10-10).
 * A URL or an absolute path is not opened. A relative path still has to
 * resolve inside the Quelle; that check reads the disk and lives next to
 * the bundle loader.
 */

function stripAnchor(target: string): string {
  const hash = target.indexOf("#");
  return (hash === -1 ? target : target.slice(0, hash)).trim();
}

/** Repo-relative target, or null when the page must not open it. */
export function citationTarget(url: string): string | null {
  const withoutHash = stripAnchor(url.trim());
  if (!withoutHash || withoutHash.includes("://")) return null;
  if (withoutHash.startsWith("/") || withoutHash.startsWith("\\")) return null;
  if (/^[A-Za-z]:[\\/]/.test(withoutHash)) return null;
  return withoutHash;
}
