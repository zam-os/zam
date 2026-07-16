import { describe, expect, it } from "vitest";
import {
  buildOpeningArguments,
  COMPANION_APPS,
  createSamplingResult,
  normalizeSamplingRequest,
  parseCompanionIntent,
  toolUiResourceUri,
} from "../../src/vscode-extension/protocol.js";

describe("VS Code companion protocol", () => {
  const now = Date.parse("2026-07-11T09:26:30.000Z");

  it("accepts a fresh purpose-built app intent", () => {
    expect(
      parseCompanionIntent(
        {
          version: 1,
          id: "01KX87ZQBE4QGDVJCBFX5PVWGW",
          app: "recall",
          input: { domain: "rag", ignored: 42 },
          createdAt: "2026-07-11T09:26:24.878Z",
        },
        now,
      ),
    ).toEqual({
      version: 1,
      id: "01KX87ZQBE4QGDVJCBFX5PVWGW",
      app: "recall",
      input: { domain: "rag" },
      createdAt: "2026-07-11T09:26:24.878Z",
    });
  });

  it("rejects stale and unknown intents", () => {
    expect(
      parseCompanionIntent(
        {
          version: 1,
          id: "old",
          app: "recall",
          input: {},
          createdAt: "2026-07-11T09:25:00.000Z",
        },
        now,
      ),
    ).toBeUndefined();
    expect(
      parseCompanionIntent(
        {
          version: 1,
          id: "studio",
          app: "studio",
          input: {},
          createdAt: "2026-07-11T09:26:24.878Z",
        },
        now,
      ),
    ).toBeUndefined();
  });

  it("keeps host arguments and tool access purpose-specific", () => {
    expect(
      buildOpeningArguments("recall", {
        user: "thomas",
        domain: "rag",
        focus: "ignore-me",
      }),
    ).toEqual({ user: "thomas", domain: "rag" });
    expect(COMPANION_APPS.recall.allowedTools).toEqual(
      new Set(["zam_get_reviews", "zam_submit_review", "zam_companion_context"]),
    );
    // The shared context bar (0.11.0 Phase 4) needs zam_companion_context
    // reachable from every proxied app.
    for (const app of Object.values(COMPANION_APPS)) {
      expect(app.allowedTools.has("zam_companion_context")).toBe(true);
    }
    expect(COMPANION_APPS).not.toHaveProperty("studio");
  });

  it("accepts current and legacy MCP Apps resource metadata", () => {
    expect(
      toolUiResourceUri({
        name: "current",
        inputSchema: { type: "object" },
        _meta: { ui: { resourceUri: "ui://zam/recall" } },
      }),
    ).toBe("ui://zam/recall");
    expect(
      toolUiResourceUri({
        name: "legacy",
        inputSchema: { type: "object" },
        _meta: { "ui/resourceUri": "ui://zam/graph" },
      }),
    ).toBe("ui://zam/graph");
  });

  it("normalizes MCP sampling text into VS Code model messages", () => {
    expect(
      normalizeSamplingRequest({
        systemPrompt: "Evaluate the learner, do not reveal chain of thought.",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Question and learner answer" },
              { type: "image", data: "ignored", mimeType: "image/png" },
            ],
          },
          {
            role: "assistant",
            content: { type: "text", text: "Prior feedback" },
          },
        ],
        maxTokens: 600,
      }),
    ).toEqual({
      messages: [
        {
          role: "user",
          text: "Evaluate the learner, do not reveal chain of thought.",
        },
        { role: "user", text: "Question and learner answer" },
        { role: "assistant", text: "Prior feedback" },
      ],
      maxTokens: 600,
    });
  });

  it("rejects unsupported tool sampling and builds a standard result", () => {
    expect(() =>
      normalizeSamplingRequest({
        messages: [{ role: "user", content: { type: "text", text: "hello" } }],
        tools: [{ name: "unsafe" }],
      }),
    ).toThrow(/tool/i);
    expect(createSamplingResult("copilot-model", "model reply")).toEqual({
      model: "copilot-model",
      role: "assistant",
      content: { type: "text", text: "model reply" },
      stopReason: "endTurn",
    });
  });
});
