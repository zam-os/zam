import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveOperationKnowledgeContexts } from "../../src/cli/knowledge-contexts.js";
import {
  createKnowledgeContext,
  type Database,
  openDatabase,
} from "../../src/kernel/index.js";

/**
 * The workspace's default context is machine-local (config.json) while the
 * contexts themselves live in whichever library is active. After switching a
 * machine from a personal library (work/school/private) to a team library
 * with the single context "team", the stored default names a context the
 * library does not have — the Studio's goal import failed with "Active
 * knowledge context not found: work" (2026-09-21).
 */
describe("resolveOperationKnowledgeContexts", () => {
  let dir: string;
  let previousConfigPath: string | undefined;
  let db: Database;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-kc-resolve-"));
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(dir, "config.json");
    writeFileSync(
      process.env.ZAM_CONFIG_PATH,
      JSON.stringify({
        activeWorkspaceId: "w1",
        workspaces: [
          {
            id: "w1",
            label: "Repo",
            kind: "custom",
            path: dir,
            activeKnowledgeContext: "work",
          },
        ],
      }),
    );
    db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    if (previousConfigPath === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfigPath;
    rmSync(dir, { recursive: true, force: true });
  });

  it("uses the workspace default when the library has that context", async () => {
    await createKnowledgeContext(db, { name: "work" });
    await createKnowledgeContext(db, { name: "school" });

    const contexts = await resolveOperationKnowledgeContexts(db, []);

    expect(contexts.map((c) => c.name)).toEqual(["work"]);
  });

  it("falls back to the library's only context when the default is unknown there", async () => {
    await createKnowledgeContext(db, { name: "team" });

    const contexts = await resolveOperationKnowledgeContexts(db, []);

    expect(contexts.map((c) => c.name)).toEqual(["team"]);
  });

  it("still refuses an unknown default when the library offers a choice", async () => {
    await createKnowledgeContext(db, { name: "team" });
    await createKnowledgeContext(db, { name: "school" });

    await expect(resolveOperationKnowledgeContexts(db, [])).rejects.toThrow(
      /Active knowledge context not found: work.*school, team.*zam kc use/s,
    );
  });

  it("returns no context when no default is configured, even with a single one", async () => {
    // A library run deliberately without a default keeps that choice; the
    // fallback only rescues a configured default the library does not have.
    writeFileSync(
      process.env.ZAM_CONFIG_PATH as string,
      JSON.stringify({
        activeWorkspaceId: "w1",
        workspaces: [{ id: "w1", label: "Repo", kind: "custom", path: dir }],
      }),
    );
    await createKnowledgeContext(db, { name: "team" });

    const contexts = await resolveOperationKnowledgeContexts(db, []);

    expect(contexts).toEqual([]);
  });

  it("never substitutes an explicitly requested context", async () => {
    await createKnowledgeContext(db, { name: "team" });

    await expect(
      resolveOperationKnowledgeContexts(db, ["work"]),
    ).rejects.toThrow(/^Knowledge context not found: work/);
  });
});
