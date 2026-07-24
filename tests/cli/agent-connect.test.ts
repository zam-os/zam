import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type AgentConnectDeps,
  CONNECT_HARNESS_LABELS,
  type ConnectHarnessId,
  inspectConnectHarnesses,
  inspectHermesGateway,
  isConnectHarnessId,
  performAgentConnect,
  USER_SCOPED_CONNECT_HARNESSES,
} from "../../src/cli/agent-connect.js";

interface FakeCalls {
  writes: Array<{ path: string; content: string }>;
  copilotInstalls: Array<{ dryRun?: boolean }>;
  vscodeInstalls: Array<{ dryRun?: boolean; codePath?: string }>;
  skillRefreshes: string[];
  connectCalls: Array<{ harness: string; zamPath: string }>;
}

function makeDeps(
  overrides: Partial<AgentConnectDeps> = {},
): { deps: AgentConnectDeps; calls: FakeCalls } {
  const calls: FakeCalls = {
    writes: [],
    copilotInstalls: [],
    vscodeInstalls: [],
    skillRefreshes: [],
    connectCalls: [],
  };

  const deps: AgentConnectDeps = {
    home: "/home/user",
    cwd: "/workspace",
    copilotHome: undefined,
    findZam: () => "/usr/local/bin/zam",
    detect: () => ["codex", "goose"] as ConnectHarnessId[],
    connectMcp: ((harness: string, opts: { zamPath: string }) => {
      calls.connectCalls.push({ harness, zamPath: opts.zamPath });
      return {
        path: `/home/user/config/${harness}`,
        content: `config-for-${harness}`,
        alreadyConfigured: false,
        hint: `hint-${harness}`,
      };
    }) as AgentConnectDeps["connectMcp"],
    writeConfig: (path, content) => {
      calls.writes.push({ path, content });
    },
    installCopilot: ((opts: { dryRun?: boolean }) => {
      calls.copilotInstalls.push({ dryRun: opts.dryRun });
      return {
        action: opts.dryRun ? "planned" : "installed",
        destinationDir: "/home/user/.copilot/extensions/zam",
        launch: { command: "node", args: ["host.js", "--stdio"] },
      };
    }) as unknown as AgentConnectDeps["installCopilot"],
    installVscode: ((opts: { dryRun?: boolean; codePath?: string }) => {
      calls.vscodeInstalls.push({
        dryRun: opts.dryRun,
        codePath: opts.codePath,
      });
      return {
        action: opts.dryRun ? "planned" : "installed",
        vsixPath: "/dist/ZAM_Companion.vsix",
        launchConfigPath: "/home/user/.zam/vscode-launch.json",
      };
    }) as unknown as AgentConnectDeps["installVscode"],
    resolveAntigravity: () => null,
    refreshSkills: (home) => {
      calls.skillRefreshes.push(home);
      return [{ success: true }, { success: true }, { success: false }];
    },
    ...overrides,
  };
  return { deps, calls };
}

