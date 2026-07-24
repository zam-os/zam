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

  it("rejects agent upsert for a harness without an outbound adapter", async () => {
    const res = (await runBridge([
      "model-upsert",
      "--transport",
      "agent",
      "--agent-harness",
      "opencode",
      "--label",
      "opencode",
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
