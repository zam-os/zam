import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CapabilityProbeResult } from "../../src/cli/llm/capability-probe.js";
import {
  CAPABILITIES_CHANGED_AT,
  needsCapabilityRefresh,
  refreshStaleCapabilities,
  staleCapabilityRows,
  widenCapabilities,
} from "../../src/cli/llm/capability-refresh.js";
import {
  loadModelRegistry,
  saveModelRegistry,
} from "../../src/cli/llm/model-registry.js";
import {
  type CapabilityFlags,
  type Database,
  type ModelCapability,
  type ModelEntry,
  openDatabase,
} from "../../src/kernel/index.js";

/**
 * Cloud models whose detection is out of date are asked again — never local
 * ones, never more than needed, and only ever widened. The probe is mocked.
 */

const NOW = new Date("2026-10-06T12:00:00.000Z");

function flags(...caps: ModelCapability[]): CapabilityFlags {
  return {
    text: caps.includes("text"),
    embedding: caps.includes("embedding"),
    image: caps.includes("image"),
    video: caps.includes("video"),
    file: caps.includes("file"),
    stt: caps.includes("stt"),
    tts: caps.includes("tts"),
  };
}

function on(value: CapabilityFlags): ModelCapability[] {
  return (Object.keys(value) as ModelCapability[]).filter((key) => value[key]);
}

function row(
  id: string,
  over: Partial<ModelEntry> = {},
  caps: ModelCapability[] = ["text"],
): ModelEntry {
  return {
    id,
    label: id,
    url: "https://openrouter.ai/api/v1",
    model: `vendor/${id.toLowerCase()}`,
    local: false,
    apiFlavor: "chat-completions",
    order: 0,
    capabilities: flags(...caps),
    detectedCapabilities: flags(...caps),
    ...over,
  };
}

