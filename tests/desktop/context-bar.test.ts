import { describe, expect, it } from "vitest";
import {
  agentPillSummary,
  buildEvaluatorOptions,
  buildUserOptions,
  type CompanionContextBarState,
  fallbackContextBarState,
  formatAgentLabel,
  PendingConfirmGate,
  surfaceUsesEvaluator,
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

describe("surfaceUsesEvaluator", () => {
  it("hides evaluator controls on both read-only graph surfaces", () => {
    expect(surfaceUsesEvaluator("graph")).toBe(false);
    expect(surfaceUsesEvaluator("okf")).toBe(false);
    expect(surfaceUsesEvaluator("recall")).toBe(true);
    expect(surfaceUsesEvaluator("studio")).toBe(true);
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

  it("prepends a disabled, selected placeholder when no learner is resolved yet but profiles exist (finding 4)", () => {
    // A native <select> with no option marked `selected` implicitly selects
    // the first one — which would silently claim a learner the bar never
    // actually resolved. The placeholder keeps the display honest.
    const state = baseState({
      user: { source: "default" },
      profiles: [
        { id: "thomas", cardCount: 42 },
        { id: "test-user-0.6.2", cardCount: 3 },
      ],
    });
    const options = buildUserOptions(state);
    expect(options[0]).toMatchObject({
      value: "",
      disabled: true,
      selected: true,
    });
    // Every real profile stays present, unselected, and pickable.
    expect(options.filter((o) => o.value !== "").every((o) => !o.selected)).toBe(
      true,
    );
    expect(options.map((o) => o.value)).toEqual(["", "thomas", "test-user-0.6.2"]);
  });

  it("does not add a placeholder when no learner is resolved and no profiles exist either", () => {
    const state = baseState({ user: { source: "default" }, profiles: [] });
    const options = buildUserOptions(state);
    expect(options).toEqual([
      { value: "", text: "No learner", disabled: true, selected: true },
    ]);
  });
});

describe("PendingConfirmGate — confirm race (finding 5)", () => {
  it("resolves the first pending confirm with false when a second one supersedes it", async () => {
    // Mirrors mountContextBar's real call shape: the SAME cleanup callback
    // (there, `hideConfirm`) is passed on every start()/resolve() call — it
    // hides whatever inline confirm UI is currently showing, whichever
    // pill's change triggered it. This test doesn't need two different
    // callbacks to prove the race is fixed; it needs the first promise to
    // actually resolve, and the shared cleanup to run for each transition.
    const gate = new PendingConfirmGate();
    let hideCount = 0;
    const hide = () => {
      hideCount += 1;
    };

    const first = gate.start(hide);
    const second = gate.start(hide);

    // The first promise resolves false — the caller can revert its <select>
    // instead of hanging on a promise nothing would otherwise resolve.
    await expect(first).resolves.toBe(false);
    expect(hideCount).toBe(1); // ran once, when the second start() displaced it

    // The second confirm is still open and functional.
    gate.resolve(true, hide);
    await expect(second).resolves.toBe(true);
    expect(hideCount).toBe(2);
  });

  it("is a no-op to resolve with nothing pending", () => {
    const gate = new PendingConfirmGate();
    expect(() => gate.resolve(true)).not.toThrow();
  });

  it("resolves only once per start() — a second resolve() call is a no-op", async () => {
    const gate = new PendingConfirmGate();
    const pending = gate.start();
    gate.resolve(true);
    gate.resolve(false); // must not un-resolve or throw
    await expect(pending).resolves.toBe(true);
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
