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

// ── Review Action ───────────────────────────────────────────────────────────

export type ReviewActionType =
  | "rate"
  | "skip"
  | "edit-token"
  | "deprecate-token"
  | "delete-token"
  | "delete-card"
  | "stop";

export interface ReviewActionRequest {
  cardId: string;
  action: ReviewActionType;
  rating?: 1 | 2 | 3 | 4;
  concept?: string;
  domain?: string;
  bloomLevel?: number;
  context?: string;
  symbiosisMode?: "shadowing" | "copilot" | "autonomy" | "none";
  confirm?: boolean;
}

export interface ReviewActionResponse {
  success: boolean;
  action: ReviewActionType;
  preview?: boolean;
  requiresConfirmation?: boolean;
  token: {
    slug: string;
    tokenId: string;
  };
  rating?: 1 | 2 | 3 | 4 | null;
  evaluation?: {
    nextDueAt: string;
    stability: number;
    scheduledDays: number;
    state: string;
    reps: number;
    lapses: number;
  } | null;
  blocked?: {
    blockedSlug: string;
    prerequisites: Array<{ slug: string; concept: string; bloomLevel: number }>;
  } | null;
  updatedToken?: {
    id: string;
    slug: string;
    concept: string;
    domain: string;
    bloom_level: number;
    context: string;
    symbiosis_mode: "shadowing" | "copilot" | "autonomy" | null;
    created_at: string;
    updated_at: string;
    deprecated_at: string | null;
  } | null;
  deletedToken?: {
    token: {
      id: string;
      slug: string;
      concept: string;
      domain: string;
      bloom_level: number;
      context: string;
      symbiosis_mode: "shadowing" | "copilot" | "autonomy" | null;
      created_at: string;
      updated_at: string;
      deprecated_at: string | null;
    };
    impact: {
      cards: number;
      review_logs: number;
      prerequisite_edges_from_token: number;
      prerequisite_edges_to_token: number;
      session_steps: number;
      sessions_touched: number;
      agent_skills: number;
    };
  } | null;
  deletedCard?: {
    card: {
      id: string;
      token_id: string;
      user_id: string;
      stability: number;
      difficulty: number;
      elapsed_days: number;
      scheduled_days: number;
      reps: number;
      lapses: number;
      state: "new" | "learning" | "review" | "relearning";
      due_at: string;
      last_review_at: string | null;
      blocked: number;
    };
    impact: {
      review_logs: number;
    };
  } | null;
  skipped?: boolean;
  stopped?: boolean;
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

// ── Get Monitor ─────────────────────────────────────────────────────────────

export interface GetMonitorResponse {
  sessionId: string;
  exists: boolean;
  commands: Array<{
    seq: number;
    command: string;
    cwd: string;
    startedAt: string;
    endedAt: string | null;
    durationMs: number | null;
    exitCode: number | null;
  }>;
  timeSpan: { start: string; end: string; durationMs: number } | null;
}

// ── Analyze Monitor ─────────────────────────────────────────────────────────

export interface AnalyzeMonitorRequest {
  patterns: Array<{
    slug: string;
    patterns: string[];
  }>;
}

export interface AnalyzeMonitorResponse {
  sessionId: string;
  ratings: Array<{
    tokenSlug: string;
    rating: 1 | 2 | 3 | 4 | null;
    confidence: "high" | "medium" | "low";
    evidence: {
      matchedCommands: number;
      helpSeeking: boolean;
      errorCount: number;
      selfCorrections: number;
      medianGapMs: number | null;
      thinkingGapMs: number | null;
    };
    matchedCommandTexts: string[];
  }>;
  unmatchedCommands: string[];
  timeSpan: { start: string; end: string; durationMs: number } | null;
}
