import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

/**
 * Load-time smoke test for the built VS Code Companion bundle.
 *
 * The 0.10.11 live test surfaced an activation crash the whole test suite
 * missed: a module-scope `createRequire(import.meta.url)` in a kernel module
 * compiled to `createRequire(undefined)` in the CJS extension bundle and
 * threw before `activate` was even reachable — every Companion bridge call
 * then failed with MCP error -32603. Type checking cannot catch this
 * (the TypeScript sources are valid ESM); only actually loading the built
 * CJS artifact does. So this test requires the real `dist` bundle inside a
 * plain Node child process with a stub `vscode` module, exactly like the
 * extension host does at activation.
 */
const bundlePath = resolve(
  __dirname,
  "..",
  "..",
  "dist",
  "vscode-extension",
  "extension.cjs",
);

const tempDirs: string[] = [];
afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

describe("vscode extension bundle", () => {
  it.skipIf(!existsSync(bundlePath))(
    "loads as CommonJS with only a stub vscode module present",
    () => {
      const dir = mkdtempSync(join(tmpdir(), "zam-ext-load-"));
      tempDirs.push(dir);
      mkdirSync(join(dir, "node_modules", "vscode"), { recursive: true });
      writeFileSync(
        join(dir, "node_modules", "vscode", "index.js"),
        "module.exports = {};\n",
        "utf8",
      );
      copyFileSync(bundlePath, join(dir, "extension.cjs"));

      const output = execFileSync(
        process.execPath,
        [
          "-e",
          "const m = require(process.argv[1]); console.log(Object.keys(m).sort().join(','))",
          join(dir, "extension.cjs"),
        ],
        { encoding: "utf8" },
      );
      expect(output.trim()).toBe("activate,deactivate");
    },
  );
});