describe("performAgentConnect", () => {
  it("returns an empty report when nothing is detected", () => {
    const { deps, calls } = makeDeps({ detect: () => [] });
    const report = performAgentConnect({}, deps);

    expect(report.success).toBe(true);
    expect(report.detected).toEqual([]);
    expect(report.results).toEqual([]);
    expect(report.skills).toBeNull();
    expect(calls.writes).toHaveLength(0);
    expect(calls.skillRefreshes).toHaveLength(0);
  });

  it("writes missing configs for every detected harness and refreshes skills", () => {
    const { deps, calls } = makeDeps();
    const report = performAgentConnect({}, deps);

    expect(report.success).toBe(true);
    expect(report.detected).toEqual(["codex", "goose"]);
    expect(calls.writes.map((w) => w.path)).toEqual([
      "/home/user/config/codex",
      "/home/user/config/goose",
    ]);
    expect(report.results.every((r) => r.wrote)).toBe(true);
    expect(report.results[0].label).toBe(CONNECT_HARNESS_LABELS.codex);
    expect(report.results[0].hint).toBe("hint-codex");
    expect(report.skills).toEqual({ refreshed: 2, total: 3 });
    expect(calls.skillRefreshes).toEqual(["/home/user"]);
    expect(report.zamOnPath).toBe(true);
    expect(calls.connectCalls[0].zamPath).toBe("/usr/local/bin/zam");
  });

  it("leaves already-configured harnesses untouched (idempotent)", () => {
    const { deps, calls } = makeDeps();
    deps.connectMcp = ((harness: string) => ({
      path: `/home/user/config/${harness}`,
      content: "existing",
      alreadyConfigured: true,
      hint: "",
    })) as AgentConnectDeps["connectMcp"];

    const report = performAgentConnect({}, deps);
    expect(calls.writes).toHaveLength(0);
    expect(report.results.every((r) => r.alreadyConfigured && !r.wrote)).toBe(
      true,
    );
    expect(report.skills).not.toBeNull();
  });

  it("connects one explicit harness without running detection", () => {
    const { deps, calls } = makeDeps({
      detect: () => {
        throw new Error("detection must not run for an explicit harness");
      },
    });
    const report = performAgentConnect({ harness: "vscode" }, deps);

    expect(report.detected).toEqual(["vscode"]);
    expect(calls.vscodeInstalls).toEqual([{ dryRun: false, codePath: undefined }]);
    expect(report.results[0].extension).toEqual({
      kind: "vscode",
      action: "installed",
      location: "/dist/ZAM_Companion.vsix",
      detail: "/home/user/.zam/vscode-launch.json",
    });
  });

  it("plans everything on dryRun without writing or refreshing skills", () => {
    const { deps, calls } = makeDeps();
    const report = performAgentConnect(
      { harness: "vscode", dryRun: true },
      deps,
    );

    expect(calls.writes).toHaveLength(0);
    expect(calls.skillRefreshes).toHaveLength(0);
    expect(calls.vscodeInstalls[0].dryRun).toBe(true);
    expect(report.skills).toBeNull();
    expect(report.results[0].extension?.action).toBe("planned");
    expect(report.results[0].content).toBe("config-for-vscode");
  });

  it("captures the copilot launch line in the extension outcome", () => {
    const { deps } = makeDeps();
    const report = performAgentConnect({ harness: "copilot" }, deps);
    expect(report.results[0].extension).toMatchObject({
      kind: "copilot",
      detail: "node host.js --stdio",
    });
  });

  it("installs the companion for antigravity only when the IDE resolves", () => {
    const without = makeDeps();
    expect(
      performAgentConnect({ harness: "antigravity" }, without.deps).results[0]
        .extension,
    ).toBeNull();
    expect(without.calls.vscodeInstalls).toHaveLength(0);

    const withIde = makeDeps({
      resolveAntigravity: () => "/bin/antigravity-ide",
    });
    const report = performAgentConnect({ harness: "antigravity" }, withIde.deps);
    expect(withIde.calls.vscodeInstalls).toEqual([
      { dryRun: false, codePath: "/bin/antigravity-ide" },
    ]);
    expect(report.results[0].extension?.kind).toBe("vscode");
  });

  it("records a per-harness error without blocking the others", () => {
    const { deps, calls } = makeDeps();
    const okConnect = deps.connectMcp as NonNullable<
      AgentConnectDeps["connectMcp"]
    >;
    deps.connectMcp = ((harness: string, opts: never) => {
      if (harness === "codex") {
        throw new Error("existing file is not valid JSON");
      }
      return okConnect(harness, opts);
    }) as AgentConnectDeps["connectMcp"];

    const report = performAgentConnect({}, deps);
    expect(report.success).toBe(false);
    expect(report.results[0].error).toContain("not valid JSON");
    expect(report.results[1].wrote).toBe(true);
    expect(calls.writes.map((w) => w.path)).toEqual([
      "/home/user/config/goose",
    ]);
    expect(report.skills).not.toBeNull();
  });

  it("falls back to the literal 'zam' when the executable is not on PATH", () => {
    const { deps, calls } = makeDeps({ findZam: () => null });
    const report = performAgentConnect({ harness: "goose" }, deps);
    expect(report.zamOnPath).toBe(false);
    expect(report.zamPath).toBe("zam");
    expect(calls.connectCalls[0].zamPath).toBe("zam");
  });
});

