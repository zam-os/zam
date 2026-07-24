/**
 * Claude Code outbound-text adapter (ADR 2026-07-12a, reference harness).
 *
 * Drives Claude Code's documented headless mode —
 * `claude -p --output-format json` — so a learner's Claude subscription (bound
 * to the `claude` login, not to any API key) generates ZAM's curriculum cards.
 * The user prompt goes in on stdin (no ARG_MAX limit on large curricula); the
 * system prompt replaces Claude Code's own coding-agent framing; and
 * `--strict-mcp-config` keeps the nested session from loading ZAM's own MCP
 * server (which would recurse). No new npm dependency, no secret handling.
 */

import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import {
  type AgentHarnessId,
  getHarness,
  resolveHarnessExecutable,
} from "../agent-harness.js";
import {
  AgentError,
  type AgentGenerateRequest,
  type AgentGenerateResult,
  type AgentProbeResult,
  type AgentTextAdapter,
} from "./adapter.js";

const HARNESS: AgentHarnessId = "claude-code";
const DEFAULT_TIMEOUT_MS = 120_000;
const ERROR_SNIPPET_CHARS = 300;

/** Outcome of running the harness once. */
export interface HeadlessRunResult {
  /** Process exit code, or null when killed by signal / timeout. */
  code: number | null;
  stdout: string;
  stderr: string;
  /** True when we aborted the process on the timeout. */
  timedOut: boolean;
}

export interface HeadlessRunInput {
  command: string;
  args: string[];
  stdin: string;
  timeoutMs: number;
  cwd: string;
}

/** Injectable subprocess runner so tests never spawn a real `claude`. */
export type HeadlessRunner = (
  input: HeadlessRunInput,
) => Promise<HeadlessRunResult>;

function truncate(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > ERROR_SNIPPET_CHARS
    ? `${trimmed.slice(0, ERROR_SNIPPET_CHARS)}…`
    : trimmed;
}

/**
 * Parse Claude Code's `--output-format json` envelope and return the `result`
 * text. Exported for unit tests. Shape (verified against the CLI):
 * `{ type:"result", subtype:"success", is_error:false, result:"…" }`.
 */
export function parseClaudeEnvelope(stdout: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new AgentError(
      HARNESS,
      `Claude Code returned non-JSON output: ${truncate(stdout)}`,
    );
  }
  if (!parsed || typeof parsed !== "object") {
    throw new AgentError(
      HARNESS,
      "Claude Code returned an unexpected envelope",
    );
  }
  const env = parsed as Record<string, unknown>;
  if (env.is_error === true || env.subtype !== "success") {
    const reason =
      typeof env.result === "string" ? env.result : String(env.subtype ?? "");
    throw new AgentError(
      HARNESS,
      `Claude Code reported an error (subtype=${String(env.subtype)}): ${truncate(reason)}`,
    );
  }
  if (typeof env.result !== "string") {
    throw new AgentError(
      HARNESS,
      "Claude Code envelope is missing a string `result` field",
    );
  }
  return env.result;
}

/** Default runner: spawn `claude`, feed stdin, collect stdout with a timeout. */
export const spawnHeadless: HeadlessRunner = (input) =>
  new Promise<HeadlessRunResult>((resolve, reject) => {
    const child = spawn(input.command, input.args, {
      cwd: input.cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, input.timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });

    child.stdin.on("error", () => {
      // Broken pipe (e.g. the process exited before reading stdin) surfaces via
      // the exit code; swallow it here so it doesn't crash the process.
    });
    child.stdin.end(input.stdin);
  });

/** Locate the `claude` executable via the shared harness registry. */
function defaultResolveExecutable(): string | null {
  const harness = getHarness(HARNESS);
  return harness ? resolveHarnessExecutable(harness) : null;
}

/**
 * Build the stdin user payload: optional image path list so multimodal models
 * (Haiku included) can read workspace files via `--add-dir`.
 */
export function buildClaudeUserPayload(req: AgentGenerateRequest): string {
  const images = req.imagePaths?.filter(Boolean) ?? [];
  if (images.length === 0) return req.user;
  return [
    req.user.trim(),
    "",
    "Image files to inspect (read these local files; they are available in the workspace):",
    ...images.map((p) => `- ${p}`),
  ].join("\n");
}

export class ClaudeCodeAdapter implements AgentTextAdapter {
  readonly harness: AgentHarnessId = HARNESS;
  /**
   * Claude models (incl. Haiku) accept image input. Headless path exposes files
   * via `--add-dir` + absolute paths in the user prompt (no separate -i flag).
   */
  readonly modalities = { text: true as const, image: true as const };

  constructor(
    private readonly resolveExecutable: () =>
      | string
      | null = defaultResolveExecutable,
    private readonly run: HeadlessRunner = spawnHeadless,
  ) {}

  async probe(): Promise<AgentProbeResult> {
    const bin = this.resolveExecutable();
    return {
      harness: this.harness,
      available: bin !== null,
      detail: bin ?? "Claude Code CLI (`claude`) not found on PATH",
    };
  }

  async generate(req: AgentGenerateRequest): Promise<AgentGenerateResult> {
    const bin = this.resolveExecutable();
    if (!bin) {
      throw new AgentError(
        this.harness,
        "Claude Code CLI (`claude`) is not installed or not on PATH. Install it and run `claude` once to sign in, or set `agent.claude-code.command`.",
      );
    }

    const system = req.jsonSchemaHint
      ? `${req.system}\n\n${req.jsonSchemaHint}`
      : req.system;
    const images = req.imagePaths?.filter(Boolean) ?? [];
    const addDirs = [...new Set(images.map((p) => dirname(p)).filter(Boolean))];
    const args = [
      "-p",
      "--output-format",
      "json",
      "--system-prompt",
      system,
      "--strict-mcp-config",
    ];
    if (req.model) {
      args.push("--model", req.model);
    }
    for (const dir of addDirs) {
      args.push("--add-dir", dir);
    }
    const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    // Prefer image parent as cwd when OCR'ing; otherwise neutral tmpdir.
    const cwd = images.length > 0 && addDirs[0] ? addDirs[0] : tmpdir();

    let result: HeadlessRunResult;
    try {
      result = await this.run({
        command: bin,
        args,
        stdin: buildClaudeUserPayload(req),
        timeoutMs,
        cwd,
      });
    } catch (err) {
      throw new AgentError(
        this.harness,
        `Failed to launch Claude Code: ${(err as Error).message}`,
        err,
      );
    }

    if (result.timedOut) {
      throw new AgentError(
        this.harness,
        `Claude Code timed out after ${timeoutMs} ms`,
      );
    }
    if (result.code !== 0) {
      throw new AgentError(
        this.harness,
        `Claude Code exited with code ${result.code}: ${truncate(result.stderr || result.stdout)}`,
      );
    }

    return { text: parseClaudeEnvelope(result.stdout) };
  }
}
