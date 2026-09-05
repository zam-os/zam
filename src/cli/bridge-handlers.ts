import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  BloomLevel,
  Database,
  InstallChannel,
  KnowledgeContext,
  Rating,
  ReviewActionType,
  SymbiosisMode,
  SynthesisConfidence,
  Token,
  TokenPattern,
  UpdateDecision,
  UpdateTokenInput,
} from "../kernel/index.js";
import {
  addPrerequisite,
  admitPresentation,
  analyzeObservation,
  assessPrecondition,
  assignTokenToContext,
  bonusCandidates,
  buildReviewQueue,
  clearTokenMaintenance,
  createAssignment,
  createToken,
  decideUpdate,
  enrolBonusAtom,
  enrolBundledCell,
  ensureCard,
  evaluatePublicationReadiness,
  executeReviewAction,
  exportSnapshot,
  findBundledCellsForScope,
  generateConceptFreeCue,
  generatePrompt,
  getBundledCell,
  getBundledCellsWithStatus,
  getCard,
  getCardById,
  getCardDeletionImpact,
  getDatabaseTargetInfo,
  getDisplayTitle,
  getDueCards,
  getInstallChannel,
  getPreconditionCandidates,
  getPrerequisites,
  getPullForwardCandidates,
  getRevisionImpact,
  getSessionSummary,
  getSetting,
  getTokenById,
  getTokenBySlug,
  getTokenDeleteImpact,
  getTokenMedia,
  getTokensBySourceLinkBase,
  getUserStats,
  isObserverPolicyConfigured,
  endSession as kernelEndSession,
  startSession as kernelStartSession,
  suggestFoundations as kernelSuggestFoundations,
  listAssignmentsByAssigner,
  listAssignmentsForLearner,
  listTokens,
  logStep,
  monitorLogExists,
  needsGenericCurriculumImport,
  OBSERVER_POLICY_UNSET_HINT,
  pairCommands,
  parseReviewFastCheck,
  prepareSessionSynthesis,
  presentFastCheck,
  publishTokenRevision,
  pullForwardCards,
  readMonitorLog,
  removePrerequisite,
  resetCardsForToken,
  resolveReviewContext,
  searchTokensHybrid,
  setTokenMaintenance,
  structuralPublicationChecks,
  updateCard,
  updateToken,
  verifySnapshot,
  withdrawAssignment,
} from "../kernel/index.js";
import { resolveOperationKnowledgeContexts } from "./knowledge-contexts.js";
import { ensureHighQualityQuestion } from "./llm/client.js";
import {
  embedQuery,
  ensureTokenEmbeddings,
  findPossibleDuplicates,
  resolveDedupThreshold,
  resolveSuggestMinSimilarity,
} from "./llm/embedder.js";
import {
  currentVersion,
  fetchLatestVersion,
  GITHUB_REPO,
} from "./update/latest-version.js";
import { ensureActiveWorkspace } from "./workspaces/active.js";

const BLOOM_VERBS: Record<BloomLevel, string> = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Synthesize",
};

async function resolveHandlerUser(
  db: Database,
  user?: string,
): Promise<string> {
  if (user) return user;
  const stored = await getSetting(db, "user.id");
  if (stored) return stored;
  throw new Error(
    "No user specified. Set a default with: zam whoami --set <id>",
  );
}

function parseKnowledgeContextNames(value: unknown): string[] {
  if (value == null) return [];
  if (
    !Array.isArray(value) ||
    value.some((name) => typeof name !== "string" || !name.trim())
  ) {
    throw new Error(
      "knowledgeContexts must be an array of non-empty context names",
    );
  }
  return [...new Set(value.map((name) => name.trim()))];
}

async function resolveKnowledgeContexts(
  db: Database,
  names: string[],
): Promise<KnowledgeContext[]> {
  return await resolveOperationKnowledgeContexts(db, names);
}

// 1. checkDue
export interface CheckDueParams {
  user?: string;
  domain?: string;
  knowledgeContext?: string;
}

export async function checkDue(db: Database, params: CheckDueParams) {
  const userId = await resolveHandlerUser(db, params.user);
  const dueCards = await getDueCards(
    db,
    userId,
    undefined,
    params.domain,
    params.knowledgeContext,
  );
  const domains = [
    ...new Set(dueCards.map((c) => c.domain).filter(Boolean)),
  ].sort();

  const stats = await getUserStats(db, userId);

  return {
    database: getDatabaseTargetInfo(),
    stats,
    userId,
    domain: params.domain ?? null,
    knowledgeContext: params.knowledgeContext ?? null,
    dueCount: dueCards.length,
    domains,
    cards: dueCards.map((c) => ({
      cardId: c.id,
      tokenId: c.token_id,
      slug: c.slug,
      concept: c.concept,
      domain: c.domain,
      bloomLevel: c.bloom_level,
      state: c.state,
      dueAt: c.due_at,
    })),
  };
}

// 2. getReview
export interface GetReviewParams {
  user?: string;
  timeZone?: string;
  /** Session-local admission budget. Zero keeps unseen cards out. */
  maxNew?: number;
  noResolve?: boolean;
  noDynamicQuestion?: boolean;
  knowledgeContext?: string;
  /**
   * Inline the card's media as base64. Opt-in because a rendering surface
   * (Studio) needs the bytes, while an agent reading this JSON would only get
   * megabytes of unreadable payload — `hasQuestionMedia` / `hasAnswerMedia`
   * already tell it that media exists.
   */
  includeMedia?: boolean;
}

export async function getReview(db: Database, params: GetReviewParams) {
  const userId = await resolveHandlerUser(db, params.user);
  const queue = await buildReviewQueue(db, {
    userId,
    maxReviews: 1,
    maxNew: params.maxNew ?? 1,
    knowledgeContext: params.knowledgeContext || undefined,
    timeZone: params.timeZone,
  });
  const item = queue.items[0];

  if (!item) {
    return {
      userId,
      hasReview: false,
      card: null,
      prompt: null,
      resolvedContext: null,
      queueSize: 0,
    };
  }
  const media = !params.includeMedia
    ? []
    : (await getTokenMedia(db, item.tokenId)).map((entry) => ({
        assetHash: entry.assetHash,
        side: entry.side,
        kind: entry.kind,
        ordinal: entry.ordinal,
        originalName: entry.originalName,
        altText: entry.altText,
        mimeType: entry.mimeType,
        byteSize: entry.byteSize,
        dataBase64: Buffer.from(
          entry.data.buffer,
          entry.data.byteOffset,
          entry.data.byteLength,
        ).toString("base64"),
        occlusions: entry.occlusions,
      }));
  const isLlmEnabled = (await getSetting(db, "llm.enabled")) === "true";

  let resolvedQuestion = item.question;
  let questionSource: "llm" | "original" = "original";
  let questionModel: string | undefined;

  if (
    isLlmEnabled &&
    params.noDynamicQuestion !== true &&
    item.fastCheck === null
  ) {
    try {
      const healed = await ensureHighQualityQuestion(db, {
        id: item.tokenId,
        slug: item.slug,
        concept: item.concept,
        domain: item.domain,
        bloomLevel: item.bloomLevel as BloomLevel,
        sourceLink: item.sourceLink,
        question: item.question,
      });
      if (healed) {
        resolvedQuestion = healed.question;
        questionSource = healed.source;
        questionModel = healed.model;
      }
    } catch {
      // ignore
    }
  }

  const prompt = generatePrompt({
    cardId: item.cardId,
    tokenId: item.tokenId,
    slug: item.slug,
    concept: item.concept,
    domain: item.domain,
    bloomLevel: item.bloomLevel as BloomLevel,
    sourceLink: item.sourceLink,
    question: resolvedQuestion,
  });

  let resolvedContext = null;
  if (params.noResolve !== true) {
    try {
      resolvedContext = await resolveReviewContext(item.sourceLink);
    } catch {
      resolvedContext = null;
    }
  }

  const fullQueue = await buildReviewQueue(db, {
    userId,
    maxNew: params.maxNew,
    knowledgeContext: params.knowledgeContext || undefined,
    timeZone: params.timeZone,
  });

  return {
    userId,
    hasReview: true,
    card: { ...item, media },
    prompt,
    questionSource,
    questionModel: questionModel ?? null,
    resolvedContext,
    queueSize: fullQueue.items.length,
  };
}

