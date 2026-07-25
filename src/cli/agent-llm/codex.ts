/**
 * Codex CLI outbound adapter (ADR 2026-07-12a).
 *
 * Drives OpenAI Codex in documented headless mode —
 * `codex exec --json …` — so a learner's ChatGPT / Codex subscription
 * (OAuth-bound to the `codex` login, not an API key) can generate ZAM's text
 * and OCR work.
 *
 * Multimodal: `-i <file>` attaches local images to the initial prompt (native
 * CLI flag). Output is JSONL; we take the last `item.completed` event with
 * `item.type === "agent_message"`.
 *
 * Verified against codex-cli 0.145.0: prompt as argv, images via `-i`, events
 * as JSON lines on stdout.
 */

import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
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

const HARNESS: AgentHarnessId = "codex";
const DEFAULT_TIMEOUT_MS = 120_000;
const ERROR_SNIPPET_CHARS = 300;

/** Outcome of one headless `codex exec` run. */
export interface CodexRunResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface CodexRunInput {
  command: string;
  args: string[];
  /** Optional stdin (unused for argv prompts; kept for test injectability). */
  stdin?: string;
  timeoutMs: number;
  cwd: string;
}

/** Injectable subprocess runner so tests never spawn a real `codex`. */
export type CodexRunner = (input: CodexRunInput) => Promise<CodexRunResult>;

function truncate(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > ERROR_SNIPPET_CHARS
    ? `${trimmed.slice(0, ERROR_SNIPPET_CHARS)}…`
    : trimmed;
}

/**
 * Parse Codex `exec --json` JSONL and return the last agent message text.
 * Exported for unit tests. Shape (verified against the CLI):
 * `{"type":"item.completed","item":{"type":"agent_message","text":"…"}}`
 */
export function parseCodexJsonl(stdout: string): string {
  let lastMessage: string | undefined;
  const lines = stdout.split(/\r?\n/).filter((l) => l.trim().length > 0);
  for (const line of lines) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      // Non-JSON noise on stdout is ignored; agent_message is JSONL only.
      continue;
    }
    if (!parsed || typeof parsed !== "object") continue;
    const rec = parsed as Record<string, unknown>;
    if (rec.type !== "item.completed") continue;
    const item = rec.item;
    if (!item || typeof item !== "object") continue;
    const it = item as Record<string, unknown>;
    if (it.type === "agent_message" && typeof it.text === "string") {
      lastMessage = it.text;
    }
  }
  if (lastMessage === undefined) {
    throw new AgentError(
      HARNESS,
      `Codex returned no agent_message in JSONL output: ${truncate(stdout)}`,
    );
  }
  return lastMessage;
}

/** Combine system + user (+ schema hint) into one exec prompt. */
export function buildCodexPrompt(req: AgentGenerateRequest): string {
  const system = req.jsonSchemaHint
    ? `${req.system}\n\n${req.jsonSchemaHint}`
    : req.system;
  return `${system.trim()}\n\n${req.user.trim()}`;
}

/** Default runner: spawn `codex`, collect stdout/stderr with a wall-clock timeout. */
export const spawnCodex: CodexRunner = (input) =>
  new Promise<CodexRunResult>((resolve, reject) => {
    const child = spawn(input.command, input.args, {
      cwd: input.cwd,
      // stdin closed: prompt is argv; open stdin makes Codex wait for more input.
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

export const FALLBACK_CODEX_MODELS = [
  "gpt-5.4-mini",
  "gpt-5.4",
  "o3-mini",
  "o1",
];

export class CodexAdapter implements AgentTextAdapter {
  readonly harness: AgentHarnessId = HARNESS;
  /** Codex accepts `-i` images; models (incl. multimodal ChatGPT) can inspect them. */
  readonly modalities = { text: true as const, image: true as const };

  constructor(
    private readonly resolveExecutable: () =>
      | string
      | null = defaultResolveExecutable,
    private readonly run: CodexRunner = spawnCodex,
  ) {}

  async probe(): Promise<AgentProbeResult> {
    const bin = this.resolveExecutable();
    return {
      harness: this.harness,
      available: bin !== null,
      detail:
        bin ??
        "Codex CLI (`codex`) not found on PATH. Install it and run `codex login`.",
    };
  }

  async listModels(): Promise<string[]> {
    return FALLBACK_CODEX_MODELS;
  }

  async generate(req: AgentGenerateRequest): Promise<AgentGenerateResult> {
    const bin = this.resolveExecutable();
    if (!bin) {
      throw new AgentError(
        this.harness,
        "Codex CLI (`codex`) is not installed or not on PATH. Install it and run `codex login` once, or set `agent.codex.command`.",
      );
    }

    const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const prompt = buildCodexPrompt(req);
    const images = req.imagePaths?.filter(Boolean) ?? [];

    // Neutral cwd: never let the nested session write into the ZAM checkout.
    // When images are attached, keep their parents readable via -i (absolute).
    const cwd = tmpdir();

    const args: string[] = [
      "exec",
      "--json",
      "--skip-git-repo-check",
      "--ephemeral",
      // Read-only sandbox: generation-only; no shell/write side effects needed
      // for ZAM text/OCR. User chose Agent deliberately — keep blast radius small.
      "-s",
      "read-only",
      "-C",
      cwd,
    ];
    for (const image of images) {
      args.push("-i", image);
    }
    if (req.model) {
      args.push("-m", req.model);
    }
    if (req.effort && req.effort !== "none") {
      const codexEffort =
        req.effort === "minimal" || req.effort === "low"
          ? "low"
          : req.effort === "medium"
            ? "medium"
            : "high";
      args.push("--reasoning-effort", codexEffort);
    }
    // Prompt last as positional argument (not stdin — avoids "Reading additional
    // input from stdin..." hang when the pipe is empty).
    args.push(prompt);

    let result: CodexRunResult;
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
        `Failed to launch Codex: ${(err as Error).message}`,
        err,
      );
    }

    if (result.timedOut) {
      throw new AgentError(
        this.harness,
        `Codex timed out after ${timeoutMs} ms`,
      );
    }
    if (result.code !== 0) {
      throw new AgentError(
        this.harness,
        `Codex exited with code ${result.code}: ${truncate(result.stderr || result.stdout)}`,
      );
    }

    return { text: parseCodexJsonl(result.stdout) };
  }
}