describe("which rows are due", () => {
  it("asks about cloud rows never probed, probed before a new capability, or a month ago", () => {
    expect(needsCapabilityRefresh(row("GLM"), NOW)).toBe(true);
    expect(
      needsCapabilityRefresh(
        row("Luna", { probedAt: "2026-09-25T19:09:20.885Z" }),
        NOW,
      ),
    ).toBe(true);
    expect(
      needsCapabilityRefresh(
        row("Fresh", { probedAt: CAPABILITIES_CHANGED_AT }),
        NOW,
      ),
    ).toBe(false);
    expect(
      needsCapabilityRefresh(
        row("Old", { probedAt: CAPABILITIES_CHANGED_AT }),
        new Date("2026-11-06T12:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("never asks about local or agent models", () => {
    expect(needsCapabilityRefresh(row("Ollama", { local: true }), NOW)).toBe(
      false,
    );
    expect(
      needsCapabilityRefresh(
        row("Loopback", { url: "http://localhost:11434/v1" }),
        NOW,
      ),
    ).toBe(false);
    expect(
      needsCapabilityRefresh(row("Claude", { transport: "agent" }), NOW),
    ).toBe(false);
  });
});

describe("widening", () => {
  it("adds and switches on what the provider declares now", () => {
    const widened = widenCapabilities(
      row("GLM"),
      flags("text", "image", "video"),
    );
    expect(on(widened.capabilities)).toEqual(["text", "image", "video"]);
    expect(widened.added).toEqual(["image", "video"]);
  });

  it("keeps the learner's toggles and takes nothing away", () => {
    const luna = row("Luna", {
      capabilities: flags("text"),
      detectedCapabilities: flags("text", "image"),
    });
    const widened = widenCapabilities(luna, flags("text", "file"));
    // Image stays detected and stays off, as the learner left it.
    expect(on(widened.detectedCapabilities)).toEqual(["text", "image", "file"]);
    expect(on(widened.capabilities)).toEqual(["text", "file"]);
    expect(widened.added).toEqual(["file"]);
    expect(widenCapabilities(luna, flags()).added).toEqual([]);
  });
});

describe("refreshStaleCapabilities", () => {
  let dir: string;
  let db: Database;
  let previousConfig: string | undefined;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-capability-refresh-"));
    previousConfig = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(dir, "config.json");
    db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    if (previousConfig === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfig;
    rmSync(dir, { recursive: true, force: true });
  });

  it("asks only due cloud rows, stores what they declare, and leaves the rest", async () => {
    await saveModelRegistry(db, [
      row("GLM", { model: "z-ai/glm-5.3-flash" }),
      row(
        "Luna",
        { model: "openai/gpt-6-luna", probedAt: "2026-09-25T19:09:20.885Z" },
        ["text", "image"],
      ),
      row("Fresh", { probedAt: "2026-10-05T10:00:00.000Z" }),
      row("Gone", { model: "vendor/gone" }),
      row(
        "Gemma",
        { url: "http://localhost:11434/v1", local: true, model: "gemma3" },
        ["text", "image"],
      ),
    ]);
    const declared: Record<string, ModelCapability[]> = {
      "z-ai/glm-5.3-flash": ["text", "image", "video"],
      "openai/gpt-6-luna": ["text", "image", "file"],
    };
    const asked: string[] = [];
    const probe = async (entry: ModelEntry): Promise<CapabilityProbeResult> => {
      asked.push(entry.model);
      return {
        reachable: true,
        // "Gone" is no longer in the catalogue: its answer is a guess.
        catalog: Object.keys(declared),
        detected: flags(...(declared[entry.model] ?? [])),
      };
    };

    const result = await refreshStaleCapabilities(db, { probe, now: NOW });

    expect(asked.sort()).toEqual([
      "openai/gpt-6-luna",
      "vendor/gone",
      "z-ai/glm-5.3-flash",
    ]);
    expect(result.checked).toBe(3);
    expect(result.refreshed).toEqual([
      expect.objectContaining({ label: "GLM", added: ["image", "video"] }),
      expect.objectContaining({ label: "Luna", added: ["file"] }),
    ]);
    const after = Object.fromEntries(
      (await loadModelRegistry(db)).map((entry) => [entry.label, entry]),
    );
    expect(on(after.GLM.capabilities)).toEqual(["text", "image", "video"]);
    expect(on(after.Luna.capabilities)).toEqual(["text", "image", "file"]);
    expect(after.Luna.probedAt).toBe(NOW.toISOString());
    // Not in the catalogue: unchanged, and still due next time.
    expect(after.Gone.probedAt).toBeUndefined();
    expect(on(after.Gone.capabilities)).toEqual(["text"]);
    expect(
      (await staleCapabilityRows(db, NOW)).map((entry) => entry.label),
    ).toEqual(["Gone"]);
  });

  it("changes nothing while offline, and keeps a toggle made meanwhile", async () => {
    await saveModelRegistry(db, [
      row("GLM", { model: "z-ai/glm-5.3-flash" }),
      row("Luna", { model: "openai/gpt-6-luna" }, ["text", "image"]),
    ]);
    const offline = await refreshStaleCapabilities(db, {
      probe: async () => {
        throw new Error("offline");
      },
      now: NOW,
    });
    expect(offline).toEqual({ checked: 2, refreshed: [] });
    expect(await staleCapabilityRows(db, NOW)).toHaveLength(2);

    await refreshStaleCapabilities(db, {
      now: NOW,
      probe: async (entry) => {
        if (entry.label === "Luna") {
          // The learner switches Luna's image off while GLM is asked.
          const rows = await loadModelRegistry(db);
          await saveModelRegistry(
            db,
            rows.map((r) =>
              r.label === "Luna" ? { ...r, capabilities: flags("text") } : r,
            ),
          );
        }
        return {
          reachable: true,
          catalog: [entry.model],
          detected: flags("text", "image"),
        };
      },
    });
    const luna = (await loadModelRegistry(db)).find((r) => r.label === "Luna");
    expect(on(luna?.capabilities ?? flags())).toEqual(["text"]);
  });
});
