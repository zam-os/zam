/**
 * ZAM Bridge Protocol — JSON IPC for AI CLI Integration
 *
 * Defines the request/response shapes for communication between
 * AI CLI skills (Claude Code, Copilot CLI, Gemini CLI) and the
 * ZAM Learning Kernel.
 *
 * The bridge uses stdin/stdout JSON: the AI CLI calls `zam bridge <command>`
 * and reads JSON from stdout.
 */

// ── Check Due ───────────────────────────────────────────────────────────────

export interface CheckDueResponse {
  due: number;
  newCount: number;
  reviewCount: number;
  relearnCount: number;
  domains: string[];
}

// ── Get Review ──────────────────────────────────────────────────────────────

export interface GetReviewResponse {
  cardId: string;
  tokenId: string;
  slug: string;
  concept: string;
  domain: string;
  bloomLevel: number;
  bloomVerb: string;
  question: string;
  state: string;
}

// ── Submit Rating ───────────────────────────────────────────────────────────

export interface SubmitRatingRequest {
  cardId: string;
  rating: 1 | 2 | 3 | 4;
  sessionId?: string;
  responseTimeMs?: number;
}

export interface SubmitRatingResponse {
  nextDueAt: string;
  stability: number;
  scheduledDays: number;
  state: string;
  blocked?: {
    slug: string;
    prerequisites: Array<{ slug: string; concept: string; bloomLevel: number }>;
  };
}

// ── Add Token ───────────────────────────────────────────────────────────────

export interface AddTokenRequest {
  slug: string;
  concept: string;
  domain: string;
  bloomLevel: number;
  context?: string;
  symbiosisMode?: "shadowing" | "copilot" | "autonomy";
  prerequisites?: string[]; // slugs of prerequisite tokens
  userId?: string;          // if provided, ensures a card is created
}

export interface AddTokenResponse {
  id: string;
  slug: string;
  created: boolean;
  cardId?: string;
}

// ── Get Agent Skill ──────────────────────────────────────────────────────────

export interface GetSkillResponse {
  slug: string;
  description: string;
  steps: string[];
  tokenSlugs: string[];
  source: string;
}
