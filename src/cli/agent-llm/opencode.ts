/**
 * OpenCode outbound adapter (ADR 2026-07-12a).
 *
 * `opencode run --format json --auto [message]` — headless message run.
 * Auth is whatever the learner configured (`opencode providers` / API keys /
 * Zen). Multimodal: `-f` attaches files to the message.
 *
 * Verified against OpenCode 2.0.25: isolated runs need `--standalone` for the
 * inline `permission: "deny"` to apply, and `session delete` removes the
 * stored session.
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
  combineSystemUser,
  type HeadlessSpawner,
  type HeadlessSpawnResult,
  spawnHeadlessClosedStdin,
  truncateSnippet,
} from "./spawn.js";

const HARNESS: AgentHarnessId = "opencode";
const DEFAULT_TIMEOUT_MS = 120_000;
const SESSION_DELETE_TIMEOUT_MS = 15_000;

/**
 * Parse `opencode run --format json` JSONL. Throws on error events; returns the
 * last textual assistant content found.
 */
export function parseOpenCodeJsonl(stdout: string): string {
  let lastText: string | undefined;
  let lastError: string | undefined;
  for (const line of stdout.split(/\r?\n/).filter((l) => l.trim())) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (!parsed || typeof parsed !== "object") continue;
    const rec = parsed as Record<string, unknown>;
    if (rec.type === "error") {
      const err = rec.error as Record<string, unknown> | undefined;
      const data = err?.data as Record<string, unknown> | undefined;
      lastError =
        (typeof data?.message === "string" && data.message) ||
        (typeof err?.name === "string" && err.name) ||
        truncateSnippet(line);
      continue;
    }
    // Common shapes: text parts, message content, assistant deltas.
    const part = rec.part as Record<string, unknown> | undefined;
    if (part && typeof part.text === "string" && part.text.trim()) {
      lastText = part.text;
    }
    const message = rec.message as Record<string, unknown> | undefined;
    if (
      message &&
      typeof message.content === "string" &&
      message.content.trim()
    ) {
      lastText = message.content;
    }
    if (typeof rec.text === "string" && rec.text.trim()) {
      lastText = rec.text;
    }
    if (typeof rec.content === "string" && rec.content.trim()) {
      lastText = rec.content;
    }
  }
  if (lastError && !lastText) {
    throw new AgentError(HARNESS, `OpenCode error: ${lastError}`);
  }
  if (!lastText?.trim()) {
    throw new AgentError(
      HARNESS,
      `OpenCode returned no assistant text: ${truncateSnippet(stdout)}`,
    );
  }
  return lastText;
}

export class OpenCodeAdapter implements AgentTextAdapter {
  readonly harness: AgentHarnessId = HARNESS;
  readonly modalities = { text: true, image: true, file: true };
  /** Tools denied and the stored session deleted for learner material. */
  readonly supportsIsolation = true;

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
        "OpenCode CLI (`opencode`) not found on PATH. Install from https://opencode.ai/",
    };
  }

  async listModels(): Promise<string[]> {
    return ["opencode-zen", "claude-3-5-sonnet", "gpt-4o"];
  }

  async generate(req: AgentGenerateRequest): Promise<AgentGenerateResult> {
    const bin = this.resolveExecutable();
    if (!bin) {
      throw new AgentError(
        this.harness,
        "OpenCode CLI (`opencode`) is not installed or not on PATH.",
      );
    }
    const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const prompt = combineSystemUser(req);
    const cwd = tmpdir();
    const isolate =
      req.isolate === true ||
      Boolean(req.imagePaths?.length || req.pdfPaths?.length);
    // OpenCode 2 has no `--dir`; the spawn cwd is the session's directory.
    const args = ["run", "--format", "json", "--auto"];
    // The background service ignores this process's inline configuration, so
    // the tool denial below needs a private server for this run.
    if (isolate) args.push("--standalone");
    if (req.model) args.push("-m", req.model);
    for (const image of req.imagePaths?.filter(Boolean) ?? []) {
      args.push("-f", image);
    }
    for (const pdf of req.pdfPaths?.filter(Boolean) ?? []) {
      args.push("-f", pdf);
    }
    args.push(prompt);

    let env: NodeJS.ProcessEnv | undefined;
    if (isolate) {
      let configured: Record<string, unknown> = {};
      try {
        const value: unknown = JSON.parse(
          process.env.OPENCODE_CONFIG_CONTENT || "{}",
        );
        if (!value || typeof value !== "object" || Array.isArray(value))
          throw new Error();
        configured = value as Record<string, unknown>;
      } catch {
        throw new AgentError(
          HARNESS,
          "OpenCode's inline configuration is invalid.",
        );
      }
      env = {
        OPENCODE_CONFIG_CONTENT: JSON.stringify({
          ...configured,
          permission: "deny",
        }),
      };
    }

    let result: HeadlessSpawnResult;
    try {
      result = await this.run({
        command: bin,
        args,
        timeoutMs,
        cwd,
        // Native attachments need no tools. Document instructions must not
        // turn this generation into shell commands, edits or MCP writes.
        ...(env ? { env } : {}),
      });
    } catch (err) {
      throw new AgentError(
        this.harness,
        `Failed to launch OpenCode: ${(err as Error).message}`,
        err,
      );
    }
    try {
      if (result.timedOut) {
        throw new AgentError(
          this.harness,
          `OpenCode timed out after ${timeoutMs} ms`,
        );
      }
      // OpenCode may exit 0 even on API error events — parse handles both.
      try {
        return { text: parseOpenCodeJsonl(result.stdout || result.stderr) };
      } catch (err) {
        if (err instanceof AgentError) throw err;
        if (result.code !== 0) {
          throw new AgentError(
            this.harness,
            `OpenCode exited with code ${result.code}: ${truncateSnippet(result.stderr || result.stdout)}`,
          );
        }
        throw err;
      }
    } finally {
      // `opencode run` has no ephemeral mode: it stores every session with its
      // attachments. Material must not stay there (ADR 2026-10-05), so delete
      // what this run created, also after a failure or timeout.
      if (isolate) {
        await this.deleteSessions(bin, openCodeSessionIds(result.stdout), cwd);
      }
    }
  }

  private async deleteSessions(
    bin: string,
    ids: string[],
    cwd: string,
  ): Promise<void> {
    for (const id of ids) {
      // Best effort: the answer is already here, and a failed cleanup must
      // not discard it.
      await this.run({
        command: bin,
        args: ["session", "delete", "--standalone", id],
        timeoutMs: SESSION_DELETE_TIMEOUT_MS,
        cwd,
      }).catch(() => undefined);
    }
  }
}

/** Session ids named by `opencode run --format json` events, in order. */
export function openCodeSessionIds(stdout: string): string[] {
  const ids = new Set<string>();
  for (const line of stdout.split(/\r?\n/)) {
    try {
      const id = (JSON.parse(line) as { sessionID?: unknown }).sessionID;
      if (typeof id === "string" && /^ses_[A-Za-z0-9]+$/.test(id)) ids.add(id);
    } catch {
      // Not an event line.
    }
  }
  return [...ids];
}
