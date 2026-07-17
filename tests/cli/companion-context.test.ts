import { describe, expect, it } from "vitest";
import {
  attachCompanionUser,
  buildCompanionContext,
  isCompanionSurface,
  normalizeNativeHostIdentity,
  parseCompanionContextReadRequest,
  parseCompanionContextWriteRequest,
  type BuildCompanionContextInput,
  type CompanionUserState,
} from "../../src/vscode-extension/companion-context.js";
import { EvaluatorUnavailableError } from "../../src/vscode-extension/companion-evaluator.js";

describe("companion context surfaces", () => {
  it("recognizes exactly the five shared-header surfaces", () => {
    expect(isCompanionSurface("recall")).toBe(true);
    expect(isCompanionSurface("graph")).toBe(true);
    expect(isCompanionSurface("settings")).toBe(true);
    expect(isCompanionSurface("studio")).toBe(true);
    expect(isCompanionSurface("okf")).toBe(true);
    expect(isCompanionSurface("unknown")).toBe(false);
    expect(isCompanionSurface(undefined)).toBe(false);
  });
});

describe("companion context read/write parsing", () => {
  it("parses a minimal read request with backward-compatible defaults", () => {
    expect(parseCompanionContextReadRequest({ surface: "recall" })).toEqual({
      surface: "recall",
      clientInfo: undefined,
      harnessOverride: undefined,
    });
  });

  it("parses a read request carrying native clientInfo and a harness override", () => {
    expect(
      parseCompanionContextReadRequest({
        surface: "graph",
        clientInfo: { name: "vscode-zam-companion", version: "0.11.0" },
        harnessOverride: "codex",
      }),
    ).toEqual({
      surface: "graph",
      clientInfo: { name: "vscode-zam-companion", version: "0.11.0" },
      harnessOverride: "codex",
    });
  });

  it("rejects a read request with an invalid or missing surface", () => {
    expect(() => parseCompanionContextReadRequest({})).toThrow();
    expect(() =>
      parseCompanionContextReadRequest({ surface: "chat" }),
    ).toThrow();
    expect(() => parseCompanionContextReadRequest(null)).toThrow();
  });

  it("parses a write request touching only the fields the ADR allows", () => {
    expect(
      parseCompanionContextWriteRequest({
        surface: "settings",
        userId: "test-user-0.6.2",
      }),
    ).toEqual({
      surface: "settings",
      userId: "test-user-0.6.2",
      evaluatorId: undefined,
      collapsed: undefined,
    });
  });

  it("rejects a write request that changes nothing", () => {
    expect(() =>
      parseCompanionContextWriteRequest({ surface: "recall" }),
    ).toThrow(/userId, evaluatorId/);
  });

  it("rejects a write request naming an unknown evaluator id", () => {
    expect(() =>
      parseCompanionContextWriteRequest({
        surface: "recall",
        evaluatorId: "banana",
      }),
    ).toThrow(/Unknown evaluator id/);
    expect(
      parseCompanionContextWriteRequest({
        surface: "recall",
        evaluatorId: "vscode-lm",
      }).evaluatorId,
    ).toBe("vscode-lm");
  });
});

describe("native host identity normalization", () => {
  it("normalizes the Companion's own confirmed clientInfo name", () => {
    expect(
      normalizeNativeHostIdentity({
        name: "vscode-zam-companion",
        version: "0.11.0",
      }),
    ).toEqual({
      rawName: "vscode-zam-companion",
      version: "0.11.0",
      normalizedId: "vscode-companion",
      label: "VS Code Companion",
    });
  });

  it("keeps an unknown client's raw name instead of guessing", () => {
    expect(normalizeNativeHostIdentity({ name: "codex-desktop" })).toEqual({
      rawName: "codex-desktop",
      version: undefined,
      normalizedId: undefined,
      label: "codex-desktop",
    });
  });

  it("lets an explicit harness override win over clientInfo for launch presets/tests", () => {
    expect(
      normalizeNativeHostIdentity(
        { name: "some-test-harness" },
        "vscode-zam-companion",
      ),
    ).toEqual({
      rawName: "some-test-harness",
      version: undefined,
      normalizedId: "vscode-companion",
      label: "VS Code Companion",
    });
  });

  it("returns undefined when there is no client identity at all", () => {
    expect(normalizeNativeHostIdentity(undefined)).toBeUndefined();
  });
});

