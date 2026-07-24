import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  getMachineAiModels,
  getSetting,
  openDatabase,
} from "../../src/kernel/index.js";
import {
  canonicalEmbeddingModelId,
  DEFAULT_EMBEDDING_MODEL,
} from "../../src/cli/llm/embedder.js";
import {
  enableLocalEmbedding,
  getLocalEmbeddingStatus,
  type LocalEmbeddingDeps,
  OLLAMA_BASE_URL,
} from "../../src/cli/llm/local-embedding.js";

describe("local embedding enhancement (ADR 2026-07-24 §5a)", () => {
  let db: Database;
  let tempDir: string;
  let previousConfigPath: string | undefined;
  let pulls: string[];

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-local-embedding-"));
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

  function deps(overrides: Partial<LocalEmbeddingDeps> = {}): LocalEmbeddingDeps {
    return {
      isInstalled: () => true,
      isOnline: async () => true,
      listModels: async () => ["embeddinggemma:latest"],
      pullModel: (model) => {
        pulls.push(model);
      },
      probe: async () => ({
        reachable: true,
        catalog: ["embeddinggemma:latest"],
        detected: {
          text: false,
          embedding: true,
          image: false,
          video: false,
          stt: false,
          tts: false,
        },
      }),
      ...overrides,
    };
  }

  it("reports the missing-Ollama state without installing anything", async () => {
    const result = await enableLocalEmbedding(
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
    const result = await enableLocalEmbedding(
      db,
      deps({ isOnline: async () => false }),
    );
    expect(result.ok).toBe(false);
    expect(result.needsOllama).toBeUndefined();
    expect(result.error).toContain("not running");
    expect(pulls).toHaveLength(0);
  });

  it("pulls the model only when it is absent", async () => {
    const withModel = await enableLocalEmbedding(db, deps());
    expect(withModel.ok).toBe(true);
    expect(withModel.pulled).toBe(false);
    expect(pulls).toHaveLength(0);

    const withoutModel = await enableLocalEmbedding(
      db,
      deps({ listModels: async () => ["qwen3.5:4b"] }),
    );
    expect(withoutModel.ok).toBe(true);
    expect(withoutModel.pulled).toBe(true);
    expect(pulls).toEqual([DEFAULT_EMBEDDING_MODEL]);
  });

  it("surfaces a pull failure without saving a registry entry", async () => {
    const result = await enableLocalEmbedding(
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
    expect(await getSetting(db, "llm.enabled")).not.toBe("true");
  });

  it("registers the local embedding entry and opens the llm.enabled gate", async () => {
    const result = await enableLocalEmbedding(db, deps());
    expect(result.ok).toBe(true);

    const models = getMachineAiModels();
    expect(models).toHaveLength(1);
    expect(models[0].url).toBe(OLLAMA_BASE_URL);
    // Registered under the tag the server actually advertises, so the
    // embedding-role resolver's exact catalog match succeeds; the alias map
    // still folds it to the canonical embeddinggemma-300m for stored vectors.
    expect(models[0].model).toBe("embeddinggemma:latest");
    expect(canonicalEmbeddingModelId(models[0].model)).toBe(
      "embeddinggemma-300m",
    );
    expect(models[0].local).toBe(true);
    expect(models[0].runner).toBe("ollama");
    expect(models[0].capabilities.embedding).toBe(true);
    expect(models[0].capabilities.text).toBe(false);
    expect(models[0].detectedCapabilities.embedding).toBe(true);
    expect(await getSetting(db, "llm.enabled")).toBe("true");
  });

  it("is idempotent: re-enabling updates the entry in place", async () => {
    await enableLocalEmbedding(db, deps());
    const [first] = getMachineAiModels();

    const again = await enableLocalEmbedding(db, deps());
    expect(again.ok).toBe(true);

    const models = getMachineAiModels();
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe(first.id);
  });

  it("reports a truthful status for each stage", async () => {
    const missing = await getLocalEmbeddingStatus(
      db,
      deps({ isInstalled: () => false }),
    );
    expect(missing).toMatchObject({
      ollamaInstalled: false,
      serverOnline: false,
      modelPresent: false,
      registered: false,
    });

    await enableLocalEmbedding(db, deps());
    const enabled = await getLocalEmbeddingStatus(db, deps());
    expect(enabled.registered).toBe(true);
    expect(enabled.modelPresent).toBe(true);
  });
});
