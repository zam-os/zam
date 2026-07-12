import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getProviderForRole,
  resolveCapability,
} from "../../src/cli/llm/client.js";
import {
  type CapabilityFlags,
  type ModelCapability,
  type ModelEntry,
  openDatabase,
  saveMachineAiModels,
  setSetting,
} from "../../src/kernel/index.js";

function openDb() {
  return openDatabase({
    dbPath: ":memory:",
    initialize: true,
    useConfiguredCloud: false,
  });
}

function flags(...caps: ModelCapability[]): CapabilityFlags {
  return {
    text: caps.includes("text"),
    embedding: caps.includes("embedding"),
    image: caps.includes("image"),
    video: caps.includes("video"),
    stt: caps.includes("stt"),
    tts: caps.includes("tts"),
  };
}

function entry(over: Partial<ModelEntry> & { id: string }): ModelEntry {
  return {
    label: over.label ?? over.id,
    url: over.url ?? "http://localhost:8000/v1",
    model: over.model ?? "m",
    local: over.local ?? true,
    apiFlavor: over.apiFlavor ?? "chat-completions",
    order: over.order ?? 0,
    capabilities: over.capabilities ?? flags("text"),
    detectedCapabilities:
      over.detectedCapabilities ?? over.capabilities ?? flags("text"),
    ...over,
  };
}

// Isolate the per-machine config so the registry under test neither reads the
// developer's real ai.models nor clobbers it.
let machineConfigDir: string;
let previousZamConfigPath: string | undefined;
beforeEach(() => {
  machineConfigDir = mkdtempSync(join(tmpdir(), "zam-cap-res-"));
  previousZamConfigPath = process.env.ZAM_CONFIG_PATH;
  process.env.ZAM_CONFIG_PATH = join(machineConfigDir, "config.json");
});
afterEach(() => {
  if (previousZamConfigPath === undefined) delete process.env.ZAM_CONFIG_PATH;
  else process.env.ZAM_CONFIG_PATH = previousZamConfigPath;
  rmSync(machineConfigDir, { recursive: true, force: true });
});

describe("resolveCapability", () => {
  it("returns null when no registry is configured", async () => {
    const db = await openDb();
    try {
      expect(await resolveCapability(db, "text")).toBeNull();
    } finally {
      await db.close();
    }
  });

  it("picks the lowest-order enabled+detected entry and chains the next as fallback", async () => {
    saveMachineAiModels([
      entry({ id: "second", label: "Cloud", order: 1, local: false }),
      entry({ id: "first", label: "Local", order: 0 }),
    ]);
    const db = await openDb();
    await setSetting(db, "llm.enabled", "true");
    try {
      const p = await resolveCapability(db, "text");
      expect(p).toMatchObject({
        providerName: "first",
        label: "Local",
        source: "machine",
        enabled: true,
      });
      expect(p?.fallback).toMatchObject({ providerName: "second" });
    } finally {
      await db.close();
    }
  });

  it("skips entries the user enabled but a probe has not detected", async () => {
    saveMachineAiModels([
      entry({
        id: "wanted",
        order: 0,
        capabilities: flags("text"),
        detectedCapabilities: flags(), // enabled by user, not detected
      }),
      entry({ id: "detected", label: "Works", order: 1 }),
    ]);
    const db = await openDb();
    await setSetting(db, "llm.enabled", "true");
    try {
      const p = await resolveCapability(db, "text");
      expect(p?.providerName).toBe("detected");
      expect(p?.fallback).toBeUndefined();
    } finally {
      await db.close();
    }
  });

  it("gates image capability on the vision consent flag and carries maxFrames", async () => {
    saveMachineAiModels([
      entry({
        id: "vis",
        url: "https://api.anthropic.com",
        apiFlavor: "anthropic-messages",
        capabilities: flags("image"),
      }),
    ]);
    const db = await openDb();
    await setSetting(db, "llm.vision.enabled", "true");
    await setSetting(db, "llm.vision.max_frames", "42");
    try {
      const p = await resolveCapability(db, "image");
      expect(p).toMatchObject({ enabled: true, maxFrames: 42 });
    } finally {
      await db.close();
    }
  });
});

describe("getProviderForRole delegates to the registry", () => {
  it("maps recall/text to the text capability", async () => {
    saveMachineAiModels([entry({ id: "text-model", label: "Text" })]);
    const db = await openDb();
    await setSetting(db, "llm.enabled", "true");
    try {
      const recall = await getProviderForRole(db, "recall");
      const text = await getProviderForRole(db, "text");
      expect(recall.providerName).toBe("text-model");
      expect(text.providerName).toBe("text-model");
      expect(recall.source).toBe("machine");
    } finally {
      await db.close();
    }
  });

  it("falls back to legacy resolution when the registry lacks the capability", async () => {
    // Registry has only an embedding model; a recall (text) lookup must fall
    // through to the flat llm.* config rather than resolve from the registry.
    saveMachineAiModels([
      entry({ id: "emb", capabilities: flags("embedding") }),
    ]);
    const db = await openDb();
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "http://legacy:1234/v1");
    await setSetting(db, "llm.model", "legacy-model");
    try {
      const recall = await getProviderForRole(db, "recall");
      expect(recall.source).toBe("legacy");
      expect(recall.url).toBe("http://legacy:1234/v1");
      expect(recall.model).toBe("legacy-model");
    } finally {
      await db.close();
    }
  });
});
