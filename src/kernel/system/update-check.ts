/**
 * Update-decision logic — Increment 12, Phase 5.
 *
 * The brain behind "the app noticed a newer version": given the current and
 * latest versions and how this copy was installed, decide what the UI should
 * do. Deliberately network-free and pure, so it is fully unit-tested; the
 * actual version fetch (e.g. GitHub releases) and the Tauri self-update live in
 * the CLI/desktop layers that call this.
 */

export type InstallChannel = "developer" | "direct" | "winget" | "homebrew";

/** Provisional package identifiers; finalized when channels ship (Phase 2). */
export const WINGET_PACKAGE_ID = "ZAM.ZAM";
export const HOMEBREW_CASK = "zam";

export type UpdateActionKind =
  | "none"
  | "self-update"
  | "run-command"
  | "inform";

export interface UpdateDecision {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  channel: InstallChannel;
  /** What the UI should do about the update. */
  action: UpdateActionKind;
  /** For "run-command"/"inform": the command to surface to the user. */
  command?: string;
  /** Locale-agnostic explanation; the UI provides its own localized copy. */
  reason: string;
}

interface ParsedVersion {
  core: number[];
  pre: string[];
}

function parseVersion(version: string): ParsedVersion {
  const clean = version.trim().replace(/^v/i, "");
  const [main, pre = ""] = clean.split("-", 2);
  const core = main.split(".").map((n) => Number.parseInt(n, 10) || 0);
  while (core.length < 3) core.push(0);
  return { core, pre: pre ? pre.split(".") : [] };
}

/**
 * Compare two semver-ish versions. Returns 1 if `a` is newer than `b`, -1 if
 * older, 0 if equal. A version with a prerelease tag (1.0.0-beta) sorts below
 * the same core release (1.0.0), per semver.
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = parseVersion(a);
  const pb = parseVersion(b);

  for (let i = 0; i < 3; i++) {
    if (pa.core[i] !== pb.core[i]) return pa.core[i] > pb.core[i] ? 1 : -1;
  }

  if (pa.pre.length === 0 && pb.pre.length === 0) return 0;
  if (pa.pre.length === 0) return 1; // release > prerelease
  if (pb.pre.length === 0) return -1;

  const len = Math.max(pa.pre.length, pb.pre.length);
  for (let i = 0; i < len; i++) {
    const x = pa.pre[i];
    const y = pb.pre[i];
    if (x === undefined) return -1; // shorter prerelease set has lower precedence
    if (y === undefined) return 1;

    const xNum = /^\d+$/.test(x);
    const yNum = /^\d+$/.test(y);
    if (xNum && yNum) {
      const dx = Number(x);
      const dy = Number(y);
      if (dx !== dy) return dx > dy ? 1 : -1;
    } else if (xNum !== yNum) {
      return xNum ? -1 : 1; // numeric identifiers rank below alphanumeric
    } else if (x !== y) {
      return x > y ? 1 : -1;
    }
  }
  return 0;
}

/**
 * Decide what to do given current/latest versions and the install channel.
 * The mechanism follows how the copy was installed so we never self-replace a
 * package-managed install or a source checkout.
 */
export function decideUpdate(input: {
  currentVersion: string;
  latestVersion: string;
  channel: InstallChannel;
}): UpdateDecision {
  const { currentVersion, latestVersion, channel } = input;
  const base = { currentVersion, latestVersion, channel };

  if (compareVersions(latestVersion, currentVersion) <= 0) {
    return {
      ...base,
      updateAvailable: false,
      action: "none",
      reason: "Already on the latest version.",
    };
  }

  switch (channel) {
    case "direct":
      return {
        ...base,
        updateAvailable: true,
        action: "self-update",
        reason: "A signed update can be installed in place.",
      };
    case "winget":
      return {
        ...base,
        updateAvailable: true,
        action: "run-command",
        command: `winget upgrade --id ${WINGET_PACKAGE_ID}`,
        reason: "Update available through winget.",
      };
    case "homebrew":
      return {
        ...base,
        updateAvailable: true,
        action: "run-command",
        command: `brew upgrade --cask ${HOMEBREW_CASK}`,
        reason: "Update available through Homebrew.",
      };
    default:
      return {
        ...base,
        updateAvailable: true,
        action: "inform",
        command: "git pull && npm install && npm run build",
        reason: "Developer install — update from source.",
      };
  }
}
