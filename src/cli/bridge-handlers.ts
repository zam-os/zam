import type {
  BloomLevel,
  Database,
  KnowledgeContext,
  Rating,
  ReviewActionType,
  SymbiosisMode,
  SynthesisConfidence,
  Token,
  TokenPattern,
  UpdateTokenInput,
} from "../kernel/index.js";
import {
  addPrerequisite,
  analyzeObservation,
  assignTokenToContext,
  buildReviewQueue,
  createToken,
  ensureCard,
  executeReviewAction,
  generateConceptFreeCue,
  generatePrompt,
  getCard,
  getCardById,
  getCardDeletionImpact,
  getDatabaseTargetInfo,
  getDisplayTitle,
  getDueCards,
  getSessionSummary,
  getSetting,
  getTokenById,
  getTokenBySlug,
  getTokenDeleteImpact,
  getUserStats,
  isObserverPolicyConfigured,
  endSession as kernelEndSession,
  startSession as kernelStartSession,
  suggestFoundations as kernelSuggestFoundations,
  logStep,
  monitorLogExists,
  OBSERVER_POLICY_UNSET_HINT,
  pairCommands,
  prepareSessionSynthesis,
  readMonitorLog,
  resolveReviewContext,
  searchTokensHybrid,
  updateCard,
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
  noResolve?: boolean;
  noDynamicQuestion?: boolean;
  knowledgeContext?: string;
}

export async function getReview(db: Database, params: GetReviewParams) {
  const userId = await resolveHandlerUser(db, params.user);
  const queue = await buildReviewQueue(db, {
    userId,
    maxReviews: 1,
    maxNew: 1,
    knowledgeContext: params.knowledgeContext || undefined,
  });

  if (queue.items.length === 0) {
    return {
      userId,
      hasReview: false,
      card: null,
      prompt: null,
      resolvedContext: null,
      queueSize: 0,
    };
  }

  const item = queue.items[0];
  const isLlmEnabled = (await getSetting(db, "llm.enabled")) === "true";

  let resolvedQuestion = item.question;
  let questionSource: "llm" | "original" = "original";
  let questionModel: string | undefined;

  if (isLlmEnabled && params.noDynamicQuestion !== true) {
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
    knowledgeContext: params.knowledgeContext || undefined,
  });

  return {
    userId,
    hasReview: true,
    card: item,
    prompt,
    questionSource,
    questionModel: questionModel ?? null,
    resolvedContext,
    queueSize: fullQueue.items.length,
  };
}

// 3. getReviewsBatch
export interface GetReviewsBatchParams {
  user?: string;
  domain?: string;
  knowledgeContext?: string;
  includeQuestions?: boolean;
  noResolve?: boolean;
  noDynamicQuestion?: boolean;
}

export async function getReviewsBatch(
  db: Database,
  params: GetReviewsBatchParams,
) {
  const userId = await resolveHandlerUser(db, params.user);
  const dueCards = await getDueCards(
    db,
    userId,
    undefined,
    params.domain,
    params.knowledgeContext,
  );

  const isLlmEnabled = (await getSetting(db, "llm.enabled")) === "true";

  const cards = [];
  for (const card of dueCards) {
    if (params.includeQuestions) {
      const token = await getTokenBySlug(db, card.slug);
      if (!token) {
        // Degrade gracefully
        cards.push({
          cardId: card.id,
          tokenId: card.token_id,
          slug: card.slug,
          concept: card.concept,
          domain: card.domain,
          bloomLevel: card.bloom_level,
          state: card.state,
          dueAt: card.due_at,
        });
        continue;
      }

      let resolvedQuestion = token.question;
      if (isLlmEnabled && params.noDynamicQuestion !== true) {
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
        cardId: card.id,
        tokenId: card.token_id,
        slug: card.slug,
        concept: card.concept,
        domain: card.domain,
        bloomLevel: card.bloom_level,
        state: card.state,
        dueAt: card.due_at,
        bloomVerb: BLOOM_VERBS[bloom],
        question: finalQuestion,
        sourceLink: token.source_link ?? null,
        resolvedContext,
      });
    } else {
      cards.push({
        cardId: card.id,
        tokenId: card.token_id,
        slug: card.slug,
        concept: card.concept,
        domain: card.domain,
        bloomLevel: card.bloom_level,
        state: card.state,
        dueAt: card.due_at,
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
}

export async function submitReview(db: Database, params: SubmitReviewParams) {
  const userId = await resolveHandlerUser(db, params.user);
  if (
    params.doneBy !== undefined &&
    !["user", "agent"].includes(params.doneBy)
  ) {
    throw new Error("doneBy must be user or agent");
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
  });

  let stepError: string | undefined;
  if (params.sessionId) {
    try {
      await logStep(db, {
        session_id: params.sessionId,
        token_id: result.token.id,
        done_by: "user",
        rating: params.rating,
      });
    } catch (err) {
      stepError = (err as Error).message;
    }
  }

  return {
    success: true,
    rating: params.rating,
    evaluation: result.evaluation,
    blocked: result.blocked ?? null,
    ...(stepError ? { stepError } : {}),
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