describe("inspectConnectHarnesses", () => {
  it("reports the user-scoped harnesses plus Claude Code without touching disk", () => {
    const { deps, calls } = makeDeps({
      detect: () => ["codex", "vscode"] as ConnectHarnessId[],
    });
    deps.connectMcp = ((harness: string) => ({
      path: `/home/user/config/${harness}`,
      content: "",
      alreadyConfigured: harness === "vscode",
      hint: "",
    })) as AgentConnectDeps["connectMcp"];

    const report = inspectConnectHarnesses(deps);
    // Claude Code is probed too (finding: it was silently excluded from the
    // inventory, so it was always reported configured:false with no
    // supporting evidence). It is appended after the seven auto-detectable
    // harnesses, never added to USER_SCOPED_CONNECT_HARNESSES itself — that
    // constant still drives auto-detection and stays claude-code-free.
    expect(report.harnesses.map((h) => h.harness)).toEqual([
      ...USER_SCOPED_CONNECT_HARNESSES,
      "claude-code",
    ]);

    const byId = new Map(report.harnesses.map((h) => [h.harness, h]));
    expect(byId.get("codex")).toMatchObject({
      installed: true,
      configured: false,
    });
    expect(byId.get("vscode")).toMatchObject({
      installed: true,
      configured: true,
    });
    expect(byId.get("goose")).toMatchObject({
      installed: false,
      configured: false,
    });
    // Claude Code is never in `detect()`'s output (workspace-scoped, not
    // machine-detectable), so "installed" honestly stays false; "configured"
    // reflects the same connectMcp probe as every other harness — here the
    // stub returns alreadyConfigured only for "vscode", so false.
    expect(byId.get("claude-code")).toMatchObject({
      installed: false,
      configured: false,
    });
    expect(calls.writes).toHaveLength(0);
  });

  it("reports claude-code as configured only when the cwd's .mcp.json already has a matching zam entry", () => {
    const cwd = mkdtempSync(join(tmpdir(), "zam-claude-code-probe-"));
    try {
      const { deps } = makeDeps({ cwd, connectMcp: undefined });

      const before = inspectConnectHarnesses(deps);
      expect(
        before.harnesses.find((h) => h.harness === "claude-code")?.configured,
      ).toBe(false);

      writeFileSync(
        join(cwd, ".mcp.json"),
        JSON.stringify({
          mcpServers: {
            zam: { command: deps.findZam?.() ?? "zam", args: ["mcp"] },
          },
        }),
        "utf-8",
      );

      const after = inspectConnectHarnesses(deps);
      const claudeCode = after.harnesses.find(
        (h) => h.harness === "claude-code",
      );
      expect(claudeCode?.configured).toBe(true);
      expect(claudeCode?.configPath).toBe(join(cwd, ".mcp.json"));
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("degrades an unreadable host config to a note instead of failing", () => {
    const { deps } = makeDeps();
    deps.connectMcp = ((harness: string) => {
      if (harness === "codex") throw new Error("broken TOML");
      return {
        path: `/home/user/config/${harness}`,
        content: "",
        alreadyConfigured: false,
        hint: "",
      };
    }) as AgentConnectDeps["connectMcp"];

    const report = inspectConnectHarnesses(deps);
    const codex = report.harnesses.find((h) => h.harness === "codex");
    expect(codex?.note).toContain("broken TOML");
    expect(codex?.configured).toBe(false);
    expect(
      report.harnesses.filter((h) => h.harness !== "codex").every((h) => !h.note),
    ).toBe(true);
  });
});

describe("isConnectHarnessId", () => {
  it("accepts the supported ids and rejects the rest", () => {
    expect(isConnectHarnessId("codex")).toBe(true);
    expect(isConnectHarnessId("claude-code")).toBe(true);
    expect(isConnectHarnessId("hermes")).toBe(true);
    expect(isConnectHarnessId("cursor")).toBe(false);
    expect(isConnectHarnessId("bogus")).toBe(false);
  });
});

describe("inspectHermesGateway (plan Phase 5)", () => {
  it("reports not-installed without probing anything", () => {
    let probed = false;
    const result = inspectHermesGateway({
      find: () => null,
      execStatus: () => {
        probed = true;
        return { ok: true, output: "running" };
      },
    });
    expect(result).toEqual({
      installed: false,
      gatewayRunning: null,
      detail: "Hermes is not installed (no `hermes` on PATH).",
    });
    expect(probed).toBe(false);
  });

  it("reports a running gateway from the status command", () => {
    const result = inspectHermesGateway({
      find: () => "/usr/bin/hermes",
      execStatus: () => ({ ok: true, output: "Gateway: running (3 channels)" }),
    });
    expect(result.installed).toBe(true);
    expect(result.gatewayRunning).toBe(true);
  });

  it("reports a stopped gateway honestly, without starting it", () => {
    for (const status of [
      { ok: true, output: "Gateway: not running" },
      { ok: false, output: "exit 1: gateway stopped" },
    ]) {
      const result = inspectHermesGateway({
        find: () => "/usr/bin/hermes",
        execStatus: () => status,
      });
      expect(result.installed).toBe(true);
      expect(result.gatewayRunning).toBe(false);
      expect(result.detail).toContain("hermes gateway");
    }
  });

  it("reports unknown when the status subcommand is unsupported", () => {
    const result = inspectHermesGateway({
      find: () => "/usr/bin/hermes",
      execStatus: () => ({
        ok: false,
        output: "Unknown command: gateway\nUsage: hermes <command>",
      }),
    });
    expect(result.installed).toBe(true);
    expect(result.gatewayRunning).toBeNull();
  });
});
