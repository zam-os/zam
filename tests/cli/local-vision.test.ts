import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  getMachineAiModels,
  getSetting,
  openDatabase,
  saveMachineAiModels,
} from "../../src/kernel/index.js";
import { OLLAMA_BASE_URL } from "../../src/cli/llm/local-embedding.js";
import {
  DEFAULT_LOCAL_VISION_MODEL,
  enableLocalVision,
  getLocalVisionStatus,
  type LocalVisionDeps,
} from "../../src/cli/llm/local-vision.js";

describe("local vision enhancement", () => {
  let db: Database;
  let tempDir: string;
  let previousConfigPath: string | undefined;
  let pulls: string[];

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-local-vision-"));
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(tempDir, "config.json");
    pulls = [];
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    if (previousConfigPath === undefined) {
      delete process.env.ZAM_CONFIG_PATH;
    } else {
      process.env.ZAM_CONFIG_PATH = previousConfigPath;
    }
    try {
      rmSync(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 50,
      });
    } catch {
      // Best-effort cleanup
    }
  });

  function deps(overrides: Partial<LocalVisionDeps> = {}): LocalVisionDeps {
    return {
      isInstalled: () => true,
      isOnline: async () => true,
      listModels: async () => [DEFAULT_LOCAL_VISION_MODEL],
      pullModel: (model) => {
        pulls.push(model);
      },
      probe: async () => ({
        reachable: true,
        catalog: [DEFAULT_LOCAL_VISION_MODEL],
        detected: {
          text: true,
          embedding: false,
          image: true,
          video: false,
          stt: false,
          tts: false,
        },
      }),
      ...overrides,
    };
  }

  it("reports the missing-Ollama state without installing anything", async () => {
    const result = await enableLocalVision(
      db,
      deps({ isInstalled: () => false }),
    );

    expect(result.ok).toBe(false);
    expect(result.needsOllama).toBe(true);
    expect(result.error).toContain("ollama.com");
    expect(pulls).toHaveLength(0);
    expect(getMachineAiModels()).toHaveLength(0);
  });

  it("reports a stopped server instead of auto-starting it", async () => {
    const result = await enableLocalVision(
      db,
      deps({ isOnline: async () => false }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain("not running");
    expect(pulls).toHaveLength(0);
  });

  it("pulls Qwen3-VL only when it is absent", async () => {
    const withModel = await enableLocalVision(db, deps());
    expect(withModel.ok).toBe(true);
    expect(withModel.pulled).toBe(false);
    expect(pulls).toHaveLength(0);

    const withoutModel = await enableLocalVision(
      db,
      deps({ listModels: async () => ["qwen3.5:4b"] }),
    );
    expect(withoutModel.ok).toBe(true);
    expect(withoutModel.pulled).toBe(true);
    expect(pulls).toEqual([DEFAULT_LOCAL_VISION_MODEL]);
  });

  it("surfaces a pull failure without saving a registry entry", async () => {
    const result = await enableLocalVision(
      db,
      deps({
        listModels: async () => [],
        pullModel: () => {
          throw new Error("disk full");
        },
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain("disk full");
    expect(getMachineAiModels()).toHaveLength(0);
    expect(await getSetting(db, "llm.vision.enabled")).not.toBe("true");
  });

  it("registers Qwen3-VL first and disables the stale Foundry vision entry", async () => {
    saveMachineAiModels([
      {
        id: "old-foundry-vision",
        label: "Foundry Local Vision",
        url: "http://127.0.0.1:5273/v1",
        model: "qwen3-vl-4b-instruct-generic-cpu",
        local: true,
        apiFlavor: "chat-completions",
        runner: "foundry",
        order: 0,
        capabilities: {
          text: false,
          embedding: false,
          image: true,
          video: false,
          stt: false,
          tts: false,
        },
        detectedCapabilities: {
          text: true,
          embedding: false,
          image: true,
          video: false,
          stt: false,
          tts: false,
        },
      },
    ]);

    const result = await enableLocalVision(db, deps());
    expect(result.ok).toBe(true);

    const models = getMachineAiModels();
    expect(models).toHaveLength(2);
    expect(models[0]).toMatchObject({
      url: OLLAMA_BASE_URL,
      model: DEFAULT_LOCAL_VISION_MODEL,
      local: true,
      runner: "ollama",
      order: 0,
    });
    expect(models[0].capabilities.image).toBe(true);
    expect(models[0].detectedCapabilities.image).toBe(true);
    expect(models[1].label).toBe("Foundry Local Vision");
    expect(models[1].capabilities.image).toBe(false);
    expect(await getSetting(db, "llm.vision.enabled")).toBe("true");
  });

  it("is idempotent and reports a usable local vision path", async () => {
    await enableLocalVision(db, deps());
    const [first] = getMachineAiModels();

    const again = await enableLocalVision(db, deps());
    expect(again.ok).toBe(true);

    const models = getMachineAiModels();
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe(first.id);

    const status = await getLocalVisionStatus(db, deps());
    expect(status).toMatchObject({
      ollamaInstalled: true,
      serverOnline: true,
      modelPresent: true,
      registered: true,
      usable: true,
    });
  });
});
