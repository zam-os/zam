import type {
  CurriculumProvider,
  CurriculumSelection,
  CurriculumTopicContentStatus,
  TopicNode,
} from "./types.js";

/**
 * Providers whose topic payloads have been verified against their real
 * official sources. Other catalogs remain navigable, but their topic leaves
 * are conservatively marked missing until equivalent evidence exists.
 */
const VERIFIED_CONTENT_PROVIDERS = new Set(["lehrplanplus-bayern"]);

export const MIN_CURRICULUM_TOPIC_CHARS = 240;
export const MIN_CURRICULUM_TOPIC_WORDS = 35;
export const MIN_CURRICULUM_TOPIC_SENTENCES = 2;

export type CurriculumReadinessReason =
  | "verified"
  | "unverified_source"
  | "missing_section"
  | "placeholder"
  | "too_short"
  | "too_few_words"
  | "too_few_sentences"
  | "truncated"
  | "source_error";

export interface CurriculumTextReadiness {
  status: CurriculumTopicContentStatus;
  reason: CurriculumReadinessReason;
  textLength: number;
  wordCount: number;
  sentenceCount: number;
}

function countWords(text: string): number {
  return text.match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

function countSentences(text: string): number {
  return text.match(/[.!?](?=\s|$)/g)?.length ?? 0;
}

/**
 * Deterministic pre-LLM check. It deliberately rejects fragments such as
 * "Die Schülerinnen und Schüler..." and text that ends mid-sentence.
 */
export function assessCurriculumText(text: string): CurriculumTextReadiness {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const textLength = normalized.length;
  const wordCount = countWords(normalized);
  const sentenceCount = countSentences(normalized);
  const metrics = { textLength, wordCount, sentenceCount };

  if (textLength === 0) {
    return { status: "missing", reason: "missing_section", ...metrics };
  }
  if (/(?:\.\.\.|…)[\s\])}"']*$/.test(normalized)) {
    return { status: "missing", reason: "placeholder", ...metrics };
  }
  if (textLength < MIN_CURRICULUM_TOPIC_CHARS) {
    return { status: "missing", reason: "too_short", ...metrics };
  }
  if (wordCount < MIN_CURRICULUM_TOPIC_WORDS) {
    return { status: "missing", reason: "too_few_words", ...metrics };
  }
  if (sentenceCount < MIN_CURRICULUM_TOPIC_SENTENCES) {
    return { status: "missing", reason: "too_few_sentences", ...metrics };
  }
  // Long structured pages often end in navigation labels (e.g. "DaZ") after
  // many complete competence sentences. For shorter extracts, an unfinished
  // ending remains a strong truncation signal.
  if (textLength < 600 && !/[.!?][\s\])}"']*$/.test(normalized)) {
    return { status: "missing", reason: "truncated", ...metrics };
  }
  return { status: "verified", reason: "verified", ...metrics };
}

function defaultContentStatus(
  provider: CurriculumProvider,
): CurriculumTopicContentStatus {
  return VERIFIED_CONTENT_PROVIDERS.has(provider.id) ? "verified" : "missing";
}

export function withCurriculumContentStatus(
  provider: CurriculumProvider,
): CurriculumProvider {
  const status = defaultContentStatus(provider);
  return {
    ...provider,
    listTopics(selection: CurriculumSelection): TopicNode[] {
      return provider.listTopics(selection).map((topic) => ({
        ...topic,
        contentStatus: status,
      }));
    },
  };
}

function selectionFromSourceRef(sourceRef: string): CurriculumSelection | null {
  const [schoolType, grade, subject, track, ...rest] = sourceRef.split("|");
  if (!schoolType || !grade || !subject || rest.length > 0) return null;
  return {
    schoolType,
    grade,
    subject,
    ...(track ? { track } : {}),
  };
}

/** Resolve status from provider-owned data instead of trusting bridge input. */
export function curriculumTopicContentStatus(
  provider: CurriculumProvider,
  topic: TopicNode,
): CurriculumTopicContentStatus {
  const selection = selectionFromSourceRef(topic.sourceRef);
  if (!selection) return "missing";
  const canonical = provider
    .listTopics(selection)
    .find(
      (candidate) =>
        candidate.id === topic.id && candidate.sourceRef === topic.sourceRef,
    );
  return canonical?.contentStatus ?? "missing";
}