export interface AdmitReviewParams {
  user?: string;
  cardId: string;
  session?: string;
  timeZone?: string;
}

export async function admitReview(db: Database, params: AdmitReviewParams) {
  const userId = await resolveHandlerUser(db, params.user);
  if (!params.cardId?.trim()) throw new Error("cardId is required");
  const admission = await admitPresentation(db, {
    userId,
    cardId: params.cardId,
    sessionId: params.session,
    timeZone: params.timeZone,
    confirm: true,
  });
  return { success: true as const, ...admission };
}

// 3. getReviewsBatch
export interface GetReviewsBatchParams {
  user?: string;
  domain?: string;
  knowledgeContext?: string;
  includeQuestions?: boolean;
  noResolve?: boolean;
  noDynamicQuestion?: boolean;
  /** Apply the same persisted workload and tier rules as learner sessions. */
  respectWorkload?: boolean;
  /** Optional session-local new-card override when workload rules are used. */
  maxNew?: number;
  timeZone?: string;
}

export async function getReviewsBatch(
  db: Database,
  params: GetReviewsBatchParams,
) {
  const userId = await resolveHandlerUser(db, params.user);
  const sourceCards = params.respectWorkload
    ? (
        await buildReviewQueue(db, {
          userId,
          domain: params.domain,
          knowledgeContext: params.knowledgeContext,
          maxNew: params.maxNew,
          timeZone: params.timeZone,
        })
      ).items.map((item) => ({
        cardId: item.cardId,
        tokenId: item.tokenId,
        slug: item.slug,
        concept: item.concept,
        domain: item.domain,
        bloomLevel: item.bloomLevel,
        state: item.state,
        dueAt: item.dueAt,
        atomId: item.atomId,
        tier: item.tier,
        fastCheck: item.fastCheck,
      }))
    : (
        await getDueCards(
          db,
          userId,
          undefined,
          params.domain,
          params.knowledgeContext,
        )
      ).map((card) => ({
        cardId: card.id,
        tokenId: card.token_id,
        slug: card.slug,
        concept: card.concept,
        domain: card.domain,
        bloomLevel: card.bloom_level,
        state: card.state,
        dueAt: card.due_at,
        atomId: null,
        tier: null,
        fastCheck: null,
      }));

  const isLlmEnabled = (await getSetting(db, "llm.enabled")) === "true";

  const cards = [];
  for (const card of sourceCards) {
    if (params.includeQuestions) {
      const token = await getTokenBySlug(db, card.slug);
      if (!token) {
        // Degrade gracefully
        cards.push({
          cardId: card.cardId,
          tokenId: card.tokenId,
          slug: card.slug,
          concept: card.concept,
          domain: card.domain,
          bloomLevel: card.bloomLevel,
          state: card.state,
          dueAt: card.dueAt,
          atomId: card.atomId,
          tier: card.tier,
          fastCheck: card.fastCheck,
        });
        continue;
      }

      // The queue path already permuted the options; the getDueCards fallback
      // has not, so it goes through the same presentation with the same seed.
      // A raw fast check here would ship the correct answer in first position,
      // which every authored item currently is.
      const fastCheck =
        card.fastCheck ??
        presentFastCheck(
          parseReviewFastCheck(token.fast_check),
          `${card.tokenId}:${card.dueAt}`,
        );
      let resolvedQuestion = token.question;
      if (
        isLlmEnabled &&
        params.noDynamicQuestion !== true &&
        fastCheck === null
      ) {
        try {
          const healed = await ensureHighQualityQuestion(db, {
            id: token.id,
            slug: token.slug,
            concept: token.concept,
            domain: token.domain,
            bloomLevel: token.bloom_level as BloomLevel,
            sourceLink: token.source_link,
            question: token.question,
          });
          if (healed) {
            resolvedQuestion = healed.question;
          }
        } catch {
          // ignore
        }
      }

      const finalQuestion = resolvedQuestion?.trim()
        ? resolvedQuestion.trim()
        : generateConceptFreeCue(
            token.bloom_level as BloomLevel,
            token.slug,
            token.domain,
          );

      let resolvedContext = null;
      if (params.noResolve !== true && token.source_link) {
        try {
          resolvedContext = await resolveReviewContext(token.source_link);
        } catch {
          resolvedContext = null;
        }
      }

      const bloom = (
        token.bloom_level >= 1 && token.bloom_level <= 5 ? token.bloom_level : 1
      ) as BloomLevel;

      cards.push({
        cardId: card.cardId,
        tokenId: card.tokenId,
        slug: card.slug,
        concept: card.concept,
        domain: card.domain,
        bloomLevel: card.bloomLevel,
        state: card.state,
        dueAt: card.dueAt,
        bloomVerb: BLOOM_VERBS[bloom],
        question: finalQuestion,
        sourceLink: token.source_link ?? null,
        resolvedContext,
        atomId: token.atom_id ?? null,
        tier: token.tier ?? null,
        fastCheck,
      });
    } else {
      cards.push({
        cardId: card.cardId,
        tokenId: card.tokenId,
        slug: card.slug,
        concept: card.concept,
        domain: card.domain,
        bloomLevel: card.bloomLevel,
        state: card.state,
        dueAt: card.dueAt,
        atomId: card.atomId,
        tier: card.tier,
        fastCheck: card.fastCheck,
      });
    }
  }

  return { cards };
}

// 4. submitReview
export interface SubmitReviewParams {
  user?: string;
  cardId?: string;
  tokenId?: string;
  rating?: Rating;
  sessionId?: string;
  doneBy?: "user" | "agent";
  /** Milliseconds between showing the card and submitting the rating (ADR 2026-08-01 Decision 5). */
  responseTimeMs?: number;
  /** Assisted user work: log a session step without an FSRS rating. */
  recordOnly?: boolean;
  /** Why this step is record-only (required when recordOnly is true). */
  reason?: string;
}

