/**
 * Observer permission policy — Layer 2 of the two-layer consent model
 * (see docs/adr/0001-observer-permission-model.md).
 *
 * A host (the CLI permission system today, MCP tool-consent later) decides
 * WHETHER an agent may invoke the observer. This module decides WHAT a given
 * capture is then allowed to see — enforced by ZAM, because ZAM holds the
 * camera. The policy is user-configurable through `zam settings` (the
 * `observer.*` keys in `user_config`) and resolved here into a typed value with
 * safe defaults.
 *
 * The decision functions are pure so they can be unit-tested without a DB or a
 * live screen, and reused unchanged under a future `zam mcp serve`.
 */

import type { Database } from "../db/types.js";
import { getSetting } from "../models/settings.js";

export const OBSERVER_POLICY_VERSION = 1 as const;

export type ObserverScope = "off" | "window" | "fullscreen";
export type ObserverConsent = "per-capture" | "per-session" | "standing";
export type ObserverRetention = "none" | "session" | "persist";

export interface ObserverPolicy {
  version: typeof OBSERVER_POLICY_VERSION;
  /** "off" disables capture; "window" requires a target; "fullscreen" permits an untargeted grab. */
  scope: ObserverScope;
  /** Lower-cased process names permitted under window scope (empty = any non-denied window). */
  allowlist: string[];
  /** Lower-cased process/title fragments the user never wants captured (added to the built-in set). */
  denylist: string[];
  consent: ObserverConsent;
  retention: ObserverRetention;
  redactWindowTitles: boolean;
  audioOptIn: boolean;
}

export const DEFAULT_OBSERVER_POLICY: ObserverPolicy = {
  version: OBSERVER_POLICY_VERSION,
  scope: "window",
  allowlist: [],
  denylist: [],
  consent: "per-session",
  retention: "none",
  redactWindowTitles: true,
  audioOptIn: false,
};

/**
 * Built-in sensitive process/title fragments that are ALWAYS non-observable.
 * User config may extend the effective denylist but can never re-enable capture
 * of these — a user `allowlist` cannot override the built-in floor. Matching is
 * case-insensitive substring against process name and window title. This mirrors
 * a conservative subset of the native Rust observer's sensitive-context set.
 */
export const BUILT_IN_SENSITIVE_MATCHERS: readonly string[] = [
  // Password managers
  "1password",
  "bitwarden",
  "keepass",
  "lastpass",
  "dashlane",
  "nordpass",
  "enpass",
  "proton pass",
  // Authentication / credential / UAC surfaces
  "credentialuibroker",
  "consentux",
  "logonui",
  "windowssecurity",
  "authenticator",
  // Conservative banking/title hints
  "online banking",
  "onlinebanking",
];

export type ObserverSettingKey =
  | "observer.scope"
  | "observer.allowlist"
  | "observer.denylist"
  | "observer.consent"
  | "observer.retention"
  | "observer.redact_titles"
  | "observer.audio";

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

function parseScope(raw: string | undefined): ObserverScope {
  return raw === "off" || raw === "window" || raw === "fullscreen"
    ? raw
    : DEFAULT_OBSERVER_POLICY.scope;
}

function parseConsent(raw: string | undefined): ObserverConsent {
  return raw === "per-capture" || raw === "per-session" || raw === "standing"
    ? raw
    : DEFAULT_OBSERVER_POLICY.consent;
}

function parseRetention(raw: string | undefined): ObserverRetention {
  return raw === "none" || raw === "session" || raw === "persist"
    ? raw
    : DEFAULT_OBSERVER_POLICY.retention;
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw === "true";
}

/** Pure: build a policy from raw setting strings (no DB access). */
export function parseObserverPolicy(
  raw: Partial<Record<ObserverSettingKey, string>>,
): ObserverPolicy {
  return {
    version: OBSERVER_POLICY_VERSION,
    scope: parseScope(raw["observer.scope"]),
    allowlist: parseList(raw["observer.allowlist"]),
    denylist: parseList(raw["observer.denylist"]),
    consent: parseConsent(raw["observer.consent"]),
    retention: parseRetention(raw["observer.retention"]),
    redactWindowTitles: parseBool(
      raw["observer.redact_titles"],
      DEFAULT_OBSERVER_POLICY.redactWindowTitles,
    ),
    audioOptIn: parseBool(
      raw["observer.audio"],
      DEFAULT_OBSERVER_POLICY.audioOptIn,
    ),
  };
}

/** Read the policy from `user_config`, falling back to safe defaults. */
export async function resolveObserverPolicy(
  db: Database,
): Promise<ObserverPolicy> {
  const [scope, allowlist, denylist, consent, retention, redactTitles, audio] =
    await Promise.all([
      getSetting(db, "observer.scope"),
      getSetting(db, "observer.allowlist"),
      getSetting(db, "observer.denylist"),
      getSetting(db, "observer.consent"),
      getSetting(db, "observer.retention"),
      getSetting(db, "observer.redact_titles"),
      getSetting(db, "observer.audio"),
    ]);
  return parseObserverPolicy({
    "observer.scope": scope,
    "observer.allowlist": allowlist,
    "observer.denylist": denylist,
    "observer.consent": consent,
    "observer.retention": retention,
    "observer.redact_titles": redactTitles,
    "observer.audio": audio,
  });
}

