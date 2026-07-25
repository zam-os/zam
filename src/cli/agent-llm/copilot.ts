/**
 * GitHub Copilot CLI outbound adapter (ADR 2026-07-12a).
 *
 * `copilot -p <prompt> -s` — non-interactive scripting mode.
 * Auth is the learner's Copilot login / seat. Multimodal: `--attachment` for
 * images (non-interactive only). Optional `--model` (e.g. gpt-5-mini).
 *
 * Do **not** pass `--allow-all-tools` for pure text generation: with MCP servers
 * enabled (e.g. the configured `zam` MCP), that path often stalls for minutes
 * while the agent explores tools. Text-only `-p -s` returns in ~10–20s.
 * Paths/tools are only enabled when attachments need filesystem access.
 */

import { homedir } from "node:os";
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
  combineSystemUser,
  type HeadlessSpawner,
  type HeadlessSpawnResult,
  spawnHeadlessClosedStdin,
  truncateSnippet,
} from "./spawn.js";

const HARNESS: AgentHarnessId = "copilot";
const DEFAULT_TIMEOUT_MS = 120_000;

/**
 * Prefer silent text output. If JSONL was requested/emitted, take the last
 * `assistant.message` content field.
 */
export function parseCopilotStdout(stdout: string): string {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new AgentError(HARNESS, "Copilot returned empty output");
  }
  // JSONL path
  if (trimmed.startsWith("{")) {
    let last: string | undefined;
    for (const line of trimmed.split(/\r?\n/).filter((l) => l.trim())) {
      try {
        const rec = JSON.parse(line) as Record<string, unknown>;
        if (rec.type === "assistant.message") {
          const data = rec.data as Record<string, unknown> | undefined;
          if (typeof data?.content === "string" && data.content.trim()) {
            last = data.content;
          }
        }
        if (rec.type === "error") {
          const data = rec.data as Record<string, unknown> | undefined;
          const msg =
            (typeof data?.message === "string" && data.message) ||
            truncateSnippet(line);
          throw new AgentError(HARNESS, `Copilot error: ${msg}`);
        }
      } catch (err) {
        if (err instanceof AgentError) throw err;
      }
    }
    if (last) return last;
  }
  // Silent text: keep the full multi-line reply (evaluation + trailing
  // "Suggested rating: N" / "Empfohlene Bewertung: N"), strip footer noise.
  // Taking only the first line was wrong — the FSRS rating is always last.
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0)
    .filter(
      (l) =>
        !/^\s*Changes\s/i.test(l) &&
        !/^\s*AI Credits/i.test(l) &&
        !/^\s*Tokens\s/i.test(l) &&
        !/^\s*Resume\s/i.test(l),
    );
  const text = lines.join("\n").trim();
  if (!text) {
    throw new AgentError(
      HARNESS,
      `Copilot returned no assistant text: ${truncateSnippet(stdout)}`,
    );
  }
  return text;
}

export class CopilotAdapter implements AgentTextAdapter {
  readonly harness: AgentHarnessId = HARNESS;
  readonly modalities = { text: true as const, image: true as const };

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
        "GitHub Copilot CLI (`copilot`) not found on PATH. Install from https://github.com/github/copilot-cli",
    };
  }

  async generate(req: AgentGenerateRequest): Promise<AgentGenerateResult> {
    const bin = this.resolveExecutable();
    if (!bin) {
      throw new AgentError(
        this.harness,
        "GitHub Copilot CLI (`copilot`) is not installed or not on PATH.",
      );
    }
    const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const prompt = combineSystemUser(req);
    // Prefer $HOME (trusted by default in Copilot config) over os.tmpdir():
    // cwd=tmpdir surfaces "Allowed model policy requested without a cwd" and
    // can leave the model list empty.
    const cwd = homedir();
    const images = req.imagePaths?.filter(Boolean) ?? [];
    // Silent text-only prompt. Tools/paths only when reading attachments —
    // blanket --allow-all-tools with MCP servers (zam, github) stalls for ages.
    const args = ["-p", prompt, "-s"];
    if (images.length > 0) {
      args.push("--allow-all-tools", "--allow-all-paths");
    }
    if (req.model) args.push("--model", req.model);
    for (const image of images) {
      args.push("--attachment", image);
    }

    let result: HeadlessSpawnResult;
    try {
      result = await this.run({ command: bin, args, timeoutMs, cwd });
    } catch (err) {
      throw new AgentError(
        this.harness,
        `Failed to launch Copilot: ${(err as Error).message}`,
        err,
      );
    }
    if (result.timedOut) {
      throw new AgentError(
        this.harness,
        `Copilot timed out after ${timeoutMs} ms`,
      );
    }
    if (result.code !== 0) {
      throw new AgentError(
        this.harness,
        `Copilot exited with code ${result.code}: ${truncateSnippet(result.stderr || result.stdout)}`,
      );
    }
    return { text: parseCopilotStdout(result.stdout) };
  }
}
