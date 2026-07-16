import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildVscodeCliInvocation,
  installVscodeExtension,
  planVscodeExtensionInstall,
  resolveVscodeExecutable,
} from "../../src/cli/vscode-extension.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "zam-vscode-extension-"));
  tempDirs.push(root);
  const home = join(root, "home");
  const assetsDir = join(root, "assets");
  mkdirSync(assetsDir, { recursive: true });
  const vsixPath = join(assetsDir, "ZAM_Companion_0.10.3.vsix");
  writeFileSync(vsixPath, "fixture");
  return { root, home, assetsDir, vsixPath };
}

describe("buildVscodeCliInvocation", () => {
  it("wraps Windows .cmd shims in a shell with quoted command and args", () => {
    const invocation = buildVscodeCliInvocation(
      "C:\\Users\\test\\AppData\\Local\\Programs\\Microsoft VS Code\\bin\\code.cmd",
      ["--install-extension", "C:\\assets\\ZAM Companion.vsix", "--force"],
      "win32",
    );
    expect(invocation).toEqual({
      command:
        '"C:\\Users\\test\\AppData\\Local\\Programs\\Microsoft VS Code\\bin\\code.cmd"',
      args: [
        '"--install-extension"',
        '"C:\\assets\\ZAM Companion.vsix"',
        '"--force"',
      ],
      shell: true,
    });
  });

  it("matches .CMD and .bat case-insensitively", () => {
    expect(
      buildVscodeCliInvocation("C:\\bin\\code.CMD", [], "win32").shell,
    ).toBe(true);
    expect(buildVscodeCliInvocation("C:\\bin\\code.BAT", [], "win32").shell).toBe(
      true,
    );
  });

  it("spawns Windows .exe targets directly without a shell", () => {
    const invocation = buildVscodeCliInvocation(
      "C:\\bin\\code.exe",
      ["--version"],
      "win32",
    );
    expect(invocation).toEqual({
      command: "C:\\bin\\code.exe",
      args: ["--version"],
      shell: false,
    });
  });

  it("spawns directly on non-Windows platforms", () => {
    const invocation = buildVscodeCliInvocation(
      "/usr/local/bin/code",
      ["--install-extension", "/tmp/a.vsix"],
      "linux",
    );
    expect(invocation).toEqual({
      command: "/usr/local/bin/code",
      args: ["--install-extension", "/tmp/a.vsix"],
      shell: false,
    });
  });
});

describe("VS Code Companion installation", () => {
  it("resolves the standard macOS CLI when code is not on PATH", () => {
    expect(
      resolveVscodeExecutable({
        home: "/Users/test",
        platform: "darwin",
        find: () => null,
        exists: (path) =>
          path ===
          "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
      }),
    ).toBe(
      "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
    );
  });

  it("plans the packaged VSIX and user launch configuration", () => {
    const { home, assetsDir, vsixPath } = fixture();
    const plan = planVscodeExtensionInstall({
      home,
      assetsDir,
      version: "0.10.3",
      zamPath: "/usr/local/bin/zam",
      codePath: "/usr/local/bin/code",
    });
    expect(plan.vsixPath).toBe(vsixPath);
    expect(plan.launchConfigPath).toBe(
      join(home, ".zam", "vscode-launch.json"),
    );
    expect(plan.launch).toEqual({
      command: "/usr/local/bin/zam",
      args: ["mcp"],
    });
  });

  it("installs idempotently and records the exact ZAM launch", () => {
    const { home, assetsDir, vsixPath } = fixture();
    const calls: Array<{ command: string; args: string[] }> = [];
    const options = {
      home,
      assetsDir,
      version: "0.10.3",
      zamPath: "/usr/local/bin/zam",
      codePath: "/usr/local/bin/code",
      run: (command: string, args: string[]) => calls.push({ command, args }),
    };

    const first = installVscodeExtension(options);
    const second = installVscodeExtension(options);
    expect(first.action).toBe("installed");
    expect(second.action).toBe("unchanged");
    expect(calls).toEqual([
      {
        command: "/usr/local/bin/code",
        args: ["--install-extension", vsixPath, "--force"],
      },
      {
        command: "/usr/local/bin/code",
        args: ["--install-extension", vsixPath, "--force"],
      },
    ]);
    expect(JSON.parse(readFileSync(first.launchConfigPath, "utf8"))).toEqual({
      schemaVersion: 1,
      version: "0.10.3",
      command: "/usr/local/bin/zam",
      args: ["mcp"],
    });
  });

  it("keeps a newer installed Companion instead of downgrading", () => {
    const { home, assetsDir } = fixture();
    const calls: string[][] = [];
    const result = installVscodeExtension({
      home,
      assetsDir,
      version: "0.10.3",
      zamPath: "/usr/local/bin/zam",
      codePath: "/usr/local/bin/code",
      run: (_command, args) => calls.push(args),
      query: () => "other.extension@1.0.0\nzam-os.zam-companion@0.11.0\n",
    });
    expect(result.action).toBe("kept-newer");
    expect(calls).toEqual([]);
    expect(existsSync(result.launchConfigPath)).toBe(false);
  });

  it("still reinstalls same-version and older installed Companions", () => {
    const { home, assetsDir } = fixture();
    for (const installed of ["0.10.3", "0.10.2"]) {
      const calls: string[][] = [];
      const result = installVscodeExtension({
        home,
        assetsDir,
        version: "0.10.3",
        zamPath: "/usr/local/bin/zam",
        codePath: "/usr/local/bin/code",
        run: (_command, args) => calls.push(args),
        query: () => `zam-os.zam-companion@${installed}\n`,
      });
      expect(result.action).not.toBe("kept-newer");
      expect(calls).toHaveLength(1);
    }
  });

  it("installs anyway when the installed version cannot be determined", () => {
    const { home, assetsDir } = fixture();
    const calls: string[][] = [];
    const result = installVscodeExtension({
      home,
      assetsDir,
      version: "0.10.3",
      zamPath: "/usr/local/bin/zam",
      codePath: "/usr/local/bin/code",
      run: (_command, args) => calls.push(args),
      query: () => {
        throw new Error("code CLI unavailable");
      },
    });
    expect(result.action).toBe("installed");
    expect(calls).toHaveLength(1);
  });

  it("does not execute or write during a dry run", () => {
    const { home, assetsDir } = fixture();
    let ran = false;
    const result = installVscodeExtension({
      home,
      assetsDir,
      version: "0.10.3",
      zamPath: "zam",
      codePath: "code",
      dryRun: true,
      run: () => {
        ran = true;
      },
    });
    expect(result.action).toBe("planned");
    expect(ran).toBe(false);
  });
});
