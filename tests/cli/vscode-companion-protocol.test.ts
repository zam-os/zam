import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type UiIntentApp,
  writeUiIntent,
} from "../../src/cli/ui-intent.js";
import { createLatestTaskQueue } from "../../src/vscode-extension/latest-task-queue.js";
import {
  buildOpeningArguments,
  COMPANION_APPS,
  createSamplingResult,
  describeServerVersionDrift,
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

  it("proxies the OKF knowledge-base panel with repo-scoped arguments", () => {
    // `zam_okf_visualize` has no `user` parameter — forwarding one would
    // violate the tool's input schema (0.13.0 live finding).
    expect(
      buildOpeningArguments("okf", {
        user: "thomas",
        bundle_dir: "C:/src/dw/Cops.AI/docs/okf",
        view: "graph",
        focus: "ignore-me",
      }),
    ).toEqual({
      bundle_dir: "C:/src/dw/Cops.AI/docs/okf",
      view: "graph",
    });
    expect(COMPANION_APPS.okf.toolName).toBe("zam_okf_visualize");
    // The reader records its focused article so chat agents can resolve
    // "import this okf", while the panel can refresh its read-only freshness
    // hints without reopening — both tools must be reachable from the panel.
    expect(COMPANION_APPS.okf.allowedTools.has("zam_okf_focus")).toBe(true);
    expect(COMPANION_APPS.okf.allowedTools.has("zam_okf_audit")).toBe(true);
  });

  it("serializes overlapping app mounts so the latest request wins", async () => {
    let markRecallStarted: () => void = () => {};
    let releaseRecall: () => void = () => {};
    const recallStarted = new Promise<void>((resolve) => {
      markRecallStarted = resolve;
    });
    const recallGate = new Promise<void>((resolve) => {
      releaseRecall = resolve;
    });
    const events: string[] = [];
    const render = createLatestTaskQueue(async (app: "recall" | "okf") => {
      events.push(`${app}:start`);
      if (app === "recall") {
        markRecallStarted();
        await recallGate;
      }
      events.push(`${app}:mounted`);
    });

    const recall = render("recall");
    await recallStarted;
    const okf = render("okf");
    releaseRecall();
    await Promise.all([recall, okf]);

    expect(events).toEqual([
      "recall:start",
      "recall:mounted",
      "okf:start",
      "okf:mounted",
    ]);
    expect(events.at(-1)).toBe("okf:mounted");
  });

  // Regression guard for the 0.13.0 gap: `zam_okf_visualize` published a UI
  // intent the extension's parser rejected, because `CompanionApp` lagged
  // behind `UiIntentApp`. Every intent the server can publish must be one
  // the Companion can consume — tested through the real producer.
  it("consumes every intent the ui-intent producer can publish", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zam-ui-intent-"));
    try {
      const apps: UiIntentApp[] = ["recall", "graph", "settings", "okf"];
      for (const app of apps) {
        const path = join(dir, `${app}.json`);
        await writeUiIntent(app, { bundle_dir: "docs/okf" }, { path });
        const parsed = parseCompanionIntent(
          JSON.parse(await readFile(path, "utf8")),
        );
        expect(parsed?.app).toBe(app);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
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

describe("describeServerVersionDrift", () => {
  it("returns null when the versions match", () => {
    expect(describeServerVersionDrift("0.15.1", "0.15.1")).toBeNull();
  });

  it("ignores prerelease/build suffixes when comparing the core", () => {
    expect(describeServerVersionDrift("0.15.1", "0.15.1-rc.1")).toBeNull();
  });

  it("flags a stale CLI (server older) with an npm fix command", () => {
    const drift = describeServerVersionDrift("0.15.1", "0.15.0");
    expect(drift?.kind).toBe("server-older");
    expect(drift?.updateCommand).toBe("npm install -g zam-core@0.15.1");
    expect(drift?.message).toContain("0.15.1");
    expect(drift?.message).toContain("0.15.0");
    expect(drift?.message).toContain("npm install -g zam-core@0.15.1");
  });

  it("orders by minor and major, not just patch", () => {
    expect(describeServerVersionDrift("0.16.0", "0.15.9")?.kind).toBe(
      "server-older",
    );
    expect(describeServerVersionDrift("1.0.0", "0.99.99")?.kind).toBe(
      "server-older",
    );
  });

  it("flags an outdated extension (server newer) without a CLI command", () => {
    const drift = describeServerVersionDrift("0.15.0", "0.15.1");
    expect(drift?.kind).toBe("server-newer");
    expect(drift?.updateCommand).toBeUndefined();
    expect(drift?.message).toContain("Update the ZAM Companion extension");
  });

  it("declines to warn when either version is unreadable", () => {
    // Dev/source builds carry the unreplaced placeholder.
    expect(describeServerVersionDrift("__ZAM_VERSION__", "0.15.0")).toBeNull();
    expect(describeServerVersionDrift("0.15.1", undefined)).toBeNull();
    expect(describeServerVersionDrift("0.15.1", "not-a-version")).toBeNull();
  });
});
