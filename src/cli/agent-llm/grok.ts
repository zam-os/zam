/**
 * Grok Build outbound adapter (ADR 2026-07-12a).
 *
 * Drives xAI's Grok Build CLI in documented headless mode —
 * `grok -p <prompt> --output-format json` — so a SuperGrok / Grok.com
 * subscription (OAuth-bound to the `grok` login) can generate ZAM's text and
 * OCR work without an API key.
 *
 * Multimodal: `--prompt-json` with ACP image content blocks
 * (`{ type:"image", data:<base64>, mimeType }`). Verified against grok 0.2.111.
 *
 * JSON envelope (verified): `{ text, stopReason, usage, … }`.
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname } from "node:path";
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

const HARNESS: AgentHarnessId = "grok";
const DEFAULT_TIMEOUT_MS = 120_000;
const ERROR_SNIPPET_CHARS = 300;

/** Outcome of one headless `grok -p` run. */
export interface GrokRunResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface GrokRunInput {
  command: string;
  args: string[];
  timeoutMs: number;
  cwd: string;
}

/** Injectable subprocess runner so tests never spawn a real `grok`. */
export type GrokRunner = (input: GrokRunInput) => Promise<GrokRunResult>;

function truncate(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > ERROR_SNIPPET_CHARS
    ? `${trimmed.slice(0, ERROR_SNIPPET_CHARS)}…`
    : trimmed;
}

/**
 * Parse Grok Build headless `--output-format json` envelope.
 * Shape (verified): `{ "text": "…", "stopReason": "EndTurn", … }`.
 */
export function parseGrokEnvelope(stdout: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    // Fall back to plain text if the CLI emitted plain despite the flag.
    const plain = stdout.trim();
    if (plain) return plain;
    throw new AgentError(
      HARNESS,
      `Grok returned non-JSON output: ${truncate(stdout)}`,
    );
  }
  if (!parsed || typeof parsed !== "object") {
    throw new AgentError(HARNESS, "Grok returned an unexpected envelope");
  }
  const env = parsed as Record<string, unknown>;
  if (typeof env.text === "string") return env.text;
  // Some builds may nest the message.
  const result = env.result;
  if (typeof result === "string") return result;
  throw new AgentError(
    HARNESS,
    "Grok envelope is missing a string `text` field",
  );
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** Build ACP content blocks for `--prompt-json` (text + optional base64 images). */
export function buildGrokPromptJson(req: AgentGenerateRequest): string {
  const blocks: Array<Record<string, unknown>> = [
    { type: "text", text: req.user },
  ];
  for (const path of req.imagePaths?.filter(Boolean) ?? []) {
    const ext = extname(path).toLowerCase();
    const mime = MIME_BY_EXT[ext];
    if (!mime) {
      throw new AgentError(
        HARNESS,
        `Unsupported image type for Grok: ${path} (use PNG, JPEG, WebP, or GIF)`,
      );
    }
    let data: string;
    try {
      data = readFileSync(path).toString("base64");
    } catch (err) {
      throw new AgentError(
        HARNESS,
        `Failed to read image ${path}: ${(err as Error).message}`,
        err,
      );
    }
    blocks.push({ type: "image", data, mimeType: mime });
  }
  return JSON.stringify(blocks);
}

/** Default runner: spawn `grok`, collect stdout/stderr with a wall-clock timeout. */
export const spawnGrok: GrokRunner = (input) =>
  new Promise<GrokRunResult>((resolve, reject) => {
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

function defaultResolveExecutable(): string | null {
  const harness = getHarness(HARNESS);
  return harness ? resolveHarnessExecutable(harness) : null;
}

export const FALLBACK_GROK_MODELS = ["grok-4.5", "grok-4-mini"];

export class GrokAdapter implements AgentTextAdapter {
  readonly harness: AgentHarnessId = HARNESS;
  /** Grok Build accepts images via `--prompt-json` base64 content blocks. */
  readonly modalities = { text: true as const, image: true as const };

  constructor(
    private readonly resolveExecutable: () =>
      | string
      | null = defaultResolveExecutable,
    private readonly run: GrokRunner = spawnGrok,
  ) {}

  async probe(): Promise<AgentProbeResult> {
    const bin = this.resolveExecutable();
    return {
      harness: this.harness,
      available: bin !== null,
      detail:
        bin ??
        "Grok Build CLI (`grok`) not found on PATH. Install from https://x.ai/cli/install.sh and run `grok login`.",
    };
  }

  async listModels(): Promise<string[]> {
    return FALLBACK_GROK_MODELS;
  }

  async generate(req: AgentGenerateRequest): Promise<AgentGenerateResult> {
    const bin = this.resolveExecutable();
    if (!bin) {
      throw new AgentError(
        this.harness,
        "Grok Build CLI (`grok`) is not installed or not on PATH. Install it (`curl -fsSL https://x.ai/cli/install.sh | bash`) and run `grok login`, or set `agent.grok.command`.",
      );
    }

    const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const system = req.jsonSchemaHint
      ? `${req.system}\n\n${req.jsonSchemaHint}`
      : req.system;
    const images = req.imagePaths?.filter(Boolean) ?? [];
    const cwd = tmpdir();

    const args: string[] = [
      "--output-format",
      "json",
      "--system-prompt-override",
      system,
      "--cwd",
      cwd,
      // Generation-only: no interactive approvals; keep agent surface small.
      "--permission-mode",
      "dontAsk",
      "--no-subagents",
      "--max-turns",
      "1",
    ];
    if (req.model) {
      args.push("-m", req.model);
    }
    if (images.length > 0) {
      args.push("--prompt-json", buildGrokPromptJson(req));
    } else {
      args.push("-p", req.user);
    }

    let result: GrokRunResult;
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
        `Failed to launch Grok: ${(err as Error).message}`,
        err,
      );
    }

    if (result.timedOut) {
      throw new AgentError(
        this.harness,
        `Grok timed out after ${timeoutMs} ms`,
      );
    }
    if (result.code !== 0) {
      throw new AgentError(
        this.harness,
        `Grok exited with code ${result.code}: ${truncate(result.stderr || result.stdout)}`,
      );
    }

    return { text: parseGrokEnvelope(result.stdout) };
  }
}