export async function submitReview(db: Database, params: SubmitReviewParams) {
  const userId = await resolveHandlerUser(db, params.user);
  if (
    params.doneBy !== undefined &&
    !["user", "agent"].includes(params.doneBy)
  ) {
    throw new Error("doneBy must be user or agent");
  }
  if (params.recordOnly) {
    if (params.doneBy === "agent") {
      throw new Error(
        "recordOnly is for assisted user work; use doneBy agent without a rating for agent steps",
      );
    }
    if (params.rating !== undefined) {
      throw new Error("recordOnly must not include a rating");
    }
    const reason = params.reason?.trim();
    if (!reason) {
      throw new Error("reason is required for a record-only user step");
    }
    if (!params.sessionId) {
      throw new Error("sessionId is required for a record-only user step");
    }
    if (!params.cardId) {
      throw new Error("cardId is required for a record-only user step");
    }
    const card = await getCardById(db, params.cardId);
    if (!card) {
      throw new Error(`Card not found: ${params.cardId}`);
    }
    if (card.user_id !== userId) {
      throw new Error(
        `Card ${params.cardId} does not belong to user ${userId}`,
      );
    }
    const session = (await db
      .prepare("SELECT user_id, completed_at FROM sessions WHERE id = ?")
      .get(params.sessionId)) as
      | { user_id: string; completed_at: string | null }
      | undefined;
    if (!session) {
      throw new Error(`Session not found: ${params.sessionId}`);
    }
    if (session.user_id !== userId) {
      throw new Error(
        `Session ${params.sessionId} does not belong to user ${userId}`,
      );
    }
    if (session.completed_at) {
      throw new Error(`Session already completed: ${params.sessionId}`);
    }
    await logStep(db, {
      session_id: params.sessionId,
      token_id: card.token_id,
      done_by: "user",
      notes: reason,
    });
    return {
      success: true,
      rating: null,
      evaluation: null,
      blocked: null,
      recordedOnly: true,
    };
  }

  if (params.doneBy === "agent") {
    if (params.rating !== undefined) {
      throw new Error("Agent-completed steps must not include a rating");
    }
    if (!params.sessionId) {
      throw new Error("sessionId is required for an agent-completed step");
    }
    if (!params.cardId) {
      throw new Error("cardId is required for an agent-completed step");
    }
    const card = await getCardById(db, params.cardId);
    if (!card) {
      throw new Error(`Card not found: ${params.cardId}`);
    }
    if (card.user_id !== userId) {
      throw new Error(
        `Card ${params.cardId} does not belong to user ${userId}`,
      );
    }
    await logStep(db, {
      session_id: params.sessionId,
      token_id: card.token_id,
      done_by: "agent",
    });
    return {
      success: true,
      rating: null,
      evaluation: null,
      blocked: null,
      recordedOnly: true,
    };
  }

  if (params.rating == null || params.rating < 1 || params.rating > 4) {
    throw new Error("Rating must be between 1 and 4");
  }
  let cardId = params.cardId;
  if (!cardId) {
    if (!params.tokenId) {
      throw new Error("cardId or tokenId is required");
    }
    const token = await getTokenById(db, params.tokenId);
    if (!token || token.deprecated_at) {
      throw new Error(`Active token not found: ${params.tokenId}`);
    }
    cardId = (await ensureCard(db, token.id, userId)).id;
  }

  const result = await executeReviewAction(db, {
    action: "rate",
    cardId,
    userId,
    rating: params.rating,
    sessionId: params.sessionId,
    responseTimeMs: params.responseTimeMs,
  });

  return {
    success: true,
    rating: params.rating,
    evaluation: result.evaluation,
    blocked: result.blocked ?? null,
  };
}

// 5. reviewAction
export interface ReviewActionParams {
  user?: string;
  cardId: string;
  action: ReviewActionType;
  rating?: Rating;
  concept?: string;
  domain?: string;
  bloomLevel?: number;
  context?: string;
  symbiosisMode?: string;
  sourceLink?: string;
  confirm?: boolean;
}

export async function reviewAction(db: Database, params: ReviewActionParams) {
  const userId = await resolveHandlerUser(db, params.user);
  const action = params.action;

  const validActions: ReviewActionType[] = [
    "rate",
    "skip",
    "edit-token",
    "deprecate-token",
    "delete-token",
    "delete-card",
    "stop",
  ];
  if (!validActions.includes(action)) {
    throw new Error(`Unsupported action: ${action}`);
  }

  const target = (await db
    .prepare(
      `SELECT c.id AS card_id, c.token_id, c.user_id, t.slug
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.id = ?`,
    )
    .get(params.cardId)) as
    | { card_id: string; token_id: string; user_id: string; slug: string }
    | undefined;

  if (!target) {
    throw new Error(`Card not found: ${params.cardId}`);
  }
  if (target.user_id !== userId) {
    throw new Error(`Card ${params.cardId} does not belong to user ${userId}`);
  }

  if (
    (action === "delete-token" || action === "delete-card") &&
    !params.confirm
  ) {
    if (action === "delete-token") {
      return {
        success: true,
        action,
        preview: true,
        requiresConfirmation: true,
        token: { slug: target.slug, tokenId: target.token_id },
        impact: await getTokenDeleteImpact(db, target.slug),
      };
    }

    return {
      success: true,
      action,
      preview: true,
      requiresConfirmation: true,
      token: { slug: target.slug, tokenId: target.token_id },
      impact: await getCardDeletionImpact(db, target.token_id, userId),
    };
  }

  if (
    action === "rate" &&
    (params.rating == null || params.rating < 1 || params.rating > 4)
  ) {
    throw new Error("Rating must be between 1 and 4 for action=rate");
  }

  let tokenUpdates: UpdateTokenInput | undefined;
  if (action === "edit-token") {
    tokenUpdates = {};
    if (params.concept !== undefined) tokenUpdates.concept = params.concept;
    if (params.domain !== undefined) tokenUpdates.domain = params.domain;
    if (params.bloomLevel !== undefined)
      tokenUpdates.bloom_level = params.bloomLevel as BloomLevel;
    if (params.context !== undefined) tokenUpdates.context = params.context;
    if (params.sourceLink !== undefined) {
      tokenUpdates.source_link =
        params.sourceLink === "" ? null : params.sourceLink;
    }
    if (params.symbiosisMode !== undefined) {
      const validModes = ["shadowing", "copilot", "autonomy", "none"];
      if (!validModes.includes(params.symbiosisMode)) {
        throw new Error(`Invalid mode: ${params.symbiosisMode}`);
      }
      tokenUpdates.symbiosis_mode =
        params.symbiosisMode === "none"
          ? null
          : (params.symbiosisMode as SymbiosisMode);
    }
  }

  const result = await executeReviewAction(db, {
    action,
    cardId: params.cardId,
    userId,
    rating: params.rating,
    tokenUpdates,
  });

  return {
    success: true,
    action,
    token: {
      slug: result.token.slug,
      tokenId: result.token.id,
    },
    rating: params.rating ?? null,
    evaluation: result.evaluation ?? null,
    blocked: result.blocked ?? null,
    updatedToken: result.updatedToken ?? null,
    deletedToken: result.deletedToken ?? null,
    deletedCard: result.deletedCard ?? null,
    skipped: result.skipped ?? false,
    stopped: result.stopped ?? false,
  };
}

