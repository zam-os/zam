import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ensureMachineAiModelsMigrated,
  type MachineAiConfig,
  migrateMachineRolesToModels,
  saveMachineAiConfig,
} from "../../src/kernel/index.js";
import { loadInstallConfig } from "../../src/kernel/system/install-config.js";

describe("migrateMachineRolesToModels", () => {
  it("returns null when there is nothing to migrate", () => {
    expect(migrateMachineRolesToModels({})).toBeNull();
    expect(migrateMachineRolesToModels({ roles: {} })).toBeNull();
  });

  it("infers capabilities from role bindings and mirrors them into detected", () => {
    const ai: MachineAiConfig = {
      providers: {
        localFoundry: {
          label: "Foundry Gemma",
          url: "http://localhost:8000/v1",
          model: "gemma4-it:e4b",
          local: true,
        },
        claudeVision: {
          url: "https://api.anthropic.com",
          model: "claude-haiku-4-5",
          apiKeyRef: "anthropic",
        },
        embedder: {
          url: "http://localhost:11434/v1",
          model: "embeddinggemma",
        },
      },
      roles: {
        recall: { primary: "localFoundry" },
        vision: { primary: "claudeVision" },
        embedding: { primary: "embedder" },
      },
    };

    const models = migrateMachineRolesToModels(ai);
    expect(models).not.toBeNull();
    if (!models) return;

    const byLabel = Object.fromEntries(models.map((m) => [m.label, m]));

    // recall → text capability, local, chat-completions inferred.
    expect(byLabel["Foundry Gemma"]).toMatchObject({
      capabilities: expect.objectContaining({ text: true, image: false }),
      detectedCapabilities: expect.objectContaining({ text: true }),
      local: true,
      apiFlavor: "chat-completions",
    });
    // vision → image capability, anthropic flavor inferred from the URL.
    expect(byLabel.claudeVision).toMatchObject({
      capabilities: expect.objectContaining({ image: true, text: false }),
      apiFlavor: "anthropic-messages",
      apiKeyRef: "anthropic",
    });
    // embedding → embedding capability.
    expect(byLabel.embedder.capabilities.embedding).toBe(true);

    // detectedCapabilities mirrors capabilities until the first probe.
    for (const m of models) {
      expect(m.detectedCapabilities).toEqual(m.capabilities);
      expect(m.probedAt).toBeUndefined();
      expect(typeof m.id).toBe("string");
    }
  });

  it("unions capabilities when one provider serves several roles", () => {
    const models = migrateMachineRolesToModels({
      providers: { multi: { url: "http://localhost:8000/v1", model: "m" } },
      roles: {
        recall: { primary: "multi" },
        embedding: { primary: "multi" },
      },
    });
    expect(models).toHaveLength(1);
    expect(models?.[0].capabilities).toMatchObject({
      text: true,
      embedding: true,
      image: false,
    });
  });

  it("orders by role priority (primary, fallback) then appends unbound providers", () => {
    const models = migrateMachineRolesToModels({
      providers: {
        cloud: { url: "https://api.deepseek.com/v1", model: "d" },
        localA: { url: "http://localhost:8000/v1", model: "a", local: true },
        unbound: { url: "http://localhost:9000/v1", model: "u", local: true },
      },
      roles: {
        recall: { primary: "localA", fallback: "cloud" },
      },
    });
    expect(models?.map((m) => m.label)).toEqual(["localA", "cloud", "unbound"]);
    expect(models?.map((m) => m.order)).toEqual([0, 1, 2]);
    // The unbound provider carries no capabilities.
    const unbound = models?.find((m) => m.label === "unbound");
    expect(Object.values(unbound?.capabilities ?? {}).some(Boolean)).toBe(
      false,
    );
  });
});

describe("ensureMachineAiModelsMigrated", () => {
  let dir: string;
  let path: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-model-registry-"));
    path = join(dir, "config.json");
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes ai.models once and preserves legacy providers/roles", () => {
    saveMachineAiConfig(
      {
        providers: { localA: { url: "http://localhost:8000/v1", model: "a" } },
        roles: { recall: { primary: "localA" } },
      },
      path,
    );

    const models = ensureMachineAiModelsMigrated(path);
    expect(models).toHaveLength(1);
    expect(models[0].capabilities.text).toBe(true);

    const persisted = loadInstallConfig(path);
    expect(persisted.ai?.models).toHaveLength(1);
    // Legacy records are kept until the Phase 4 cleanup.
    expect(persisted.ai?.providers?.localA).toBeDefined();
    expect(persisted.ai?.roles?.recall?.primary).toBe("localA");
  });

  it("is a no-op when ai.models already exists", () => {
    saveMachineAiConfig(
      {
        models: [
          {
            id: "keep",
            label: "Existing",
            url: "http://localhost:8000/v1",
            model: "m",
            local: true,
            apiFlavor: "chat-completions",
            order: 0,
            capabilities: {
              text: true,
              embedding: false,
              image: false,
              video: false,
              stt: false,
              tts: false,
            },
            detectedCapabilities: {
              text: true,
              embedding: false,
              image: false,
              video: false,
              stt: false,
              tts: false,
            },
          },
        ],
        providers: { other: { url: "http://localhost:9000/v1", model: "x" } },
        roles: { recall: { primary: "other" } },
      },
      path,
    );

    const models = ensureMachineAiModelsMigrated(path);
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe("keep");
  });

  it("returns an empty registry when there is nothing to migrate", () => {
    saveMachineAiConfig({}, path);
    expect(ensureMachineAiModelsMigrated(path)).toEqual([]);
  });
});
