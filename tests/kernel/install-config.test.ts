import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  detectSyncProvider,
  ensureMachineProviderRolesSanitized,
  getActiveWorkspace,
  getActiveWorkspaceId,
  getAgentConnectAutoDone,
  getCompanionCollapsed,
  getCompanionSelectedAntigravityEvaluatorId,
  getCompanionSelectedAntigravityModelId,
  getCompanionSelectedEvaluatorId,
  getCompanionSelectedUserId,
  getCompanionSelectedVscodeEvaluatorId,
  getCompanionSelectedVscodeModelId,
  getConfiguredWorkspaces,
  getInstallMode,
  getMachineAiConfig,
  getOnboardingDone,
  getOnboardingPersona,
  loadInstallConfig,
  removeConfiguredWorkspace,
  saveInstallConfig,
  saveMachineAiConfig,
  setActiveWorkspaceId,
  setAgentConnectAutoDone,
  setCompanionCollapsed,
  setCompanionSelectedAntigravityEvaluatorId,
  setCompanionSelectedAntigravityModelId,
  setCompanionSelectedEvaluatorId,
  setCompanionSelectedUserId,
  setCompanionSelectedVscodeEvaluatorId,
  setCompanionSelectedVscodeModelId,
  setInstallMode,
  setOnboardingDone,
  setOnboardingPersona,
  updateInstallConfig,
  updateMachineCompanionConfig,
  upsertConfiguredWorkspace,
} from "../../src/kernel/index.js";

const tempDirs: string[] = [];

function tempConfigPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "zam-install-config-"));
  tempDirs.push(dir);
  return join(dir, "config.json");
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("install config", () => {
  it("defaults the mode to developer when no config exists", () => {
    expect(getInstallMode(tempConfigPath())).toBe("developer");
  });

  it("round-trips the install mode and creates the file", () => {
    const path = tempConfigPath();
    setInstallMode("default", path);
    expect(getInstallMode(path)).toBe("default");
    expect(loadInstallConfig(path).mode).toBe("default");

    setInstallMode("developer", path);
    expect(getInstallMode(path)).toBe("developer");
  });

  it("preserves unrelated keys when changing the mode", () => {
    const path = tempConfigPath();
    saveInstallConfig({ mode: "developer" }, path);
    // Simulate a future key written by another part of the app.
    const withExtra = { ...loadInstallConfig(path), futureKey: "keep me" };
    writeFileSync(path, JSON.stringify(withExtra), "utf-8");

    setInstallMode("default", path);

    const reloaded = JSON.parse(readFileSync(path, "utf-8"));
    expect(reloaded.mode).toBe("default");
    expect(reloaded.futureKey).toBe("keep me");
  });

  it("returns developer for a corrupt config file", () => {
    const path = tempConfigPath();
    writeFileSync(path, "{ not json", "utf-8");
    expect(getInstallMode(path)).toBe("developer");
  });

  it("round-trips the machine-local agent auto-connect marker", () => {
    const path = tempConfigPath();
    expect(getAgentConnectAutoDone(path)).toBe(false);

    setAgentConnectAutoDone(true, path);
    expect(getAgentConnectAutoDone(path)).toBe(true);
    // Lives in the per-machine file, next to mode/ai — never in the database,
    // which may be shared across machines via Turso.
    expect(loadInstallConfig(path).agent?.connectAutoDone).toBe(true);

    setAgentConnectAutoDone(false, path);
    expect(getAgentConnectAutoDone(path)).toBe(false);
  });

  it("round-trips the machine-local onboarding-done marker", () => {
    const path = tempConfigPath();
    expect(getOnboardingDone(path)).toBe(false);

    setOnboardingDone(true, path);
    expect(getOnboardingDone(path)).toBe(true);
    // Per-machine, next to the agent marker — never in the shared database.
    expect(loadInstallConfig(path).onboarding?.done).toBe(true);

    setOnboardingDone(false, path);
    expect(getOnboardingDone(path)).toBe(false);
  });

  it("keeps the onboarding marker independent of unrelated keys", () => {
    const path = tempConfigPath();
    setAgentConnectAutoDone(true, path);
    setOnboardingDone(true, path);
    // Toggling onboarding off must not disturb the agent marker.
    setOnboardingDone(false, path);
    expect(getAgentConnectAutoDone(path)).toBe(true);
    expect(getOnboardingDone(path)).toBe(false);
  });

  it("defaults the onboarding persona to the free learner", () => {
    // ADR 2026-07-24 open question 4, resolved in the plan: skipping the
    // persona page yields "private".
    expect(getOnboardingPersona(tempConfigPath())).toBe("private");
  });

  it("round-trips the machine-local onboarding persona", () => {
    const path = tempConfigPath();
    setOnboardingPersona("school", path);
    expect(getOnboardingPersona(path)).toBe("school");
    expect(loadInstallConfig(path).onboarding?.persona).toBe("school");

    setOnboardingPersona(undefined, path);
    expect(getOnboardingPersona(path)).toBe("private");
  });

  it("falls back to the default persona for an unknown on-disk value", () => {
    const path = tempConfigPath();
    saveInstallConfig({ onboarding: { persona: "astronaut" } } as never, path);
    expect(getOnboardingPersona(path)).toBe("private");
  });

  it("keeps the persona and the done marker independent", () => {
    const path = tempConfigPath();
    setOnboardingPersona("work", path);
    setOnboardingDone(true, path);
    setOnboardingDone(false, path);
    expect(getOnboardingPersona(path)).toBe("work");
    setOnboardingPersona(undefined, path);
    setOnboardingDone(true, path);
    expect(getOnboardingDone(path)).toBe(true);
    expect(getOnboardingPersona(path)).toBe("private");
  });

  it("strips deprecated text bindings from machine-local AI config", () => {
    const path = tempConfigPath();
    saveMachineAiConfig(
      {
        roles: {
          recall: { primary: "mimo" },
          text: { primary: "legacy-text" },
        },
      },
      path,
    );

    ensureMachineProviderRolesSanitized(path);

    const roles = getMachineAiConfig(path).roles;
    expect(roles?.recall?.primary).toBe("mimo");
    expect(roles?.text).toBeUndefined();
  });

  it("round-trips machine-local AI config without touching install mode", () => {
    const path = tempConfigPath();
    saveInstallConfig({ mode: "default" }, path);

    saveMachineAiConfig(
      {
        providers: {
          foundry: {
            label: "Foundry Gemma",
            url: "http://localhost:8000/v1",
            model: "gemma4-it:e4b",
            local: true,
          },
        },
        roles: { recall: { primary: "foundry" } },
      },
      path,
    );

    expect(getInstallMode(path)).toBe("default");
    expect(getMachineAiConfig(path).roles?.recall?.primary).toBe("foundry");
    expect(getMachineAiConfig(path).providers?.foundry?.model).toBe(
      "gemma4-it:e4b",
    );
  });

  it("upserts configured workspaces", () => {
    const path = tempConfigPath();
    upsertConfiguredWorkspace(
      {
        id: "team",
        kind: "team",
        path: "C:\\src\\Team.Management",
        sourceControl: "azure-devops",
        knowledgeScopes: ["goals", "concepts"],
      },
      path,
    );

    upsertConfiguredWorkspace(
      {
        id: "team",
        label: "Team Management",
        kind: "team",
        path: "D:\\work\\Team.Management",
      },
      path,
    );

    expect(getConfiguredWorkspaces(path)).toEqual([
      {
        id: "team",
        label: "Team Management",
        kind: "team",
        path: "D:\\work\\Team.Management",
      },
    ]);
  });

  it("removes a configured workspace without touching the others", () => {
    const path = tempConfigPath();
    upsertConfiguredWorkspace(
      { id: "family", kind: "family", path: "C:\\family" },
      path,
    );
    upsertConfiguredWorkspace(
      { id: "team", kind: "team", path: "C:\\team" },
      path,
    );

    const remaining = removeConfiguredWorkspace("family", path);

    expect(remaining).toEqual([{ id: "team", kind: "team", path: "C:\\team" }]);
    expect(getConfiguredWorkspaces(path)).toEqual(remaining);
  });

  it("round-trips the active workspace id", () => {
    const path = tempConfigPath();
    upsertConfiguredWorkspace(
      { id: "personal", kind: "personal", path: "/work/personal" },
      path,
    );
    upsertConfiguredWorkspace(
      { id: "team", kind: "team", path: "/work/team" },
      path,
    );

    setActiveWorkspaceId("team", path);

    expect(getActiveWorkspaceId(path)).toBe("team");
    expect(getActiveWorkspace(path)).toEqual({
      id: "team",
      kind: "team",
      path: "/work/team",
    });

    setActiveWorkspaceId(undefined, path);
    expect(getActiveWorkspaceId(path)).toBeUndefined();
    expect(getActiveWorkspace(path)).toBeUndefined();
  });

  it("moves the active workspace id when the active workspace is removed", () => {
    const path = tempConfigPath();
    upsertConfiguredWorkspace(
      { id: "family", kind: "family", path: "C:\\family" },
      path,
    );
    upsertConfiguredWorkspace(
      { id: "team", kind: "team", path: "C:\\team" },
      path,
    );
    setActiveWorkspaceId("family", path);

    const remaining = removeConfiguredWorkspace("family", path);

    expect(remaining).toEqual([{ id: "team", kind: "team", path: "C:\\team" }]);
    expect(getActiveWorkspaceId(path)).toBe("team");
    expect(getActiveWorkspace(path)?.path).toBe("C:\\team");
  });

  it("round-trips the persisted Companion learner and evaluator selections", () => {
    const path = tempConfigPath();
    expect(getCompanionSelectedUserId(path)).toBeUndefined();
    expect(getCompanionSelectedEvaluatorId(path)).toBeUndefined();

    setCompanionSelectedUserId("test-user-0.6.2", path);
    setCompanionSelectedEvaluatorId("quick-mode", path);

    expect(getCompanionSelectedUserId(path)).toBe("test-user-0.6.2");
    expect(getCompanionSelectedEvaluatorId(path)).toBe("quick-mode");
    // Lives in the per-machine `companion` section, never a database setting
    // — changing it must never touch the shared `user.id` default.
    expect(loadInstallConfig(path).companion?.selectedUserId).toBe(
      "test-user-0.6.2",
    );

    setCompanionSelectedUserId(undefined, path);
    expect(getCompanionSelectedUserId(path)).toBeUndefined();
    // Clearing the learner selection preserves the unrelated evaluator key.
    expect(getCompanionSelectedEvaluatorId(path)).toBe("quick-mode");
  });

  it("round-trips the persisted explicit VS Code model choice independently of the evaluator id", () => {
    const path = tempConfigPath();
    expect(getCompanionSelectedVscodeModelId(path)).toBeUndefined();

    setCompanionSelectedEvaluatorId("vscode-lm", path);
    setCompanionSelectedVscodeModelId("copilot-claude-sonnet-5", path);

    expect(getCompanionSelectedEvaluatorId(path)).toBe("vscode-lm");
    expect(getCompanionSelectedVscodeModelId(path)).toBe(
      "copilot-claude-sonnet-5",
    );
    expect(loadInstallConfig(path).companion?.selectedVscodeModelId).toBe(
      "copilot-claude-sonnet-5",
    );

    setCompanionSelectedVscodeModelId(undefined, path);
    expect(getCompanionSelectedVscodeModelId(path)).toBeUndefined();
    // Clearing the model choice preserves the unrelated evaluator id.
    expect(getCompanionSelectedEvaluatorId(path)).toBe("vscode-lm");
  });

  it("round-trips the persisted explicit Antigravity model choice independently", () => {
    const path = tempConfigPath();
    expect(getCompanionSelectedAntigravityModelId(path)).toBeUndefined();

    setCompanionSelectedAntigravityModelId("google:gemini-3.5-flash", path);

    expect(getCompanionSelectedAntigravityModelId(path)).toBe(
      "google:gemini-3.5-flash",
    );
    expect(loadInstallConfig(path).companion?.selectedAntigravityModelId).toBe(
      "google:gemini-3.5-flash",
    );

    setCompanionSelectedAntigravityModelId(undefined, path);
    expect(getCompanionSelectedAntigravityModelId(path)).toBeUndefined();
  });

  it("round-trips the separate VS Code and Antigravity evaluator selections independently", () => {
    const path = tempConfigPath();
    expect(getCompanionSelectedVscodeEvaluatorId(path)).toBeUndefined();
    expect(getCompanionSelectedAntigravityEvaluatorId(path)).toBeUndefined();

    setCompanionSelectedVscodeEvaluatorId("vscode-lm", path);
    setCompanionSelectedAntigravityEvaluatorId("quick-mode", path);

    expect(getCompanionSelectedVscodeEvaluatorId(path)).toBe("vscode-lm");
    expect(getCompanionSelectedAntigravityEvaluatorId(path)).toBe("quick-mode");
    expect(loadInstallConfig(path).companion?.selectedVscodeEvaluatorId).toBe(
      "vscode-lm",
    );
    expect(
      loadInstallConfig(path).companion?.selectedAntigravityEvaluatorId,
    ).toBe("quick-mode");

    setCompanionSelectedVscodeEvaluatorId(undefined, path);
    expect(getCompanionSelectedVscodeEvaluatorId(path)).toBeUndefined();
    expect(getCompanionSelectedAntigravityEvaluatorId(path)).toBe("quick-mode");
  });

  it("round-trips per-surface Companion collapsed state independently", () => {
    const path = tempConfigPath();
    expect(getCompanionCollapsed(path)).toEqual({});

    setCompanionCollapsed("recall", true, path);
    expect(getCompanionCollapsed(path)).toEqual({ recall: true });

    setCompanionCollapsed("graph", false, path);
    expect(getCompanionCollapsed(path)).toEqual({
      recall: true,
      graph: false,
    });
  });

  it("preserves unrelated config keys when writing Companion preferences", () => {
    const path = tempConfigPath();
    setInstallMode("default", path);
    setAgentConnectAutoDone(true, path);

    setCompanionSelectedUserId("test-user-0.6.2", path);

    expect(getInstallMode(path)).toBe("default");
    expect(getAgentConnectAutoDone(path)).toBe(true);
  });

  it("falls back cleanly instead of crashing on a corrupt config file", () => {
    const path = tempConfigPath();
    writeFileSync(path, "{ not json", "utf-8");

    expect(getCompanionSelectedUserId(path)).toBeUndefined();
    expect(getCompanionSelectedEvaluatorId(path)).toBeUndefined();
    expect(getCompanionCollapsed(path)).toEqual({});

    // A subsequent write must not propagate the corruption forward.
    setCompanionSelectedUserId("test-user-0.6.2", path);
    expect(getCompanionSelectedUserId(path)).toBe("test-user-0.6.2");
  });

  it("falls back cleanly on a malformed (but valid JSON) companion section", () => {
    const path = tempConfigPath();
    writeFileSync(
      path,
      JSON.stringify({
        companion: {
          selectedUserId: 42, // wrong type
          collapsed: ["recall"], // array instead of a record
        },
      }),
      "utf-8",
    );

    expect(getCompanionSelectedUserId(path)).toBeUndefined();
    expect(getCompanionCollapsed(path)).toEqual({});
  });

  it("writes atomically via a temp file + rename, leaving no stray temp files behind", () => {
    const path = tempConfigPath();
    setInstallMode("default", path);
    setCompanionSelectedUserId("test-user-0.6.2", path);

    // Only the real config file should remain in the directory — the temp
    // file used for the atomic write is renamed over the target, never left
    // behind, regardless of how many saves ran.
    const entries = readdirSync(dirname(path));
    expect(entries).toEqual([basename(path)]);
    const reloaded = JSON.parse(readFileSync(path, "utf-8"));
    expect(reloaded.mode).toBe("default");
    expect(reloaded.companion.selectedUserId).toBe("test-user-0.6.2");
  });

  it("recovers cleanly from a torn config file left by an interrupted write", () => {
    const path = tempConfigPath();
    setInstallMode("default", path);
    setAgentConnectAutoDone(true, path);

    // Simulate a crash mid-write: half a JSON document on disk.
    writeFileSync(path, '{"mode":"defau', "utf-8");
    expect(loadInstallConfig(path)).toEqual({});

    // A subsequent setter can only load {} from the torn file (the merge
    // behavior is unchanged — it is not this atomic-write fix's job to
    // recover the lost fields), but its own write goes through the same
    // temp-file + rename path, so it leaves a fully-formed file behind
    // instead of compounding the corruption.
    setAgentConnectAutoDone(true, path);
    expect(getAgentConnectAutoDone(path)).toBe(true);
    expect(JSON.parse(readFileSync(path, "utf-8"))).toEqual({
      agent: { connectAutoDone: true },
    });
  });

  it("applies a batch of Companion preference changes with one load and one save", () => {
    const path = tempConfigPath();
    // An unrelated Companion key already on disk must survive the batch.
    setCompanionSelectedVscodeModelId("existing-model", path);

    const result = updateMachineCompanionConfig(
      {
        selectedUserId: "test-user-0.6.2",
        selectedEvaluatorId: "quick-mode",
        collapsed: { surface: "recall", value: true },
      },
      path,
    );

    expect(result).toEqual({
      selectedUserId: "test-user-0.6.2",
      selectedEvaluatorId: "quick-mode",
      selectedVscodeModelId: "existing-model",
      collapsed: { recall: true },
    });
    expect(getCompanionSelectedUserId(path)).toBe("test-user-0.6.2");
    expect(getCompanionSelectedEvaluatorId(path)).toBe("quick-mode");
    expect(getCompanionCollapsed(path)).toEqual({ recall: true });
    expect(getCompanionSelectedVscodeModelId(path)).toBe("existing-model");
  });

  it("merges a second collapsed surface into the batch update instead of replacing the map", () => {
    const path = tempConfigPath();
    updateMachineCompanionConfig(
      { collapsed: { surface: "recall", value: true } },
      path,
    );
    updateMachineCompanionConfig(
      { collapsed: { surface: "graph", value: false } },
      path,
    );

    expect(getCompanionCollapsed(path)).toEqual({
      recall: true,
      graph: false,
    });
  });

  it("clears a Companion field via the batch update when it is explicitly present but undefined", () => {
    const path = tempConfigPath();
    setCompanionSelectedUserId("test-user-0.6.2", path);
    setCompanionSelectedEvaluatorId("quick-mode", path);

    updateMachineCompanionConfig({ selectedUserId: undefined }, path);

    expect(getCompanionSelectedUserId(path)).toBeUndefined();
    // Unrelated key untouched by the clear.
    expect(getCompanionSelectedEvaluatorId(path)).toBe("quick-mode");
  });

  it("detects file-sync providers from a folder path", () => {
    expect(
      detectSyncProvider("/Users/x/Library/CloudStorage/OneDrive-Personal/zam"),
    ).toBe("OneDrive");
    expect(detectSyncProvider("/Users/x/Dropbox/zam")).toBe("Dropbox");
    expect(
      detectSyncProvider(
        "/Users/x/Library/CloudStorage/GoogleDrive-x/My Drive/zam",
      ),
    ).toBe("Google Drive");
    expect(
      detectSyncProvider(
        "/Users/x/Library/Mobile Documents/com~apple~CloudDocs/zam",
      ),
    ).toBe("iCloud Drive");
    expect(detectSyncProvider("/Users/x/Documents/zam")).toBeNull();
  });
});