// 6. addToken
export interface AddTokenParams {
  user?: string;
  slug: string;
  concept: string;
  title?: string;
  domain?: string;
  bloomLevel?: number;
  context?: string;
  symbiosisMode?: "shadowing" | "copilot" | "autonomy" | null;
  sourceLink?: string | null;
  question?: string | null;
  knowledgeContexts?: string[];
  knowledge_contexts?: string[];
  prerequisites?: string[];
}

export async function addToken(db: Database, params: AddTokenParams) {
  const userId = await resolveHandlerUser(db, params.user);
  if (!params.slug.trim() || !params.concept.trim()) {
    throw new Error("slug and concept must be non-empty");
  }
  if (
    params.bloomLevel !== undefined &&
    (!Number.isInteger(params.bloomLevel) ||
      params.bloomLevel < 1 ||
      params.bloomLevel > 5)
  ) {
    throw new Error("bloomLevel must be an integer between 1 and 5");
  }

  const possibleDuplicates = await findPossibleDuplicates(db, {
    concept: params.concept,
    question: params.question ?? null,
    domain: params.domain,
    title: params.title ?? null,
  });

  const ctxNames = parseKnowledgeContextNames(
    params.knowledgeContexts ?? params.knowledge_contexts,
  );
  const assignedContexts = await resolveKnowledgeContexts(db, ctxNames);
  const prerequisiteSlugs = [
    ...new Set(
      (params.prerequisites ?? []).map((slug) => slug.trim()).filter(Boolean),
    ),
  ];
  const prerequisites: Token[] = [];
  for (const slug of prerequisiteSlugs) {
    const prerequisite = await getTokenBySlug(db, slug);
    if (!prerequisite) {
      throw new Error(`Prerequisite token not found: ${slug}`);
    }
    prerequisites.push(prerequisite);
  }

  const token = await createToken(db, {
    slug: params.slug,
    title: params.title,
    concept: params.concept,
    domain: params.domain,
    bloom_level: (params.bloomLevel ?? 1) as BloomLevel,
    context: params.context,
    symbiosis_mode: params.symbiosisMode,
    source_link: params.sourceLink ?? null,
    question: params.question ?? null,
    // Bridge/MCP callers are agents: their questions are LLM-authored and
    // stay refreshable. Humans author questions via the token CLI instead.
    question_source: params.question ? "llm" : undefined,
    editorial_state: "draft",
  });

  for (const context of assignedContexts) {
    await assignTokenToContext(db, token.id, context.id);
  }

  for (const prerequisite of prerequisites) {
    await addPrerequisite(db, token.id, prerequisite.id);
  }

  const card = await ensureCard(db, token.id, userId);

  try {
    await ensureTokenEmbeddings(db, { limit: 8 });
  } catch {
    // ignore
  }

  return {
    success: true,
    token: {
      ...token,
      knowledgeContexts: assignedContexts.map((c) => ({
        name: c.name,
        label: c.label,
        language: c.language,
      })),
      prerequisites: prerequisites.map((prerequisite) => prerequisite.slug),
    },
    card: {
      id: card.id,
      tokenId: card.token_id,
      userId: card.user_id,
      state: card.state,
      dueAt: card.due_at,
      blocked: card.blocked,
    },
    possible_duplicates: possibleDuplicates,
  };
}

// 6b. importOkfTokens (ADR 2026-07-18)

export interface ImportOkfTokenInput {
  slug: string;
  title?: string;
  concept: string;
  bloomLevel?: number;
  domain?: string;
  /** Heading anchor within the article; appended to the source link. */
  anchor?: string;
  /** In-import slugs and/or existing token slugs. */
  prerequisites?: string[];
  knowledgeContexts?: string[];
  question?: string | null;
  /** Re-import classification (ADR 2026-07-18 Decision 4). Default "new". */
  mode?: "new" | "update" | "replace";
}

export interface ImportOkfParams {
  user?: string;
  bundleDir?: string;
  file: string;
  tokens: ImportOkfTokenInput[];
}

/**
 * Record an agent's finished decomposition of one OKF article as learning
 * tokens (ADR 2026-07-18). The agent judges; this handler only validates
 * and writes — atomically. Per token `mode`:
 * - "new" (default): create; an existing slug is an instructive error.
 * - "update": refresh content, keep every user's learning state.
 * - "replace": concept changed — refresh content and reset all cards to
 *   the beginning.
 * Tokens previously imported from this article but absent from the call
 * are moved to maintenance (kept, unscheduled, awaiting repair).
 */
