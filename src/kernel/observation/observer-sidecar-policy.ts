/**
 * Bridge between the ObserverPolicy (Layer 2) and the native Rust observer
 * sidecar. The sidecar reads a kernel-written policy file at
 * `<observer-dir>/policy.json` instead of its own `ZAM_OBSERVER_PRIVACY_POLICY`
 * env var, so the headless `capture-ui` path and the live sidecar share one
 * source of truth. See docs/adr/0001-observer-permission-model.md (item 4).
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Database } from "../db/types.js";
import { type ObserverPolicy, resolveObserverPolicy } from "./policy.js";
import { getUiObserverDir } from "./ui-observer-io.js";

/** Filename, under the observer dir, that the Rust sidecar reads. */
export const SIDECAR_POLICY_FILE = "policy.json";

/**
 * The Rust observer's `WindowPrivacyPolicy` wire shape (serde camelCase). These
 * are only the user-configurable lists; the sidecar enforces its own
 * authoritative built-in sensitive set on top, exactly like the TS side.
 */
export interface SidecarPrivacyPolicy {
  allowProcesses: string[];
  denyProcesses: string[];
  denyTitleMarkers: string[];
}

/**
 * Pure mapping from an ObserverPolicy to the sidecar's `WindowPrivacyPolicy`.
 * A denylist term should block on process OR title, so it feeds both the
 * process and title-marker lists.
 */
export function toSidecarPrivacyPolicy(
  policy: ObserverPolicy,
): SidecarPrivacyPolicy {
  return {
    allowProcesses: [...policy.allowlist],
    denyProcesses: [...policy.denylist],
    denyTitleMarkers: [...policy.denylist],
  };
}

/**
 * Resolve the policy from settings and write the sidecar file. Returns the
 * path written and the serialized policy. The directory mirrors
 * `getUiObserverDir()`, which the Rust observer resolves identically
 * (`ZAM_OBSERVER_DIR`, else `~/.zam/observer`).
 */
export async function syncObserverSidecarPolicy(
  db: Database,
  dir: string = getUiObserverDir(),
): Promise<{ path: string; policy: SidecarPrivacyPolicy }> {
  const policy = toSidecarPrivacyPolicy(await resolveObserverPolicy(db));
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const path = join(dir, SIDECAR_POLICY_FILE);
  writeFileSync(path, `${JSON.stringify(policy, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  return { path, policy };
}
