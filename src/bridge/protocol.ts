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
  atomId?: string | null;
  tier?: string | null;
  fastCheck?: {
    type: "binary_choice" | "multiple_choice";
    options: string[];
    correctIndex: number;
    /** Options as segments, parallel to `options`; `null` for a plain one. */
    optionSegments?: Array<CardSegmentPayload[] | null>;
  } | null;
  media?: ReviewMediaPayload[];
  /** Present when the token has a source_link and resolution was not disabled. */
  resolvedContext?: ResolvedReviewContext | null;
  /**
   * Card text as segments (ADR 2026-10-14b). A rendering surface shows these;
   * `question` and `concept` stay their plain projections for everyone else.
   */
  questionSegments?: CardSegmentPayload[] | null;
  conceptSegments?: CardSegmentPayload[] | null;
  /** What voice mode reads instead of `question`/`concept`, when set. */
  spokenQuestion?: string | null;
  spokenConcept?: string | null;
}

/**
 * One segment of card text (ADR 2026-10-14b): plain text, an allowlisted
 * TeX formula with the words to read it aloud, or an image from the media
 * store with its alt text. Never markup to be inserted as HTML.
 */
export type CardSegmentPayload =
  | { type: "text"; text: string }
  | { type: "math"; tex: string; speech?: string; block?: boolean }
  | {
      type: "image";
      media: string;
      alt: string;
      caption?: string;
      inline?: boolean;
    };

