/**
 * Trusted folders for learners (ADR 2026-10-08b D1): which folders ZAM may
 * read files from, and which ones the learner's cards point into without
 * being trusted yet.
 *
 * Only learner surfaces use this — `zam trust` and desktop Settings through
 * `zam bridge`. Neither the Studio bridge nor an MCP tool can trust a folder.
 */
import { dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type Database,
  getTrustedFolders,
  isAcceptableRoot,
  isInside,
  trustedRoots,
} from "../kernel/index.js";
import { findRepoRoot, isZamBundle } from "./okf/io.js";

export interface TrustSuggestion {
  /** The folder to trust: the repository holding the bundle, else the bundle. */
  folder: string;
  /** How many cards link into it. */
  cards: number;
}

/** A source link's local file path, or null for web and placeholder links. */
function localPathOf(link: string): string | null {
  const withoutAnchor = link.split("#", 1)[0].trim();
  if (!withoutAnchor) return null;
  if (withoutAnchor.startsWith("file:")) {
    try {
      return fileURLToPath(withoutAnchor);
    } catch {
      return null;
    }
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(withoutAnchor)) return null;
  if (/^(search|photo):/i.test(withoutAnchor)) return null;
  return isAbsolute(withoutAnchor) ? withoutAnchor : null;
}

/**
 * The one-time upgrade check, kept as a standing offer: folders that the
 * learner's cards link into, that hold an OKF knowledge base and that are not
 * trusted yet. OKF imports store absolute article paths, so without trust
 * those cards would show the refusal after the update.
 */
export async function suggestTrustedFolders(
  db: Database,
  configPath?: string,
): Promise<TrustSuggestion[]> {
  const rows = (await db
    .prepare(
      "SELECT source_link FROM tokens WHERE source_link IS NOT NULL AND source_link <> '' AND deprecated_at IS NULL",
    )
    .all()) as Array<{ source_link: string }>;
  const roots = trustedRoots(configPath);
  const counts = new Map<string, number>();
  for (const { source_link } of rows) {
    const path = localPathOf(source_link);
    if (!path) continue;
    const bundle = dirname(path);
    if (!isZamBundle(bundle)) continue;
    const repo = findRepoRoot(bundle);
    const folder = isAcceptableRoot(repo) ? repo : bundle;
    if (!isAcceptableRoot(folder)) continue;
    if (roots.some((root) => isInside(root, folder))) continue;
    counts.set(folder, (counts.get(folder) ?? 0) + 1);
  }
  return [...counts]
    .map(([folder, cards]) => ({ folder, cards }))
    .sort((a, b) => b.cards - a.cards || a.folder.localeCompare(b.folder));
}

/** The trusted folders and the standing suggestions, for Settings. */
export async function trustedFolderStatus(
  db: Database | null,
  configPath?: string,
): Promise<{ folders: string[]; suggestions: TrustSuggestion[] }> {
  return {
    folders: getTrustedFolders(configPath),
    suggestions: db ? await suggestTrustedFolders(db, configPath) : [],
  };
}
