import { describe, expect, it } from "vitest";
import {
  activateSelectedEvaluator,
  buildEvaluatorRoutes,
  EvaluatorUnavailableError,
  formatEvaluatorLabel,
  type EvaluatorRouteInput,
} from "../../src/vscode-extension/companion-evaluator.js";

const ROUTES: EvaluatorRouteInput[] = [
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
  {
    id: "codex",
    displayIdentity: { provider: "Codex" },
    configured: false,
    routable: false,
    reason: "No MCP configuration found for Codex",
  },
];

describe("companion evaluator routes", () => {
  it("distinguishes configured, routable, and selected independently", () => {
    const routes = buildEvaluatorRoutes(ROUTES, "vscode-lm");

    const quickMode = routes.find((route) => route.id === "quick-mode");
    expect(quickMode).toMatchObject({
      configured: true,
      routable: true,
      selected: false,
      active: false,
    });

    const vscodeLm = routes.find((route) => route.id === "vscode-lm");
    expect(vscodeLm).toMatchObject({
      configured: true,
      routable: true,
      selected: true,
      active: false,
    });

    const claudeCode = routes.find((route) => route.id === "claude-code");
    expect(claudeCode).toMatchObject({
      configured: true,
      routable: false,
      selected: false,
      active: false,
      reason: "Claude Code has no MCP sampling relay in 0.11.0",
    });

    const codex = routes.find((route) => route.id === "codex");
    expect(codex).toMatchObject({
      configured: false,
      routable: false,
      selected: false,
    });
  });

  it("requires an availability reason for every unroutable entry", () => {
    expect(() =>
      buildEvaluatorRoutes([
        {
          id: "opencode",
          displayIdentity: { provider: "opencode" },
          configured: true,
          routable: false,
        },
      ]),
    ).toThrow(/reason/i);
  });

  it("marks the selected evaluator active once activation succeeds", () => {
    const routes = buildEvaluatorRoutes(ROUTES, "vscode-lm");
    const activated = activateSelectedEvaluator(routes, "vscode-lm");
    expect(activated).toMatchObject({ id: "vscode-lm", active: true });
  });

  it("fails a configured-but-unroutable selection WITHOUT falling back to another evaluator", () => {
    const routes = buildEvaluatorRoutes(ROUTES, "claude-code");

    let thrown: unknown;
    try {
      activateSelectedEvaluator(routes, "claude-code");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(EvaluatorUnavailableError);
    expect((thrown as EvaluatorUnavailableError).evaluatorId).toBe(
      "claude-code",
    );
    // No route in the list was mutated into "active" as a substitute.
    expect(routes.every((route) => !route.active)).toBe(true);
  });

  it("fails an unknown/unconfigured evaluator id the same way — not configured is not routable", () => {
    const routes = buildEvaluatorRoutes(ROUTES, "goose");
    expect(() => activateSelectedEvaluator(routes, "goose")).toThrow(
      EvaluatorUnavailableError,
    );
  });

  it("names the concrete provider and model, never a bare host name", () => {
    expect(
      formatEvaluatorLabel({ provider: "Copilot", model: "Claude Sonnet 5" }),
    ).toBe("Copilot: Claude Sonnet 5");
    expect(formatEvaluatorLabel({ provider: "Quick mode — no agent" })).toBe(
      "Quick mode — no agent",
    );
  });

  it("refuses a bare 'VS Code' or bare 'Claude' label", () => {
    expect(() => formatEvaluatorLabel({ provider: "VS Code" })).toThrow(
      /bare/i,
    );
    expect(() => formatEvaluatorLabel({ provider: "Claude" })).toThrow(
      /bare/i,
    );
    // The same provider is fine once a concrete model is attached.
    expect(
      formatEvaluatorLabel({ provider: "Claude", model: "Sonnet 5" }),
    ).toBe("Claude: Sonnet 5");
  });
});
