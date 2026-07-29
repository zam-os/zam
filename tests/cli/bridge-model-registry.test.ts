import { execFile } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { InstallConfig } from "../../src/kernel/index.js";

const execFileAsync = promisify(execFile);

/**
 * Exercises the `zam bridge model-*` surface end-to-end against the built CLI,
 * using a tiny local `/v1/models` server so the capability probe reaches a real
 * endpoint. Requires `npm run build` (uses dist/cli/index.js), like the other
 * bridge subprocess suites. Calls are async so the in-process mock server can
 * serve the subprocess's probe (a blocking exec would freeze this event loop).
 */
describe("bridge model-* registry commands", () => {
  let tempHome: string;
  let configPath: string;
  let cliPath: string;
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-model-"));
    configPath = join(tempHome, "config.json");
    cliPath = join(process.cwd(), "dist", "cli", "index.js");

    server = createServer((req, res) => {
      if (req.url === "/v1/models") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ data: [{ id: "gemma4-it:e4b" }] }));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (address && typeof address === "object") {
      baseUrl = `http://127.0.0.1:${address.port}/v1`;
    }
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(tempHome, { recursive: true, force: true });
  });

  async function runBridge(args: string[]): Promise<{ parsed: unknown }> {
    const env = {
      ...process.env,
      USERPROFILE: tempHome,
      HOME: tempHome,
      ZAM_CONFIG_PATH: configPath,
    };
    let stdout = "";
    try {
      const result = await execFileAsync("node", [cliPath, "bridge", ...args], {
        env,
      });
      stdout = result.stdout;
    } catch (err) {
      stdout = (err as { stdout?: string }).stdout ?? "";
    }
    const start = stdout.indexOf("{");
    return { parsed: start >= 0 ? JSON.parse(stdout.slice(start)) : undefined };
  }

  function readConfig(): InstallConfig {
    if (!existsSync(configPath)) return {};
    return JSON.parse(readFileSync(configPath, "utf-8")) as InstallConfig;
  }

  it("upserts a reachable text model and persists detected capabilities", async () => {
    const res = (await runBridge([
      "model-upsert",
      "--label",
      "Foundry Gemma",
      "--url",
      baseUrl,
      "--model",
      "gemma4-it:e4b",
      "--capabilities",
      JSON.stringify({ text: true, image: true }),
    ])) as { parsed: { ok: boolean; model: Record<string, unknown> } };

    expect(res.parsed.ok).toBe(true);
    const model = res.parsed.model as {
      capabilities: Record<string, boolean>;
      detectedCapabilities: Record<string, boolean>;
      probedAt?: string;
    };
    // The model is not multimodal, so image is auto-unchecked on save.
    expect(model.capabilities).toMatchObject({ text: true, image: false });
    expect(model.detectedCapabilities.text).toBe(true);
    expect(model.probedAt).toBeTruthy();

    expect(readConfig().ai?.models).toHaveLength(1);
  });

  it("blocks a save when the endpoint is unreachable", async () => {
    const res = (await runBridge([
      "model-upsert",
      "--url",
      "http://127.0.0.1:1/v1",
      "--model",
      "whatever",
      "--capabilities",
      JSON.stringify({ text: true }),
    ])) as { parsed: { error?: string } };
    expect(res.parsed.error).toMatch(/unreachable/i);
    // Nothing was persisted.
    expect(readConfig().ai?.models ?? []).toHaveLength(0);
  });

  it("sets capabilities within the detected ceiling without re-probing", async () => {
    const created = (await runBridge([
      "model-upsert",
      "--label",
      "Gemma",
      "--url",
      baseUrl,
      "--model",
      "gemma4-it:e4b",
      "--capabilities",
      JSON.stringify({ text: true }),
    ])) as { parsed: { model: { id: string } } };
    const id = created.parsed.model.id;

    // Enabling an undetected capability (image) is rejected by the ceiling,
    // while disabling a detected one (text) is honored.
    const updated = (await runBridge([
      "model-set-capabilities",
      "--id",
      id,
      "--capabilities",
      JSON.stringify({ text: false, image: true }),
    ])) as { parsed: { model: { capabilities: Record<string, boolean> } } };
    expect(updated.parsed.model.capabilities).toMatchObject({
      text: false,
      image: false,
    });
  });

  it("lists, reorders, and removes registry entries", async () => {
    const a = (await runBridge([
      "model-upsert",
      "--label",
      "A",
      "--url",
      baseUrl,
      "--model",
      "gemma4-it:e4b",
      "--capabilities",
      JSON.stringify({ text: true }),
    ])) as { parsed: { model: { id: string } } };
    const b = (await runBridge([
      "model-upsert",
      "--label",
      "B",
      "--url",
      baseUrl,
      "--model",
      "gemma4-it:e4b",
      "--capabilities",
      JSON.stringify({ text: true }),
    ])) as { parsed: { model: { id: string } } };
    const idA = a.parsed.model.id;
    const idB = b.parsed.model.id;

    const listed = (await runBridge(["model-list"])) as {
      parsed: { models: Array<{ id: string; order: number }> };
    };
    expect(listed.parsed.models.map((m) => m.id)).toEqual([idA, idB]);

    const reordered = (await runBridge([
      "model-reorder",
      "--ids",
      JSON.stringify([idB, idA]),
    ])) as { parsed: { models: Array<{ id: string; order: number }> } };
    expect(reordered.parsed.models.map((m) => m.id)).toEqual([idB, idA]);
    expect(reordered.parsed.models.map((m) => m.order)).toEqual([0, 1]);

    const removed = (await runBridge(["model-remove", "--id", idB])) as {
      parsed: { ok: boolean; models: Array<{ id: string; order: number }> };
    };
    expect(removed.parsed.ok).toBe(true);
    expect(removed.parsed.models.map((m) => m.id)).toEqual([idA]);
    expect(removed.parsed.models[0].order).toBe(0);
  });

  it("upserts an agent-transport model without an HTTP endpoint", async () => {
    // ADR 2026-07-12a: agent entries have no URL; the harness is the "endpoint".
    // Probe availability depends on whether `claude` is on PATH in this env —
    // the registry always persists the row either way.
    const res = (await runBridge([
      "model-upsert",
      "--transport",
      "agent",
      "--agent-harness",
      "claude-code",
      "--label",
      "Claude Code",
      "--capabilities",
      JSON.stringify({ text: true }),
    ])) as {
      parsed: {
        ok?: boolean;
        error?: string;
        model?: {
          id: string;
          transport: string;
          agentHarness: string;
          label: string;
          capabilities: Record<string, boolean>;
          model: string;
        };
      };
    };

    expect(res.parsed.error).toBeUndefined();
    expect(res.parsed.ok).toBe(true);
    expect(res.parsed.model).toMatchObject({
      transport: "agent",
      agentHarness: "claude-code",
      label: "Claude Code",
      // Cheap default for Claude Code (Haiku class).
      model: "haiku",
      capabilities: expect.objectContaining({ text: true }),
    });

    const listed = (await runBridge(["model-list"])) as {
      parsed: {
        models: Array<{
          id: string;
          transport: string;
          agentHarness?: string;
        }>;
      };
    };
    expect(listed.parsed.models.some((m) => m.transport === "agent")).toBe(
      true,
    );
    expect(readConfig().ai?.models?.[0]).toMatchObject({
      transport: "agent",
      agentHarness: "claude-code",
    });
  });

  it("updates the same agent entry instead of appending a duplicate", async () => {
    // The add forms have no id to send, so a re-click (or a retry while the
    // probe was still running) used to append another identical row -- one
    // add attempt left three "Claude Code · haiku" entries in the registry.
    const args = [
      "model-upsert",
      "--transport",
      "agent",
      "--agent-harness",
      "claude-code",
      "--label",
      "Claude Code",
      "--capabilities",
      JSON.stringify({ text: true }),
    ];
    const first = (await runBridge(args)) as {
      parsed: { ok?: boolean; created?: boolean; model?: { id: string } };
    };
    const second = (await runBridge(args)) as {
      parsed: { ok?: boolean; created?: boolean; model?: { id: string } };
    };
    const third = (await runBridge([...args, "--label", "Renamed"])) as {
      parsed: { ok?: boolean; model?: { id: string; label: string } };
    };

    expect(first.parsed.created).toBe(true);
    expect(second.parsed.created).toBe(false);
    // Same registry row throughout, and a later label edits it in place.
    expect(second.parsed.model?.id).toBe(first.parsed.model?.id);
    expect(third.parsed.model?.id).toBe(first.parsed.model?.id);
    expect(third.parsed.model?.label).toBe("Renamed");

    const models = readConfig().ai?.models ?? [];
    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({
      transport: "agent",
      agentHarness: "claude-code",
      model: "haiku",
      order: 0,
    });
  });

  it("keeps a second model on the same harness as its own entry", async () => {
    // Deduplication is per (harness, model id) -- two models from one harness
    // are two genuine registry rows, not a duplicate.
    const base = [
      "model-upsert",
      "--transport",
      "agent",
      "--agent-harness",
      "claude-code",
      "--capabilities",
      JSON.stringify({ text: true }),
    ];
    await runBridge([...base, "--label", "Claude Code", "--model", "haiku"]);
    await runBridge([
      ...base,
      "--label",
      "Claude Code Opus",
      "--model",
      "opus",
    ]);

    const models = readConfig().ai?.models ?? [];
    expect(models.map((m) => m.model)).toEqual(["haiku", "opus"]);
    expect(models.map((m) => m.order)).toEqual([0, 1]);
  });

  it("rejects agent upsert for a harness without an outbound adapter", async () => {
    const res = (await runBridge([
      "model-upsert",
      "--transport",
      "agent",
      "--agent-harness",
      "unknown-harness",
      "--label",
      "unknown-harness",
    ])) as { parsed: { error?: string } };
    expect(res.parsed.error).toMatch(/no agent-text adapter/i);
    expect(readConfig().ai?.models ?? []).toHaveLength(0);
  });

  it("upserts an antigravity agent model with image capability when agy is present", async () => {
    const res = (await runBridge([
      "model-upsert",
      "--transport",
      "agent",
      "--agent-harness",
      "antigravity",
      "--label",
      "Antigravity",
      "--capabilities",
      JSON.stringify({ text: true, image: true }),
    ])) as {
      parsed: {
        ok?: boolean;
        error?: string;
        model?: {
          transport: string;
          agentHarness: string;
          capabilities: Record<string, boolean>;
          detectedCapabilities: Record<string, boolean>;
        };
      };
    };

    expect(res.parsed.error).toBeUndefined();
    expect(res.parsed.ok).toBe(true);
    expect(res.parsed.model).toMatchObject({
      transport: "agent",
      agentHarness: "antigravity",
      capabilities: expect.objectContaining({ text: true }),
    });
    // Image is offered only when the adapter declares it; detection follows
    // whether `agy` is on PATH in this environment.
    expect(res.parsed.model?.capabilities.image).toBe(true);
  });

  it("updates an agent model in place when --id is passed", async () => {
    // Settings' agent form edits through --id (issue #224): changing the model
    // or effort must update the row, not append a rival at the same order.
    const created = (await runBridge([
      "model-upsert",
      "--transport",
      "agent",
      "--agent-harness",
      "copilot",
      "--label",
      "Copilot",
      "--effort",
      "high",
    ])) as { parsed: { model?: { id: string; effort?: string } } };
    const id = created.parsed.model?.id;
    expect(id).toBeTruthy();
    expect(created.parsed.model?.effort).toBe("high");

    const edited = (await runBridge([
      "model-upsert",
      "--id",
      String(id),
      "--transport",
      "agent",
      "--agent-harness",
      "copilot",
      "--label",
      "Copilot",
      "--model",
      "gpt-5-mini",
      "--effort",
      "low",
    ])) as {
      parsed: { ok?: boolean; model?: { id: string; model: string; effort?: string } };
    };
    expect(edited.parsed.ok).toBe(true);
    expect(edited.parsed.model?.id).toBe(id);
    expect(edited.parsed.model?.model).toBe("gpt-5-mini");
    expect(edited.parsed.model?.effort).toBe("low");
    // Still one row — the edit replaced it rather than adding a duplicate.
    expect(readConfig().ai?.models ?? []).toHaveLength(1);

    // "auto" clears a stored override so the adapter heuristic applies again.
    const cleared = (await runBridge([
      "model-upsert",
      "--id",
      String(id),
      "--transport",
      "agent",
      "--agent-harness",
      "copilot",
      "--effort",
      "auto",
    ])) as { parsed: { model?: { effort?: string } } };
    expect(cleared.parsed.model?.effort).toBeUndefined();
    expect(readConfig().ai?.models?.[0]?.effort).toBeUndefined();
    // Clearing effort must not disturb the model id chosen in the edit above.
    expect(readConfig().ai?.models?.[0]?.model).toBe("gpt-5-mini");
  });

  it("migrates legacy providers/roles into ai.models on first model-list", async () => {
    // Seed a legacy machine config, then read the registry.
    const legacy: InstallConfig = {
      ai: {
        providers: {
          localFoundry: {
            label: "Foundry",
            url: baseUrl,
            model: "gemma4-it:e4b",
            local: true,
          },
        },
        roles: { recall: { primary: "localFoundry" } },
      },
    };
    writeFileSync(configPath, JSON.stringify(legacy));

    const listed = (await runBridge(["model-list"])) as {
      parsed: {
        models: Array<{ label: string; capabilities: Record<string, boolean> }>;
      };
    };
    expect(listed.parsed.models).toHaveLength(1);
    expect(listed.parsed.models[0].label).toBe("Foundry");
    expect(listed.parsed.models[0].capabilities.text).toBe(true);

    // The migration is persisted.
    expect(readConfig().ai?.models).toHaveLength(1);
  });
});
