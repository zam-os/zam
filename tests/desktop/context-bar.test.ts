import { describe, expect, it } from "vitest";
import {
  agentPillSummary,
  buildEvaluatorOptions,
  buildUserOptions,
  type CompanionContextBarState,
  fallbackContextBarState,
  formatAgentLabel,
  userPillTitle,
  userPillValue,
} from "../../desktop/src/panel/context-bar.js";

function baseState(
  overrides: Partial<CompanionContextBarState> = {},
): CompanionContextBarState {
  return {
    surface: "recall",
    user: { currentId: "thomas", source: "default" },
    profiles: [{ id: "thomas", cardCount: 42 }],
    evaluators: [
      {
        id: "quick-mode",
        displayIdentity: { provider: "Quick mode — no agent" },
        configured: true,
        routable: true,
        selected: true,
        active: true,
      },
    ],
    selectedEvaluatorId: "quick-mode",
    activeEvaluatorId: "quick-mode",
    collapsed: false,
    ...overrides,
  };
}

describe("formatAgentLabel", () => {
  it("joins provider and model", () => {
    expect(formatAgentLabel({ provider: "Copilot", model: "Claude Sonnet 5" })).toBe(
      "Copilot: Claude Sonnet 5",
    );
  });

  it("renders provider alone when there is no model", () => {
    expect(formatAgentLabel({ provider: "Quick mode — no agent" })).toBe(
      "Quick mode — no agent",
    );
  });

  it("degrades a bare dishonest provider instead of throwing", () => {
    // Unlike its source of truth (formatEvaluatorLabel in
    // src/vscode-extension/companion-evaluator.ts), the UI mirror never
    // throws on this shape — it is defense in depth, not the enforcement
    // point, and a UI must degrade rather than crash on unexpected data.
    expect(() => formatAgentLabel({ provider: "Claude" })).not.toThrow();
    expect(formatAgentLabel({ provider: "Claude" })).toBe("Claude");
  });
});

describe("userPillValue / userPillTitle", () => {
  it("marks a session-scoped invocation user visibly", () => {
    const user = { currentId: "test-user-0.6.2", source: "invocation" as const };
    expect(userPillValue(user)).toBe("test-user-0.6.2 (this session)");
    expect(userPillTitle(user)).toContain("this session only");
  });

  it("shows the plain id for a persisted/default/manual user", () => {
    expect(userPillValue({ currentId: "thomas", source: "persisted" })).toBe(
      "thomas",
    );
    expect(userPillValue({ currentId: "thomas", source: "default" })).toBe(
      "thomas",
    );
  });

  it("has a placeholder for no resolved user", () => {
    expect(userPillValue({ source: "default" })).toBe("—");
    expect(userPillTitle({ source: "default" })).toContain("No learner");
  });
});

describe("agentPillSummary", () => {
  it("shows the active evaluator's label when one is active", () => {
    const state = baseState({
      evaluators: [
        {
          id: "vscode-lm",
          displayIdentity: { provider: "Copilot", model: "Claude Sonnet 5" },
          configured: true,
          routable: true,
          selected: true,
          active: true,
        },
      ],
      selectedEvaluatorId: "vscode-lm",
      activeEvaluatorId: "vscode-lm",
    });
    expect(agentPillSummary(state)).toEqual({
      text: "Copilot: Claude Sonnet 5",
      unavailable: false,
    });
  });

  it("never silently falls back for a selected-but-unavailable evaluator", () => {
    const state = baseState({
      evaluators: [
        {
          id: "claude-code",
          displayIdentity: { provider: "Claude Code" },
          configured: true,
          routable: false,
          reason: "Claude Code has no MCP sampling relay in 0.11.0",
          selected: true,
          active: false,
        },
      ],
      selectedEvaluatorId: "claude-code",
      activeEvaluatorId: undefined,
    });
    const summary = agentPillSummary(state);
    expect(summary.unavailable).toBe(true);
    expect(summary.text).toContain("unavailable");
    expect(summary.title).toBe("Claude Code has no MCP sampling relay in 0.11.0");
  });

  it("names quick mode when nothing is selected or active", () => {
    const state = baseState({
      evaluators: [],
      selectedEvaluatorId: undefined,
      activeEvaluatorId: undefined,
    });
    expect(agentPillSummary(state)).toEqual({
      text: "Quick mode — no agent",
      unavailable: false,
    });
  });
});

describe("buildUserOptions", () => {
  it("keeps the current user even when it is missing from profiles", () => {
    const state = baseState({
      user: { currentId: "test-user-0.6.2", source: "invocation" },
      profiles: [{ id: "thomas", cardCount: 42 }],
    });
    const options = buildUserOptions(state);
    expect(options.map((o) => o.value)).toEqual(["test-user-0.6.2", "thomas"]);
    expect(options[0].selected).toBe(true);
    expect(options[0].text).toContain("this session");
  });

  it("marks the current profile selected among the rest", () => {
    const state = baseState({
      user: { currentId: "thomas", source: "default" },
      profiles: [
        { id: "thomas", cardCount: 42 },
        { id: "test-user-0.6.2", cardCount: 3 },
      ],
    });
    const options = buildUserOptions(state);
    expect(options.find((o) => o.value === "thomas")?.selected).toBe(true);
    expect(options.find((o) => o.value === "test-user-0.6.2")?.selected).toBe(
      false,
    );
  });
});

describe("buildEvaluatorOptions", () => {
  it("disables an unroutable evaluator and keeps its reason visible", () => {
    const state = baseState({
      evaluators: [
        {
          id: "quick-mode",
          displayIdentity: { provider: "Quick mode — no agent" },
          configured: true,
          routable: true,
          selected: false,
          active: false,
        },
        {
          id: "codex",
          displayIdentity: { provider: "Codex" },
          configured: true,
          routable: false,
          reason: "Codex has no MCP sampling relay in 0.11.0",
          selected: true,
          active: false,
        },
      ],
      selectedEvaluatorId: "codex",
      activeEvaluatorId: undefined,
    });
    const options = buildEvaluatorOptions(state);
    const codex = options.find((o) => o.value === "codex");
    expect(codex?.disabled).toBe(true);
    expect(codex?.selected).toBe(true);
    expect(codex?.text).toContain("unavailable");
    expect(codex?.title).toBe("Codex has no MCP sampling relay in 0.11.0");
    const quick = options.find((o) => o.value === "quick-mode");
    expect(quick?.disabled).toBe(false);
    expect(quick?.text).toBe("Quick mode — no agent");
  });
});

describe("fallbackContextBarState", () => {
  it("degrades to quick mode with no companionContext on the wire", () => {
    const state = fallbackContextBarState("graph", "thomas");
    expect(state.user.currentId).toBe("thomas");
    expect(state.activeEvaluatorId).toBe("quick-mode");
    expect(state.evaluators).toHaveLength(1);
  });

  it("tolerates no resolved user at all", () => {
    const state = fallbackContextBarState("settings", null);
    expect(state.user.currentId).toBeUndefined();
    expect(state.profiles).toEqual([]);
  });
});
