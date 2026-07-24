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
import { ClaudeCodeAdapter } from "./claude-code.js";

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
  /** Cheap readiness check for status chips; never runs a real generation. */
  probe(): Promise<AgentProbeResult>;
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
 * Resolve the adapter for a harness id (as stored in `ModelEntry.agentHarness`),
 * or `null` when no outbound-text adapter exists for it yet. Constructed lazily
 * to keep this optional surface out of the eager module graph.
 */
export function getAgentAdapter(harness: string): AgentTextAdapter | null {
  switch (harness) {
    case "claude-code":
      return new ClaudeCodeAdapter();
    default:
      return null;
  }
}
