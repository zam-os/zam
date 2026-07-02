import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const SECRET = "sk-super-secret-test-key-12345";

describe("bridge provider-config commands", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;
  let configPath: string;
  let credentialsPath: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-provider-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-provider-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    configPath = join(tempHome, ".zam", "config.json");
    credentialsPath = join(tempHome, ".zam", "credentials.json");
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best effort
      }
    }
  });

  function runCli(args: string[]): string {
    const env = {
      ...process.env,
      USERPROFILE: tempHome,
      HOME: tempHome,
      ZAM_CONFIG_PATH: configPath,
    };
    return execFileSync("node", [cliPath, ...args], {
      env,
      cwd: tempCwd,
      encoding: "utf-8",
    });
  }

  function runBridge(args: string[]): unknown {
    return JSON.parse(runCli(["bridge", ...args]));
  }

  it("stores machine-scope providers and binds roles without exposing API keys", () => {
    runCli(["setup", "--skip-claude-md", "--skip-agents-md"]);

    const upsert = runBridge([
      "provider-config-upsert",
      "--name",
      "deepseek-work",
      "--scope",
      "machine",
      "--label",
      "Work DeepSeek",
      "--url",
      "https://api.deepseek.com/v1",
      "--model",
      "deepseek-v4-flash",
      "--flavor",
      "chat-completions",
      "--no-local",
      "--key-ref",
      "deepseek-work",
    ]) as { ok: boolean; provider: { keyState: string } };
    expect(upsert.ok).toBe(true);
    expect(upsert.provider.keyState).toBe("missing");

    const setKey = runBridge([
      "provider-set-key",
      "--ref",
      "deepseek-work",
      "--key",
      SECRET,
    ]) as { ok: boolean; masked: string };
    expect(setKey.ok).toBe(true);
    expect(setKey.masked).toBe("…2345");
    expect(JSON.stringify(setKey)).not.toContain(SECRET);

    const listed = runBridge([
      "provider-config-list",
      "--scope",
      "machine",
    ]) as {
      scope: string;
      providers: Array<{ name: string; keyState: string }>;
      roles: Record<string, unknown>;
    };
    expect(listed.scope).toBe("machine");
    expect(listed.providers[0]).toMatchObject({
      name: "deepseek-work",
      keyState: "set",
      local: false,
    });
    expect(JSON.stringify(listed)).not.toContain(SECRET);

    const bound = runBridge([
      "provider-config-bind",
      "--role",
      "recall",
      "--primary",
      "deepseek-work",
      "--scope",
      "machine",
    ]) as { ok: boolean; role: string };
    expect(bound.ok).toBe(true);
    expect(bound.role).toBe("recall");

    expect(existsSync(configPath)).toBe(true);
    const config = JSON.parse(readFileSync(configPath, "utf-8")) as {
      ai: {
        providers: Record<string, { apiKey?: string }>;
        roles: { recall: { primary: string } };
      };
    };
    expect(config.ai.providers["deepseek-work"]).toBeDefined();
    expect(config.ai.roles.recall.primary).toBe("deepseek-work");
    expect(JSON.stringify(config)).not.toContain(SECRET);

    expect(existsSync(credentialsPath)).toBe(true);
    const credentials = JSON.parse(readFileSync(credentialsPath, "utf-8")) as {
      llmProviders: Record<string, { apiKey: string }>;
    };
    expect(credentials.llmProviders["deepseek-work"].apiKey).toBe(SECRET);

    const cleared = runBridge([
      "provider-clear-key",
      "--ref",
      "deepseek-work",
    ]) as { ok: boolean };
    expect(cleared.ok).toBe(true);
    const relisted = runBridge([
      "provider-config-list",
      "--scope",
      "machine",
    ]) as { providers: Array<{ keyState: string }> };
    expect(relisted.providers[0].keyState).toBe("missing");
    expect(JSON.stringify(relisted)).not.toContain(SECRET);
  }, 15_000);

  it("reports referencing roles when removing a provider", () => {
    runCli(["setup", "--skip-claude-md", "--skip-agents-md"]);
    runBridge([
      "provider-config-upsert",
      "--name",
      "local-vl",
      "--scope",
      "machine",
      "--url",
      "http://localhost:8000/v1",
      "--model",
      "qwen2.5vl-it:3b",
      "--local",
    ]);
    runBridge([
      "provider-config-bind",
      "--role",
      "vision",
      "--primary",
      "local-vl",
      "--scope",
      "machine",
    ]);

    const removed = runBridge([
      "provider-config-remove",
      "--name",
      "local-vl",
      "--scope",
      "machine",
    ]) as { removed: boolean; referencingRoles: string[] };
    expect(removed.removed).toBe(true);
    expect(removed.referencingRoles).toContain("vision");
  }, 15_000);
});
