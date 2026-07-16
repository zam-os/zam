import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  readCompanionContext,
  resolveOpeningCompanionContext,
  writeCompanionContext,
} from "../../src/cli/companion-context-server.js";
import {
  getCompanionSelectedUserId,
  loadInstallConfig,
} from "../../src/kernel/index.js";
import { createToken, ensureCard, openDatabase } from "../../src/kernel/index.js";
import type { Database } from "../../src/kernel/index.js";

describe("companion context server", () => {
  let tempDir: string;
  let configPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-companion-context-server-"));
    configPath = join(tempDir, "machine-config.json");
    db = await openDatabase({
      dbPath: join(tempDir, "test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await db
      .prepare(
        "INSERT OR REPLACE INTO user_config (key, value) VALUES ('user.id', 'thomas')",
      )
      .run();
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("falls back to the shared database default with no persisted preference", async () => {
    const result = await readCompanionContext(
      db,
      { surface: "recall" },
      { configPath },
    );
    expect(result.user).toEqual({
      currentId: "thomas",
      persistedId: undefined,
      source: "default",
    });
  });

  it("persists a written learner selection and reflects it on the next read (restart persistence)", async () => {
    const written = await writeCompanionContext(
      db,
      { surface: "recall", userId: "test-user-0.6.2" },
      { configPath },
    );
    expect(written.read.user.currentId).toBe("test-user-0.6.2");
    expect(written.reloadRequired).toBe(true);

    // Simulate a restart: nothing here is cached in-process, so a brand-new
    // read call must re-derive the same value purely from the config file.
    const reread = await readCompanionContext(
      db,
      { surface: "recall" },
      { configPath },
    );
    expect(reread.user).toEqual({
      currentId: "test-user-0.6.2",
      persistedId: "test-user-0.6.2",
      source: "persisted",
    });
  });

  it("resolves opening context with invocation > persisted > default precedence", async () => {
    // No persisted preference yet: falls back to the database default.
    const noPersisted = await resolveOpeningCompanionContext(
      db,
      "recall",
      undefined,
      undefined,
      { configPath },
    );
    expect(noPersisted.user.currentId).toBe("thomas");
    expect(noPersisted.user.source).toBe("default");

    await writeCompanionContext(
      db,
      { surface: "recall", userId: "test-user-0.6.2" },
      { configPath },
    );

    // Persisted preference now wins over the database default.
    const withPersisted = await resolveOpeningCompanionContext(
      db,
      "recall",
      undefined,
      undefined,
      { configPath },
    );
    expect(withPersisted.user.currentId).toBe("test-user-0.6.2");
    expect(withPersisted.user.source).toBe("persisted");

    // An explicit invocation argument still wins over the persisted value.
    const withInvocation = await resolveOpeningCompanionContext(
      db,
      "recall",
      "someone-else",
      undefined,
      { configPath },
    );
    expect(withInvocation.user.currentId).toBe("someone-else");
    expect(withInvocation.user.source).toBe("invocation");
  });

  it("never persists an invocation-scoped user (opening a panel is not a preference change)", async () => {
    await resolveOpeningCompanionContext(
      db,
      "recall",
      "test-user-0.6.2",
      undefined,
      { configPath },
    );

    // Resolving an opening context never calls the write path, so nothing
    // should have reached disk — the config file may not even exist yet.
    expect(getCompanionSelectedUserId(configPath)).toBeUndefined();
  });

  it("leaves the database-wide user.id setting untouched when the Companion learner changes (test-user isolation)", async () => {
    await writeCompanionContext(
      db,
      { surface: "recall", userId: "test-user-0.6.2" },
      { configPath },
    );

    const userIdRow = (await db
      .prepare("SELECT value FROM user_config WHERE key = 'user.id'")
      .get()) as { value: string } | undefined;
    expect(userIdRow?.value).toBe("thomas");
  });

  it("requires a reload only when the user or evaluator changes, not for a collapsed-only write", async () => {
    const collapsedOnly = await writeCompanionContext(
      db,
      { surface: "recall", collapsed: true },
      { configPath },
    );
    expect(collapsedOnly.reloadRequired).toBe(false);
    expect(collapsedOnly.read.collapsed).toBe(true);

    const evaluatorChange = await writeCompanionContext(
      db,
      { surface: "recall", evaluatorId: "quick-mode" },
      { configPath },
    );
    expect(evaluatorChange.reloadRequired).toBe(true);
  });

  it("falls back cleanly instead of crashing on a corrupt machine-local config file", async () => {
    writeFileSync(configPath, "{ not json", "utf-8");

    const result = await readCompanionContext(
      db,
      { surface: "recall" },
      { configPath },
    );
    expect(result.user.currentId).toBe("thomas");
    expect(result.user.source).toBe("default");

    // A write afterward must still succeed and overwrite the corruption.
    const written = await writeCompanionContext(
      db,
      { surface: "recall", userId: "test-user-0.6.2" },
      { configPath },
    );
    expect(written.read.user.currentId).toBe("test-user-0.6.2");
    expect(loadInstallConfig(configPath).companion?.selectedUserId).toBe(
      "test-user-0.6.2",
    );
  });

  it("falls back cleanly when the config file is simply missing", async () => {
    // configPath was never written in this test — no beforeEach touches it.
    const result = await readCompanionContext(
      db,
      { surface: "graph" },
      { configPath: join(tempDir, "never-written.json") },
    );
    expect(result.user.currentId).toBe("thomas");
    expect(result.collapsed).toBe(false);
    // No cards exist yet in this test's fresh database, so the profile list
    // (grouped from `cards`, mirroring `database-status`) is legitimately
    // empty — the point of this test is that resolution never throws.
    expect(result.profiles).toEqual([]);
  });

  it("lists learner profiles from the shared database, reused from database-status", async () => {
    const token = await createToken(db, {
      slug: "companion-context-token",
      concept: "Concept",
      domain: "science",
      bloom_level: 1,
    });
    await ensureCard(db, token.id, "thomas");
    await ensureCard(db, token.id, "test-user-0.6.2");

    const result = await readCompanionContext(
      db,
      { surface: "settings" },
      { configPath },
    );
    const profileIds = result.profiles.map((profile) => profile.id).sort();
    expect(profileIds).toEqual(["test-user-0.6.2", "thomas"]);
  });

  it("marks quick-mode as the only routable evaluator for an unknown/generic MCP client", async () => {
    const result = await readCompanionContext(
      db,
      { surface: "recall" },
      { configPath },
    );
    const routable = result.evaluators
      .filter((route) => route.routable)
      .map((route) => route.id);
    expect(routable).toEqual(["quick-mode"]);
    expect(result.activeEvaluatorId).toBe("quick-mode");
  });

  it("marks vscode-lm routable (and defaults the Agent pill to it) only when the client is the VS Code Companion", async () => {
    const result = await readCompanionContext(
      db,
      { surface: "recall", clientInfo: { name: "vscode-zam-companion" } },
      { configPath },
    );
    const routable = result.evaluators
      .filter((route) => route.routable)
      .map((route) => route.id);
    expect(routable.sort()).toEqual(["quick-mode", "vscode-lm"]);
    expect(result.activeEvaluatorId).toBe("vscode-lm");

    const nativeHost = result.evaluators.find(
      (route) => route.id === "native-mcp-host",
    );
    expect(nativeHost?.routable).toBe(false);
    expect(nativeHost?.reason).toMatch(/vs code language-model adapter/i);
  });

  it("never marks vscode-lm routable for a non-Companion client, even one that advertises sampling", async () => {
    const result = await readCompanionContext(
      db,
      { surface: "recall", clientInfo: { name: "some-other-host" } },
      { configPath, clientSamplingCapable: true },
    );
    const vscodeLm = result.evaluators.find((route) => route.id === "vscode-lm");
    expect(vscodeLm?.routable).toBe(false);
    expect(vscodeLm?.reason).toMatch(/vs code companion/i);

    const nativeHost = result.evaluators.find(
      (route) => route.id === "native-mcp-host",
    );
    expect(nativeHost?.routable).toBe(true);
    expect(nativeHost?.reason).toBeUndefined();
    expect(result.activeEvaluatorId).toBe("quick-mode");
  });

  it("marks native-mcp-host unroutable for a non-Companion client that never advertised sampling", async () => {
    const result = await readCompanionContext(
      db,
      { surface: "recall", clientInfo: { name: "some-other-host" } },
      { configPath },
    );
    const nativeHost = result.evaluators.find(
      (route) => route.id === "native-mcp-host",
    );
    expect(nativeHost?.routable).toBe(false);
    expect(nativeHost?.reason).toMatch(/did not advertise sampling/i);
  });

  it("never allows both vscode-lm and native-mcp-host to be routable for the same connection", async () => {
    const asCompanion = await readCompanionContext(
      db,
      { surface: "recall", clientInfo: { name: "vscode-zam-companion" } },
      { configPath, clientSamplingCapable: true },
    );
    const routableAsCompanion = asCompanion.evaluators
      .filter((route) => route.routable)
      .map((route) => route.id)
      .sort();
    expect(routableAsCompanion).toEqual(["quick-mode", "vscode-lm"]);
  });

  it("keeps an explicitly persisted evaluator selection even once vscode-lm becomes routable", async () => {
    await writeCompanionContext(
      db,
      { surface: "recall", evaluatorId: "quick-mode" },
      { configPath },
    );

    const result = await readCompanionContext(
      db,
      { surface: "recall", clientInfo: { name: "vscode-zam-companion" } },
      { configPath },
    );
    expect(result.selectedEvaluatorId).toBe("quick-mode");
    expect(result.activeEvaluatorId).toBe("quick-mode");
  });
});
