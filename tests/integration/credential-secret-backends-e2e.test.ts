/**
 * End-to-end: vault references in credentials.json via a fake `bw` on PATH.
 *
 * Exercises the real CLI entry (dist/cli/index.js) with an isolated HOME —
 * the same surface a multi-machine learner hits after `bw unlock`.
 */
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter as pathDelimiter, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const E2E_TIMEOUT_MS = 45_000;
const VAULT_API_KEY = "e2e-vault-api-key-NEVER-PRINT";
const VAULT_TOKEN = "e2e-vault-turso-token-NEVER-PRINT";

describe("credential secret backends E2E", () => {
  let tempHome: string;
  let tempCwd: string;
  let fakeBin: string;
  let cliPath: string;
  let credentialsPath: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-secret-e2e-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-secret-e2e-cwd-"));
    fakeBin = mkdtempSync(join(tmpdir(), "zam-secret-e2e-bin-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    credentialsPath = join(tempHome, ".zam", "credentials.json");
    expect(existsSync(cliPath)).toBe(true);
    writeFakeBw(fakeBin, { mode: "ok" });
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd, fakeBin]) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best effort
      }
    }
  });

  function env(withBw = true): NodeJS.ProcessEnv {
    const pathKey = process.platform === "win32" ? "Path" : "PATH";
    const existing = process.env[pathKey] ?? process.env.PATH ?? "";
    return {
      ...process.env,
      HOME: tempHome,
      USERPROFILE: tempHome,
      [pathKey]: withBw
        ? `${fakeBin}${pathDelimiter}${existing}`
        : existing,
      // Avoid BW_SESSION from the host shell affecting the fake.
      BW_SESSION: "",
    };
  }

  function runCli(
    args: string[],
    opts: { withBw?: boolean; expectFail?: boolean } = {},
  ): { stdout: string; stderr: string; status: number } {
    try {
      const stdout = execFileSync("node", [cliPath, ...args], {
        env: env(opts.withBw !== false),
        cwd: tempCwd,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { stdout, stderr: "", status: 0 };
    } catch (err) {
      const e = err as {
        status?: number;
        stdout?: string;
        stderr?: string;
        message?: string;
      };
      if (!opts.expectFail) {
        throw new Error(
          `CLI failed (${args.join(" ")}): status=${e.status}\nstdout=${e.stdout}\nstderr=${e.stderr}\n${e.message}`,
        );
      }
      return {
        stdout: e.stdout ?? "",
        stderr: e.stderr ?? "",
        status: e.status ?? 1,
      };
    }
  }

  it(
    "stores a vault reference, resolves it at startup, and never writes or prints the secret",
    () => {
      // 1) provider set-key --key-from stores the ref and verifies resolution
      const set = runCli([
        "provider",
        "set-key",
        "openrouter",
        "--key-from",
        "bw://zam-e2e/apiKey",
      ]);
      expect(set.stdout).toMatch(/vault reference/i);
      expect(set.stdout).toContain("bw://zam-e2e/apiKey");
      expect(set.stdout).not.toContain(VAULT_API_KEY);
      expect(set.stderr).not.toContain(VAULT_API_KEY);

      // 2) On disk: reference only
      const onDisk = JSON.parse(readFileSync(credentialsPath, "utf-8")) as {
        llmProviders?: Record<string, { apiKey: unknown }>;
      };
      expect(onDisk.llmProviders?.openrouter?.apiKey).toEqual({
        $secret: "bw://zam-e2e/apiKey",
      });
      expect(JSON.stringify(onDisk)).not.toContain(VAULT_API_KEY);

      // 3) credentials check reports ok without values
      const check = runCli(["credentials", "check", "--json"]);
      const report = JSON.parse(check.stdout) as {
        credentials: Array<{
          field: string;
          kind: string;
          ok: boolean;
          ref?: string;
        }>;
      };
      const entry = report.credentials.find(
        (e) => e.field === "llmProviders.openrouter.apiKey",
      );
      expect(entry).toMatchObject({
        kind: "reference",
        ok: true,
        ref: "bw://zam-e2e/apiKey",
      });
      expect(check.stdout).not.toContain(VAULT_API_KEY);
      expect(JSON.stringify(report)).not.toContain(VAULT_API_KEY);

      // 4) A second process (fresh startup → resolveCredentials) still resolves
      const checkAgain = runCli(["credentials", "check"]);
      expect(checkAgain.stdout).toMatch(/✓.*openrouter/i);
      expect(checkAgain.stdout).not.toContain(VAULT_API_KEY);
      expect(checkAgain.status).toBe(0);
    },
    E2E_TIMEOUT_MS,
  );

  it(
    "resolves turso.token from a reference written into credentials.json",
    () => {
      mkdirSync(join(tempHome, ".zam"), { recursive: true, mode: 0o700 });
      writeFileSync(
        credentialsPath,
        `${JSON.stringify(
          {
            turso: {
              url: "libsql://e2e-db.turso.io",
              token: { $secret: "bw://zam-e2e/token" },
              mode: "remote",
            },
          },
          null,
          2,
        )}\n`,
        { encoding: "utf-8", mode: 0o600 },
      );

      const check = runCli(["credentials", "check", "--json"]);
      const report = JSON.parse(check.stdout) as {
        credentials: Array<{ field: string; ok: boolean; ref?: string }>;
      };
      expect(
        report.credentials.find((e) => e.field === "turso.token"),
      ).toMatchObject({
        ok: true,
        ref: "bw://zam-e2e/token",
      });
      expect(check.stdout).not.toContain(VAULT_TOKEN);

      // bridge server-db path reads getTursoCredentials after resolve —
      // pairing should see complete credentials (will fail later for other
      // reasons if DB unreachable; here we only assert resolution succeeded
      // via credentials check and that the disk file stayed ref-only).
      const disk = readFileSync(credentialsPath, "utf-8");
      expect(disk).toContain("$secret");
      expect(disk).not.toContain(VAULT_TOKEN);
    },
    E2E_TIMEOUT_MS,
  );

  it(
    "fails set-key when the vault is locked, without storing a usable key",
    () => {
      writeFakeBw(fakeBin, { mode: "locked" });
      const result = runCli(
        [
          "provider",
          "set-key",
          "broken",
          "--key-from",
          "bw://zam-e2e/apiKey",
        ],
        { expectFail: true },
      );
      expect(result.status).not.toBe(0);
      const combined = `${result.stdout}\n${result.stderr}`;
      expect(combined).toMatch(/locked|Could not resolve/i);
      expect(combined).not.toContain(VAULT_API_KEY);

      // Ref may be on disk (we store then resolve) but must not resolve to a key
      if (existsSync(credentialsPath)) {
        const check = runCli(["credentials", "check", "--json"], {
          expectFail: true,
        });
        const report = JSON.parse(check.stdout || "{}") as {
          credentials?: Array<{ field: string; ok: boolean; reason?: string }>;
        };
        const entry = report.credentials?.find(
          (e) => e.field === "llmProviders.broken.apiKey",
        );
        if (entry) {
          expect(entry.ok).toBe(false);
          expect(entry.reason).toBe("locked");
        }
      }
    },
    E2E_TIMEOUT_MS,
  );

  it(
    "fails with not-installed when bw is absent from PATH",
    () => {
      const result = runCli(
        [
          "provider",
          "set-key",
          "missing-cli",
          "--key-from",
          "bw://zam-e2e/apiKey",
        ],
        { withBw: false, expectFail: true },
      );
      expect(result.status).not.toBe(0);
      const combined = `${result.stdout}\n${result.stderr}`;
      expect(combined).toMatch(/not-installed|not installed|Could not resolve/i);
      expect(combined).not.toContain(VAULT_API_KEY);
    },
    E2E_TIMEOUT_MS,
  );

  it(
    "keeps literal keys working without any vault backend",
    () => {
      const literal = "sk-literal-only-key";
      const set = runCli(
        ["provider", "set-key", "local", "--key", literal],
        { withBw: false },
      );
      expect(set.stdout).toMatch(/Stored API key/);
      // maskSecret should hide the bulk of the key
      expect(set.stdout).not.toContain(literal);

      const onDisk = JSON.parse(readFileSync(credentialsPath, "utf-8")) as {
        llmProviders: Record<string, { apiKey: string }>;
      };
      expect(onDisk.llmProviders.local.apiKey).toBe(literal);

      const check = runCli(["credentials", "check", "--json"], {
        withBw: false,
      });
      const report = JSON.parse(check.stdout) as {
        credentials: Array<{ field: string; kind: string; ok: boolean }>;
      };
      expect(
        report.credentials.find(
          (e) => e.field === "llmProviders.local.apiKey",
        ),
      ).toMatchObject({ kind: "literal", ok: true });
      expect(check.stdout).not.toContain(literal);
    },
    E2E_TIMEOUT_MS,
  );
});

