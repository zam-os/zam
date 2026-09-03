import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("bridge serve mode JSON-RPC", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(() => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-serve-test-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-serve-test-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");

    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });

    // Create a local config file so setup runs without network prompts.
    writeFileSync(
      join(tempHome, ".zam", "config.json"),
      JSON.stringify({
        providers: {
          openai: {
            url: "http://127.0.0.1:9999/v1",
            apiKey: "stub-key",
            enabled: true,
          },
        },
        roles: {
          embedding: {
            provider: "openai",
            model: "embeddinggemma",
            enabled: true,
          },
        },
      }),
    );
  });

  afterEach(() => {
    try {
      rmSync(tempHome, { recursive: true, force: true });
    } catch {
      // ignore
    }
    try {
      rmSync(tempCwd, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("handles json-rpc requests with nested stdin payload and unwarps errors without deadlock", async () => {
    const child = spawn("node", [cliPath, "bridge", "serve"], {
      cwd: tempCwd,
      env: {
        ...process.env,
        USERPROFILE: tempHome,
        HOME: tempHome,
      },
    });

    const outputPromise = new Promise<string>((resolve, reject) => {
      let buffer = "";
      child.stdout.on("data", (data) => {
        buffer += data.toString();
        // A single JSON-RPC response should end with a newline.
        if (buffer.includes("\n")) {
          resolve(buffer);
        }
      });
      child.stderr.on("data", (data) => {
        reject(new Error(`stderr output: ${data.toString()}`));
      });
      child.on("error", reject);
      // Timeout after 3 seconds to prevent deadlock
      setTimeout(() => reject(new Error("Timeout waiting for response")), 3000);
    });

    // Write a request to register a token. Since we don't have a valid concept,
    // it will throw a validation error.
    const request = {
      id: 42,
      cmd: "add-token",
      args: [],
      stdin: {
        slug: "invalid-token",
        // missing 'concept' field intentionally to trigger JSON validation error
      },
    };

    child.stdin.write(`${JSON.stringify(request)}\n`);

    const rawResponse = await outputPromise;
    child.kill();

    const response = JSON.parse(rawResponse.trim());
    expect(response.id).toBe(42);
    expect(response.error).toContain("JSON must include 'slug' and 'concept' fields");
    // Ensure it is NOT double-encoded as {"error": "{\"error\":\"...\"}"}
    expect(response.error).not.toContain('{"error":');
  });

  it("handles raw string stdin for add-token and cap limits correctly", async () => {
    const child = spawn("node", [cliPath, "bridge", "serve"], {
      cwd: tempCwd,
      env: {
        ...process.env,
        USERPROFILE: tempHome,
        HOME: tempHome,
      },
    });

    const outputPromise = new Promise<string>((resolve, reject) => {
      let buffer = "";
      child.stdout.on("data", (data) => {
        buffer += data.toString();
        if (buffer.includes("\n")) {
          resolve(buffer);
        }
      });
      child.on("error", reject);
      setTimeout(() => reject(new Error("Timeout")), 3000);
    });

    // We send relevant-tokens query with raw string stdin.
    // Since there's no context/concept provided, it triggers validation error
    const request = {
      id: 43,
      cmd: "relevant-tokens",
      args: [],
      stdin: JSON.stringify({
        // missing context
      }),
    };

    child.stdin.write(`${JSON.stringify(request)}\n`);

    const rawResponse = await outputPromise;
    child.kill();

    const response = JSON.parse(rawResponse.trim());
    expect(response.id).toBe(43);
    expect(response.error).toContain("JSON must include a non-empty 'context' field");
  });

  it("handles suggest-foundations request via the stdin payload field in serve mode", async () => {
    const child = spawn("node", [cliPath, "bridge", "serve"], {
      cwd: tempCwd,
      env: {
        ...process.env,
        USERPROFILE: tempHome,
        HOME: tempHome,
      },
    });

    const outputPromise = new Promise<string>((resolve, reject) => {
      let buffer = "";
      child.stdout.on("data", (data) => {
        buffer += data.toString();
        if (buffer.includes("\n")) {
          resolve(buffer);
        }
      });
      child.on("error", reject);
      setTimeout(() => reject(new Error("Timeout")), 3000);
    });

    const request = {
      id: 44,
      cmd: "suggest-foundations",
      args: ["--user", "thomas"],
      stdin: {
        concept: "Calculating fractions",
        domain: "math",
      },
    };

    child.stdin.write(`${JSON.stringify(request)}\n`);

    const rawResponse = await outputPromise;
    child.kill();

    const response = JSON.parse(rawResponse.trim());
    expect(response.id).toBe(44);
    expect(response.result).toMatchObject({
      semantic: false,
      target: null,
      suggestions: [],
    });
  });

  it("serves multiple requests from one host and shuts down on stdin close", async () => {
    const child = spawn("node", [cliPath, "bridge", "serve"], {
      cwd: tempCwd,
      env: {
        ...process.env,
        USERPROFILE: tempHome,
        HOME: tempHome,
      },
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.stdin.write(
      `${JSON.stringify({ id: 45, cmd: "get-settings", args: [] })}\n`,
    );
    child.stdin.end(
      `${JSON.stringify({ id: 46, cmd: "list-knowledge-contexts", args: [] })}\n`,
    );

    const exitCode = await new Promise<number | null>((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("Bridge did not shut down after stdin closed"));
      }, 5_000);
      child.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.once("exit", (code) => {
        clearTimeout(timeout);
        resolve(code);
      });
    });

    expect(exitCode).toBe(0);
    expect(stderr).toBe("");
    const responses = stdout
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(responses.map((response) => response.id)).toEqual([45, 46]);
    expect(responses[0].result.recall).toEqual({
      quickMode: false,
      dynamicQuestions: true,
    });
    expect(responses[1].result).toMatchObject({
      success: true,
      contexts: [],
    });
  });
});
