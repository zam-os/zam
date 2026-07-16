import { describe, expect, it } from "vitest";
import type {
  EvaluatorAdapter,
  EvaluatorAvailability,
  EvaluatorDisplayIdentity,
  EvaluatorTurnResult,
} from "../../src/vscode-extension/companion-evaluator.js";
import { EvaluatorUnavailableError } from "../../src/vscode-extension/companion-evaluator.js";
import {
  assertSamplingRoutableToVscodeLm,
  type CallToolResultLike,
  enrichCallToolResultForVscodeLm,
  unroutableVscodeLmReason,
} from "../../src/vscode-extension/companion-dispatch.js";

/**
 * Review findings 1/2 (ADR 2026-07-16 §Decision 2/5, 0.11.0). These are the
 * VS Code extension's dispatch boundary, tested here with a fake
 * EvaluatorAdapter instead of a real `vscode` extension host — see
 * companion-adapters.test.ts for the same pattern.
 */

function fakeAdapter(
  identity: EvaluatorDisplayIdentity,
): { adapter: EvaluatorAdapter; calls: { count: number } } {
  const calls = { count: 0 };
  const adapter: EvaluatorAdapter = {
    id: "vscode-lm",
    displayIdentity: async () => {
      calls.count += 1;
      return identity;
    },
    availability: (): EvaluatorAvailability => ({ available: true }),
    evaluateAnswer: async (): Promise<EvaluatorTurnResult> => ({
      model: "m1",
      text: "ok",
    }),
    followUp: async (): Promise<EvaluatorTurnResult> => ({
      model: "m1",
      text: "ok",
    }),
  };
  return { adapter, calls };
}

describe("assertSamplingRoutableToVscodeLm — finding 1", () => {
  it("allows an explicit vscode-lm selection through", () => {
    expect(() => assertSamplingRoutableToVscodeLm("vscode-lm")).not.toThrow();
  });

  it("allows no persisted selection through (defaults to vscode-lm)", () => {
    expect(() => assertSamplingRoutableToVscodeLm(undefined)).not.toThrow();
  });

  it("throws for quick-mode instead of silently using vscode-lm", () => {
    let thrown: unknown;
    try {
      assertSamplingRoutableToVscodeLm("quick-mode");
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(EvaluatorUnavailableError);
    expect((thrown as EvaluatorUnavailableError).evaluatorId).toBe("quick-mode");
    expect((thrown as Error).message).toMatch(/model-free by design/);
  });

  it("throws for a detached harness id, naming the harness in the reason", () => {
    let thrown: unknown;
    try {
      assertSamplingRoutableToVscodeLm("claude-code");
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(EvaluatorUnavailableError);
    expect((thrown as Error).message).toMatch(/Claude Code/);
    expect((thrown as Error).message).toMatch(/no MCP sampling relay/);
  });

  it("throws for every detached harness id", () => {
    for (const id of ["claude-code", "codex", "opencode", "goose"]) {
      expect(() => assertSamplingRoutableToVscodeLm(id)).toThrow(
        EvaluatorUnavailableError,
      );
    }
  });

  it("throws for native-mcp-host too — this connection IS the VS Code Companion", () => {
    expect(() => assertSamplingRoutableToVscodeLm("native-mcp-host")).toThrow(
      EvaluatorUnavailableError,
    );
    expect(unroutableVscodeLmReason("native-mcp-host")).toMatch(
      /VS Code language-model adapter/,
    );
  });
});

describe("enrichCallToolResultForVscodeLm — finding 2", () => {
  function resultWithCompanionContext(
    companionContext: unknown,
  ): CallToolResultLike {
    const payload = { companionContext };
    return {
      structuredContent: payload,
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    };
  }

  const routableVscodeLmRoute = {
    id: "vscode-lm",
    displayIdentity: { provider: "VS Code language models" },
    configured: true,
    routable: true,
    selected: true,
    active: true,
  };

  it("patches a routable vscode-lm route's displayIdentity in both structuredContent and content[0].text", async () => {
    const { adapter, calls } = fakeAdapter({
      provider: "Copilot",
      model: "Claude Sonnet 5",
    });
    const result = resultWithCompanionContext({
      evaluators: [routableVscodeLmRoute],
    });

    await enrichCallToolResultForVscodeLm(result, adapter);

    const structured = result.structuredContent as {
      companionContext: { evaluators: Array<{ displayIdentity: unknown }> };
    };
    expect(structured.companionContext.evaluators[0].displayIdentity).toEqual({
      provider: "Copilot",
      model: "Claude Sonnet 5",
    });
    const parsedText = JSON.parse(result.content![0].text as string) as {
      companionContext: { evaluators: Array<{ displayIdentity: unknown }> };
    };
    expect(parsedText.companionContext.evaluators[0].displayIdentity).toEqual({
      provider: "Copilot",
      model: "Claude Sonnet 5",
    });
    expect(calls.count).toBe(1); // one adapter call, reused for both positions
  });

  it("patches the zam_companion_context write shape (nested under `read`)", async () => {
    const { adapter } = fakeAdapter({ provider: "Copilot", model: "GPT-5" });
    const result: CallToolResultLike = {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            read: { evaluators: [routableVscodeLmRoute] },
            reloadRequired: true,
          }),
        },
      ],
    };

    await enrichCallToolResultForVscodeLm(result, adapter);

    const parsed = JSON.parse(result.content![0].text as string) as {
      read: { evaluators: Array<{ displayIdentity: unknown }> };
    };
    expect(parsed.read.evaluators[0].displayIdentity).toEqual({
      provider: "Copilot",
      model: "GPT-5",
    });
  });

  it("patches the zam_companion_context read shape (evaluators at the top level)", async () => {
    const { adapter } = fakeAdapter({ provider: "Copilot", model: "o1" });
    const result: CallToolResultLike = {
      content: [
        {
          type: "text",
          text: JSON.stringify({ evaluators: [routableVscodeLmRoute] }),
        },
      ],
    };

    await enrichCallToolResultForVscodeLm(result, adapter);

    const parsed = JSON.parse(result.content![0].text as string) as {
      evaluators: Array<{ displayIdentity: unknown }>;
    };
    expect(parsed.evaluators[0].displayIdentity).toEqual({
      provider: "Copilot",
      model: "o1",
    });
  });

  it("is a no-op when there is no companionContext at all", async () => {
    const { adapter, calls } = fakeAdapter({ provider: "Copilot" });
    const result: CallToolResultLike = {
      content: [{ type: "text", text: JSON.stringify({ due: [] }) }],
    };

    await enrichCallToolResultForVscodeLm(result, adapter);

    expect(result.content![0].text).toBe(JSON.stringify({ due: [] }));
    expect(calls.count).toBe(0);
  });

  it("is a no-op when the vscode-lm route is not routable (unaffected by finding 2)", async () => {
    const { adapter, calls } = fakeAdapter({ provider: "Copilot" });
    const result = resultWithCompanionContext({
      evaluators: [{ ...routableVscodeLmRoute, routable: false }],
    });

    await enrichCallToolResultForVscodeLm(result, adapter);

    expect(calls.count).toBe(0);
  });

  it("is a no-op on an error result", async () => {
    const { adapter, calls } = fakeAdapter({ provider: "Copilot" });
    const result: CallToolResultLike = {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({ evaluators: [routableVscodeLmRoute] }),
        },
      ],
    };

    await enrichCallToolResultForVscodeLm(result, adapter);

    expect(calls.count).toBe(0);
  });
});