function writeFakeBw(
  binDir: string,
  opts: { mode: "ok" | "locked" | "not-found" },
): void {
  // Cross-platform: a small Node script named `bw` (and `bw.cmd` on Windows).
  const script = `#!/usr/bin/env node
const args = process.argv.slice(2);
const mode = ${JSON.stringify(opts.mode)};
if (args[0] === "--version") {
  process.stdout.write("2024.6.0\\n");
  process.exit(0);
}
if (args[0] === "get" && args[1] === "item") {
  const item = args[2];
  if (mode === "locked") {
    process.stderr.write("Vault is locked.\\n");
    process.exit(1);
  }
  if (mode === "not-found" || item === "missing") {
    process.stderr.write("Not found.\\n");
    process.exit(1);
  }
  const body = {
    name: item,
    notes: "note-value",
    login: { username: "user", password: ${JSON.stringify(VAULT_TOKEN)} },
    fields: [
      { name: "apiKey", value: ${JSON.stringify(VAULT_API_KEY)} },
      { name: "token", value: ${JSON.stringify(VAULT_TOKEN)} },
    ],
  };
  process.stdout.write(JSON.stringify(body));
  process.exit(0);
}
process.stderr.write("unexpected args: " + args.join(" ") + "\\n");
process.exit(1);
`;

  const scriptPath = join(binDir, "bw.mjs");
  writeFileSync(scriptPath, script, { encoding: "utf-8", mode: 0o755 });

  if (process.platform === "win32") {
    // Node's execFile("bw") on Windows resolves bw.cmd via PATHEXT.
    writeFileSync(
      join(binDir, "bw.cmd"),
      `@echo off\r\nnode "%~dp0bw.mjs" %*\r\n`,
      "utf-8",
    );
  } else {
    const wrapper = join(binDir, "bw");
    writeFileSync(
      wrapper,
      `#!/bin/sh\nexec node "$(dirname "$0")/bw.mjs" "$@"\n`,
      { encoding: "utf-8", mode: 0o755 },
    );
    chmodSync(wrapper, 0o755);
  }
}
