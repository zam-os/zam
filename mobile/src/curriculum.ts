/**
 * Mobile curriculum discovery and AI-assisted fallback import.
 *
 * Catalog data and reviewed-cell precedence are shared with Desktop. Network
 * and model calls stay injected here because a WebView cannot rely on CORS;
 * Android and iOS route them through the Tauri shell.
 */

import type { ZamPairLlmEndpoint } from "../../src/bridge/mobile-pairing.js";
import {
  assessCurriculumText,
  curriculumTopicContentStatus,
} from "../../src/cli/curriculum/content-readiness.js";
import {
  getCurriculumProvider,
  listCurriculumRegions,
} from "../../src/cli/curriculum/registry.js";
import type {
  CurriculumSelection,
  TaxonomyNode,
  TopicNode,
} from "../../src/cli/curriculum/types.js";
import type { Database } from "../../src/kernel/db/types.js";
import {
  type BundledCellStatus,
  findBundledCellsForScope,
  getBundledCellsWithStatus,
} from "../../src/kernel/library/bundled-cells.js";
import { slugify } from "../../src/kernel/models/token.js";
import type { MobileTokenDraft } from "./import.js";
import { resolveMobileCloudChain } from "./model-registry.js";

export type MobileCurriculumStep =
  | "region"
  | "schoolType"
  | "grade"
  | "subject"
  | "track"
  | "topic";

export interface MobileCurriculumState extends CurriculumSelection {
  country: string;
  providerId?: string;
}

export interface MobileCurriculumOption extends TaxonomyNode {
  providerId?: string;
  contentStatus?: "verified" | "missing";
  sourceRef?: string;
  hours?: number;
}

export interface MobileCurriculumView {
  step: MobileCurriculumStep;
  options: MobileCurriculumOption[];
}

const STEP_SEQUENCE: MobileCurriculumStep[] = [
  "region",
  "schoolType",
  "grade",
  "subject",
  "track",
  "topic",
];

export function initialMobileCurriculumState(): MobileCurriculumState {
  return { country: "DE" };
}

function providerFor(state: MobileCurriculumState) {
  return state.providerId ? getCurriculumProvider(state.providerId) : undefined;
}

/** Options for one catalog step, using the same filtered provider view as Desktop. */
export function mobileCurriculumOptions(
  step: MobileCurriculumStep,
  state: MobileCurriculumState,
): MobileCurriculumOption[] {
  if (step === "region") {
    return listCurriculumRegions(state.country).map((region) => ({
      ...region,
      providerId: region.providerId,
    }));
  }

  const provider = providerFor(state);
  if (!provider) return [];
  if (step === "schoolType") return provider.listSchoolTypes();
  if (!state.schoolType) return [];
  if (step === "grade") return provider.listGrades(state.schoolType);
  if (!state.grade) return [];
  if (step === "subject") {
    return provider.listSubjects(state.schoolType, state.grade);
  }
  if (!state.subject) return [];
  if (step === "track") {
    return provider.listTracks(state.schoolType, state.grade, state.subject);
  }
  return provider.listTopics(state);
}

/**
 * Next visible step after a choice. Providers without a track level skip it,
 * so a learner never taps through an empty screen.
 */
export function nextMobileCurriculumView(
  state: MobileCurriculumState,
  after?: MobileCurriculumStep,
): MobileCurriculumView | null {
  let index = after ? STEP_SEQUENCE.indexOf(after) + 1 : 0;
  while (index < STEP_SEQUENCE.length) {
    const step = STEP_SEQUENCE[index] as MobileCurriculumStep;
    const options = mobileCurriculumOptions(step, state);
    if (step === "track" && options.length === 0) {
      index += 1;
      continue;
    }
    return { step, options };
  }
  return null;
}

/** Apply one catalog choice without mutating history owned by the surface. */
export function applyMobileCurriculumChoice(
  state: MobileCurriculumState,
  step: MobileCurriculumStep,
  option: MobileCurriculumOption,
): MobileCurriculumState {
  if (step === "region") {
    return { country: state.country, providerId: option.providerId };
  }
  if (step === "schoolType") {
    return {
      country: state.country,
      providerId: state.providerId,
      schoolType: option.id,
    };
  }
  if (step === "grade") {
    return { ...state, grade: option.id, subject: undefined, track: undefined };
  }
  if (step === "subject") {
    return { ...state, subject: option.id, track: undefined };
  }
  if (step === "track") return { ...state, track: option.id };
  return state;
}

