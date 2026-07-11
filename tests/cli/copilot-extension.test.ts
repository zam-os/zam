import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  installCopilotExtension,
  resolveCopilotHome,
  resolveCopilotZamLaunch,
} from "../../src/cli/copilot-extension.js";

const ASSET_FILES = [
  "extension.mjs",
  "host.bundle.js",
  "mcp-client.bundle.mjs",
] as const;

function withFixture(
  run: (fixture: {
    root: string;
    home: string;
    assetsDir: string;
    cliEntry: string;
  }) => void,
): void {
  const root = mkdtempSync(join(tmpdir(), "zam-copilot-extension-"));
  const home = join(root, "home");
  const assetsDir = join(root, "assets");
  const cliEntry = join(root, "package", "dist", "cli", "index.js");
  mkdirSync(assetsDir, { recursive: true });
  mkdirSync(dirname(cliEntry), { recursive: true });
  for (const file of ASSET_FILES) {
    writeFileSync(join(assetsDir, file), `fixture:${file}\n`, "utf8");
  }
  writeFileSync(
    join(assetsDir, "manifest.json"),
    `${JSON.stringify({ name: "zam-mcp-apps", version: "0.10.2" })}\n`,
    "utf8",
  );
  writeFileSync(cliEntry, "// cli fixture\n", "utf8");

  try {
    run({ root, home, assetsDir, cliEntry });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("Copilot MCP Apps extension provisioning", () => {
  it("resolves the default and configured Copilot homes", () => {
    const home = join(tmpdir(), "zam-home");
    const custom = join(tmpdir(), "zam-copilot-home");
    expect(resolveCopilotHome(home, undefined)).toBe(join(home, ".copilot"));
    expect(resolveCopilotHome(home, custom)).toBe(custom);
  });

  it("launches the built CLI through Node instead of an npm shim", () => {
    withFixture(({ cliEntry }) => {
      expect(
        resolveCopilotZamLaunch("C:\\Users\\thomas\\bin\\zam.cmd", {
          cliEntry,
          nodePath: "C:\\Program Files\\nodejs\\node.exe",
        }),
      ).toEqual({
        command: "C:\\Program Files\\nodejs\\node.exe",
        args: [cliEntry, "mcp"],
      });
    });
  });

  it("falls back to the resolved ZAM executable outside a built package", () => {
    expect(
      resolveCopilotZamLaunch("/usr/local/bin/zam", {
        cliEntry: "/missing/zam/dist/cli/index.js",
      }),
    ).toEqual({
      command: "/usr/local/bin/zam",
      args: ["mcp"],
    });
  });

  it("installs assets and a machine-specific launch configuration", () => {
    withFixture(({ home, assetsDir, cliEntry }) => {
      const result = installCopilotExtension({
        home,
        assetsDir,
        cliEntry,
        nodePath: "/runtime/node",
        zamPath: "/usr/local/bin/zam",
      });

      expect(result.action).toBe("installed");
      expect(result.destinationDir).toBe(
        join(home, ".copilot", "extensions", "zam-mcp-apps"),
      );
      expect(result.changedFiles).toEqual([
        ...ASSET_FILES,
        "manifest.json",
        "launch.json",
      ]);
      for (const file of [...ASSET_FILES, "manifest.json"]) {
        expect(readFileSync(join(result.destinationDir, file), "utf8")).toBe(
          readFileSync(join(assetsDir, file), "utf8"),
        );
      }
      expect(
        JSON.parse(
          readFileSync(join(result.destinationDir, "launch.json"), "utf8"),
        ),
      ).toEqual({
        schemaVersion: 1,
        command: "/runtime/node",
        args: [cliEntry, "mcp"],
      });
    });
  });

  it("is idempotent and only updates changed assets", () => {
    withFixture(({ home, assetsDir, cliEntry }) => {
      const options = {
        home,
        assetsDir,
        cliEntry,
        zamPath: "/usr/local/bin/zam",
      };
      installCopilotExtension(options);

      const unchanged = installCopilotExtension(options);
      expect(unchanged.action).toBe("unchanged");
      expect(unchanged.changedFiles).toEqual([]);

      writeFileSync(
        join(assetsDir, "host.bundle.js"),
        "fixture:host.bundle.js:v2\n",
        "utf8",
      );
      const updated = installCopilotExtension(options);
      expect(updated.action).toBe("updated");
      expect(updated.changedFiles).toEqual(["host.bundle.js"]);
    });
  });

  it("keeps dry runs write-free and honors COPILOT_HOME", () => {
    withFixture(({ root, home, assetsDir, cliEntry }) => {
      const copilotHome = join(root, "custom-copilot");
      const result = installCopilotExtension({
        home,
        copilotHome,
        assetsDir,
        cliEntry,
        zamPath: "/usr/local/bin/zam",
        dryRun: true,
      });

      expect(result.action).toBe("planned");
      expect(result.destinationDir).toBe(
        join(copilotHome, "extensions", "zam-mcp-apps"),
      );
      expect(existsSync(result.destinationDir)).toBe(false);
    });
  });
});
