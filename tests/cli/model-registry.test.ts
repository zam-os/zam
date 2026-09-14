import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CLOUD_MODELS_SETTING,
  isMachineLocalEntry,
  loadModelRegistry,
  saveModelRegistry,
  type ResolvedModelEntry,
} from "../../src/cli/llm/model-registry.js";
import {
  type Database,
  emptyCapabilityFlags,
  getMachineAiModels,
  getSetting,
  openDatabase,
  saveMachineAiModels,
} from "../../src/kernel/index.js";

let dir: string;
let db: Database;

function entry(
  overrides: Partial<ResolvedModelEntry> & { id: string },
): ResolvedModelEntry {
  return {
    label: overrides.id,
    url: "https://models.example/v1",
    model: "m",
    local: false,
    apiFlavor: "chat-completions",
    order: 0,
    capabilities: emptyCapabilityFlags(),
    detectedCapabilities: emptyCapabilityFlags(),
    ...overrides,
  };
}

// ZAM_CONFIG_PATH, not ZAM_HOME: `defaultConfigPath()` reads that one, and
// without it every `saveMachineAiModels` in this file rewrites the developer's
// real ~/.zam/config.json.
let previousConfigPath: string | undefined;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "zam-registry-"));
  previousConfigPath = process.env.ZAM_CONFIG_PATH;
  process.env.ZAM_CONFIG_PATH = join(dir, "config.json");
  // `useConfiguredCloud: false` is not optional here: without it this opens
  // the developer's configured database and writes test rows into it.
  db = await openDatabase({
    dbPath: join(dir, "zam-test.db"),
    initialize: true,
    useConfiguredCloud: false,
  });
});

afterEach(() => {
  db.close?.();
  if (previousConfigPath === undefined) {
    process.env.ZAM_CONFIG_PATH = undefined;
  } else {
    process.env.ZAM_CONFIG_PATH = previousConfigPath;
  }
  rmSync(dir, { recursive: true, force: true });
});

