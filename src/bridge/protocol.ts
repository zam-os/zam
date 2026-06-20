/**
 * ZAM Bridge Protocol — JSON IPC for AI CLI Integration
 *
 * Defines the request/response shapes for communication between
 * AI CLI skills (Claude Code, Codex, Copilot CLI, Gemini CLI) and the
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

/**
 * A token's source_link resolved into ready-to-use context.
 *
 * `sourceType` tells the AI client how to treat `content`:
 * - `local` / `remote_web`: the literal file/page text (already line-sliced
 *   when the link carried a `#Lx-Ly` anchor). Ground questions in it directly.
 * - `dynamic_search`: `content` is a `QUERY_DIRECTIVE` — run the web search it
 *   names, then ground the review in the results.
 */
export interface ResolvedReviewContext {
  sourceLink: string;
  sourceType: "local" | "remote_web" | "dynamic_search";
  content: string;
  filePath?: string;
  url?: string;
  truncated: boolean;
}

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
  sourceLink?: string | null;
  /** Present when the token has a source_link and resolution was not disabled. */
  resolvedContext?: ResolvedReviewContext | null;
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
  sourceLink?: string | null;
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
    source_link: string | null;
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
      source_link: string | null;
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
  source_link?: string | null; // file path / reference URL; stdin payload is snake_case
  prerequisites?: string[]; // slugs of prerequisite tokens
  userId?: string; // if provided, ensures a card is created
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

// ── Knowledge Graph / 3D Neighborhood (experimental feature) ─────────────────

/** Token shape used by graph endpoints (camelCase for the JSON bridge contract). */
export interface GraphToken {
  id: string;
  slug: string;
  concept: string;
  domain: string;
  bloomLevel: number;
  card?: {
    state: string;
    reps: number;
    stability: number;
    difficulty: number;
    blocked: boolean;
    dueAt: string;
    lastReviewAt: string | null;
  } | null;
}

export interface GetNeighborhoodResponse {
  focus: string; // slug of the node in focus
  center: GraphToken;
  prerequisites: GraphToken[];
  dependents: GraphToken[];
}

export interface ListTokensResponse {
  tokens: GraphToken[];
}

// ── Observer Policy / UI Capture ─────────────────────────────────────────────
//
// Layer 2 of the two-layer consent model (docs/adr/0001-observer-permission-model.md).
// Every `bridge capture-ui` response echoes the resolved permission summary and
// is either granted (pixels returned) or denied (refused by policy).

export type ObserverScope = "off" | "window" | "fullscreen";
export type ObserverConsent = "per-capture" | "per-session" | "standing";
export type ObserverRetention = "none" | "session" | "persist";

/** The permission summary echoed back on every capture-ui response. */
export interface ObserverPermission {
  scope: ObserverScope;
  consent: ObserverConsent;
  retention: ObserverRetention;
  granted: boolean;
}

export type CaptureDenialReason =
  | "scope-off"
  | "scope-requires-target"
  | "denylisted"
  | "not-allowlisted"
  | "sensitive";

export interface CaptureUiTarget {
  requestedHwnd: string | null;
  requestedProcessName: string | null;
  matchedBy: string;
  hwnd: number | null;
  processId: number | null;
  processName: string | null;
  windowTitle: string | null;
  bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null;
}

/** Granted capture (or a caller-provided `--image`). */
export interface CaptureUiResponse {
  sessionId: string | null;
  granted: true;
  imagePath: string;
  base64: string;
  mimeType: "image/png";
  captureMethod: string;
  captureTarget: CaptureUiTarget | null;
  capturedAt: string;
  platform: string;
  permission: ObserverPermission;
}

/** Capture refused by the observer policy; no pixels are returned. */
export interface CaptureUiDeniedResponse {
  sessionId: string | null;
  granted: false;
  denied: true;
  denialReason: CaptureDenialReason;
  reason: string;
  capturedAt: string;
  platform: string;
  permission: ObserverPermission;
}