export async function importOkfTokens(db: Database, params: ImportOkfParams) {
  const userId = await resolveHandlerUser(db, params.user);
  if (!params.file?.trim()) throw new Error("file must be non-empty");
  if (!Array.isArray(params.tokens) || params.tokens.length === 0) {
    throw new Error("tokens must be a non-empty array");
  }
  const seen = new Set<string>();
  for (const input of params.tokens) {
    const slug = input.slug?.trim();
    if (!slug || !input.concept?.trim()) {
      throw new Error("every token needs a non-empty slug and concept");
    }
    if (seen.has(slug)) throw new Error(`duplicate token slug: ${slug}`);
    seen.add(slug);
    if (
      input.bloomLevel !== undefined &&
      (!Number.isInteger(input.bloomLevel) ||
        input.bloomLevel < 1 ||
        input.bloomLevel > 5)
    ) {
      throw new Error(`bloomLevel must be 1-5 (token: ${slug})`);
    }
  }

  // Resolve the article and its canonical source link. The frontmatter
  // `resource` URL is the durable anchor tokens carry as source_link; a
  // bundle without one falls back to the resolved article path.
  const { DEFAULT_BUNDLE_DIR, resolveArticlePath } = await import(
    "./okf/io.js"
  );
  const { parseFrontmatter } = await import("./okf/bundle.js");
  const { readFileSync } = await import("node:fs");
  const bundleDir = params.bundleDir ?? DEFAULT_BUNDLE_DIR;
  const articlePath = resolveArticlePath(bundleDir, params.file);
  let markdown: string;
  try {
    markdown = readFileSync(articlePath, "utf8");
  } catch {
    throw new Error(`Article not found: ${articlePath}`);
  }
  let resource: string | undefined;
  try {
    const { fields } = parseFrontmatter(markdown);
    resource =
      typeof fields.resource === "string" ? fields.resource : undefined;
  } catch {
    resource = undefined;
  }
  const sourceBase = resource ?? articlePath;
  const sourceLinkFor = (anchor?: string): string =>
    anchor?.trim() ? `${sourceBase}#${anchor.trim()}` : sourceBase;

  const created: string[] = [];
  const updated: string[] = [];
  const replaced: string[] = [];
  const maintenance: string[] = [];
  let cardsEnsured = 0;

  await db.transaction(async (tx) => {
    const inImport = new Map<string, Token>();

    for (const input of params.tokens) {
      const mode = input.mode ?? "new";
      const existing = await getTokenBySlug(tx, input.slug);

      if (mode === "new") {
        if (existing) {
          throw new Error(
            `Token '${input.slug}' already exists. Use mode "update" to refresh it ` +
              `(keeps learning state), "replace" if the concept changed ` +
              `(resets learning state), or choose a different slug.`,
          );
        }
        const readyToPublish =
          structuralPublicationChecks({
            slug: input.slug,
            concept: input.concept,
            question: input.question ?? null,
            requireQuestion: true,
          }).filter((check) => check.blocking).length === 0;
        const token = await createToken(tx, {
          slug: input.slug,
          title: input.title,
          concept: input.concept,
          domain: input.domain,
          bloom_level: (input.bloomLevel ?? 1) as BloomLevel,
          source_link: sourceLinkFor(input.anchor),
          question: input.question ?? null,
          question_source: input.question ? "llm" : undefined,
          editorial_state: readyToPublish ? "published" : "draft",
        });
        inImport.set(input.slug, token);
        created.push(input.slug);
      } else {
        if (!existing) {
          throw new Error(
            `Token '${input.slug}' does not exist — mode "${mode}" requires an existing token.`,
          );
        }
        const updates: UpdateTokenInput = {
          concept: input.concept,
          source_link: sourceLinkFor(input.anchor),
        };
        if (input.title !== undefined) updates.title = input.title;
        if (input.domain !== undefined) updates.domain = input.domain;
        if (input.bloomLevel !== undefined) {
          updates.bloom_level = input.bloomLevel as BloomLevel;
        }
        if (input.question !== undefined) {
          updates.question = input.question;
          updates.question_source = input.question ? "llm" : undefined;
        }
        const token = await updateToken(tx, input.slug, updates);
        // An explicit update/replace re-confirms the source binding.
        if (existing.maintenance_at) {
          await clearTokenMaintenance(tx, input.slug);
        }
        if (mode === "replace") {
          await resetCardsForToken(tx, token.id);
          replaced.push(input.slug);
        } else {
          updated.push(input.slug);
        }
        inImport.set(input.slug, token);
      }

      const ctxNames = parseKnowledgeContextNames(input.knowledgeContexts);
      const assigned = await resolveKnowledgeContexts(tx, ctxNames);
      const token = inImport.get(input.slug);
      if (token) {
        for (const context of assigned) {
          await assignTokenToContext(tx, token.id, context.id);
        }
      }
    }

    // Prerequisites in a second pass, so forward references within the
    // import resolve. In-import slugs win; otherwise existing tokens.
    for (const input of params.tokens) {
      const token = inImport.get(input.slug);
      if (!token) continue;
      const prereqSlugs = [
        ...new Set(
          (input.prerequisites ?? []).map((s) => s.trim()).filter(Boolean),
        ),
      ];
      const desiredPrerequisites = new Set(prereqSlugs);
      const existingPrerequisites = await getPrerequisites(tx, token.id);
      for (const existing of existingPrerequisites) {
        if (!desiredPrerequisites.has(existing.slug)) {
          await removePrerequisite(tx, token.id, existing.requires_id);
        }
      }
      for (const prereqSlug of prereqSlugs) {
        const target =
          inImport.get(prereqSlug) ?? (await getTokenBySlug(tx, prereqSlug));
        if (!target) {
          throw new Error(
            `Prerequisite token not found: ${prereqSlug} (for '${input.slug}')`,
          );
        }
        await addPrerequisite(tx, token.id, target.id);
      }
    }

    // Import means "I want to learn this": a card per token for the user.
    for (const token of inImport.values()) {
      await ensureCard(tx, token.id, userId);
      cardsEnsured++;
    }

    // Tokens previously bound to this article that the new decomposition
    // did not confirm: maintenance, never deletion (learning history is
    // preserved for manual repair or doctor auto-heal).
    const prior = await getTokensBySourceLinkBase(tx, sourceBase);
    for (const token of prior) {
      if (!inImport.has(token.slug)) {
        await setTokenMaintenance(
          tx,
          token.slug,
          `absent from re-import of ${params.file}`,
        );
        maintenance.push(token.slug);
      }
    }
  });

  try {
    await ensureTokenEmbeddings(db, { limit: 16 });
  } catch {
    // best-effort, mirrors addToken
  }

  return {
    success: true,
    user: userId,
    article: { file: params.file, source_link: sourceBase },
    created,
    updated,
    replaced,
    maintenance,
    cards: cardsEnsured,
  };
}

// 7. findTokens
export interface FindTokensParams {
  user?: string;
  context: string;
  limit?: number;
}

export async function findTokens(db: Database, params: FindTokensParams) {
  const userId = await resolveHandlerUser(db, params.user);
  if (!params.context.trim()) {
    throw new Error("context must be non-empty");
  }
  const truncatedContext = params.context.slice(0, 2000);

  const q = await embedQuery(db, truncatedContext);

  try {
    await ensureTokenEmbeddings(db, {
      limit: 32,
      dims: q?.vector.length,
    });
  } catch {
    // ignore
  }

  let limit = params.limit ?? 10;
  if (typeof limit !== "number" || limit <= 0 || !Number.isInteger(limit)) {
    limit = 10;
  }
  if (limit > 100) {
    limit = 100;
  }

  const results = await searchTokensHybrid(db, truncatedContext, {
    queryEmbedding: q?.vector,
    model: q?.model,
    limit,
  });

  const tokens = [];
  const contextMap = new Map<
    string,
    Array<{ name: string; label: string | null; language: string | null }>
  >();

  if (results.length > 0) {
    const ids = results.map((t) => t.id);
    const placeholders = ids.map(() => "?").join(",");
    const mappings = (await db
      .prepare(
        `SELECT tc.token_id, c.name, c.label, c.language
         FROM token_contexts tc
         INNER JOIN contexts c ON c.id = tc.context_id
         WHERE tc.token_id IN (${placeholders})`,
      )
      .all(...ids)) as Array<{
      token_id: string;
      name: string;
      label: string | null;
      language: string | null;
    }>;
    for (const m of mappings) {
      const list = contextMap.get(m.token_id) ?? [];
      list.push({ name: m.name, label: m.label, language: m.language });
      contextMap.set(m.token_id, list);
    }
  }

  for (const t of results) {
    const card = await getCard(db, t.id, userId);
    tokens.push({
      slug: t.slug,
      title: t.title,
      display_title: getDisplayTitle(t),
      concept: t.concept,
      domain: t.domain,
      bloom_level: t.bloom_level,
      score: t.score,
      similarity: t.similarity,
      knowledgeContexts: contextMap.get(t.id) ?? [],
      card: card
        ? {
            state: card.state,
            due_at: card.due_at,
            blocked: card.blocked,
          }
        : null,
    });
  }

  return {
    semantic: q !== null,
    // Lexical fallback is stated, never silent (ADR 2026-07-24 §7): agents
    // and surfaces reading this response can tell the user how to get
    // meaning-aware ranking back.
    ...(q === null
      ? {
          semanticNote:
            "Semantic ranking is off — these are lexical matches only. " +
            "Enable local semantic search (Ollama + embeddinggemma) from the " +
            "desktop setup or via `zam bridge embedding-enable`.",
        }
      : {}),
    tokens,
  };
}