export interface ReviewMediaPayload {
  assetHash: string;
  side: "question" | "answer";
  kind: "image" | "audio";
  ordinal: number;
  originalName: string;
  altText: string | null;
  mimeType: string;
  byteSize: number;
  dataBase64: string;
  occlusions: Array<{
    shape: "rect" | "ellipse";
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
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
  buriedSiblings?: number;
  buriedUntil?: string | null;
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
    buriedSiblings: number;
    buriedUntil: string | null;
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
      learning_step: number | null;
      buried_until: string | null;
      buried_reason: string | null;
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

// ── Discuss Review (post-reveal follow-up dialogue, ADR 2026-07-06b) ────────

export interface DiscussionTurn {
  role: "user" | "assistant";
  content: string;
}

export interface DiscussReviewResponse {
  success: boolean;
  /** Assistant reply to the newest learner turn; empty string on failure. */
  reply: string;
  replyModel?: string | null;
  error?: string;
}

// ── Add Token ───────────────────────────────────────────────────────────────

export interface KnowledgeContextPayload {
  id?: string;
  name: string;
  label: string | null;
  language: string | null;
  created_at?: string;
}

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
  knowledgeContexts?: string[];
  /** Compatibility spelling accepted by the stdin bridge command. */
  knowledge_contexts?: string[];
}

export interface AddTokenResponse {
  id: string;
  slug: string;
  created: boolean;
  cardId?: string;
}

export interface ListKnowledgeContextsResponse {
  success: true;
  contexts: KnowledgeContextPayload[];
}

export interface KnowledgeContextAssignmentResponse {
  success: true;
  token: string;
  context: string;
}

export interface ActiveKnowledgeContextResponse {
  success: true;
  activeContext: string | null;
  staleContext?: string | null;
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
  title: string;
  display_title: string;
  concept: string;
  domain: string;
  bloomLevel: number;
  knowledgeContexts: Array<{
    name: string;
    label: string | null;
    language: string | null;
  }>;
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
  | "screen-observation-off"
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

/**
 * Reported by `bridge get-observer-policy` so an agent can check the rules
 * before attempting a capture (the check-before-acting / list-granted pattern).
 * `denylist` is the user's configured list; the surfaces in
 * `builtInSensitiveMatchers` are always refused regardless of `allowlist`.
 */
export interface GetObserverPolicyResponse {
  scope: ObserverScope;
  consent: ObserverConsent;
  retention: ObserverRetention;
  allowlist: string[];
  denylist: string[];
  redactWindowTitles: boolean;
  audioOptIn: boolean;
  builtInSensitiveAlwaysRefused: true;
  builtInSensitiveMatchers: string[];
  /**
   * The machine-local switch in front of every screen surface (ADR 2026-10-08
   * R8). While it is "off", the policy above is never reached: each surface
   * returns a {@link ScreenObservationDeniedResponse} first.
   */
  screenObservation: "on" | "off";
}

/**
 * Returned by `capture-ui`, `observe-ui-snapshot`, `observe-ui-watch` and
 * `get-observations` while screen observation is off on this machine (ADR
 * 2026-10-08 R8). Nothing was captured, read or analyzed.
 */
export interface ScreenObservationDeniedResponse {
  sessionId: string | null;
  denied: true;
  denialReason: "screen-observation-off";
  reason: string;
}

export interface GetReviewsResponse {
  cards: Array<{
    cardId: string;
    tokenId: string;
    slug: string;
    concept: string;
    domain: string;
    bloomLevel: number;
    state: string;
    dueAt: string;
    bloomVerb?: string;
    question?: string;
    sourceLink?: string | null;
    atomId?: string | null;
    tier?: string | null;
    fastCheck?: {
      type: "binary_choice" | "multiple_choice";
      options: string[];
      correctIndex: number;
    } | null;
    resolvedContext?: ResolvedReviewContext | null;
  }>;
}

/**
 * `zam bridge answer-presentation` (ADR 2026-09-27 Decisions 6–9): how a card
 * is asked in the choice or auto mode. `entries` is aligned with `options`.
 */
export interface AnswerPresentationResponse {
  success: true;
  presentation:
    | {
        format: "choice";
        choice: {
          options: string[];
          correctIndex: number;
          entries: Array<{
            source: "correct" | "curated" | "derived" | "generated";
            distractorId?: string;
            curatedIndex?: number;
            donorTokenId?: string;
            reason?: string | null;
            /** The model that wrote a generated option. */
            model?: string | null;
          }>;
        };
      }
    | {
        format: "recall";
        reason:
          | "mode"
          | "unsuitable"
          | "no_options"
          | "probe"
          | "recall_stage"
          | "curated_disputed";
        /** For `unsuitable`: which rule excluded the item. */
        detail?: "answer_media";
      };
}

export interface SubmitReviewResult {
  success: boolean;
  rating: number | null;
  evaluation?: {
    nextDueAt: string;
    stability: number;
    scheduledDays: number;
    state: string;
    reps: number;
    lapses: number;
    /** The tap ceiling bounded this rating (ADR 2026-09-27 Decision 4). */
    ceilingApplied?: boolean;
  } | null;
  blocked?: {
    blockedSlug: string;
    prerequisites: Array<{ slug: string; concept: string; bloomLevel: number }>;
  } | null;
  /** True when an unrated agent or assisted-user step was logged without advancing FSRS. */
  recordedOnly?: boolean;
  /**
   * Attempt this submission belongs to. Pass the id `admit-review` returned so
   * a retried submit is recognised as the same attempt.
   */
  attemptId?: string;
  /** False when the same attempt was already rated identically; FSRS was not touched. */
  applied?: boolean;
  /** True when a record-only or agent step for this attempt already existed. */
  replayed?: boolean;
}

export interface SessionOpenResponse {
  session: {
    id: string;
    userId: string;
    task: string;
    executionContext: string;
    startedAt: string;
    completedAt: string | null;
  };
  due: {
    dueCount: number;
    domains: string[];
    cards: Array<{
      cardId: string;
      tokenId: string;
      slug: string;
      concept: string;
      domain: string;
      bloomLevel: number;
      state: string;
      dueAt: string;
    }>;
  };
  relevant: {
    semantic: boolean;
    tokens: Array<{
      slug: string;
      title: string | null;
      display_title: string;
      concept: string;
      domain: string;
      bloom_level: number;
      score: number;
      similarity: number;
      knowledgeContexts: Array<{
        name: string;
        label: string | null;
        language: string | null;
      }>;
      card: {
        state: string;
        due_at: string;
        blocked: boolean;
      } | null;
    }>;
  };
}

// ── Agent harness connect (App settings & first-run, ADR 2026-07-11) ────────

export interface AgentHarnessStatusEntry {
  harness: string;
  label: string;
  installed: boolean;
  configured: boolean;
  configPath: string;
  /** Present when the existing host config could not be inspected. */
  note?: string;
}

export interface AgentHarnessStatusResponse {
  success: boolean;
  zamOnPath: boolean;
  harnesses: AgentHarnessStatusEntry[];
}

export interface AgentConnectResultEntry {
  harness: string;
  label: string;
  path: string;
  alreadyConfigured: boolean;
  wrote: boolean;
  hint: string;
  extension: {
    kind: "copilot" | "vscode";
    action: string;
    location: string;
    detail: string;
  } | null;
  error?: string;
}

export interface AgentConnectResponse {
  success: boolean;
  /** True when `--auto-once` found the first-run marker already set. */
  skipped?: boolean;
  error?: string;
  detected?: string[];
  zamOnPath?: boolean;
  results?: AgentConnectResultEntry[];
  skills?: { refreshed: number; total: number } | null;
}

// ── Material import (ADR 2026-10-05) ────────────────────────────────────────
//
// Learning cards from photos and files. `material-import-stage` (or the MCP
// tool) leaves a batch waiting; `material-import-review` builds the list the
// learner decides; `material-import-confirm` writes the choices.

export type MaterialChoiceWire = "yes" | "bonus" | "no";

export interface MaterialImportStageResponse {
  success: boolean;
  id: string;
  proposalCount: number;
}

/**
 * `model-refresh-capabilities`: cloud rows asked again because their detection
 * was out of date. With `--check`, only `due` is set and nothing is asked.
 */
export interface ModelRefreshCapabilitiesResponse {
  success: boolean;
  due?: number;
  checked?: number;
  refreshed?: Array<{ id: string; label: string; added: string[] }>;
}

/** `material-import-models`: where a built-in import would send the files. */
export interface MaterialImportModelsResponse {
  success: boolean;
  image: { label: string; model: string } | null;
  file: { label: string; model: string } | null;
  /** The model typed notes go to (ADR 2026-10-13, Decision 9). */
  text?: { label: string; model: string } | null;
  /** HEIC photos can be converted on this machine. */
  convertsHeic: boolean;
}

export type MaterialAnalyzeCodeWire =
  | "no-files"
  | "unsupported"
  | "mixed"
  | "one-pdf"
  | "too-many"
  | "heic"
  | "too-large"
  | "missing"
  | "no-image-model"
  | "no-file-model"
  | "no-text-model"
  | "model-failed"
  | "invalid-answer";

/**
 * `material-import-analyze`: the staged batch, or a refusal with a code the
 * Studio explains. Progress goes to stderr as
 * `{"type":"material-analyze-progress","done":n,"total":m}`.
 */
export type MaterialImportAnalyzeResponse =
  | {
      success: true;
      id: string;
      proposalCount: number;
      /** The model that read the pages — not always the one named before. */
      model: { label: string; model: string };
      /** Every model the pages were sent to, in order. */
      sentTo: Array<{ label: string; model: string }>;
    }
  | { success: false; code: MaterialAnalyzeCodeWire; message: string };

export interface MaterialImportPendingEntry {
  id: string;
  title: string;
  createdAt: string;
  origin: "harness" | "studio";
  harness: string | null;
  proposalCount: number;
}

export interface MaterialImportPendingResponse {
  success: boolean;
  imports: MaterialImportPendingEntry[];
}

export interface MaterialImportProposalWire {
  question: string;
  answer: string;
  title: string | null;
  bloom: number;
  file: number;
  page: number | null;
  area: string;
  origin: "page" | "completed" | "extra";
  hardToRead: boolean;
  /** Names for the levels below the import's atlas place (ADR 2026-10-13). */
  placeBelow?: string[];
  /** The published unit this card's method may stand in for (D12). */
  standsFor?: string;
  /**
   * The kind the producer proposes (ADR 2026-10-13, D2): `welt`, or
   * `firma`/`privat` for the library's own planet. Mixed imports only.
   */
  kind?: "welt" | "firma" | "privat";
  /** Question and answer as segments when they hold a formula (ADR 2026-10-14b). */
  questionSegments?: CardSegmentPayload[];
  answerSegments?: CardSegmentPayload[];
  /**
   * What stayed text although it looked like TeX: a `$` that is not math,
   * or a formula the validator refused. The review list shows it.
   */
  textNotes?: Array<{ kind: "dollar" | "formula"; text: string }>;
}

export type MaterialImportTargetWire =
  | { type: "token"; tokenId: string }
  | { type: "cell-item"; cellId: string; atomId: string; itemId: string };

export type MaterialImportRowWire =
  | {
      kind: "proposal";
      id: string;
      proposalIndex: number;
      preset: MaterialChoiceWire | null;
    }
  | {
      kind: "existing";
      id: string;
      besideProposal: number;
      preset: MaterialChoiceWire | null;
      held: boolean;
      score: number;
      via: "lexical" | "vector";
      target: MaterialImportTargetWire;
      question: string;
      answer: string;
      title: string;
      area: string;
    }
  | {
      kind: "continuation";
      id: string;
      preset: "bonus";
      target: MaterialImportTargetWire;
      question: string;
      answer: string;
      title: string;
      area: string;
    };

export interface MaterialImportReviewResponse {
  success: boolean;
  id: string;
  createdAt: string;
  origin: "harness" | "studio";
  harness: string | null;
  /** The model that read the pages on the built-in path (D11). */
  readBy: string | null;
  /** Every model the pages were sent to on the built-in path, in order. */
  sentTo: string[];
  analysis: {
    kind: string;
    title: string;
    subjects: string[];
    topic: string;
    level: string;
    bloom: [number, number];
    leadsTo: string | null;
  };
  proposals: MaterialImportProposalWire[];
  files: Array<{
    name: string;
    sourceLink: string;
    sha256: string | null;
    path: string | null;
  }>;
  rows: MaterialImportRowWire[];
  areaGroups: Array<{ area: string; proposalIndexes: number[] }>;
  reimports: Array<{
    sourceId: string;
    title: string | null;
    createdAt: string;
  }>;
  semantic: boolean;
  /** Where on the knowledge atlas the new cards go: region names, island first. */
  place?: { lens: string; regionKey: string; path: string[] } | null;
  /** Titles of the published units a proposal's `standsFor` names. */
  variantTitles?: Record<string, string>;
  /** The library's own planet, for a mixed import's kind per card. */
  ownPlanet?: AtlasOwnPlanetWire;
}

export interface MaterialImportConfirmResponse {
  success: boolean;
  sourceId: string;
  cardsCreated: number;
  bonusKept: number;
  linkedExisting: number;
  notSaved: number;
  /** New units put at the import's atlas place. */
  placed?: number;
  /** Published units a new card now stands in for. */
  variantsChosen?: number;
  /** New units the learner's kind sent to the world planet or the own. */
  kinds?: { welt: number; own: number };
}

export interface MaterialImportAreasResponse {
  success: boolean;
  areas: Array<{ path: string; tokenCount: number }>;
  cellSubjects: string[];
}

export interface MaterialImportBonusItemWire {
  tokenId: string;
  title: string;
  question: string | null;
  concept: string;
  domain: string;
  sourceId: string;
  sourceTitle: string | null;
  importedAt: string;
}

export interface MaterialImportBonusListResponse {
  success: boolean;
  items: MaterialImportBonusItemWire[];
}

export interface MaterialImportBonusTakeResponse {
  success: boolean;
  cardId: string;
}

export interface MaterialImportFilePreviewResponse {
  success: boolean;
  name: string;
  path: string | null;
  kind: "image" | "pdf" | "other";
  /** `data:` URL of an image small enough to show inline. */
  dataUrl: string | null;
  reason: "ok" | "missing" | "too-large" | "not-viewable";
}

// ── Knowledge atlas (ADR 2026-10-13) ────────────────────────────────────────

export type AtlasConditionWire =
  | "known"
  | "due"
  | "overdue"
  | "decaying"
  | "forgotten"
  | "unpractised";

export type AtlasLensKindWire =
  | "weltwissen"
  | "schule"
  | "unternehmen"
  | "produkte"
  | "leben";

/** "atom:<id>" or "token:<id>": one learning unit. */
export type AtlasUnitKeyWire = string;

/**
 * Reading up on a world unit (ADR 2026-10-14, Decision 4), opened only on
 * the learner's click: the web page it came from, or a reference work's
 * search for its term, which the surface builds in the learner's language.
 * Firma and Privat units carry none. Never a source link; nothing fetches it.
 */
export type ReadUpWire =
  | { kind: "source"; url: string }
  | { kind: "search"; term: string; language: string | null };

/** `graph3d-feature`: this machine's switch for the 3D Wissensnetz alpha. */
export interface Graph3dFeatureResponse {
  success: boolean;
  enabled: boolean;
}

export interface AtlasRegionWire {
  key: string;
  name: string;
  level: number;
  parentKey: string | null;
  rank: number;
  /** Key the hue comes from; empty above the lens's colour level. */
  hueKey: string;
  pattern: string | null;
  /** Not stored yet; the next settle writes it. */
  provisional: boolean;
  /**
   * Key into `emblems`: the region's own Sinnbild, or for a leaf region
   * without one, its first unit's.
   */
  emblem?: string;
  /**
   * Where a new Sinnbild of this region is written: `subject:<key>` for a
   * Fach (one Sinnbild in every lens), else `region:<lens>:<key>`.
   */
  emblemSubject: string;
}

/**
 * A Sinnbild as the validator re-serialised it (ADR 2026-10-13, D6). Show it
 * only as an image (`emblemDataUrl`) and the glyph only as text.
 */
export interface AtlasEmblemWire {
  svg: string;
  glyph: string | null;
  /** The learner's own, the library's, or the seed's. */
  source: "personal" | "shared" | "seed";
}

export interface AtlasUnitWire {
  key: AtlasUnitKeyWire;
  title: string;
  /** Leaf region key. */
  region: string;
  condition: AtlasConditionWire | null;
  due: number;
  cards: number;
  /** Written in this library, not published: drawn with a marker. */
  own: boolean;
  /** No card yet; shown only with *Neue Inhalte zeigen*. */
  inReach: boolean;
  /** This unit stands in for a published one on its hex (Decision 12). */
  standsFor?: { key: AtlasUnitKeyWire; title: string; chosen: boolean };
  /** The library sets a variant for this unit; the learner still holds it. */
  variantOffer?: { key: AtlasUnitKeyWire; title: string };
  /** Key into `emblems` when the unit has a Sinnbild. */
  emblem?: string;
  /** Where to read the unit up; world lenses only (ADR 2026-10-14, D4). */
  readUp?: ReadUpWire;
}

export interface AtlasReadResponse {
  success: boolean;
  lens: {
    kind: AtlasLensKindWire;
    planet: AtlasPlanetWire;
    name: string;
    levels: string[];
    colourLevel: number;
  };
  regions: AtlasRegionWire[];
  islands: Array<{
    key: string;
    dq: number;
    dr: number;
    /** Hex steps since founding. */
    drift: number;
    provisional: boolean;
  }>;
  /** Every hex of the library; `unit` is null for reserve and for units the caller does not hold. */
  land: Array<{
    island: string;
    q: number;
    r: number;
    region: string;
    unit: AtlasUnitKeyWire | null;
  }>;
  units: AtlasUnitWire[];
  /**
   * Threads with at least one end on this map (ADR 2026-10-13, D7). An end
   * on the library's other planet is named in `portals`.
   */
  threads: AtlasThreadWire[];
  /** Ends of threads on the other planet, drawn as portals. Titles are untrusted. */
  portals?: Record<
    AtlasUnitKeyWire,
    { title: string; planet: AtlasPlanetWire }
  >;
  /** The caller's own due counts, per region and every ancestor. */
  own: { dueByRegion: Record<string, number> };
  settle: { pending: number; mayWrite: boolean };
  /** Resolved home region key; null = the whole lens. */
  home: string | null;
  /** Sinnbilder by subject key (a unit key or `region:<lens>:<key>`). */
  emblems: Record<string, AtlasEmblemWire>;
  /** The library's own planet beside world knowledge (ADR 2026-10-13, D2). */
  ownPlanet?: AtlasOwnPlanetWire;
  /** The lenses this library shows, world's first. */
  lenses?: AtlasLensInfoWire[];
  /** The lens's curation (Decision 3); null before the lens is stored. */
  curation?: AtlasCurationWire | null;
}

/**
 * A curated lens's state: the named source it follows, the agent's verdict
 * that it no longer fits it, and one replacement waiting for a curator.
 * Source, note and names are untrusted text.
 */
export interface AtlasCurationWire {
  source: string | null;
  stale: { at: string; note: string | null } | null;
  proposal: {
    source: string;
    at: string;
    by: string | null;
    regions: number;
    members: number;
  } | null;
}

/** `atlas-revision`: changes whenever what the atlas shows may have changed. */
export interface AtlasRevisionResponse {
  success: boolean;
  revision: string;
}

export type AtlasThreadKindWire =
  | "voraussetzung"
  | "nutzt"
  | "schnittstelle"
  | "ist-ein"
  | "verbindung";

/** One red thread (ADR 2026-10-13, D7). `scope` and `id` are additive. */
export interface AtlasThreadWire {
  /**
   * The dependent end: it builds on, uses, consumes the interface of, or is
   * a special case of `to`. A Verbindung has no direction.
   */
  from: AtlasUnitKeyWire;
  to: AtlasUnitKeyWire;
  kind: AtlasThreadKindWire;
  /** The library's (a prerequisite or a connection), or the learner's own. */
  scope?: "shared" | "personal";
  /** A connection's id, for `atlas-disconnect`; prerequisites have none. */
  id?: string;
  /** Why the two belong together. Untrusted text. */
  note?: string;
  /**
   * The learner's own thread, drawn once although the library has the same
   * one: `id` and `note` are the learner's.
   */
  alsoShared?: boolean;
}

/** `atlas-connect`: the thread as stored. */
export interface AtlasConnectResponse {
  success: true;
  id: string;
  scope: "shared" | "personal";
  from: AtlasUnitKeyWire;
  to: AtlasUnitKeyWire;
  kind: AtlasThreadKindWire;
  note: string | null;
  /** A Verbindung was turned around. */
  swapped: boolean;
  /** False when the same thread was there already. */
  created: boolean;
}

export interface AtlasDisconnectResponse {
  success: true;
  scope: "shared" | "personal";
}

/** A refused `atlas-connect` or `atlas-disconnect`: the message and its code. */
export interface AtlasThreadRefusal {
  error: string;
  /** `world-to-own`, `same-unit`, `not-curator`, … (`ConnectionErrorCode`). */
  code: string;
}

export type AtlasPlanetWire = "welt" | "firma" | "privat";
export type AtlasOwnPlanetWire = "firma" | "privat";

export interface AtlasLensInfoWire {
  kind: AtlasLensKindWire;
  planet: AtlasPlanetWire;
  name: string;
}

/** `atlas-planet`: the library's own planet, and whether the caller may change it. */
export interface AtlasPlanetResponse {
  success: boolean;
  own: AtlasOwnPlanetWire;
  /** Set explicitly; otherwise the default for this kind of library. */
  explicit: boolean;
  /** The library's owner, or a curator on a team library. */
  mayChange: boolean;
  lenses: AtlasLensInfoWire[];
}

/** `atlas-move-planet`: units that changed their kind. */
export interface AtlasMovePlanetResponse {
  success: boolean;
  moved: AtlasUnitKeyWire[];
  unchanged: AtlasUnitKeyWire[];
  /** Published units, which stay world knowledge, and unknown keys. */
  skipped: AtlasUnitKeyWire[];
  /**
   * Units a thread or prerequisite keeps on their planet, because world
   * knowledge would depend on a Firma or Privat unit; `by` is the other end.
   */
  held: Array<{ unit: AtlasUnitKeyWire; by: AtlasUnitKeyWire }>;
}

/** `atlas-emblem-set` and a successful `atlas-emblem-draw`. */
export interface AtlasEmblemResponse {
  success: true;
  /** Shared (the library's) or personal (the learner's own). */
  scope: "personal" | "shared";
  subjectKey: string;
  emblem: AtlasEmblemWire;
  /** `atlas-emblem-draw` only: the model that drew it. */
  model?: string;
}

/** `atlas-emblem-draw` refusals, which the Studio explains by code. */
export interface AtlasEmblemDrawRefusal {
  success: false;
  code: "no-text-model" | "model-failed" | "invalid-answer";
  message: string;
}

export interface AtlasEmblemClearResponse {
  success: true;
  cleared: boolean;
}

export interface AtlasSettleResponse {
  success: boolean;
  regionsCreated: number;
  islandsWritten: number;
  landWritten: number;
  /** Hexes that went back to the sea: no unit reaches their region. */
  landRemoved: number;
  /** Islands left without units, gone from the map. */
  islandsRemoved: number;
}

export interface AtlasPrefsResponse {
  success: boolean;
  lens: AtlasLensKindWire;
  showNew: boolean;
  /** Stored home path per lens, root first. */
  home: Partial<Record<AtlasLensKindWire, string[]>>;
  /** Cells installed because *Neue Inhalte zeigen* went on; enrols nobody. */
  cellsInstalled?: string[];
}

/** `atlas-place`: what an import at a region needs (ADR 2026-10-13, D9). */
export interface AtlasPlaceResponse {
  success: boolean;
  place: {
    lens: AtlasLensKindWire;
    regionKey: string;
    path: Array<{ key: string; name: string; level: number }>;
    missingLevels: string[];
  };
  units: Array<{ key: AtlasUnitKeyWire; title: string }>;
  cells: Array<{
    id: string;
    title: string;
    gradeLabel: string;
    installed: boolean;
    enrolled: boolean;
    cardCount: number;
  }>;
  scope: {
    provider: string;
    schoolType?: string;
    grade?: number;
    track?: string;
    subject?: string;
  } | null;
  /** Offer the generic curriculum wizard: no cell covers the position. */
  wizard: boolean;
}

export interface AtlasTakeResponse {
  success: boolean;
  cardsCreated: number;
  skipped: number;
}

export interface AtlasVariantResponse {
  success: boolean;
  detached?: number;
  reattached?: number;
}
