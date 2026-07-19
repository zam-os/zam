import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  installCliShim,
  unixShimContent,
  windowsShimContent,
} from "../../src/cli/cli-install.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "zam-cli-install-"));
  tempDirs.push(root);
  const home = join(root, "home");
  mkdirSync(home, { recursive: true });
  const appDir = join(root, "app");
  const cliPath = join(appDir, "dist", "cli", "index.js");
  mkdirSync(join(appDir, "dist", "cli"), { recursive: true });
  writeFileSync(cliPath, "// built cli");
  const nodePath = join(appDir, "runtime", "node");
  mkdirSync(join(appDir, "runtime"), { recursive: true });
  writeFileSync(nodePath, "node");
  return { root, home, appDir, cliPath, nodePath };
}

describe("installCliShim", () => {
  it("skips when not running from a built dist/cli/index.js", () => {
    const { home, nodePath } = fixture();
    const report = installCliShim({
      home,
      platform: "win32",
      nodePath,
      cliPath: join(home, "src", "cli", "index.ts"),
      find: () => null,
      env: { PATH: "" },
    });
    expect(report.status).toBe("skipped");
    expect(existsSync(report.shimPath)).toBe(false);
  });

  it("never shadows an externally installed zam", () => {
    const { home, cliPath, nodePath } = fixture();
    const report = installCliShim({
      home,
      platform: "darwin",
      nodePath,
      cliPath,
      find: () => "/usr/local/bin/zam",
      env: { PATH: "/usr/local/bin" },
    });
    expect(report.status).toBe("external");
    expect(report.onPath).toBe(true);
    expect(report.detail).toBe("/usr/local/bin/zam");
    expect(existsSync(report.shimPath)).toBe(false);
  });

  it("installs a Windows zam.cmd and ensures the user PATH", () => {
    const { home, cliPath, nodePath } = fixture();
    const ensured: string[] = [];
    const report = installCliShim({
      home,
      platform: "win32",
      nodePath,
      cliPath,
      find: () => null,
      env: { PATH: "C:\\Windows\\System32" },
      ensureUserPath: (dir) => {
        ensured.push(dir);
        return true;
      },
    });
    expect(report.status).toBe("installed");
    expect(report.shimPath).toBe(join(home, ".zam", "bin", "zam.cmd"));
    expect(readFileSync(report.shimPath, "utf8")).toBe(
      windowsShimContent(nodePath, cliPath),
    );
    expect(ensured).toEqual([join(home, ".zam", "bin")]);
    expect(report.pathUpdated).toBe(true);
    expect(report.needsNewTerminal).toBe(true);
    expect(report.onPath).toBe(true);
  });

  it("reports ok without touching PATH when the shim dir is already on PATH", () => {
    const { home, cliPath, nodePath } = fixture();
    const binDir = join(home, ".zam", "bin");
    const first = installCliShim({
      home,
      platform: "win32",
      nodePath,
      cliPath,
      find: () => null,
      env: { PATH: binDir },
      ensureUserPath: () => {
        throw new Error("must not be called");
      },
    });
    expect(first.status).toBe("installed");
    expect(first.needsNewTerminal).toBe(false);

    const second = installCliShim({
      home,
      platform: "win32",
      nodePath,
      cliPath,
      // The shim itself resolving on PATH must count as "ours", not external.
      find: () => first.shimPath,
      env: { PATH: binDir },
      ensureUserPath: () => {
        throw new Error("must not be called");
      },
    });
    expect(second.status).toBe("ok");
    expect(second.pathUpdated).toBe(false);
  });

  it("refreshes a shim whose CLI target moved", () => {
    const { root, home, cliPath, nodePath } = fixture();
    const env = { PATH: join(home, ".zam", "bin") };
    installCliShim({
      home,
      platform: "win32",
      nodePath,
      cliPath,
      find: () => null,
      env,
    });

    const movedCli = join(root, "app-next", "dist", "cli", "index.js");
    mkdirSync(join(root, "app-next", "dist", "cli"), { recursive: true });
    writeFileSync(movedCli, "// built cli v2");
    const report = installCliShim({
      home,
      platform: "win32",
      nodePath,
      cliPath: movedCli,
      find: () => null,
      env,
    });
    expect(report.status).toBe("refreshed");
    expect(readFileSync(report.shimPath, "utf8")).toBe(
      windowsShimContent(nodePath, movedCli),
    );
  });

  it("installs an executable unix shim and appends the login profile once", () => {
    const { home, cliPath, nodePath } = fixture();
    const options = {
      home,
      platform: "darwin" as const,
      nodePath,
      cliPath,
      find: () => null,
      env: { PATH: "/usr/bin" },
    };
    const report = installCliShim(options);
    expect(report.status).toBe("installed");
    expect(readFileSync(report.shimPath, "utf8")).toBe(
      unixShimContent(nodePath, cliPath),
    );
    if (process.platform !== "win32") {
      // POSIX execute bits do not exist on Windows (chmod is a no-op and
      // stat reports no x-bits), so the mode assertion only runs elsewhere.
      expect(statSync(report.shimPath).mode & 0o111).not.toBe(0);
    }
    const profile = join(home, ".zprofile");
    expect(readFileSync(profile, "utf8")).toContain(".zam/bin");
    expect(report.pathUpdated).toBe(true);
    expect(report.needsNewTerminal).toBe(true);

    const second = installCliShim(options);
    expect(second.status).toBe("ok");
    expect(second.pathUpdated).toBe(false);
    expect(second.needsNewTerminal).toBe(true);
    const occurrences =
      readFileSync(profile, "utf8").split(".zam/bin").length - 1;
    expect(occurrences).toBe(1);
  });
});