describe("cross-process config writes", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function tempConfigPath(): string {
    const dir = mkdtempSync(join(tmpdir(), "zam-config-lock-"));
    tempDirs.push(dir);
    return join(dir, "config.json");
  }

  /**
   * Append `rounds` distinct keys to the Companion section from a separate OS
   * process, so several writers' load-mutate-save cycles really interleave.
   * `saveInstallConfig` replaces the file atomically, so a torn read is not
   * what this exercises — the question is whether one writer's snapshot of the
   * *whole* config silently drops another writer's concurrent change.
   */
  function writerProcess(
    path: string,
    writer: string,
    rounds: number,
  ): ReturnType<typeof spawn> {
    // The writers wait on a barrier file before starting: without it, Node's
    // startup cost staggers them so far apart that their read-modify-write
    // windows never overlap and the race under test cannot occur.
    const script = `
      const { existsSync } = await import("node:fs");
      const { setCompanionCollapsed } = await import(${JSON.stringify(
        pathToFileURL(join(process.cwd(), "dist", "index.js")).href,
      )});
      const idle = new Int32Array(new SharedArrayBuffer(4));
      while (!existsSync(${JSON.stringify(`${path}.start`)})) {
        Atomics.wait(idle, 0, 0, 5);
      }
      for (let i = 0; i < ${rounds}; i += 1) {
        setCompanionCollapsed(
          ${JSON.stringify(writer)} + "-" + i,
          true,
          ${JSON.stringify(path)},
        );
      }
    `;
    return spawn(process.execPath, ["--input-type=module", "-e", script], {
      stdio: "ignore",
    });
  }

  it("keeps concurrent Companion writes from overwriting each other", async () => {
    const path = tempConfigPath();
    const writers = ["alpha", "beta", "gamma", "delta"];
    const rounds = 150;

    const running = writers.map(
      (writer) =>
        new Promise<void>((resolve, reject) => {
          const child = writerProcess(path, writer, rounds);
          child.on("error", reject);
          child.on("exit", (code) =>
            code === 0
              ? resolve()
              : reject(new Error(`writer exited with ${code}`)),
          );
        }),
    );
    // Give every writer time to boot, then release them at once.
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    writeFileSync(`${path}.start`, "", "utf8");
    await Promise.all(running);

    // Every single write must have survived. With the load and the save
    // unsynchronized, a writer's snapshot drops whatever another writer
    // committed in between — the Companion setting that reverts by itself.
    const stored = getCompanionCollapsed(path);
    const missing = writers.flatMap((writer) =>
      Array.from({ length: rounds }, (_, i) => `${writer}-${i}`).filter(
        (key) => stored[key] !== true,
      ),
    );
    expect(missing).toEqual([]);
    // And no lock file is left behind to block the next write.
    expect(existsSync(`${path}.lock`)).toBe(false);
  }, 60_000);

  /**
   * Hold the config lock in a separate process for `holdMs` — a stand-in for
   * one read-modify-write on a filesystem slow enough that the critical
   * section outlives any fixed patience budget (a Windows ARM runner with a
   * scanner between every create and rename). The holder writes its own key
   * from inside the lock, so a waiter that gives up and takes the lock away
   * destroys a real write rather than just racing an empty one.
   */
  function slowHolderProcess(
    path: string,
    holdMs: number,
  ): ReturnType<typeof spawn> {
    const script = `
      const { writeFileSync } = await import("node:fs");
      const { updateInstallConfig } = await import(${JSON.stringify(
        pathToFileURL(join(process.cwd(), "dist", "index.js")).href,
      )});
      updateInstallConfig((config) => {
        writeFileSync(${JSON.stringify(`${path}.held`)}, "", "utf8");
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ${holdMs});
        config.companion = { collapsed: { "slow-holder": true } };
      }, ${JSON.stringify(path)});
    `;
    return spawn(process.execPath, ["--input-type=module", "-e", script], {
      stdio: "ignore",
    });
  }

  it("waits for a live holder instead of taking a slow lock away", async () => {
    const path = tempConfigPath();
    // Comfortably past the 2s budget this lock used to give up after.
    const child = slowHolderProcess(path, 3_000);
    const exited = new Promise<void>((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(`holder exited with ${code}`)),
      );
    });

    // Only start competing once the holder is provably inside its lock.
    while (!existsSync(`${path}.held`)) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    setCompanionCollapsed("waiter", true, path);
    await exited;

    // Neither write may be lost: the waiter must have queued behind the slow
    // holder and re-read its committed value, not overwritten it.
    expect(getCompanionCollapsed(path)).toEqual({
      "slow-holder": true,
      waiter: true,
    });
    expect(existsSync(`${path}.lock`)).toBe(false);
  }, 30_000);

  it("does not remove a lock another writer has taken over", () => {
    const path = tempConfigPath();
    const lockPath = `${path}.lock`;

    updateInstallConfig((config) => {
      // A waiter that gave up broke our lock and took it for itself: same
      // path, same pid on this machine, different owner.
      writeFileSync(lockPath, `${process.pid}\nsomeone-else\n`, "utf8");
      config.companion = { collapsed: { held: true } };
    }, path);

    // Releasing ours must leave the new owner's lock in place — otherwise one
    // stolen lock cascades into a run of unprotected writes.
    expect(existsSync(lockPath)).toBe(true);
    expect(readFileSync(lockPath, "utf8")).toContain("someone-else");
  });

  it("does not remove a lock whose owner token cannot be verified", () => {
    const path = tempConfigPath();
    const lockPath = `${path}.lock`;

    updateInstallConfig((config) => {
      // A replacement lock without a token could be from a pre-token writer
      // or a concurrent writer whose contents cannot be read yet. In neither
      // case may this process assume it still owns the path and delete it.
      writeFileSync(lockPath, `${process.pid}\n`, "utf8");
      config.companion = { collapsed: { held: true } };
    }, path);

    expect(existsSync(lockPath)).toBe(true);
    expect(readFileSync(lockPath, "utf8")).toBe(`${process.pid}\n`);
  });

  it("does not wedge behind a lock no holder can be read from", () => {
    const path = tempConfigPath();
    // A directory where the lock file belongs: it can never be acquired, read,
    // or removed. Waiting on a live holder is right; waiting on this is not,
    // so the write must still land promptly rather than after the full budget.
    mkdirSync(`${path}.lock`);

    const started = Date.now();
    setCompanionCollapsed("recall", true, path);

    expect(getCompanionCollapsed(path)).toEqual({ recall: true });
    expect(Date.now() - started).toBeLessThan(4_000);
  });

  /**
   * Rename that tolerates Windows briefly refusing a directory another process
   * has just touched. The waiter polls the lock path every few milliseconds,
   * so an unlucky overlap is EPERM/EBUSY rather than a real failure.
   */
  function renameWithRetry(from: string, to: string): void {
    for (let attempt = 0; ; attempt += 1) {
      try {
        renameSync(from, to);
        return;
      } catch (error) {
        if (attempt >= 20) throw error;
        const until = Date.now() + 20;
        while (Date.now() < until) {
          // Busy-wait: this runs between two timed steps of the scenario.
        }
      }
    }
  }

  /**
   * A writer that announces itself before queueing for the lock, so the test
   * can time the rest of the scenario from "this process is now waiting".
   */
  function waitingWriterProcess(
    path: string,
    writer: string,
  ): ReturnType<typeof spawn> {
    const script = `
      const { writeFileSync } = await import("node:fs");
      const { setCompanionCollapsed } = await import(${JSON.stringify(
        pathToFileURL(join(process.cwd(), "dist", "index.js")).href,
      )});
      writeFileSync(${JSON.stringify(`${path}.waiting`)}, "", "utf8");
      setCompanionCollapsed(
        ${JSON.stringify(writer)},
        true,
        ${JSON.stringify(path)},
      );
    `;
    return spawn(process.execPath, ["--input-type=module", "-e", script], {
      stdio: "ignore",
    });
  }

  it("does not skip the lock when the path refuses it after a long wait", async () => {
    const path = tempConfigPath();
    const lockPath = `${path}.lock`;
    // This process is the holder: a live pid, so a waiter has to queue rather
    // than decide the lock is abandoned.
    writeFileSync(lockPath, `${process.pid}\nholder-token\n`, "utf8");

    const child = waitingWriterProcess(path, "waiter");
    const exited = new Promise<void>((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(`waiter exited with ${code}`)),
      );
    });
    while (!existsSync(`${path}.waiting`)) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Queue the waiter for longer than the transient-refusal retry budget…
    await new Promise((resolve) => setTimeout(resolve, 600));
    // …then make the create fail with something other than EEXIST, the way
    // Windows does with EPERM/EBUSY while the previous holder's unlink is
    // still in flight. Moving the directory aside is the portable stand-in:
    // ENOENT everywhere, and atomic — deleting it instead would take the lock
    // file with it and hand the waiter the lock for real. A waiter that counts
    // its time queueing against the retry budget gives up on this first
    // refusal and writes unsynchronized, dropping what the holder commits next.
    const dir = dirname(path);
    const asideDir = `${dir}-aside`;
    renameWithRetry(dir, asideDir);
    await new Promise((resolve) => setTimeout(resolve, 150));
    // Commit the holder's write where the directory is about to reappear, so
    // it is already on disk the moment the path becomes usable again.
    saveInstallConfig({ companion: { collapsed: { "slow-holder": true } } },
      join(asideDir, basename(path)),
    );
    // A waiter that already gave up has recreated the directory for its
    // unsynchronized write; drop it so the real one can come back.
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 20 });
    renameWithRetry(asideDir, dir);
    await exited;

    // Both writes must survive: the waiter has to have taken the lock once the
    // path recovered and re-read what the holder committed.
    expect(getCompanionCollapsed(path)).toEqual({
      "slow-holder": true,
      waiter: true,
    });
    expect(existsSync(lockPath)).toBe(false);
  }, 30_000);

  it("breaks a lock left behind by a process that died holding it", () => {
    const path = tempConfigPath();
    const lockPath = `${path}.lock`;
    writeFileSync(lockPath, "999999\n", "utf8");
    const stale = Date.now() - 60_000;
    utimesSync(lockPath, new Date(stale), new Date(stale));

    setCompanionCollapsed("recall", true, path);

    expect(getCompanionCollapsed(path)).toEqual({ recall: true });
    expect(existsSync(lockPath)).toBe(false);
  });
});