export interface MobileCurriculumPosition {
  cells: BundledCellStatus[];
  needsGenericImport: boolean;
  topics: TopicNode[];
}

/**
 * Resolve the completed learner position. Reviewed cells come first; generic
 * topics remain available as the fallback/manual route.
 */
export async function resolveMobileCurriculumPosition(
  db: Database,
  userId: string,
  state: MobileCurriculumState,
): Promise<MobileCurriculumPosition> {
  const provider = providerFor(state);
  if (!provider || !state.schoolType || !state.grade || !state.subject) {
    throw new Error("curriculum position is incomplete");
  }
  const grade = Number.parseInt(state.grade, 10);
  const covering = findBundledCellsForScope({
    provider: provider.id,
    schoolType: state.schoolType,
    ...(Number.isInteger(grade) ? { grade } : {}),
    subject: state.subject,
    ...(state.track ? { track: state.track } : {}),
  });
  return {
    cells: await getBundledCellsWithStatus(db, userId, covering),
    needsGenericImport: covering.length === 0,
    topics: provider.listTopics(state),
  };
}

export class NoMobileCurriculumModelError extends Error {
  constructor() {
    super("no cloud text model is connected");
    this.name = "NoMobileCurriculumModelError";
  }
}

export interface MobileCurriculumImportPorts {
  fetchSource(url: string): Promise<string>;
  generateText(endpoint: ZamPairLlmEndpoint, prompt: string): Promise<string>;
}

export interface MobileCurriculumImportInput {
  providerId: string;
  topic: TopicNode;
  category: string;
  locale: string;
  ports: MobileCurriculumImportPorts;
}

interface GeneratedCurriculumCard {
  title: string;
  question: string;
  concept: string;
  context: string;
  bloomLevel: number;
  prerequisites: string[];
}

export function buildMobileCurriculumPrompt(input: {
  text: string;
  category: string;
  sourceUrl: string;
  locale: string;
}): string {
  const language = input.locale.toLowerCase().startsWith("de")
    ? "German"
    : "English";
  return `Turn this official curriculum section into focused active-recall cards in ${language}.

Rules:
- Test the subject directly. Never ask what the curriculum says or what learners should know.
- One fact, concept, method, or skill per card; no duplicate cards.
- Stay inside the supplied text. The context must be the exact supporting sentence or bullet.
- Order foundations before applications. Prerequisites may name only titles from this same output.
- Return only a JSON array with this shape:
[{"title":"short title","question":"active-recall question","concept":"concise reference answer","context":"exact source excerpt","bloom_level":1,"prerequisites":[]}]
- bloom_level is an integer from 1 to 5.

Category: ${input.category}
Source: ${input.sourceUrl}

Curriculum section:
${input.text}`;
}

function jsonArrayFromModel(text: string): unknown[] {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end < start) {
    throw new Error("curriculum model returned no JSON array");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(parsed)) {
    throw new Error("curriculum model response is not an array");
  }
  return parsed;
}

export function parseMobileCurriculumCards(
  text: string,
): GeneratedCurriculumCard[] {
  const values = jsonArrayFromModel(text);
  if (values.length === 0 || values.length > 60) {
    throw new Error(
      `curriculum model must return between 1 and 60 cards (got ${values.length})`,
    );
  }
  return values.map((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`curriculum card ${index + 1} is not an object`);
    }
    const card = value as Record<string, unknown>;
    for (const field of ["title", "question", "concept", "context"] as const) {
      if (typeof card[field] !== "string" || !card[field].trim()) {
        throw new Error(`curriculum card ${index + 1} has no ${field}`);
      }
    }
    const bloom = card.bloom_level;
    if (
      typeof bloom !== "number" ||
      !Number.isInteger(bloom) ||
      bloom < 1 ||
      bloom > 5
    ) {
      throw new Error(
        `curriculum card ${index + 1} has an invalid bloom_level`,
      );
    }
    const prerequisites = card.prerequisites ?? [];
    if (
      !Array.isArray(prerequisites) ||
      prerequisites.some((entry) => typeof entry !== "string")
    ) {
      throw new Error(`curriculum card ${index + 1} has invalid prerequisites`);
    }
    return {
      title: (card.title as string).trim(),
      question: (card.question as string).trim(),
      concept: (card.concept as string).trim(),
      context: (card.context as string).trim(),
      bloomLevel: bloom,
      prerequisites: prerequisites.map((entry) => entry.trim()).filter(Boolean),
    };
  });
}

