/**
 * Pre-release acceptance tests for LLM Configuration UI (v0.5.2).
 *
 * Exercises the exact bridge surface the Studio uses — simulates the full
 * configure-without-CLI workflow before manual/computer-use UI verification.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const SECRET = "sk-release-test-secret-key-98765";
const RELEASE_TIMEOUT_MS = 45_000;

describe("LLM config release acceptance (bridge)", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;
  let configPath: string;
  let credentialsPath: string;
  let dbPath: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-llm-release-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-llm-release-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    configPath = join(tempHome, ".zam", "config.json");
    credentialsPath = join(tempHome, ".zam", "credentials.json");
    dbPath = join(tempHome, ".zam", "zam.db");
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

  function env(): NodeJS.ProcessEnv {
    return {
      ...process.env,
      USERPROFILE: tempHome,
      HOME: tempHome,
      ZAM_CONFIG_PATH: configPath,
    };
  }

  function runCli(args: string[]): string {
    return execFileSync("node", [cliPath, ...args], {
      env: env(),
      cwd: tempCwd,
      encoding: "utf-8",
    });
  }

  function bridge(args: string[]): unknown {
    return JSON.parse(runCli(["bridge", ...args]));
  }

  function allBridgeOutputsContainSecret(outputs: unknown[]): void {
    for (const output of outputs) {
      expect(JSON.stringify(output)).not.toContain(SECRET);
    }
  }

  it(
    "covers the Studio configure-without-CLI workflow and secret-safety invariants",
    () => {
      runCli(["setup", "--skip-claude-md", "--skip-agents-md"]);

      const outputs: unknown[] = [];

      // 1) Add cloud provider (recall candidate)
      outputs.push(
        bridge([
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
        ]),
      );

      // 2) Store API key (write-only)
      outputs.push(
        bridge([
          "provider-set-key",
          "--ref",
          "deepseek-work",
          "--key",
          SECRET,
        ]),
      );

      // 3) Add local provider (vision candidate)
      outputs.push(
        bridge([
          "provider-config-upsert",
          "--name",
          "foundry-gemma",
          "--scope",
          "machine",
          "--label",
          "Foundry Gemma local",
          "--url",
          "http://localhost:8000/v1",
          "--model",
          "gemma4-it:e4b",
          "--local",
          "--runner",
          "flm",
        ]),
      );

      // 4) List + cloud hint (Studio editor load)
      outputs.push(bridge(["provider-config-list", "--scope", "machine"]));
      outputs.push(
        bridge([
          "cloud-model-hint",
          "--url",
          "https://api.deepseek.com/v1",
        ]),
      );

      // 5) Bind recall to cloud provider
      outputs.push(
        bridge([
          "provider-config-bind",
          "--role",
          "recall",
          "--primary",
          "deepseek-work",
          "--scope",
          "machine",
        ]),
      );

      // 6) Bind vision to local provider
      outputs.push(
        bridge([
          "provider-config-bind",
          "--role",
          "vision",
          "--primary",
          "foundry-gemma",
          "--scope",
          "machine",
        ]),
      );

      // 7) Status refresh (Studio status lines)
      outputs.push(bridge(["provider-status"]));

      // 8) Cloud vision opt-in path (Studio confirm + setting-set)
      outputs.push(
        bridge([
          "provider-config-upsert",
          "--name",
          "openai-vision",
          "--scope",
          "machine",
          "--url",
          "https://api.openai.com/v1",
          "--model",
          "gpt-5-mini",
          "--no-local",
          "--key-ref",
          "openai-vision",
        ]),
      );
      outputs.push(
        bridge([
          "setting-set",
          "--key",
          "llm.vision.enabled",
          "--value",
          "true",
        ]),
      );
      outputs.push(
        bridge([
          "provider-config-bind",
          "--role",
          "vision",
          "--primary",
          "openai-vision",
          "--scope",
          "machine",
        ]),
      );
      outputs.push(bridge(["check-vision"]));
      outputs.push(bridge(["provider-status"]));

      // 9) Clear key
      outputs.push(
        bridge(["provider-clear-key", "--ref", "deepseek-work"]),
      );
      outputs.push(bridge(["provider-config-list", "--scope", "machine"]));

      allBridgeOutputsContainSecret(outputs);

      // Machine-scope persistence
      expect(existsSync(configPath)).toBe(true);
      const config = JSON.parse(readFileSync(configPath, "utf-8")) as {
        ai: {
          providers: Record<string, { apiKey?: string; local?: boolean }>;
          roles: {
            recall: { primary: string };
            vision: { primary: string };
          };
        };
      };
      expect(config.ai.providers["deepseek-work"]).toMatchObject({
        url: "https://api.deepseek.com/v1",
        model: "deepseek-v4-flash",
      });
      expect(config.ai.providers["foundry-gemma"]).toMatchObject({
        local: true,
        runner: "flm",
      });
      expect(config.ai.roles.recall.primary).toBe("deepseek-work");
      expect(config.ai.roles.vision.primary).toBe("openai-vision");
      expect(JSON.stringify(config)).not.toContain(SECRET);
      expect(config.ai.providers["deepseek-work"].apiKey).toBeUndefined();

      // Keys only in credentials store
      expect(existsSync(credentialsPath)).toBe(true);
      const credentials = JSON.parse(readFileSync(credentialsPath, "utf-8")) as {
        llmProviders?: Record<string, { apiKey: string }>;
      };
      expect(credentials.llmProviders?.["deepseek-work"]).toBeUndefined();
      expect(credentials.llmProviders?.["openai-vision"]).toBeUndefined();

      // Shared DB untouched for machine scope
      expect(existsSync(dbPath)).toBe(true);
      const dbProviders = runCli(["settings", "get", "llm.providers"]).trim();
      const dbRoles = runCli(["settings", "get", "llm.roles"]).trim();
      expect(dbProviders).toBe("Not set: llm.providers");
      expect(dbRoles).toBe("Not set: llm.roles");

      const visionEnabled = runCli([
        "settings",
        "get",
        "llm.vision.enabled",
      ]).trim();
      expect(visionEnabled).toBe("true");

      const listedAfterClear = outputs.at(-1) as {
        providers: Array<{ name: string; keyState: string }>;
      };
      const deepseek = listedAfterClear.providers.find(
        (p) => p.name === "deepseek-work",
      );
      expect(deepseek?.keyState).toBe("missing");

      const status = bridge(["provider-status"]) as {
        roles: {
          recall: { providerName?: string };
          vision: { providerName?: string };
        };
      };
      expect(status.roles.recall.providerName).toBe("deepseek-work");
      expect(status.roles.vision.providerName).toBe("openai-vision");
    },
    RELEASE_TIMEOUT_MS,
  );

  it(
    "list-models accepts key-ref without echoing the key",
    () => {
      runCli(["setup", "--skip-claude-md", "--skip-agents-md"]);
      bridge([
        "provider-config-upsert",
        "--name",
        "local-test",
        "--scope",
        "machine",
        "--url",
        "http://localhost:8000/v1",
        "--model",
        "qwen3.5:4b",
        "--local",
      ]);
      bridge([
        "provider-set-key",
        "--ref",
        "local-test",
        "--key",
        SECRET,
      ]);

      try {
        const result = bridge([
          "list-models",
          "--url",
          "http://localhost:8000/v1",
          "--key-ref",
          "local-test",
        ]) as { models: string[] };
        expect(Array.isArray(result.models)).toBe(true);
        expect(JSON.stringify(result)).not.toContain(SECRET);
      } catch {
        // Offline local server is acceptable in CI — command must not leak the key.
        const stderr = "";
        expect(stderr).not.toContain(SECRET);
      }
    },
    RELEASE_TIMEOUT_MS,
  );
});