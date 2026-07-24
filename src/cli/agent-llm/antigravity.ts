/**
 * Antigravity CLI outbound adapter (ADR 2026-07-12a).
 *
 * Drives the Google Antigravity CLI (`agy`) in documented print mode —
 * `agy -p <prompt>` — so a learner's Google AI / Antigravity subscription
 * (OAuth-bound to `agy`, not an API key) can generate ZAM's text and OCR work.
 *
 * Multimodal: Gemini models in Antigravity read image *files* from the
 * workspace (no base64 wire format). When {@link AgentGenerateRequest.imagePaths}
 * is set, the adapter adds parent dirs via `--add-dir` and lists absolute paths
 * in the prompt so the model can inspect them. Verified against `agy` 1.0.6.
 *
 * Output is plain text on stdout (no JSON envelope, unlike Claude Code).
 */

import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname } from "node:path";
import type { AgentHarnessId } from "../agent-harness.js";
import { findExecutable } from "../terminal-open.js";
import {
  AgentError,
  type AgentGenerateRequest,
  type AgentGenerateResult,
  type AgentProbeResult,
  type AgentTextAdapter,
} from "./adapter.js";

const HARNESS: AgentHarnessId = "antigravity";
/** Default CLI binary name (distinct from the Antigravity *IDE* `antigravity`). */
const DEFAULT_COMMAND = "agy";
const DEFAULT_TIMEOUT_MS = 120_000;
const ERROR_SNIPPET_CHARS = 300;

/** Outcome of one headless `agy -p` run. */
export interface AgyRunResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface AgyRunInput {
  command: string;
  args: string[];
  timeoutMs: number;
  cwd: string;
}

/** Injectable subprocess runner so tests never spawn a real `agy`. */
export type AgyRunner = (input: AgyRunInput) => Promise<AgyRunResult>;

function truncate(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > ERROR_SNIPPET_CHARS
    ? `${trimmed.slice(0, ERROR_SNIPPET_CHARS)}…`
    : trimmed;
}

/** Format a ms budget as the duration string `agy --print-timeout` accepts. */
export function formatPrintTimeout(timeoutMs: number): string {
  const seconds = Math.max(1, Math.ceil(timeoutMs / 1000));
  return `${seconds}s`;
}

/**
 * Build the single print-mode prompt: system framing + user content + optional
 * image path list. `agy` has no separate `--system-prompt` flag.
 */
export function buildAgyPrompt(req: AgentGenerateRequest): string {
  const system = req.jsonSchemaHint
    ? `${req.system}\n\n${req.jsonSchemaHint}`
    : req.system;
  const parts = [system.trim(), "", req.user.trim()];
  const images = req.imagePaths?.filter(Boolean) ?? [];
  if (images.length > 0) {
    parts.push(
      "",
      "Image files to inspect (read these local files; they are in the workspace):",
      ...images.map((p) => `- ${p}`),
    );
  }
  return parts.join("\n");
}

/** Default runner: spawn `agy`, collect stdout/stderr with a wall-clock timeout. */
export const spawnAgy: AgyRunner = (input) =>
  new Promise<AgyRunResult>((resolve, reject) => {
    const child = spawn(input.command, input.args, {
      cwd: input.cwd,
      stdio: ["ignore", "pipe", "pipe"],
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
  });

/** Locate the `agy` CLI (not the IDE app). Override via constructor. */
function defaultResolveExecutable(): string | null {
  return findExecutable(DEFAULT_COMMAND);
}

export class AntigravityAdapter implements AgentTextAdapter {
  readonly harness: AgentHarnessId = HARNESS;
  /** Gemini models behind `agy` accept image files in the workspace. */
  readonly modalities = { text: true as const, image: true as const };

  constructor(
    private readonly resolveExecutable: () =>
      | string
      | null = defaultResolveExecutable,
    private readonly run: AgyRunner = spawnAgy,
  ) {}

  async probe(): Promise<AgentProbeResult> {
    const bin = this.resolveExecutable();
    return {
      harness: this.harness,
      available: bin !== null,
      detail:
        bin ??
        "Antigravity CLI (`agy`) not found on PATH. Install it and run `agy` once to sign in.",
    };
  }

  async generate(req: AgentGenerateRequest): Promise<AgentGenerateResult> {
    const bin = this.resolveExecutable();
    if (!bin) {
      throw new AgentError(
        this.harness,
        "Antigravity CLI (`agy`) is not installed or not on PATH. Install it from https://antigravity.google/product/antigravity-cli and run `agy` once to sign in.",
      );
    }

    const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const prompt = buildAgyPrompt(req);
    const images = req.imagePaths?.filter(Boolean) ?? [];
    const addDirs = [...new Set(images.map((p) => dirname(p)).filter(Boolean))];

    // Prefer the image parent as cwd so relative references work; otherwise a
    // neutral tmpdir so the nested agent never sees the ZAM checkout.
    const cwd = images.length > 0 && addDirs[0] ? addDirs[0] : tmpdir();

    const args: string[] = [
      "-p",
      prompt,
      "--print-timeout",
      formatPrintTimeout(timeoutMs),
    ];
    for (const dir of addDirs) {
      args.push("--add-dir", dir);
    }
    if (req.model) {
      args.push("--model", req.model);
    }

    let result: AgyRunResult;
    try {
      result = await this.run({
        command: bin,
        args,
        timeoutMs,
        cwd,
      });
    } catch (err) {
      throw new AgentError(
        this.harness,
        `Failed to launch Antigravity CLI: ${(err as Error).message}`,
        err,
      );
    }

    if (result.timedOut) {
      throw new AgentError(
        this.harness,
        `Antigravity CLI timed out after ${timeoutMs} ms`,
      );
    }
    if (result.code !== 0) {
      throw new AgentError(
        this.harness,
        `Antigravity CLI exited with code ${result.code}: ${truncate(result.stderr || result.stdout)}`,
      );
    }

    const text = result.stdout.trim();
    if (!text) {
      throw new AgentError(
        this.harness,
        `Antigravity CLI returned empty output${result.stderr ? `: ${truncate(result.stderr)}` : ""}`,
      );
    }
    return { text };
  }
}
