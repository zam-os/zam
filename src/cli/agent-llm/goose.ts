/**
 * Goose outbound adapter (ADR 2026-07-12a).
 *
 * `goose run -t <text> --system <sys> --no-session` — headless instruction run.
 * Model/provider come from goose config or `--model` when set. Auth is whatever
 * the learner configured (OpenRouter, local, …).
 */

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
import {
  type HeadlessSpawner,
  type HeadlessSpawnResult,
  spawnHeadlessClosedStdin,
  truncateSnippet,
} from "./spawn.js";

const HARNESS: AgentHarnessId = "goose";
const DEFAULT_TIMEOUT_MS = 120_000;

/** Drop goose banner lines; return the last substantive non-empty line. */
export function parseGooseStdout(stdout: string): string {
  const lines = stdout
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g"), "")
        .trim(),
    )
    .filter(Boolean)
    .filter(
      (l) =>
        !l.includes("__( O)>") &&
        !l.includes("\\____)") &&
        !/^L L\b/.test(l) &&
        !/goose is ready/i.test(l) &&
        !/new session/i.test(l),
    );
  const last = lines[lines.length - 1];
  if (!last) {
    throw new AgentError(
      HARNESS,
      `Goose returned no assistant text: ${truncateSnippet(stdout)}`,
    );
  }
  return last;
}

export class GooseAdapter implements AgentTextAdapter {
  readonly harness: AgentHarnessId = HARNESS;
  /** Text-only headless surface today (no documented image attach flag). */
  readonly modalities = { text: true as const, image: false as const };

  constructor(
    private readonly resolveExecutable: () => string | null = () => {
      const h = getHarness(HARNESS);
      return h ? resolveHarnessExecutable(h) : null;
    },
    private readonly run: HeadlessSpawner = spawnHeadlessClosedStdin,
  ) {}

  async probe(): Promise<AgentProbeResult> {
    const bin = this.resolveExecutable();
    return {
      harness: this.harness,
      available: bin !== null,
      detail:
        bin ??
        "Goose CLI (`goose`) not found on PATH. Install from https://block.github.io/goose/",
    };
  }

  async generate(req: AgentGenerateRequest): Promise<AgentGenerateResult> {
    const bin = this.resolveExecutable();
    if (!bin) {
      throw new AgentError(
        this.harness,
        "Goose CLI (`goose`) is not installed or not on PATH.",
      );
    }
    if (req.imagePaths?.length) {
      throw new AgentError(
        this.harness,
        "Goose outbound adapter does not support image input yet.",
      );
    }
    const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const system = req.jsonSchemaHint
      ? `${req.system}\n\n${req.jsonSchemaHint}`
      : req.system;
    const cwd = tmpdir();
    const args = ["run", "-t", req.user, "--system", system, "--no-session"];
    if (req.model) args.push("--model", req.model);

    let result: HeadlessSpawnResult;
    try {
      result = await this.run({ command: bin, args, timeoutMs, cwd });
    } catch (err) {
      throw new AgentError(
        this.harness,
        `Failed to launch Goose: ${(err as Error).message}`,
        err,
      );
    }
    if (result.timedOut) {
      throw new AgentError(
        this.harness,
        `Goose timed out after ${timeoutMs} ms`,
      );
    }
    if (result.code !== 0) {
      throw new AgentError(
        this.harness,
        `Goose exited with code ${result.code}: ${truncateSnippet(result.stderr || result.stdout)}`,
      );
    }
    return { text: parseGooseStdout(result.stdout) };
  }
}
