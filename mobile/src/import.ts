/** Android additive-import and quick-capture orchestration over the shared kernel. */

import type { AddTokenRequest } from "../../src/bridge/protocol.js";
import type { Database } from "../../src/kernel/db/types.js";
import { type Card, ensureCard } from "../../src/kernel/models/card.js";
import {
  assignTokenToContext,
  getKnowledgeContextByName,
} from "../../src/kernel/models/knowledge-context.js";
import { addPrerequisite } from "../../src/kernel/models/prerequisite.js";
import {
  type BloomLevel,
  createToken,
  type EditorialState,
  getTokenBySlug,
  type SymbiosisMode,
  slugify,
  type Token,
} from "../../src/kernel/models/token.js";

export const MAX_MOBILE_IMPORT_BYTES = 256_000;

export type MobileImportOrigin =
  | "bridge-json"
  | "quick-capture"
  | "image-vl"
  | "curriculum";

export interface MobileTokenDraft extends AddTokenRequest {
  origin: MobileImportOrigin;
  title?: string;
  question?: string | null;
  /** Curriculum / import provenance (e.g. `vision:gpt-4o`). */
  provider?: string | null;
  /** Stable provider-owned topic id for curriculum re-imports. */
  topicId?: string | null;
  /**
   * Capture writes `draft`. Curated starter cards pass `published` so the
   * first-run path remains immediately reviewable.
   */
  editorial_state?: EditorialState;
}

export interface MobileImportResult {
  token: Token;
  card: Card;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalString(
  value: unknown,
  field: string,
  allowNull = false,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null && allowNull) return null;
  if (typeof value !== "string") {
    throw new Error(`${field} must be a string${allowNull ? " or null" : ""}`);
  }
  return value.trim();
}

function stringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string" || !entry.trim())
  ) {
    throw new Error(`${field} must be an array of non-empty strings`);
  }
  return [...new Set(value.map((entry) => entry.trim()))];
}

/** Normalize a bridge-token-shaped object into a mobile draft. */
export function normalizeBridgeDraft(
  value: Record<string, unknown>,
  origin: MobileImportOrigin = "bridge-json",
): MobileTokenDraft {
  const slug = optionalString(value.slug, "slug");
  const concept = optionalString(value.concept, "concept");
  if (!slug || !concept) {
    throw new Error(
      "Bridge JSON must include non-empty slug and concept fields",
    );
  }

  const bloomRaw = value.bloomLevel ?? value.bloom_level ?? 1;
  const bloomValue =
    typeof bloomRaw === "string" && /^\d+$/.test(bloomRaw.trim())
      ? Number(bloomRaw.trim())
      : bloomRaw;
  if (
    typeof bloomValue !== "number" ||
    !Number.isInteger(bloomValue) ||
    bloomValue < 1 ||
    bloomValue > 5
  ) {
    throw new Error("bloomLevel must be an integer between 1 and 5");
  }

  const symbiosis = value.symbiosisMode ?? value.symbiosis_mode;
  if (
    symbiosis !== undefined &&
    symbiosis !== null &&
    !["shadowing", "copilot", "autonomy"].includes(String(symbiosis))
  ) {
    throw new Error("symbiosisMode must be shadowing, copilot, or autonomy");
  }

  const provider = optionalString(value.provider, "provider");
  const topicId = optionalString(
    value.topicId ?? value.topic_id,
    "topicId",
    true,
  );

  return {
    origin,
    slug,
    title: optionalString(value.title, "title") ?? undefined,
    concept,
    domain: optionalString(value.domain, "domain") ?? "",
    bloomLevel: bloomValue,
    context: optionalString(value.context, "context") ?? undefined,
    symbiosisMode: (symbiosis ?? undefined) as SymbiosisMode | undefined,
    source_link: optionalString(value.source_link, "source_link", true),
    question: optionalString(value.question, "question", true),
    prerequisites: stringArray(value.prerequisites, "prerequisites"),
    knowledgeContexts: stringArray(
      value.knowledgeContexts ?? value.knowledge_contexts,
      "knowledgeContexts",
    ),
    ...(provider ? { provider } : {}),
    ...(topicId ? { topicId } : {}),
  };
}

function isLlmOrigin(origin: MobileImportOrigin): boolean {
  return (
    origin === "bridge-json" || origin === "image-vl" || origin === "curriculum"
  );
}

function exactWebUrl(text: string): string | null {
  try {
    const url = new URL(text);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    // Plain text is a valid quick capture.
  }
  return null;
}

function quickCaptureTitle(text: string, sourceLink: string | null): string {
  if (sourceLink) return new URL(sourceLink).hostname;
  const firstLine = text.split(/\r?\n/, 1)[0]?.trim() ?? "";
  return firstLine.slice(0, 80);
}

export function parseMobileImport(text: string): MobileTokenDraft {
  if (new TextEncoder().encode(text).byteLength > MAX_MOBILE_IMPORT_BYTES) {
    throw new Error("Import is larger than 256 KB");
  }
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Enter text or choose a JSON file first");

  if (trimmed.startsWith("{")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error("Bridge JSON is not valid JSON");
    }
    if (!isObject(parsed)) throw new Error("Bridge JSON must be one object");
    return normalizeBridgeDraft(parsed);
  }

  const sourceLink = exactWebUrl(trimmed);
  const title = quickCaptureTitle(trimmed, sourceLink);
  const baseSlug = slugify(title || trimmed).slice(0, 60) || "notiz";
  return {
    origin: "quick-capture",
    slug: baseSlug,
    title,
    concept: trimmed,
    domain: "inbox",
    bloomLevel: 1,
    source_link: sourceLink,
  };
}

export async function confirmMobileImport(
  db: Database,
  userId: string,
  draft: MobileTokenDraft,
): Promise<MobileImportResult> {
  if (!userId.trim()) throw new Error("A paired learner is required");
  const normalized = normalizeBridgeDraft(
    draft as unknown as Record<string, unknown>,
    draft.origin,
  );
  // Preserve caller-set provenance (e.g. vision:<model>) when the draft body
  // did not carry a provider field through normalize.
  if (draft.provider && !normalized.provider) {
    normalized.provider = draft.provider;
  }

  return db.transaction(async (tx) => {
    const prerequisiteTokens = [];
    for (const slug of normalized.prerequisites ?? []) {
      const token = await getTokenBySlug(tx, slug);
      if (!token) throw new Error(`Prerequisite token not found: ${slug}`);
      prerequisiteTokens.push(token);
    }

    const contexts = [];
    for (const name of normalized.knowledgeContexts ?? []) {
      const context = await getKnowledgeContextByName(tx, name);
      if (!context) throw new Error(`Knowledge context not found: ${name}`);
      contexts.push(context);
    }

    const token = await createToken(tx, {
      slug: normalized.slug,
      title: normalized.title,
      concept: normalized.concept,
      domain: normalized.domain,
      bloom_level: normalized.bloomLevel as BloomLevel,
      context: normalized.context,
      symbiosis_mode: normalized.symbiosisMode,
      source_link: normalized.source_link,
      question: normalized.question,
      question_source:
        normalized.question && isLlmOrigin(draft.origin) ? "llm" : "manual",
      provider: normalized.provider ?? null,
      topic_id: normalized.topicId ?? null,
      editorial_state: draft.editorial_state ?? "draft",
    });

    for (const context of contexts) {
      await assignTokenToContext(tx, token.id, context.id);
    }
    for (const prerequisite of prerequisiteTokens) {
      await addPrerequisite(tx, token.id, prerequisite.id);
    }
    const card = await ensureCard(tx, token.id, userId);
    return { token, card };
  });
}
