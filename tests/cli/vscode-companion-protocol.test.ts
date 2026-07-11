import { describe, expect, it } from "vitest";
import {
  buildOpeningArguments,
  COMPANION_APPS,
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
      new Set(["zam_get_reviews", "zam_submit_review"]),
    );
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
});