// 8. suggestFoundations
export interface SuggestFoundationsParams {
  user?: string;
  slug?: string;
  concept?: string;
  question?: string;
  domain?: string;
  title?: string;
  bloom_level?: number;
  limit?: number;
}

export async function suggestFoundations(
  db: Database,
  params: SuggestFoundationsParams,
) {
  let queryText = "";
  let targetTokenId: string | undefined;
  let targetBloomLevel: BloomLevel | undefined;
  let targetJson: { slug: string } | null = null;

  if (params.slug !== undefined) {
    if (typeof params.slug !== "string" || params.slug.trim() === "") {
      throw new Error("Invalid slug");
    }
    const token = await getTokenBySlug(db, params.slug);
    if (!token) {
      throw new Error(`Token not found: ${params.slug}`);
    }
    const { embeddingContentForToken: getContent } = await import(
      "../kernel/index.js"
    );
    queryText = getContent(token);
    targetTokenId = token.id;
    targetBloomLevel = token.bloom_level;
    targetJson = { slug: token.slug };
  } else {
    if (
      !params.concept ||
      typeof params.concept !== "string" ||
      params.concept.trim() === ""
    ) {
      throw new Error(
        "JSON must include a non-empty 'slug' or 'concept' field",
      );
    }
    const { embeddingContentForToken: getContent } = await import(
      "../kernel/index.js"
    );
    queryText = getContent({
      concept: params.concept,
      question: typeof params.question === "string" ? params.question : null,
      domain: typeof params.domain === "string" ? params.domain : "",
      title: typeof params.title === "string" ? params.title : null,
    });
    if (params.bloom_level !== undefined) {
      if (
        typeof params.bloom_level !== "number" ||
        !Number.isInteger(params.bloom_level) ||
        params.bloom_level < 1 ||
        params.bloom_level > 5
      ) {
        throw new Error("bloom_level must be an integer between 1 and 5");
      }
      targetBloomLevel = params.bloom_level as BloomLevel;
    }
  }

  let limit = params.limit ?? 5;
  if (typeof limit !== "number" || limit <= 0 || !Number.isInteger(limit)) {
    limit = 5;
  }
  if (limit > 20) {
    limit = 20;
  }

  const q = await embedQuery(db, queryText);
  if (q === null) {
    return {
      semantic: false,
      target: targetJson,
      suggestions: [],
    };
  }

  try {
    await ensureTokenEmbeddings(db, {
      limit: 100,
      dims: q.vector.length,
    });
  } catch {
    // ignore
  }

  const maxSimilarity = await resolveDedupThreshold(db);
  const minSimilarity = await resolveSuggestMinSimilarity(db);
  if (minSimilarity >= maxSimilarity) {
    return {
      semantic: true,
      target: targetJson,
      suggestions: [],
    };
  }

  const suggestions = await kernelSuggestFoundations(db, {
    queryEmbedding: q.vector,
    model: q.model,
    targetTokenId,
    targetBloomLevel,
    limit,
    minSimilarity,
    maxSimilarity,
  });

  return {
    semantic: true,
    target: targetJson,
    suggestions: suggestions.map((s) => ({
      slug: s.token.slug,
      concept: s.token.concept,
      domain: s.token.domain,
      bloom_level: s.token.bloom_level,
      similarity: s.similarity,
      already_prerequisite: s.alreadyPrerequisite,
      would_create_cycle: s.wouldCreateCycle,
      bloom_above_target: s.bloomAboveTarget,
    })),
  };
}

// 9. linkPrereq
export interface LinkPrereqParams {
  token: string;
  requires: string;
  blockUser?: string;
}

export async function linkPrereq(db: Database, params: LinkPrereqParams) {
  if (!params.token.trim() || !params.requires.trim()) {
    throw new Error("token and requires must be non-empty slugs");
  }
  const token = await getTokenBySlug(db, params.token);
  if (!token) {
    throw new Error(`Token not found: ${params.token}`);
  }
  const requires = await getTokenBySlug(db, params.requires);
  if (!requires) {
    throw new Error(`Prerequisite token not found: ${params.requires}`);
  }

  await addPrerequisite(db, token.id, requires.id);

  let blockedCardId: string | undefined;
  if (params.blockUser) {
    const card = await getCard(db, token.id, params.blockUser);
    if (card) {
      await updateCard(db, card.id, { blocked: 1 });
      blockedCardId = card.id;
    }
  }

  return {
    success: true,
    token: params.token,
    requires: params.requires,
    ...(blockedCardId ? { blockedCardId } : {}),
  };
}

// 10. startSession / endSession
export interface StartSessionParams {
  user?: string;
  task: string;
  context?: "shell" | "ui" | "reallife";
}

export async function startSession(db: Database, params: StartSessionParams) {
  if (!params.task.trim()) {
    throw new Error("task must be non-empty");
  }
  const context = params.context ?? "shell";
  if (!["shell", "ui", "reallife"].includes(context)) {
    throw new Error("context must be shell, ui, or reallife");
  }

  const userId = await resolveHandlerUser(db, params.user);
  const session = await kernelStartSession(db, {
    user_id: userId,
    task: params.task,
    execution_context: context,
  });

  const observerPolicyHint =
    context === "ui" && !(await isObserverPolicyConfigured(db))
      ? OBSERVER_POLICY_UNSET_HINT
      : undefined;

  return {
    id: session.id,
    userId: session.user_id,
    task: session.task,
    executionContext: session.execution_context,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    ...(observerPolicyHint ? { observerPolicyHint } : {}),
  };
}

export interface EndSessionParams {
  session: string;
  synthesize?: boolean;
  patterns?: TokenPattern[];
  minConfidence?: SynthesisConfidence;
}

export async function endSession(db: Database, params: EndSessionParams) {
  const synthesisPreview = params.synthesize
    ? await prepareSessionSynthesis(db, {
        sessionId: params.session,
        explicitPatterns: params.patterns,
        minConfidence: params.minConfidence ?? "medium",
      })
    : undefined;
  const synthesis = synthesisPreview
    ? {
        ...synthesisPreview,
        candidates: await Promise.all(
          synthesisPreview.candidates.map(async (candidate) => ({
            ...candidate,
            cardId:
              (await getCard(db, candidate.tokenId, synthesisPreview.userId))
                ?.id ?? null,
          })),
        ),
      }
    : undefined;
  const session = await kernelEndSession(db, params.session);
  const summary = await getSessionSummary(db, params.session);
  return {
    id: session.id,
    userId: session.user_id,
    task: session.task,
    executionContext: session.execution_context,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    summary,
    ...(synthesis ? { synthesis } : {}),
  };
}