describe("user identity attached to every rating call", () => {
  it("carries the context's resolved user into the rating request", () => {
    const thomas: CompanionUserState = { currentId: "thomas", source: "persisted" };
    const testUser: CompanionUserState = {
      currentId: "test-user-0.6.2",
      source: "manual",
    };

    expect(attachCompanionUser(thomas, { cardId: "card-1", rating: 3 })).toEqual({
      user: "thomas",
      cardId: "card-1",
      rating: 3,
    });
    // The same call shape against a different resolved user carries that
    // user instead — nothing here defaults back to a shared/global user.
    expect(
      attachCompanionUser(testUser, { cardId: "card-1", rating: 3 }),
    ).toEqual({ user: "test-user-0.6.2", cardId: "card-1", rating: 3 });
  });

  it("refuses to submit a rating when no user is resolved", () => {
    const noUser: CompanionUserState = { source: "default" };
    expect(() => attachCompanionUser(noUser, { cardId: "card-1" })).toThrow(
      /resolved user/,
    );
  });
});

describe("buildCompanionContext", () => {
  const baseInput: BuildCompanionContextInput = {
    surface: "recall",
    userSelection: { fallback: "thomas" },
    evaluatorSelection: { fallback: "quick-mode" },
    evaluatorRouteInputs: [
      {
        id: "quick-mode",
        displayIdentity: { provider: "Quick mode — no agent" },
        configured: true,
        routable: true,
      },
      {
        id: "vscode-lm",
        displayIdentity: { provider: "Copilot", model: "Claude Sonnet 5" },
        configured: true,
        routable: true,
      },
      {
        id: "claude-code",
        displayIdentity: { provider: "Claude Code" },
        configured: true,
        routable: false,
        reason: "Claude Code has no MCP sampling relay in 0.11.0",
      },
    ],
    harnesses: [
      { id: "claude-code", label: "Claude Code", configured: true },
      { id: "goose", label: "goose", configured: false },
    ],
  };

  it("falls back to the legacy default user/evaluator with no other candidates (backward compatibility)", () => {
    const result = buildCompanionContext(baseInput);
    expect(result.read.user).toEqual({
      currentId: "thomas",
      persistedId: undefined,
      source: "default",
    });
    expect(result.read.selectedEvaluatorId).toBe("quick-mode");
    expect(result.read.activeEvaluatorId).toBe("quick-mode");
    expect(result.read.collapsed).toBe(false);
    expect(result.activeEvaluatorError).toBeUndefined();
  });

  it("keeps an invocation-scoped user/evaluator override out of the persisted preference", () => {
    const result = buildCompanionContext({
      ...baseInput,
      userSelection: {
        invocation: "test-user-0.6.2",
        persisted: "thomas",
        fallback: "thomas",
      },
      evaluatorSelection: {
        invocation: "vscode-lm",
        persisted: "quick-mode",
        fallback: "quick-mode",
      },
    });

    expect(result.read.user.currentId).toBe("test-user-0.6.2");
    expect(result.read.user.persistedId).toBe("thomas");
    expect(result.userSelection.sessionScoped).toBe(true);
    expect(result.evaluatorSelection.sessionScoped).toBe(true);
    // The persisted preference itself is reported unchanged — nothing here
    // has (or could have) overwritten it with the invocation value.
    expect(result.read.user.persistedId).not.toBe(result.read.user.currentId);
  });

  it("marks a selected-but-unroutable evaluator honestly instead of silently activating another one", () => {
    const result = buildCompanionContext({
      ...baseInput,
      evaluatorSelection: { manual: "claude-code", fallback: "quick-mode" },
    });

    expect(result.read.selectedEvaluatorId).toBe("claude-code");
    expect(result.read.activeEvaluatorId).toBeUndefined();
    expect(result.activeEvaluatorError).toBeInstanceOf(
      EvaluatorUnavailableError,
    );
    const claudeCode = result.read.evaluators.find(
      (route) => route.id === "claude-code",
    );
    expect(claudeCode).toMatchObject({ selected: true, active: false });
    // No other route was promoted to active as a substitute.
    expect(result.read.evaluators.every((route) => !route.active)).toBe(true);
  });

  it("passes through the configured harness inventory untouched", () => {
    const result = buildCompanionContext(baseInput);
    expect(result.read.harnesses).toEqual(baseInput.harnesses);
  });

  it("defaults learner profiles to an empty list for pre-Phase-2 callers (backward compatibility)", () => {
    const result = buildCompanionContext(baseInput);
    expect(result.read.profiles).toEqual([]);
  });

  it("passes through learner profiles untouched (0.11.0 Phase 2)", () => {
    const profiles = [
      { id: "thomas", cardCount: 121 },
      { id: "test-user-0.6.2", cardCount: 3 },
    ];
    const result = buildCompanionContext({ ...baseInput, profiles });
    expect(result.read.profiles).toEqual(profiles);
  });

  it("reports the collapsed state for only the current surface", () => {
    const result = buildCompanionContext({
      ...baseInput,
      surface: "graph",
      collapsed: { recall: true, graph: false },
    });
    expect(result.read.collapsed).toBe(false);

    const collapsedResult = buildCompanionContext({
      ...baseInput,
      collapsed: { recall: true },
    });
    expect(collapsedResult.read.collapsed).toBe(true);
  });
});
