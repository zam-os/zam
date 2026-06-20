import { describe, expect, it } from "vitest";
import {
  DEFAULT_OBSERVER_POLICY,
  decidePostCapture,
  decidePreCapture,
  matchBuiltInSensitive,
  type ObserverPolicy,
  OBSERVER_POLICY_VERSION,
  parseObserverPolicy,
} from "../../../src/kernel/observation/policy.js";

function policy(overrides: Partial<ObserverPolicy> = {}): ObserverPolicy {
  return { ...DEFAULT_OBSERVER_POLICY, ...overrides };
}

describe("parseObserverPolicy", () => {
  it("returns safe defaults for empty input", () => {
    expect(parseObserverPolicy({})).toEqual(DEFAULT_OBSERVER_POLICY);
  });

  it("parses configured values", () => {
    const parsed = parseObserverPolicy({
      "observer.scope": "fullscreen",
      "observer.allowlist": "Calculator, notepad",
      "observer.denylist": "Signal,  Telegram ",
      "observer.consent": "standing",
      "observer.retention": "session",
      "observer.redact_titles": "false",
      "observer.audio": "true",
    });
    expect(parsed.version).toBe(OBSERVER_POLICY_VERSION);
    expect(parsed.scope).toBe("fullscreen");
    expect(parsed.allowlist).toEqual(["calculator", "notepad"]);
    expect(parsed.denylist).toEqual(["signal", "telegram"]);
    expect(parsed.consent).toBe("standing");
    expect(parsed.retention).toBe("session");
    expect(parsed.redactWindowTitles).toBe(false);
    expect(parsed.audioOptIn).toBe(true);
  });

  it("falls back to defaults for invalid enum values", () => {
    const parsed = parseObserverPolicy({
      "observer.scope": "everything",
      "observer.consent": "whenever",
      "observer.retention": "forever",
    });
    expect(parsed.scope).toBe(DEFAULT_OBSERVER_POLICY.scope);
    expect(parsed.consent).toBe(DEFAULT_OBSERVER_POLICY.consent);
    expect(parsed.retention).toBe(DEFAULT_OBSERVER_POLICY.retention);
  });
});

describe("decidePreCapture", () => {
  it("denies when the observer is disabled", () => {
    const d = decidePreCapture(policy({ scope: "off" }), {
      hasExplicitTarget: true,
      requestedProcessName: "notepad",
    });
    expect(d).toMatchObject({ allowed: false, denialReason: "scope-off" });
  });

  it("requires a target under window scope", () => {
    const d = decidePreCapture(policy({ scope: "window" }), {
      hasExplicitTarget: false,
      requestedProcessName: null,
    });
    expect(d).toMatchObject({
      allowed: false,
      denialReason: "scope-requires-target",
    });
  });

  it("allows a targeted window capture", () => {
    const d = decidePreCapture(policy({ scope: "window" }), {
      hasExplicitTarget: true,
      requestedProcessName: "notepad",
    });
    expect(d.allowed).toBe(true);
  });

  it("allows an untargeted fullscreen capture", () => {
    const d = decidePreCapture(policy({ scope: "fullscreen" }), {
      hasExplicitTarget: false,
      requestedProcessName: null,
    });
    expect(d.allowed).toBe(true);
  });

  it("refuses an explicitly requested sensitive process", () => {
    const d = decidePreCapture(policy({ scope: "window" }), {
      hasExplicitTarget: true,
      requestedProcessName: "1Password",
    });
    expect(d).toMatchObject({ allowed: false, denialReason: "sensitive" });
  });

  it("refuses a user-denylisted process", () => {
    const d = decidePreCapture(
      policy({ scope: "window", denylist: ["signal"] }),
      { hasExplicitTarget: true, requestedProcessName: "Signal" },
    );
    expect(d).toMatchObject({ allowed: false, denialReason: "denylisted" });
  });

  it("enforces a non-empty allowlist", () => {
    const d = decidePreCapture(
      policy({ scope: "window", allowlist: ["calculator"] }),
      { hasExplicitTarget: true, requestedProcessName: "notepad" },
    );
    expect(d).toMatchObject({
      allowed: false,
      denialReason: "not-allowlisted",
    });
  });

  it("does not enforce allowlist under fullscreen scope", () => {
    const d = decidePreCapture(
      policy({ scope: "fullscreen", allowlist: ["calculator"] }),
      { hasExplicitTarget: true, requestedProcessName: "notepad" },
    );
    expect(d.allowed).toBe(true);
  });
});

describe("decidePostCapture", () => {
  it("denies a window-scope capture that fell back to fullscreen", () => {
    const d = decidePostCapture(policy({ scope: "window" }), {
      method: "fullscreen",
      processName: null,
      windowTitle: null,
    });
    expect(d).toMatchObject({
      allowed: false,
      denialReason: "scope-requires-target",
    });
  });

  it("refuses a resolved sensitive window", () => {
    const d = decidePostCapture(policy({ scope: "window" }), {
      method: "printwindow",
      processName: "Bitwarden",
      windowTitle: "Vault",
    });
    expect(d).toMatchObject({ allowed: false, denialReason: "sensitive" });
  });

  it("detects sensitive surfaces by window title too", () => {
    const d = decidePostCapture(policy({ scope: "fullscreen" }), {
      method: "fullscreen",
      processName: "chrome",
      windowTitle: "My Bank — Online Banking",
    });
    expect(d).toMatchObject({ allowed: false, denialReason: "sensitive" });
  });

  it("allows a permitted resolved window", () => {
    const d = decidePostCapture(
      policy({ scope: "window", allowlist: ["calculator"] }),
      {
        method: "printwindow",
        processName: "Calculator",
        windowTitle: "Calculator",
      },
    );
    expect(d.allowed).toBe(true);
  });

  it("built-in sensitive set wins even when the user allowlists it", () => {
    // The load-bearing invariant: a user allowlist can never re-enable capture
    // of a built-in sensitive surface.
    const d = decidePostCapture(
      policy({ scope: "window", allowlist: ["1password"] }),
      {
        method: "printwindow",
        processName: "1Password",
        windowTitle: "1Password",
      },
    );
    expect(d).toMatchObject({ allowed: false, denialReason: "sensitive" });
  });
});

describe("matchBuiltInSensitive", () => {
  it("matches a known password manager", () => {
    expect(matchBuiltInSensitive("KeePassXC", null)).toBe("keepass");
  });

  it("returns null for an ordinary app", () => {
    expect(matchBuiltInSensitive("notepad", "Untitled")).toBeNull();
  });
});