// 11. getMonitor / analyzeMonitor
export interface GetMonitorParams {
  session: string;
}

export async function getMonitor(_db: Database, params: GetMonitorParams) {
  if (!monitorLogExists(params.session)) {
    return {
      sessionId: params.session,
      exists: false,
      commands: [],
      timeSpan: null,
    };
  }

  const events = readMonitorLog(params.session);
  const commands = pairCommands(events);

  let timeSpan: { start: string; end: string; durationMs: number } | null =
    null;
  if (commands.length > 0) {
    const first = commands[0];
    const last = commands[commands.length - 1];
    const endTs = last.endedAt ?? last.startedAt;
    timeSpan = {
      start: first.startedAt,
      end: endTs,
      durationMs:
        new Date(endTs).getTime() - new Date(first.startedAt).getTime(),
    };
  }

  return {
    sessionId: params.session,
    exists: true,
    commands: commands.map((c) => ({
      seq: c.seq,
      command: c.command,
      cwd: c.cwd,
      startedAt: c.startedAt,
      endedAt: c.endedAt,
      durationMs: c.durationMs,
      exitCode: c.exitCode,
    })),
    timeSpan,
  };
}

export interface AnalyzeMonitorParams {
  session: string;
  patterns: TokenPattern[];
}

export async function analyzeMonitor(
  _db: Database,
  params: AnalyzeMonitorParams,
) {
  if (!monitorLogExists(params.session)) {
    return {
      sessionId: params.session,
      ratings: [],
      unmatchedCommands: [],
      timeSpan: null,
    };
  }

  const events = readMonitorLog(params.session);
  const commands = pairCommands(events);
  const result = analyzeObservation(commands, params.patterns);

  return {
    sessionId: params.session,
    ...result,
  };
}

// 12. sessionOpen
export interface SessionOpenParams {
  user?: string;
  task: string;
  context?: "shell" | "ui" | "reallife";
}

export async function sessionOpen(db: Database, params: SessionOpenParams) {
  const sessionResult = await startSession(db, params);
  const checkDueResult = await checkDue(db, { user: params.user });
  const findTokensResult = await findTokens(db, {
    user: params.user,
    context: params.task,
    limit: 10,
  });

  return {
    session: {
      id: sessionResult.id,
      userId: sessionResult.userId,
      task: sessionResult.task,
      executionContext: sessionResult.executionContext,
      startedAt: sessionResult.startedAt,
      completedAt: sessionResult.completedAt,
    },
    due: {
      dueCount: checkDueResult.dueCount,
      domains: checkDueResult.domains,
      cards: checkDueResult.cards,
    },
    relevant: findTokensResult,
  };
}

// 13. backupCreate
export interface BackupCreateParams {
  dir?: string;
}

/**
 * Write a portable SQL-text snapshot (kernel exportSnapshot/verifySnapshot) —
 * not the VACUUM file copy `backup-db`/backupDatabaseTo produces. Used by the
 * Settings card's "Back up now" button via zam_studio_bridge.
 */
export async function backupCreate(db: Database, params: BackupCreateParams) {
  const targetDir = params.dir || (await ensureActiveWorkspace(db)).path;
  const snapshot = await exportSnapshot(db);
  const manifest = verifySnapshot(snapshot);
  const backupDir = join(targetDir, "zam-backups");
  mkdirSync(backupDir, { recursive: true });
  const stamp = manifest.createdAt.replace(/[:.]/g, "-");
  const path = join(backupDir, `zam-snapshot-${stamp}.sql`);
  writeFileSync(path, snapshot, "utf-8");
  return {
    ok: true as const,
    path,
    createdAt: manifest.createdAt,
    checksum: manifest.checksum,
    tables: manifest.tables,
  };
}

// 14. updateCheck
export interface UpdateCheckParams {
  latest?: string;
  channel?: string;
}

/**
 * Decide whether a newer ZAM release is available. `latest`/`channel` let
 * callers (tests, the Settings card's error path) short-circuit the network
 * fetch / detected channel for deterministic or offline checks.
 */
export async function updateCheck(
  params: UpdateCheckParams,
): Promise<UpdateDecision> {
  const current = currentVersion();
  const latest = params.latest ?? (await fetchLatestVersion(GITHUB_REPO));
  const channel = (params.channel as InstallChannel) ?? getInstallChannel();
  return decideUpdate({
    currentVersion: current,
    latestVersion: latest,
    channel,
  });
}

// 15. publishRevision & revisionPreview (Closed-Group Library Phase 2)
export interface PublishRevisionParams {
  tokenId?: string;
  slug?: string;
  materiality: "cosmetic" | "material";
  publishedBy?: string;
  changes?: {
    title?: string;
    question?: string;
    concept?: string;
    context?: string;
    domain?: string;
    bloomLevel?: number;
    sourceLink?: string | null;
  };
}

export async function publishRevision(
  db: Database,
  params: PublishRevisionParams,
) {
  let tokenId = params.tokenId;
  if (!tokenId && params.slug) {
    const token = await getTokenBySlug(db, params.slug);
    if (!token) throw new Error(`Token not found for slug: ${params.slug}`);
    tokenId = token.id;
  }
  if (!tokenId) throw new Error("tokenId or slug is required");

  const result = await publishTokenRevision(db, {
    tokenId,
    materiality: params.materiality,
    publishedBy: params.publishedBy,
    changes: params.changes,
  });

  return {
    success: true as const,
    ...result,
  };
}

export interface ListDraftsParams {
  user?: string;
}

export async function listDrafts(db: Database, _params: ListDraftsParams = {}) {
  const drafts = await listTokens(db, { editorialState: "draft" });
  const inReview = await listTokens(db, { editorialState: "in_review" });
  const tokens = [...drafts, ...inReview].map((token) => ({
    id: token.id,
    slug: token.slug,
    title: token.title,
    concept: token.concept,
    question: token.question,
    context: token.context,
    sourceLink: token.source_link,
    domain: token.domain,
    bloomLevel: token.bloom_level,
    editorialState: token.editorial_state,
  }));
  return {
    success: true as const,
    tokens,
  };
}

export interface RevisionPreviewParams {
  tokenId?: string;
  slug?: string;
}

export async function revisionPreview(
  db: Database,
  params: RevisionPreviewParams,
) {
  let tokenId = params.tokenId;
  if (!tokenId && params.slug) {
    const token = await getTokenBySlug(db, params.slug);
    if (!token) throw new Error(`Token not found for slug: ${params.slug}`);
    tokenId = token.id;
  }
  if (!tokenId) throw new Error("tokenId or slug is required");

  const impact = await getRevisionImpact(db, tokenId);
  const publication = await evaluatePublicationReadiness(db, tokenId);
  return {
    success: true as const,
    ...impact,
    publication,
  };
}

// 16. createAssignment, withdrawAssignment & listAssignments (Closed-Group Library Phase D)
export interface CreateAssignmentParams {
  tokenId?: string;
  slug?: string;
  assignerId: string;
  assigneeId: string;
  dueDate?: string | null;
}