describe("registry split", () => {
  it("treats only unreachable rows as machine-local", () => {
    // The split is by reachability, not by taste: another device can call a
    // hosted endpoint and can call neither a loopback one nor a CLI on this
    // machine.
    expect(isMachineLocalEntry(entry({ id: "cloud" }))).toBe(false);
    expect(isMachineLocalEntry(entry({ id: "ollama", local: true }))).toBe(true);
    expect(
      isMachineLocalEntry(entry({ id: "grok", transport: "agent" })),
    ).toBe(true);
  });

  it("routes each row to where it belongs on save", async () => {
    await saveModelRegistry(db, [
      entry({ id: "cloud", order: 0, apiKey: "sk-shared" }),
      entry({ id: "ollama", order: 1, local: true }),
    ]);

    expect(getMachineAiModels().map((row) => row.id)).toEqual(["ollama"]);
    const stored = JSON.parse(
      (await getSetting(db, CLOUD_MODELS_SETTING)) ?? "[]",
    );
    expect(stored.map((row: ResolvedModelEntry) => row.id)).toEqual(["cloud"]);
  });

  it("never writes a secret into the machine config", async () => {
    // `apiKeyRef` is the rule for config.json (ADR 2026-07-12). A key that
    // arrived on a database row must not be copied there on the way back.
    await saveModelRegistry(db, [
      entry({ id: "ollama", local: true, apiKey: "sk-leak" }),
    ]);

    expect(getMachineAiModels()[0]).not.toHaveProperty("apiKey");
  });

  it("presents both halves as one list ordered by order", async () => {
    await saveModelRegistry(db, [
      entry({ id: "second", order: 2 }),
      entry({ id: "first", order: 1, local: true }),
      entry({ id: "third", order: 3 }),
    ]);

    expect((await loadModelRegistry(db)).map((row) => row.id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("breaks an order tie towards the machine row", async () => {
    // Two rows claiming one slot is an accident, and the cheaper, more private
    // endpoint is the better guess.
    await saveModelRegistry(db, [
      entry({ id: "cloud", order: 0 }),
      entry({ id: "local", order: 0, local: true }),
    ]);

    expect((await loadModelRegistry(db))[0].id).toBe("local");
  });

  it("resolves a cloud row's key reference onto the row", async () => {
    // The database is the only channel another client reads a cloud row
    // through, and `apiKeyRef` names a file on this machine. A row saved with
    // the reference alone arrives elsewhere as a model with no key.
    await saveModelRegistry(
      db,
      [entry({ id: "cloud", apiKeyRef: "openrouter" })],
      (ref) => (ref === "openrouter" ? "sk-resolved" : null),
    );

    const stored = JSON.parse(
      (await getSetting(db, CLOUD_MODELS_SETTING)) ?? "[]",
    );
    expect(stored[0].apiKey).toBe("sk-resolved");
    // The reference stays, so the machine that owns it can still rotate.
    expect(stored[0].apiKeyRef).toBe("openrouter");
  });

  it("leaves a reference this machine cannot resolve alone", async () => {
    // It belongs to another machine; replacing it would trade a row that works
    // there for one that works nowhere.
    await saveModelRegistry(
      db,
      [entry({ id: "cloud", apiKeyRef: "other-machine" })],
      () => null,
    );

    const stored = JSON.parse(
      (await getSetting(db, CLOUD_MODELS_SETTING)) ?? "[]",
    );
    expect(stored[0]).not.toHaveProperty("apiKey");
    expect(stored[0].apiKeyRef).toBe("other-machine");
  });

  it("does not overwrite a key the row already carries", async () => {
    await saveModelRegistry(
      db,
      [entry({ id: "cloud", apiKey: "sk-inline", apiKeyRef: "openrouter" })],
      () => "sk-from-reference",
    );

    const stored = JSON.parse(
      (await getSetting(db, CLOUD_MODELS_SETTING)) ?? "[]",
    );
    expect(stored[0].apiKey).toBe("sk-inline");
  });

  it("does not let the resolver put a secret into the machine config", async () => {
    // The guard that matters: resolution must not become a back door around
    // the "never inline" rule for config.json.
    await saveModelRegistry(
      db,
      [entry({ id: "ollama", local: true, apiKeyRef: "openrouter" })],
      () => "sk-resolved",
    );

    expect(getMachineAiModels()[0]).not.toHaveProperty("apiKey");
    expect(
      JSON.parse((await getSetting(db, CLOUD_MODELS_SETTING)) ?? "[]"),
    ).toEqual([]);
  });
});

describe("migration out of the machine config", () => {
  it("moves existing cloud rows into the database exactly once", async () => {
    saveMachineAiModels([
      entry({ id: "cloud", order: 0 }),
      entry({ id: "ollama", order: 1, local: true }),
    ]);

    const merged = await loadModelRegistry(db);

    expect(merged.map((row) => row.id)).toEqual(["cloud", "ollama"]);
    // Moved, not copied: two writable copies of one endpoint is the drift the
    // split exists to end.
    expect(getMachineAiModels().map((row) => row.id)).toEqual(["ollama"]);
  });

  it("leaves a database that already has cloud rows alone", async () => {
    // A second machine attaching to the same database contributes its local
    // models; it must not re-upload a registry that is already there.
    await saveModelRegistry(db, [entry({ id: "from-desktop", order: 0 })]);
    saveMachineAiModels([entry({ id: "ollama", order: 1, local: true })]);

    expect((await loadModelRegistry(db)).map((row) => row.id)).toEqual([
      "from-desktop",
      "ollama",
    ]);
  });

  it("survives a corrupt cloud setting rather than losing the machine rows", async () => {
    saveMachineAiModels([entry({ id: "ollama", local: true })]);
    await db.run?.(
      "INSERT OR REPLACE INTO user_config (key, value) VALUES (?, ?)",
      [CLOUD_MODELS_SETTING, "{not json"],
    );

    expect((await loadModelRegistry(db)).map((row) => row.id)).toEqual([
      "ollama",
    ]);
  });
});