function endpointChain(first: ZamPairLlmEndpoint | null): ZamPairLlmEndpoint[] {
  const result: ZamPairLlmEndpoint[] = [];
  const seen = new Set<ZamPairLlmEndpoint>();
  let endpoint = first;
  while (endpoint && result.length < 8 && !seen.has(endpoint)) {
    seen.add(endpoint);
    if (
      endpoint.enabled &&
      !endpoint.local &&
      endpoint.apiFlavor === "chat-completions" &&
      Boolean(endpoint.apiKey)
    ) {
      result.push(endpoint);
    }
    endpoint = endpoint.fallback ?? null;
  }
  return result;
}

function uniqueDraftSlugs(cards: GeneratedCurriculumCard[]): string[] {
  const used = new Map<string, number>();
  return cards.map((card) => {
    const base = slugify(card.title || card.question).slice(0, 54) || "karte";
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  });
}

/** Fetch, strictly extract, generate and normalize one topic for the edit UI. */
export async function previewMobileCurriculumTopic(
  db: Database,
  input: MobileCurriculumImportInput,
): Promise<MobileTokenDraft[]> {
  const provider = getCurriculumProvider(input.providerId);
  if (!provider)
    throw new Error(`unknown curriculum provider: ${input.providerId}`);
  if (curriculumTopicContentStatus(provider, input.topic) !== "verified") {
    throw new Error(
      "official source for this curriculum topic is not verified",
    );
  }
  if (!provider.extractTopics) {
    throw new Error("this curriculum provider cannot extract selected topics");
  }
  const endpoints = endpointChain(await resolveMobileCloudChain(db, "text"));
  if (endpoints.length === 0) throw new NoMobileCurriculumModelError();

  const resolved = provider.resolveTopic(input.topic);
  const raw = await input.ports.fetchSource(resolved.uri);
  const text = (
    provider.extractTopics(raw, [resolved.topicId])[resolved.topicId] ?? ""
  ).trim();
  const readiness = assessCurriculumText(text);
  if (readiness.status !== "verified") {
    throw new Error(`curriculum source is incomplete (${readiness.reason})`);
  }

  const prompt = buildMobileCurriculumPrompt({
    text,
    category: input.category,
    sourceUrl: resolved.uri,
    locale: input.locale,
  });

  const failures: string[] = [];
  let response = "";
  for (const endpoint of endpoints) {
    try {
      response = await input.ports.generateText(endpoint, prompt);
      break;
    } catch (error) {
      failures.push(
        `${endpoint.label || endpoint.model}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (!response) {
    throw new Error(`curriculum generation failed: ${failures.join("; ")}`);
  }

  const cards = parseMobileCurriculumCards(response);
  const slugs = uniqueDraftSlugs(cards);
  const slugByTitle = new Map(
    cards.map((card, index) => [card.title.toLocaleLowerCase(), slugs[index]]),
  );
  return cards.map((card, index) => ({
    origin: "curriculum",
    slug: slugs[index] as string,
    title: card.title,
    question: card.question,
    concept: card.concept,
    domain: input.category,
    bloomLevel: card.bloomLevel,
    context: card.context,
    source_link: resolved.uri,
    provider: provider.id,
    topicId: resolved.topicId,
    prerequisites: card.prerequisites
      .map((title) => slugByTitle.get(title.toLocaleLowerCase()))
      .filter((slug): slug is string => Boolean(slug)),
  }));
}
