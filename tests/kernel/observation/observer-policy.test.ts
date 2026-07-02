import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "../../../src/kernel/db/connection.js";
import type { Database } from "../../../src/kernel/db/types.js";
import {
  DEFAULT_OBSERVER_POLICY,
  decidePostCapture,
  decidePreCapture,
  getDefaultsForSymbiosisMode,
  matchBuiltInSensitive,
  OBSERVER_POLICY_VERSION,
  type ObserverPolicy,
  parseObserverPolicy,
  resolveActiveSymbiosisMode,
  resolveObserverPolicy,
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

describe("symbiosis mode presets", () => {
  it("getDefaultsForSymbiosisMode returns correct presets", () => {
    expect(getDefaultsForSymbiosisMode("autonomy")).toEqual({
      scope: "fullscreen",
      consent: "standing",
    });
    expect(getDefaultsForSymbiosisMode("copilot")).toEqual({
      scope: "window",
      consent: "per-session",
    });
    expect(getDefaultsForSymbiosisMode("shadowing")).toEqual({
      scope: "window",
      consent: "per-session",
    });
  });

  describe("database-backed resolvers", () => {
    let db: Database;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-policy-test-"));
      db = await openDatabase({
        dbPath: join(tempDir, "zam-policy-test.db"),
        initialize: true,
      });
      // Set the default user setting
      await db
        .prepare(
          "INSERT INTO user_config (key, value) VALUES ('user.id', 'test-user')",
        )
        .run();
    });

    afterEach(async () => {
      await db.close();
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup
      }
    });

    async function seedToken(
      id: string,
      slug: string,
      domain: string,
      mode: string | null,
    ) {
      await db
        .prepare(`
        INSERT INTO tokens (id, slug, concept, domain, symbiosis_mode)
        VALUES (?, ?, ?, ?, ?)
      `)
        .run(id, slug, `Concept for ${slug}`, domain, mode);
    }

    async function seedCard(
      id: string,
      tokenId: string,
      reps: number,
      stability: number,
    ) {
      await db
        .prepare(`
        INSERT INTO cards (id, token_id, user_id, reps, stability)
        VALUES (?, ?, 'test-user', ?, ?)
      `)
        .run(id, tokenId, reps, stability);
    }

    async function seedReviewLog(
      id: string,
      cardId: string,
      tokenId: string,
      rating: number,
      reviewedAt: string,
    ) {
      await db
        .prepare(`
        INSERT INTO review_logs (id, card_id, token_id, user_id, rating, reviewed_at, scheduled_at)
        VALUES (?, ?, ?, 'test-user', ?, ?, datetime('now'))
      `)
        .run(id, cardId, tokenId, rating, reviewedAt);
    }

    async function seedSession(id: string, completedAt: string | null) {
      await db
        .prepare(`
        INSERT INTO sessions (id, user_id, task, started_at, completed_at)
        VALUES (?, 'test-user', 'Task', datetime('now'), ?)
      `)
        .run(id, completedAt);
    }

    async function seedSessionStep(
      id: string,
      sessionId: string,
      tokenId: string,
      createdAt: string,
    ) {
      await db
        .prepare(`
        INSERT INTO session_steps (id, session_id, token_id, done_by, created_at)
        VALUES (?, ?, ?, 'user', ?)
      `)
        .run(id, sessionId, tokenId, createdAt);
    }

    it("resolveActiveSymbiosisMode defaults to shadowing on empty database", async () => {
      const mode = await resolveActiveSymbiosisMode(db);
      expect(mode).toBe("shadowing");
    });

    it("resolveActiveSymbiosisMode resolves running session step token mode directly", async () => {
      await seedToken("t1", "slug1", "domain1", "autonomy");
      await seedSession("s1", null);
      await seedSessionStep("step1", "s1", "t1", "2026-06-20T12:00:00Z");

      const mode = await resolveActiveSymbiosisMode(db);
      expect(mode).toBe("autonomy");
    });

    it("resolveActiveSymbiosisMode resolves running session step domain competence suggestedMode", async () => {
      // Suggested Mode for autonomy requires avgStab > 30, retentionRate > 0.9
      await seedToken("t1", "slug1", "domain1", null);
      await seedCard("c1", "t1", 3, 35);
      await seedReviewLog("r1", "c1", "t1", 3, "2026-06-20T11:00:00Z");
      await seedSession("s1", null);
      await seedSessionStep("step1", "s1", "t1", "2026-06-20T12:00:00Z");

      const mode = await resolveActiveSymbiosisMode(db);
      expect(mode).toBe("autonomy");
    });

    it("resolveActiveSymbiosisMode falls back to review log token mode", async () => {
      // No active session
      await seedToken("t1", "slug1", "domain1", "copilot");
      await seedCard("c1", "t1", 1, 10);
      await seedReviewLog("r1", "c1", "t1", 3, "2026-06-20T11:00:00Z");

      const mode = await resolveActiveSymbiosisMode(db);
      expect(mode).toBe("copilot");
    });

    it("resolveActiveSymbiosisMode falls back to review log domain Suggested Mode", async () => {
      // No active session, token symbiosis_mode is null
      await seedToken("t1", "slug1", "domain1", null);
      await seedCard("c1", "t1", 3, 35);
      await seedReviewLog("r1", "c1", "t1", 4, "2026-06-20T11:00:00Z");

      const mode = await resolveActiveSymbiosisMode(db);
      expect(mode).toBe("autonomy");
    });

    it("resolveObserverPolicy defaults fall back to presets depending on resolved mode", async () => {
      // empty DB -> mode = shadowing -> defaults to scope="window", consent="per-session"
      let policy = await resolveObserverPolicy(db);
      expect(policy.scope).toBe("window");
      expect(policy.consent).toBe("per-session");

      // Set active session step -> mode = autonomy -> defaults to scope="fullscreen", consent="standing"
      await seedToken("t1", "slug1", "domain1", "autonomy");
      await seedSession("s1", null);
      await seedSessionStep("step1", "s1", "t1", "2026-06-20T12:00:00Z");

      policy = await resolveObserverPolicy(db);
      expect(policy.scope).toBe("fullscreen");
      expect(policy.consent).toBe("standing");
    });

    it("resolveObserverPolicy uses explicit user settings over active mode presets", async () => {
      // mode = autonomy -> default scope="fullscreen", consent="standing"
      await seedToken("t1", "slug1", "domain1", "autonomy");
      await seedSession("s1", null);
      await seedSessionStep("step1", "s1", "t1", "2026-06-20T12:00:00Z");

      // explicitly set scope to window
      await db
        .prepare(
          "INSERT INTO user_config (key, value) VALUES ('observer.scope', 'window')",
        )
        .run();

      const policy = await resolveObserverPolicy(db);
      expect(policy.scope).toBe("window"); // overridden by user_config
      expect(policy.consent).toBe("standing"); // still default preset
    });
  });
});
