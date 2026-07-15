import { describe, expect, it } from "vitest";
import type { CliInstallReport } from "../../src/cli/cli-install.js";
import {
  type InstallRepairAgentSummary,
  performInstallRepair,
} from "../../src/cli/install-repair.js";

function cliReport(overrides: Partial<CliInstallReport>): CliInstallReport {
  return {
    status: "ok",
    binDir: "/home/user/.zam/bin",
    shimPath: "/home/user/.zam/bin/zam",
    nodePath: "/app/runtime/node",
    cliPath: "/app/dist/cli/index.js",
    onPath: true,
    pathUpdated: false,
    needsNewTerminal: false,
    ...overrides,
  };
}

const agentSummary: InstallRepairAgentSummary = {
  success: true,
  detected: ["vscode"],
  connected: 1,
  companion: "updated",
  errors: [],
};

describe("performInstallRepair", () => {
  it("skips when the version already ran with ifVersionChanged", () => {
    let installed = 0;
    const report = performInstallRepair(
      { ifVersionChanged: true },
      {
        version: () => "1.2.3",
        getLastRepaired: () => "1.2.3",
        setLastRepaired: () => {
          throw new Error("must not stamp a skipped run");
        },
        installCli: () => {
          installed += 1;
          return cliReport({});
        },
      },
    );
    expect(report.skipped).toBe(true);
    expect(report.version).toBe("1.2.3");
    expect(report.cli).toBeNull();
    expect(installed).toBe(0);
  });

  it("runs all repairs, points agents at the shim, and stamps the version", () => {
    const stamped: string[] = [];
    let findZamResult: string | null | undefined;
    const report = performInstallRepair(
      { ifVersionChanged: true },
      {
        version: () => "1.2.4",
        getLastRepaired: () => "1.2.3",
        setLastRepaired: (version) => stamped.push(version),
        installCli: () =>
          cliReport({ status: "installed", needsNewTerminal: true }),
        repairWorkspaces: () => ({ provisioned: 2, missing: 1, relinked: 3 }),
        connectAgents: (deps) => {
          findZamResult = deps.findZam?.();
          return agentSummary;
        },
      },
    );
    expect(report.skipped).toBe(false);
    expect(report.cli?.status).toBe("installed");
    expect(report.workspaces).toEqual({
      provisioned: 2,
      missing: 1,
      relinked: 3,
    });
    expect(report.agents).toEqual(agentSummary);
    expect(findZamResult).toBe("/home/user/.zam/bin/zam");
    expect(stamped).toEqual(["1.2.4"]);
  });

  it("keeps the default zam lookup when another install provides zam", () => {
    let sawFindZam: unknown = "unset";
    performInstallRepair(
      {},
      {
        version: () => "1.2.4",
        setLastRepaired: () => {},
        installCli: () =>
          cliReport({ status: "external", detail: "/usr/local/bin/zam" }),
        repairWorkspaces: () => ({ provisioned: 0, missing: 0, relinked: 0 }),
        connectAgents: (deps) => {
          sawFindZam = deps.findZam;
          return agentSummary;
        },
      },
    );
    expect(sawFindZam).toBeUndefined();
  });

  it("reports agent failures without blocking the version stamp", () => {
    const stamped: string[] = [];
    const report = performInstallRepair(
      {},
      {
        version: () => "1.2.4",
        setLastRepaired: (version) => stamped.push(version),
        installCli: () => cliReport({}),
        repairWorkspaces: () => ({ provisioned: 1, missing: 0, relinked: 0 }),
        connectAgents: () => {
          throw new Error("code binary crashed");
        },
      },
    );
    expect(report.agents?.success).toBe(false);
    expect(report.agents?.errors).toEqual(["code binary crashed"]);
    expect(stamped).toEqual(["1.2.4"]);
  });
});