// ── Capture decisions (pure) ────────────────────────────────────────────────

export type CaptureDenialReason =
  | "scope-off"
  | "scope-requires-target"
  | "denylisted"
  | "not-allowlisted"
  | "sensitive";

export type CaptureDecision =
  | { allowed: true }
  | { allowed: false; reason: string; denialReason: CaptureDenialReason };

export interface CaptureRequest {
  /** Whether the caller specified a concrete window target (--hwnd or --process-name). */
  hasExplicitTarget: boolean;
  /** The requested process name, if any (comparison is case-insensitive). */
  requestedProcessName: string | null;
}

export interface ResolvedCaptureTarget {
  /** printwindow | copyfromscreen | fullscreen | provided | screencapture-* */
  method: string;
  processName: string | null;
  windowTitle: string | null;
}

function haystacks(...values: Array<string | null | undefined>): string[] {
  return values
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .map((v) => v.toLowerCase());
}

function deny(
  reason: string,
  denialReason: CaptureDenialReason,
): CaptureDecision {
  return { allowed: false, reason, denialReason };
}

/** Built-in sensitive match (authoritative — user config cannot override). */
export function matchBuiltInSensitive(
  processName: string | null,
  windowTitle: string | null,
): string | null {
  const fields = haystacks(processName, windowTitle);
  for (const matcher of BUILT_IN_SENSITIVE_MATCHERS) {
    if (fields.some((field) => field.includes(matcher))) return matcher;
  }
  return null;
}

/** User-denylist match. */
export function matchDenylist(
  policy: ObserverPolicy,
  processName: string | null,
  windowTitle: string | null,
): string | null {
  const fields = haystacks(processName, windowTitle);
  for (const matcher of policy.denylist) {
    if (fields.some((field) => field.includes(matcher))) return matcher;
  }
  return null;
}

function inAllowlist(
  policy: ObserverPolicy,
  processName: string | null,
): boolean {
  if (policy.allowlist.length === 0) return true;
  if (!processName) return false;
  const name = processName.toLowerCase();
  return policy.allowlist.some((entry) => name.includes(entry));
}

/**
 * Phase 1 — decide before any pixels are grabbed, from scope plus the requested
 * target. Cheap denials (disabled observer, missing target, an explicitly named
 * sensitive/denied process) happen here so no screenshot is taken at all.
 */
export function decidePreCapture(
  policy: ObserverPolicy,
  request: CaptureRequest,
): CaptureDecision {
  if (policy.scope === "off") {
    return deny("observer is disabled (observer.scope=off)", "scope-off");
  }
  if (policy.scope === "window" && !request.hasExplicitTarget) {
    return deny(
      "window scope requires a target: pass --process-name or --hwnd, or set observer.scope=fullscreen",
      "scope-requires-target",
    );
  }
  const requested = request.requestedProcessName;
  if (requested) {
    const sensitive = matchBuiltInSensitive(requested, null);
    if (sensitive) {
      return deny(`refusing sensitive surface (${sensitive})`, "sensitive");
    }
    const denied = matchDenylist(policy, requested, null);
    if (denied) {
      return deny(`process is denylisted (${denied})`, "denylisted");
    }
    if (!inAllowlist(policy, requested)) {
      return deny(
        `process not in observer.allowlist (${requested.toLowerCase()})`,
        "not-allowlisted",
      );
    }
  }
  return { allowed: true };
}

/**
 * Phase 2 — decide after the window was resolved into a concrete target. This
 * is the first point where the real process/title are known, so the
 * sensitive/denylist check against the *actual* captured window happens here;
 * the caller discards the pixels if it fails.
 */
export function decidePostCapture(
  policy: ObserverPolicy,
  target: ResolvedCaptureTarget,
): CaptureDecision {
  const isFullscreen = target.method.toLowerCase().includes("fullscreen");
  if (policy.scope === "window" && isFullscreen) {
    return deny(
      "window scope but capture fell back to fullscreen (target window not resolved)",
      "scope-requires-target",
    );
  }
  const sensitive = matchBuiltInSensitive(
    target.processName,
    target.windowTitle,
  );
  if (sensitive) {
    return deny(`refusing sensitive surface (${sensitive})`, "sensitive");
  }
  const denied = matchDenylist(policy, target.processName, target.windowTitle);
  if (denied) {
    return deny(`captured window is denylisted (${denied})`, "denylisted");
  }
  if (policy.scope === "window" && !inAllowlist(policy, target.processName)) {
    return deny(
      `captured window not in observer.allowlist (${target.processName ?? "unknown"})`,
      "not-allowlisted",
    );
  }
  return { allowed: true };
}