export async function createAssignmentHandler(
  db: Database,
  params: CreateAssignmentParams,
) {
  let tokenId = params.tokenId;
  if (!tokenId && params.slug) {
    const token = await getTokenBySlug(db, params.slug);
    if (!token) throw new Error(`Token not found for slug: ${params.slug}`);
    tokenId = token.id;
  }
  if (!tokenId) throw new Error("tokenId or slug is required");

  const assignment = await createAssignment(db, {
    tokenId,
    assignerId: params.assignerId,
    assigneeId: params.assigneeId,
    dueDate: params.dueDate,
  });

  return {
    success: true as const,
    assignment,
  };
}

export interface WithdrawAssignmentParams {
  assignmentId: string;
  assignerId?: string;
}

export async function withdrawAssignmentHandler(
  db: Database,
  params: WithdrawAssignmentParams,
) {
  const assignment = await withdrawAssignment(
    db,
    params.assignmentId,
    params.assignerId,
  );
  return {
    success: true as const,
    assignment,
  };
}

export interface ListAssignmentsParams {
  assigneeId?: string;
  assignerId?: string;
}

export async function listAssignmentsHandler(
  db: Database,
  params: ListAssignmentsParams,
) {
  if (params.assigneeId) {
    const assignments = await listAssignmentsForLearner(db, params.assigneeId);
    return { success: true as const, assignments };
  }
  if (params.assignerId) {
    const assignments = await listAssignmentsByAssigner(db, params.assignerId);
    return { success: true as const, assignments };
  }
  throw new Error("assigneeId or assignerId must be provided");
}

// 17. Bundled learning cells (Central learning path onboarding)
export interface ListBundledCellsParams {
  user?: string;
  /** Curriculum position. Present means "answer the precedence question". */
  provider?: string;
  schoolType?: string;
  grade?: number;
  track?: string;
  subject?: string;
}

export async function listBundledCellsHandler(
  db: Database,
  params: ListBundledCellsParams = {},
) {
  const userId = await resolveHandlerUser(db, params.user);

  // Without a scope this is the plain catalogue. With one it answers the
  // precedence question of ADR 2026-08-14 Decision 10: an import surface asks
  // before offering the generic wizard, and gets both the covering cells and
  // the verdict, so it cannot read the empty list as "no opinion".
  if (!params.provider) {
    const cells = await getBundledCellsWithStatus(db, userId);
    return { success: true as const, cells, scoped: false as const };
  }

  const scope = {
    provider: params.provider,
    schoolType: params.schoolType,
    grade: params.grade,
    track: params.track,
    subject: params.subject,
  };
  const covering = findBundledCellsForScope(scope);
  const cells = await getBundledCellsWithStatus(db, userId, covering);

  return {
    success: true as const,
    scoped: true as const,
    scope,
    needsGenericImport: needsGenericCurriculumImport(scope),
    cells,
  };
}

export interface EnrolBundledCellParams {
  cellId: string;
  user?: string;
}

export async function enrolBundledCellHandler(
  db: Database,
  params: EnrolBundledCellParams,
) {
  if (!params.cellId?.trim()) {
    throw new Error("cellId is required");
  }
  const userId = await resolveHandlerUser(db, params.user);
  const result = await enrolBundledCell(db, userId, params.cellId.trim());
  return result;
}

// 18. Precondition Self-Assessment (Entry Problem, Phase 3)
export interface GetPreconditionsParams {
  cellId?: string;
  user?: string;
}

export async function getPreconditionsHandler(
  db: Database,
  params: GetPreconditionsParams = {},
) {
  const userId = await resolveHandlerUser(db, params.user);
  const candidates = await getPreconditionCandidates(db, userId, params.cellId);
  return {
    success: true as const,
    candidates,
  };
}

export interface AssessPreconditionParams {
  atomId: string;
  decision: "known" | "learn";
  user?: string;
}

export async function assessPreconditionHandler(
  db: Database,
  params: AssessPreconditionParams,
) {
  if (!params.atomId?.trim()) {
    throw new Error("atomId is required");
  }
  if (params.decision !== "known" && params.decision !== "learn") {
    throw new Error("decision must be 'known' or 'learn'");
  }
  const userId = await resolveHandlerUser(db, params.user);
  const result = await assessPrecondition(db, {
    userId,
    atomId: params.atomId.trim(),
    decision: params.decision,
  });
  return result;
}

// 19. Pull Forward on Empty Queue (Phase 4)
export interface GetPullForwardCandidatesParams {
  limit?: number;
  includeFutureDue?: boolean;
  user?: string;
}

export async function getPullForwardCandidatesHandler(
  db: Database,
  params: GetPullForwardCandidatesParams = {},
) {
  const userId = await resolveHandlerUser(db, params.user);
  const candidates = await getPullForwardCandidates(db, userId, {
    limit: params.limit,
    includeFutureDue: params.includeFutureDue,
  });
  return {
    success: true as const,
    candidates,
  };
}

export interface PullForwardCardsParams {
  cardIds: string[];
  user?: string;
}

export async function pullForwardCardsHandler(
  db: Database,
  params: PullForwardCardsParams,
) {
  if (!Array.isArray(params.cardIds) || params.cardIds.length === 0) {
    throw new Error("cardIds array is required and must not be empty");
  }
  const userId = await resolveHandlerUser(db, params.user);
  const result = await pullForwardCards(db, userId, params.cardIds);
  return {
    success: true as const,
    ...result,
  };
}

// 20. Bonus Candidates & Enrolment Surface (Phase 5)
export interface ListBonusCandidatesParams {
  cellId?: string;
  inScopeAtomIds?: string[];
  limit?: number;
  user?: string;
}

export async function listBonusCandidatesHandler(
  db: Database,
  params: ListBonusCandidatesParams = {},
) {
  const userId = await resolveHandlerUser(db, params.user);

  let inScopeAtomIds = params.inScopeAtomIds ?? [];
  if (inScopeAtomIds.length === 0 && params.cellId) {
    const cell = getBundledCell(params.cellId);
    if (cell) {
      inScopeAtomIds = cell.inScopeAtomIds;
    }
  } else if (inScopeAtomIds.length === 0) {
    const enrolled = await getBundledCellsWithStatus(db, userId);
    inScopeAtomIds = [
      ...new Set(
        enrolled
          .filter((cell) => cell.enrolled)
          .flatMap((cell) => cell.inScopeAtomIds),
      ),
    ];
  }

  const candidates = await bonusCandidates(db, userId, {
    inScopeAtomIds,
    limit: params.limit,
  });

  return {
    success: true as const,
    candidates,
  };
}

export interface EnrolBonusAtomParams {
  atomId: string;
  user?: string;
}

export async function enrolBonusAtomHandler(
  db: Database,
  params: EnrolBonusAtomParams,
) {
  if (!params.atomId?.trim()) {
    throw new Error("atomId is required");
  }
  const userId = await resolveHandlerUser(db, params.user);
  const result = await enrolBonusAtom(db, userId, params.atomId.trim());
  return result;
}
