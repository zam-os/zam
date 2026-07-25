/**
 * Agent-backed text generation (ADR 2026-07-12a). A third AI transport beside
 * the direct-HTTP local and cloud paths: instead of ZAM owning the LLM call, it
 * delegates outbound `text` work *through* a connected agent harness (Claude
 * Code, Codex, …) so a learner's subscription — which is OAuth-bound to that
 * harness and cannot be reached over HTTP — drives ZAM's generation.
 *
 * This module is the harness-agnostic contract; concrete adapters live one file
 * per harness (`claude-code.ts`, …). It is CLI-only and lazy-loaded from
 * `client.ts`; the kernel stays HTTP- and harness-agnostic.
 */

import type { AgentHarnessId } from "../agent-harness.js";
import { AntigravityAdapter } from "./antigravity.js";
import { ClaudeCodeAdapter } from "./claude-code.js";
import { CodexAdapter } from "./codex.js";
import { CopilotAdapter } from "./copilot.js";
import { GooseAdapter } from "./goose.js";
import { GrokAdapter } from "./grok.js";
import { HermesAdapter } from "./hermes.js";
import { OpenCodeAdapter } from "./opencode.js";

/** Modalities an adapter can serve (static; probe still gates readiness). */
export interface AgentModalities {
  text: boolean;
  /** True when the harness can inspect local image files (e.g. Gemini via agy). */
  image?: boolean;
}

/** One bounded generation request: system framing + user content → text. */
export interface AgentGenerateRequest {
  /** Full system prompt (replaces the harness's own default framing). */
  system: string;
  /** User message / content to act on. */
  user: string;
  /** Optional schema reminder appended to the system prompt. */
  jsonSchemaHint?: string;
  /** Hard wall-clock budget; the adapter aborts the harness past it. */
  timeoutMs?: number;
  /**
   * Optional absolute paths to local images for multimodal harnesses.
   * Text-only adapters ignore this. Antigravity reads files from the
   * workspace via `--add-dir` rather than base64 payloads.
   */
  imagePaths?: string[];
  /**
   * Optional harness model id (e.g. `Gemini 3.5 Flash (Low)` for `agy --model`).
   * When omitted the harness default applies.
   */
  model?: string;
  /**
   * Optional reasoning effort for harnesses that support it (e.g. Copilot
   * `--effort`). Callers pick by task: medium for fast question rewrite,
   * high for careful answer evaluation.
   */
  effort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
}

export interface AgentGenerateResult {
  /** Raw model text — parsed by the caller (e.g. `parseGeneratedCardArray`). */
  text: string;
}

export interface AgentProbeResult {
  harness: AgentHarnessId;
  /** True when the harness executable is present and usable right now. */
  available: boolean;
  /** Human-readable detail for status chips / errors. */
  detail?: string;
}

/**
 * A per-harness outbound-text adapter. Bespoke per harness (each may use its
 * native headless surface) but sharing this contract so callers stay
 * harness-agnostic.
 */
export interface AgentTextAdapter {
  readonly harness: AgentHarnessId;
  /**
   * Declared modalities. Defaults to text-only when omitted. Used by Settings
   * / model-upsert to set `detectedCapabilities` for agent entries.
   */
  readonly modalities?: AgentModalities;
  /** Cheap readiness check for status chips; never runs a real generation. */
  probe(): Promise<AgentProbeResult>;
  /** Optional model discovery for harnesses that support querying available models. */
  listModels?(): Promise<string[]>;
  /** Generate text, or throw {@link AgentError} on offline/malformed harness. */
  generate(req: AgentGenerateRequest): Promise<AgentGenerateResult>;
}

/**
 * Typed failure that always names the harness, so the UI can say "Claude Code
 * is offline" rather than surfacing a generic LLM timeout. There is deliberately
 * no silent fallback to cloud — a learner who chose Agent chose it on purpose.
 */
export class AgentError extends Error {
  constructor(
    readonly harness: AgentHarnessId,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AgentError";
  }
}

/**
 * Harnesses that currently ship an outbound-text adapter. The Settings UI only
 * offers these as Agent models; additional ids land here as adapters land
 * (Codex, Grok, … — ADR 2026-07-12a).
 */
const AGENT_TEXT_ADAPTERS: Record<string, () => AgentTextAdapter> = {
  "claude-code": () => new ClaudeCodeAdapter(),
  /** Antigravity CLI (`agy`), not the IDE app — multimodal (text + image). */
  antigravity: () => new AntigravityAdapter(),
  /** OpenAI Codex CLI — `codex exec --json`, multimodal via `-i`. */
  codex: () => new CodexAdapter(),
  /** xAI Grok Build CLI — `grok -p`, multimodal via `--prompt-json`. */
  grok: () => new GrokAdapter(),
  /** OpenCode — `opencode run --format json`, files via `-f`. */
  opencode: () => new OpenCodeAdapter(),
  /** Block Goose — `goose run -t … --system …`. */
  goose: () => new GooseAdapter(),
  /** GitHub Copilot CLI — `copilot -p -s`, images via `--attachment`. */
  copilot: () => new CopilotAdapter(),
  /** Hermes Agent — `hermes chat -q -Q`, images via `--image`. */
  hermes: () => new HermesAdapter(),
};

/** Harness ids that can back a `transport: "agent"` model entry today. */
export function listAgentTextHarnessIds(): string[] {
  return Object.keys(AGENT_TEXT_ADAPTERS);
}

/**
 * Resolve the adapter for a harness id (as stored in `ModelEntry.agentHarness`),
 * or `null` when no outbound-text adapter exists for it yet. Constructed lazily
 * to keep this optional surface out of the eager module graph.
 */
export function getAgentAdapter(harness: string): AgentTextAdapter | null {
  const factory = AGENT_TEXT_ADAPTERS[harness];
  return factory ? factory() : null;
}
