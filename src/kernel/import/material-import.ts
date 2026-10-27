/**
 * Learning cards from photos and files — the shared contract (ADR 2026-10-05).
 *
 * A model on the built-in path, or an agent on the harness path, reads the
 * material itself and returns a {@link MaterialProposalSet}. This module is
 * everything after that: it validates the set, presets each card, matches it
 * against what the library already holds, and writes the learner's choices in
 * one transaction.
 *
 * No HTTP, no LLM, no file reading. Embeddings for matching come in as an
 * injected function; the files never reach the kernel, only their names,
 * links and fingerprints. Nothing of the material is stored (Decision 9).
 */

import { ulid } from "ulid";
import {
  ensureLensRow,
  ensureWorldLenses,
  resolveLensKind,
} from "../atlas/lenses.js";
import {
  moveUnitsToPlanet,
  type PlacedUnit,
  placeUnits,
} from "../atlas/place.js";
import { ownPlanetOf } from "../atlas/planets.js";
import type { LensKind, PlanetKind, UnitKey } from "../atlas/types.js";
import { chooseVariantIn } from "../atlas/variants.js";
import type { Database } from "../db/types.js";
import {
  BUNDLED_TILES,
  type BundledTile,
  type CurriculumScope,
  getBundledCellTile,
  listBundledCells,
} from "../library/bundled-cells.js";
import type { CardText } from "../library/card-text.js";
import {
  type CardTextInputMode,
  type CardTextNote,
  readCardTextInput,
  withSpeech,
} from "../library/card-text-input.js";
import { installKvtTile, kvtItemPlainTexts } from "../library/kvt-attach.js";
import { ensureCard, getCard, reattachCardForUser } from "../models/card.js";
import {
  type BloomLevel,
  createToken,
  generateTokenSlug,
  getTokenById,
  type Token,
} from "../models/token.js";
import {
  embeddingContentForToken,
  listEmbeddedTokens,
} from "../models/token-embedding.js";
import { cosineSimilarity } from "../search/hybrid.js";
import {
  MATERIAL_KINDS,
  MATERIAL_ORIGINS,
  MATERIAL_PROPOSAL_SET_VERSION,
  type MaterialKind,
  type MaterialOrigin,
} from "./material-contract.js";

/** `sources.uri` of an import: this prefix plus a ULID, never a file name. */
export const IMPORT_SOURCE_PREFIX = "zam-import:";
export const MAX_MATERIAL_PROPOSALS = 200;
export const MAX_MATERIAL_FILES = 50;
/** Items that continue the material, offered as Bonus (Decision 8). */
export const MAX_CONTINUATION_ITEMS = 3;

/**
 * Match thresholds (Decision 8). A match only proposes; the learner decides,
 * so a threshold errs towards showing a plausible neighbour rather than
 * hiding one. Calibrated by `tests/kernel/material-import.test.ts`.
 */
export const VECTOR_MATCH_THRESHOLD = 0.82;
export const LEXICAL_MATCH_THRESHOLD = 0.6;
export const LEXICAL_MATCH_MIN_SHARED = 3;
const CONTINUATION_THRESHOLD = 0.4;
const CONTINUATION_MIN_SHARED = 2;
const VECTOR_CANDIDATES_PER_PROPOSAL = 5;

export {
  MATERIAL_KINDS,
  MATERIAL_ORIGINS,
  MATERIAL_PROPOSAL_SET_VERSION,
  type MaterialKind,
  type MaterialOrigin,
} from "./material-contract.js";

/** The learner's choice per card (Decision 5). */
export type MaterialChoice = "yes" | "bonus" | "no";

export interface MaterialAnalysis {
  kind: MaterialKind;
  /** Names the import in the Studio and on a card's source line. */
  title: string;
  /** Subject codes as the bundled cells use them (`chemie`), lowercase. */
  subjects: string[];
  topic: string;
  level: string;
  /** Bloom range of the material, `[min, max]`. */
  bloom: [BloomLevel, BloomLevel];
  /** What the material leads to; drives the continuation offer. */
  leadsTo: string | null;
}

export interface MaterialProposal {
  /** Plain text; with segments, their projection. */
  question: string;
  answer: string;
  /**
   * Question and answer as card-text segments, when they hold a formula
   * (ADR 2026-10-14b, Decision 6). The producer may send either side as a
   * string with `$…$` or as a segment list; the parse lifts and repairs it.
   */
  questionSegments?: CardText;
  answerSegments?: CardText;
  /**
   * What stayed text although it looked like TeX: a `$HOME`, a price, a
   * formula the tokenizer refused. The review list shows it; never an error.
   */
  textNotes?: CardTextNote[];
  title: string | null;
  bloom: BloomLevel;
  /** Index into {@link MaterialProposalSet.files}. */
  file: number;
  page: number | null;
  area: string;
  origin: MaterialOrigin;
  hardToRead: boolean;
  /**
   * With a place: names for the levels below it, outermost first, such as
   * the Thema under a Gebiet (ADR 2026-10-13, Decision 9).
   */
  placeBelow?: string[];
  /**
   * The published unit this card's method stands in for, when the notes
   * teach another method for a unit the learner has there (Decision 12).
   * Only the learner's tick in the review list makes it so.
   */
  standsFor?: UnitKey;
  /**
   * The kind the producer proposes for this card's unit (ADR 2026-10-13,
   * Decision 2): `welt` for common knowledge that protects nobody, `firma`
   * or `privat` for what an organisation or a person protects. Either of
   * the last two means the library's own planet. The learner confirms it in
   * the review list; the unit stays own either way.
   */
  kind?: PlanetKind;
}

/** Where on the knowledge atlas an import starts (ADR 2026-10-13, Decision 9). */
export interface MaterialPlace {
  lens: LensKind;
  /** The region's key in that lens, such as `natur.physik.optik`. */
  regionKey: string;
}

export const MATERIAL_PLACE_LENSES: readonly LensKind[] = [
  "weltwissen",
  "schule",
  "leben",
  "produkte",
  "unternehmen",
];
/** Levels below a place an import may name: a lens has at most four. */
export const MAX_PLACE_BELOW = 4;

export interface MaterialFile {
  name: string;
  /** What the card's `source_link` names: `file://…` or `photo:<name>@<date>`. */
  sourceLink: string;
  sha256: string | null;
  /** Where the file was when it was imported; display only. */
  path: string | null;
}

export interface MaterialProposalSet {
  version: typeof MATERIAL_PROPOSAL_SET_VERSION;
  analysis: MaterialAnalysis;
  proposals: MaterialProposal[];
  files: MaterialFile[];
  /** Optional, so the contract stays at version 1. */
  place?: MaterialPlace;
}

/** One validation failure per offending path, collected in a single error. */
export class MaterialProposalSetError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid material proposals: ${issues.join("; ")}`);
    this.name = "MaterialProposalSetError";
    this.issues = issues;
  }
}

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Normalise a proposed area path: trimmed segments, `/` as the only
 * separator, no empty segments. A leading `schule/` is dropped — the root of
 * an area is the subject, never a life area (Decision 7). Case is kept so a
 * learner's existing area (`Deutsch`) still matches itself.
 */
export function normaliseMaterialArea(area: string): string {
  const segments = area
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  while (segments.length > 1 && segments[0].toLowerCase() === "schule") {
    segments.shift();
  }
  if (segments.length === 1 && segments[0].toLowerCase() === "schule") {
    return "";
  }
  return segments.join("/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBloom(value: unknown): value is BloomLevel {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

function readText(
  issues: string[],
  record: Record<string, unknown>,
  key: string,
  path: string,
  opts: { required: boolean; max: number },
): string | null {
  const value = record[key];
  if (value === undefined || value === null) {
    if (opts.required) issues.push(`${path}.${key}: required`);
    return null;
  }
  if (typeof value !== "string") {
    issues.push(`${path}.${key}: must be a string`);
    return null;
  }
  const trimmed = value.trim();
  if (opts.required && trimmed.length === 0) {
    issues.push(`${path}.${key}: must not be empty`);
    return null;
  }
  if (trimmed.length > opts.max) {
    issues.push(`${path}.${key}: longer than ${opts.max} characters`);
    return null;
  }
  return trimmed;
}

function parseAnalysis(
  issues: string[],
  value: unknown,
): MaterialAnalysis | null {
  if (!isRecord(value)) {
    issues.push("analysis: must be an object");
    return null;
  }
  const kind = value.kind;
  if (!MATERIAL_KINDS.includes(kind as MaterialKind)) {
    issues.push(`analysis.kind: must be one of ${MATERIAL_KINDS.join(", ")}`);
  }
  const title = readText(issues, value, "title", "analysis", {
    required: true,
    max: 200,
  });
  const topic = readText(issues, value, "topic", "analysis", {
    required: true,
    max: 300,
  });
  const level = readText(issues, value, "level", "analysis", {
    required: false,
    max: 300,
  });
  const leadsTo = readText(issues, value, "leadsTo", "analysis", {
    required: false,
    max: 500,
  });

  const subjects: string[] = [];
  if (!Array.isArray(value.subjects) || value.subjects.length === 0) {
    issues.push("analysis.subjects: must be a non-empty array");
  } else if (value.subjects.length > 5) {
    issues.push("analysis.subjects: at most 5 subjects");
  } else {
    value.subjects.forEach((subject, index) => {
      if (typeof subject !== "string" || subject.trim().length === 0) {
        issues.push(`analysis.subjects[${index}]: must be a non-empty string`);
      } else {
        const code = subject.trim().toLowerCase();
        if (!subjects.includes(code)) subjects.push(code);
      }
    });
  }

  let bloom: [BloomLevel, BloomLevel] = [1, 5];
  if (value.bloom !== undefined) {
    if (
      !Array.isArray(value.bloom) ||
      value.bloom.length !== 2 ||
      !isBloom(value.bloom[0]) ||
      !isBloom(value.bloom[1]) ||
      value.bloom[0] > value.bloom[1]
    ) {
      issues.push("analysis.bloom: must be [min, max] with 1 ≤ min ≤ max ≤ 5");
    } else {
      bloom = [value.bloom[0], value.bloom[1]];
    }
  }

  if (title === null || topic === null) return null;
  return {
    kind: kind as MaterialKind,
    title,
    subjects,
    topic,
    level: level ?? "",
    bloom,
    leadsTo: leadsTo && leadsTo.length > 0 ? leadsTo : null,
  };
}

function parseFiles(issues: string[], value: unknown): MaterialFile[] {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push("files: must be a non-empty array");
    return [];
  }
  if (value.length > MAX_MATERIAL_FILES) {
    issues.push(`files: at most ${MAX_MATERIAL_FILES} files`);
    return [];
  }
  const files: MaterialFile[] = [];
  value.forEach((entry, index) => {
    const path = `files[${index}]`;
    if (!isRecord(entry)) {
      issues.push(`${path}: must be an object`);
      return;
    }
    const name = readText(issues, entry, "name", path, {
      required: true,
      max: 500,
    });
    const sourceLink = readText(issues, entry, "sourceLink", path, {
      required: true,
      max: 2000,
    });
    const filePath = readText(issues, entry, "path", path, {
      required: false,
      max: 4000,
    });
    let sha256: string | null = null;
    if (entry.sha256 !== undefined && entry.sha256 !== null) {
      if (
        typeof entry.sha256 !== "string" ||
        !/^[0-9a-f]{64}$/i.test(entry.sha256.trim())
      ) {
        issues.push(`${path}.sha256: must be 64 hex characters`);
      } else {
        sha256 = entry.sha256.trim().toLowerCase();
      }
    }
    if (name !== null && sourceLink !== null) {
      files.push({
        name,
        sourceLink,
        sha256,
        path: filePath && filePath.length > 0 ? filePath : null,
      });
    }
  });
  return files;
}

/**
 * One side of a proposal: `<key>Segments` (the parsed form a staged batch
 * stores) wins over `<key>`, which may be a string or a segment list.
 */
function readCardSide(
  issues: string[],
  entry: Record<string, unknown>,
  key: "question" | "answer",
  path: string,
  max: number,
  mode: CardTextInputMode,
): { plain: string; segments: CardText | null; notes: CardTextNote[] } | null {
  const stored = entry[`${key}Segments`];
  const value = Array.isArray(stored) ? stored : entry[key];
  if (value === undefined || value === null) {
    issues.push(`${path}.${key}: required`);
    return null;
  }
  const result = readCardTextInput(value, mode);
  if (!result.ok) {
    for (const issue of result.issues) {
      issues.push(`${path}.${key}${issue.path}: ${issue.message}`);
    }
    return null;
  }
  if (result.value.plain.length > max) {
    issues.push(`${path}.${key}: longer than ${max} characters`);
    return null;
  }
  return result.value;
}

function parseProposals(
  issues: string[],
  value: unknown,
  fileCount: number,
  mode: CardTextInputMode,
): MaterialProposal[] {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push("proposals: must be a non-empty array");
    return [];
  }
  if (value.length > MAX_MATERIAL_PROPOSALS) {
    issues.push(`proposals: at most ${MAX_MATERIAL_PROPOSALS} proposals`);
    return [];
  }
  const proposals: MaterialProposal[] = [];
  value.forEach((entry, index) => {
    const path = `proposals[${index}]`;
    if (!isRecord(entry)) {
      issues.push(`${path}: must be an object`);
      return;
    }
    const before = issues.length;
    const question = readCardSide(issues, entry, "question", path, 1000, mode);
    const answer = readCardSide(issues, entry, "answer", path, 2000, mode);
    const title = readText(issues, entry, "title", path, {
      required: false,
      max: 200,
    });
    const rawArea = readText(issues, entry, "area", path, {
      required: true,
      max: 200,
    });
    const area = rawArea === null ? null : normaliseMaterialArea(rawArea);
    if (rawArea !== null && !area) {
      issues.push(`${path}.area: needs a subject, not only "schule"`);
    }
    if (!isBloom(entry.bloom)) {
      issues.push(`${path}.bloom: must be an integer from 1 to 5`);
    }
    if (!MATERIAL_ORIGINS.includes(entry.origin as MaterialOrigin)) {
      issues.push(
        `${path}.origin: must be one of ${MATERIAL_ORIGINS.join(", ")}`,
      );
    }
    const file = entry.file ?? 0;
    if (
      typeof file !== "number" ||
      !Number.isInteger(file) ||
      file < 0 ||
      (fileCount > 0 && file >= fileCount)
    ) {
      issues.push(`${path}.file: must index one of the ${fileCount} files`);
    }
    let page: number | null = null;
    if (entry.page !== undefined && entry.page !== null) {
      if (
        typeof entry.page !== "number" ||
        !Number.isInteger(entry.page) ||
        entry.page < 1
      ) {
        issues.push(`${path}.page: must be a positive integer`);
      } else {
        page = entry.page;
      }
    }
    if (
      entry.hardToRead !== undefined &&
      typeof entry.hardToRead !== "boolean"
    ) {
      issues.push(`${path}.hardToRead: must be a boolean`);
    }
    let placeBelow: string[] | undefined;
    if (entry.placeBelow !== undefined && entry.placeBelow !== null) {
      if (
        !Array.isArray(entry.placeBelow) ||
        entry.placeBelow.length > MAX_PLACE_BELOW ||
        !entry.placeBelow.every(
          (name) => typeof name === "string" && name.length <= 200,
        )
      ) {
        issues.push(
          `${path}.placeBelow: must be up to ${MAX_PLACE_BELOW} names`,
        );
      } else {
        placeBelow = (entry.placeBelow as string[]).map((name) => name.trim());
      }
    }
    let standsFor: UnitKey | undefined;
    if (entry.standsFor !== undefined && entry.standsFor !== null) {
      if (
        typeof entry.standsFor !== "string" ||
        !/^atom:[^\s]{1,100}$/.test(entry.standsFor.trim())
      ) {
        issues.push(`${path}.standsFor: must be a published unit key (atom:…)`);
      } else {
        standsFor = entry.standsFor.trim() as UnitKey;
      }
    }
    let kind: PlanetKind | undefined;
    if (entry.kind !== undefined && entry.kind !== null) {
      if (
        entry.kind !== "welt" &&
        entry.kind !== "firma" &&
        entry.kind !== "privat"
      ) {
        issues.push(`${path}.kind: must be welt, firma or privat`);
      } else {
        kind = entry.kind;
      }
    }
    if (issues.length > before || !question || !answer) return;
    const textNotes = [...question.notes, ...answer.notes];
    proposals.push({
      question: question.plain,
      answer: answer.plain,
      ...(question.segments ? { questionSegments: question.segments } : {}),
      ...(answer.segments ? { answerSegments: answer.segments } : {}),
      ...(textNotes.length > 0 ? { textNotes } : {}),
      title: title && title.length > 0 ? title : null,
      bloom: entry.bloom as BloomLevel,
      file: file as number,
      page,
      area: area as string,
      origin: entry.origin as MaterialOrigin,
      hardToRead: entry.hardToRead === true,
      ...(placeBelow && placeBelow.length > 0 ? { placeBelow } : {}),
      ...(standsFor ? { standsFor } : {}),
      ...(kind ? { kind } : {}),
    });
  });
  return proposals;
}

function parsePlace(
  issues: string[],
  value: unknown,
): MaterialPlace | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    issues.push("place: must be an object");
    return undefined;
  }
  const lens = value.lens;
  if (
    typeof lens !== "string" ||
    !(MATERIAL_PLACE_LENSES as readonly string[]).includes(lens)
  ) {
    issues.push(
      `place.lens: must be one of ${MATERIAL_PLACE_LENSES.join(", ")}`,
    );
  }
  const regionKey = readText(issues, value, "regionKey", "place", {
    required: true,
    max: 300,
  });
  if (issues.length > 0 || !regionKey) return undefined;
  return { lens: lens as MaterialPlace["lens"], regionKey };
}

/**
 * Validate a proposal set from a model or an agent. Unstructured output never
 * passes (ADR 2026-06-30, testing strategy): every offending path is listed in
 * one {@link MaterialProposalSetError}.
 *
 * Card text (ADR 2026-10-14b, Decision 6): `mode: "agent"` names a formula
 * the tokenizer refuses; the default `import` keeps it as readable text and
 * notes it for the review list. Missing speech is checked separately
 * ({@link materialSpeechIssues}), because only the harness path refuses it.
 */
export function parseMaterialProposalSet(
  input: unknown,
  opts: { mode?: CardTextInputMode } = {},
): MaterialProposalSet {
  const issues: string[] = [];
  if (!isRecord(input)) {
    throw new MaterialProposalSetError(["(root): must be an object"]);
  }
  if (input.version !== MATERIAL_PROPOSAL_SET_VERSION) {
    issues.push(`version: must be ${MATERIAL_PROPOSAL_SET_VERSION}`);
  }
  const analysis = parseAnalysis(issues, input.analysis);
  const files = parseFiles(issues, input.files);
  const proposals = parseProposals(
    issues,
    input.proposals,
    files.length,
    opts.mode ?? "import",
  );
  const place = parsePlace(issues, input.place);
  if (issues.length > 0 || analysis === null) {
    throw new MaterialProposalSetError(
      issues.length > 0 ? issues : ["analysis: invalid"],
    );
  }
  return {
    version: MATERIAL_PROPOSAL_SET_VERSION,
    analysis,
    proposals,
    files,
    ...(place ? { place } : {}),
  };
}

/**
 * Formulas without speech, one line per formula: `proposals[2].question[1]`
 * and its TeX. The harness path refuses a set with any (ADR 2026-10-14b,
 * Decision 4: a model-written card carries speech); the agent adds speech
 * and sends the set again.
 */
export function materialSpeechIssues(set: MaterialProposalSet): string[] {
  const out: string[] = [];
  set.proposals.forEach((proposal, index) => {
    for (const [key, segments] of [
      ["question", proposal.questionSegments],
      ["answer", proposal.answerSegments],
    ] as const) {
      (segments ?? []).forEach((segment, at) => {
        if (segment.type === "math" && !segment.speech?.trim()) {
          out.push(
            `proposals[${index}].${key}[${at}].speech: required — how "${segment.tex}" is read aloud`,
          );
        }
      });
    }
  });
  return out;
}

/** Every formula without speech in the set, once each. */
export function materialFormulasWithoutSpeech(
  set: MaterialProposalSet,
): string[] {
  const out = new Set<string>();
  for (const proposal of set.proposals) {
    for (const segments of [
      proposal.questionSegments,
      proposal.answerSegments,
    ]) {
      for (const segment of segments ?? []) {
        if (segment.type === "math" && !segment.speech?.trim()) {
          out.add(segment.tex);
        }
      }
    }
  }
  return [...out];
}

/** The set with speech filled in from a `tex → speech` reading list. */
export function withMaterialSpeech(
  set: MaterialProposalSet,
  speech: ReadonlyMap<string, string>,
): MaterialProposalSet {
  return {
    ...set,
    proposals: set.proposals.map((proposal) => ({
      ...proposal,
      ...(proposal.questionSegments
        ? { questionSegments: withSpeech(proposal.questionSegments, speech) }
        : {}),
      ...(proposal.answerSegments
        ? { answerSegments: withSpeech(proposal.answerSegments, speech) }
        : {}),
    })),
  };
}

// ── Presets ──────────────────────────────────────────────────────────────────

/**
 * The choice a card starts with (Decision 5). A `completed` card is the
 * model's own addition and the page is gone after the import, so it is chosen
 * by hand; so is anything the model could not read with confidence.
 */
export function presetFor(proposal: MaterialProposal): MaterialChoice | null {
  if (proposal.hardToRead) return null;
  switch (proposal.origin) {
    case "page":
      return "yes";
    case "extra":
      return "bonus";
    case "completed":
      return null;
  }
}

// ── Area context ─────────────────────────────────────────────────────────────

export interface MaterialAreaContext {
  /** Areas in use, so a proposal can reuse one (Decision 7). */
  areas: Array<{ path: string; tokenCount: number }>;
  /** Subject codes of the bundled cells, for the learner's school type first. */
  cellSubjects: string[];
}

export async function listMaterialAreaContext(
  db: Database,
  scope?: Pick<CurriculumScope, "schoolType">,
): Promise<MaterialAreaContext> {
  const rows = (await db
    .prepare(
      `SELECT domain, COUNT(*) AS token_count
         FROM tokens
        WHERE deprecated_at IS NULL AND domain <> ''
        GROUP BY domain
        ORDER BY domain`,
    )
    .all()) as Array<{ domain: string; token_count: number | string }>;

  const preferred = new Set<string>();
  const others = new Set<string>();
  for (const cell of listBundledCells()) {
    for (const cellScope of cell.curriculumScopes) {
      if (!cellScope.subject) continue;
      const subject = cellScope.subject.toLowerCase();
      if (scope?.schoolType && cellScope.schoolType === scope.schoolType) {
        preferred.add(subject);
      } else {
        others.add(subject);
      }
    }
  }
  const cellSubjects = [
    ...[...preferred].sort(),
    ...[...others].filter((subject) => !preferred.has(subject)).sort(),
  ];

  return {
    areas: rows.map((row) => ({
      path: row.domain,
      tokenCount: Number(row.token_count),
    })),
    cellSubjects,
  };
}

// ── Matching ─────────────────────────────────────────────────────────────────

/** What an existing or continuation row points at. */
export type MaterialTarget =
  | { type: "token"; tokenId: string }
  | { type: "cell-item"; cellId: string; atomId: string; itemId: string };

interface MaterialRowContent {
  target: MaterialTarget;
  question: string;
  answer: string;
  title: string;
  area: string;
}

export type MaterialReviewRow =
  | {
      kind: "proposal";
      id: string;
      proposalIndex: number;
      preset: MaterialChoice | null;
    }
  | (MaterialRowContent & {
      kind: "existing";
      id: string;
      /** The proposal this item stands beside. */
      besideProposal: number;
      /** Inherited from that proposal; `null` once the learner holds it. */
      preset: MaterialChoice | null;
      /** The learner already has a card for it; the row takes no choice. */
      held: boolean;
      score: number;
      via: "lexical" | "vector";
    })
  | (MaterialRowContent & {
      kind: "continuation";
      id: string;
      preset: "bonus";
    });

export interface MaterialMatchOptions {
  /**
   * Embeds canonical token texts (`embeddingContentForToken`) with the
   * library's embedding model; absent = lexical only.
   */
  embed?: (texts: string[]) => Promise<number[][]>;
  /** The model the stored token vectors must match; required with `embed`. */
  embeddingModel?: string;
  /** The learner's curriculum position. It ranks cells; it never filters. */
  scope?: CurriculumScope;
}

interface Candidate extends MaterialRowContent {
  key: string;
  /** The learning atom behind the item, when there is one. */
  atomId: string | null;
  /** Lower ranks first; 0 = the learner's own school type. */
  rank: number;
  stems: Set<string>;
  vector: Float32Array | null;
}

const STOPWORDS = new Set([
  // German
  "aber",
  "alle",
  "auch",
  "dass",
  "dem",
  "den",
  "der",
  "des",
  "die",
  "das",
  "durch",
  "eine",
  "einem",
  "einen",
  "einer",
  "eines",
  "für",
  "hat",
  "ist",
  "kann",
  "man",
  "mit",
  "nach",
  "nicht",
  "oder",
  "sich",
  "sind",
  "und",
  "von",
  "was",
  "welche",
  "welcher",
  "welches",
  "werden",
  "wie",
  "wird",
  "zum",
  "zur",
  "beim",
  "warum",
  "woran",
  "wozu",
  // English
  "and",
  "are",
  "does",
  "for",
  "from",
  "how",
  "into",
  "that",
  "the",
  "their",
  "this",
  "what",
  "when",
  "which",
  "why",
  "with",
]);

/**
 * Content-word stems: lowercase words of at least four letters, stopwords
 * dropped, cut to six characters — a crude stemmer that lets "Eigenschaft"
 * and "Eigenschaften" meet without a language model.
 */
export function materialStems(text: string): Set<string> {
  const stems = new Set<string>();
  for (const word of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (word.length < 4 || STOPWORDS.has(word)) continue;
    stems.add(word.slice(0, 6));
  }
  return stems;
}

/** Overlap coefficient of two stem sets, with the shared count. */
function overlap(
  a: Set<string>,
  b: Set<string>,
): { score: number; shared: number } {
  if (a.size === 0 || b.size === 0) return { score: 0, shared: 0 };
  let shared = 0;
  for (const stem of a) if (b.has(stem)) shared++;
  return { score: shared / Math.min(a.size, b.size), shared };
}

function rowText(question: string, answer: string, title?: string): string {
  return [title ?? "", question, answer].filter(Boolean).join("\n");
}

function subjectMatches(subjects: string[], value: string): boolean {
  const lower = normaliseMaterialArea(value).toLowerCase();
  return subjects.some(
    (subject) =>
      lower === subject ||
      lower.startsWith(`${subject}/`) ||
      lower.startsWith(`${subject}-`),
  );
}

async function libraryCandidates(
  db: Database,
  set: MaterialProposalSet,
): Promise<Candidate[]> {
  const roots = new Set(set.analysis.subjects);
  for (const proposal of set.proposals) {
    const root = proposal.area.split("/")[0]?.toLowerCase();
    if (root) roots.add(root);
  }
  const subjects = [...roots];
  const rows = (await db
    .prepare(
      `SELECT * FROM tokens
        WHERE deprecated_at IS NULL
          AND maintenance_at IS NULL
          AND editorial_state = 'published'
          AND domain <> ''`,
    )
    .all()) as Token[];
  return rows
    .filter((token) => subjectMatches(subjects, token.domain))
    .map((token) => libraryCandidate(token));
}

function libraryCandidate(token: Token): Candidate {
  const question = token.question ?? "";
  return {
    key: `t:${token.id}`,
    atomId: token.atom_id,
    rank: 0,
    target: { type: "token", tokenId: token.id },
    question,
    answer: token.concept,
    title: token.title,
    area: token.domain,
    stems: materialStems(rowText(question, token.concept, token.title)),
    vector: null,
  };
}

function cellCandidates(
  set: MaterialProposalSet,
  scope: CurriculumScope | undefined,
): Candidate[] {
  const subjects = set.analysis.subjects;
  const candidates: Candidate[] = [];
  for (const cell of listBundledCells()) {
    const scopes = cell.curriculumScopes.filter(
      (cellScope) =>
        cellScope.subject !== undefined &&
        subjects.includes(cellScope.subject.toLowerCase()),
    );
    if (scopes.length === 0) continue;
    // Rank, never filter (Decision 8): the learner's school type first, then
    // the nearest grade.
    let rank = 2;
    for (const cellScope of scopes) {
      if (scope?.schoolType && cellScope.schoolType === scope.schoolType) {
        const distance =
          scope.grade !== undefined && cellScope.grade !== undefined
            ? Math.abs(scope.grade - cellScope.grade)
            : 1;
        rank = Math.min(rank, distance === 0 ? 0 : 1);
      }
    }
    for (const atom of cell.atoms) {
      for (const item of atom.practice_items ?? []) {
        const { question, concept } = kvtItemPlainTexts(item);
        candidates.push({
          key: `c:${item.id}`,
          atomId: atom.id,
          rank,
          target: {
            type: "cell-item",
            cellId: cell.id,
            atomId: atom.id,
            itemId: item.id,
          },
          question,
          answer: concept,
          title: atom.title,
          area: normaliseMaterialArea(atom.domain ?? ""),
          stems: materialStems(rowText(question, concept, atom.title)),
          vector: null,
        });
      }
    }
  }
  return candidates;
}

interface ScoredMatch {
  proposalIndex: number;
  candidate: Candidate;
  score: number;
  via: "lexical" | "vector";
}

/**
 * Find what the library already holds for each proposal (Decision 8). A match
 * stands beside its proposal and inherits its preset; the proposal keeps the
 * learner's own wording and starts without a choice. Items that continue the
 * material join at the end, preset to Bonus. Deterministic: no randomness, a
 * stable order for equal scores.
 */
export async function matchMaterialProposals(
  db: Database,
  userId: string,
  set: MaterialProposalSet,
  opts: MaterialMatchOptions = {},
): Promise<MaterialReviewRow[]> {
  const library = await libraryCandidates(db, set);
  // An installed cell item is already a library token: offer it once, as
  // the token.
  const installed = new Set(library.map((candidate) => candidate.key));
  const cells = cellCandidates(set, opts.scope).filter(
    (candidate) =>
      candidate.target.type !== "cell-item" ||
      !installed.has(`t:${candidate.target.itemId}`),
  );

  // Vector leg: stored vectors for library tokens, on-the-fly vectors for the
  // proposals and the cell items. Both legs run without it.
  let proposalVectors: Float32Array[] | null = null;
  if (opts.embed && opts.embeddingModel) {
    // The canonical token text, so a proposal meets a stored token vector on
    // the same terms.
    const texts = [
      ...set.proposals.map((p) =>
        embeddingContentForToken({
          concept: p.answer,
          question: p.question,
          domain: p.area,
          title: p.title,
        }),
      ),
      ...cells.map((c) =>
        embeddingContentForToken({
          concept: c.answer,
          question: c.question,
          domain: c.area,
          title: c.title,
        }),
      ),
    ];
    const vectors = await opts.embed(texts);
    proposalVectors = vectors
      .slice(0, set.proposals.length)
      .map((v) => Float32Array.from(v));
    vectors.slice(set.proposals.length).forEach((v, index) => {
      cells[index].vector = Float32Array.from(v);
    });
    // The vector leg searches the whole library, not only the subject's
    // pre-selection (owner decision, 2026-10-05): a learner's library is
    // small and personal, a match from elsewhere still has to clear the
    // threshold, and a subject filter would miss cards filed under an
    // unconventional area.
    const known = new Map(library.map((c) => [c.key, c]));
    const embedded = await listEmbeddedTokens(db, opts.embeddingModel);
    for (const row of embedded) {
      if (
        row.token.deprecated_at ||
        row.token.maintenance_at ||
        row.token.editorial_state !== "published"
      ) {
        continue;
      }
      const key = `t:${row.token.id}`;
      const candidate = known.get(key) ?? libraryCandidate(row.token);
      candidate.vector = row.embedding;
      if (!known.has(key)) {
        known.set(key, candidate);
        library.push(candidate);
      }
    }
  }

  // The vector leg may have added installed cell items as tokens; offer each
  // item once.
  const libraryKeys = new Set(library.map((candidate) => candidate.key));
  const cellPool = cells.filter(
    (candidate) =>
      candidate.target.type !== "cell-item" ||
      !libraryKeys.has(`t:${candidate.target.itemId}`),
  );
  const candidates = [...library, ...cellPool];
  const matches: ScoredMatch[] = [];
  set.proposals.forEach((proposal, proposalIndex) => {
    const stems = materialStems(
      rowText(proposal.question, proposal.answer, proposal.title ?? ""),
    );
    const vector = proposalVectors?.[proposalIndex] ?? null;
    const scored: ScoredMatch[] = [];
    for (const candidate of candidates) {
      if (vector && candidate.vector) {
        const similarity = cosineSimilarity(vector, candidate.vector);
        if (similarity >= VECTOR_MATCH_THRESHOLD) {
          scored.push({
            proposalIndex,
            candidate,
            score: similarity,
            via: "vector",
          });
          continue;
        }
      }
      const lexical = overlap(stems, candidate.stems);
      if (
        lexical.score >= LEXICAL_MATCH_THRESHOLD &&
        lexical.shared >= LEXICAL_MATCH_MIN_SHARED
      ) {
        scored.push({
          proposalIndex,
          candidate,
          score: lexical.score,
          via: "lexical",
        });
      }
    }
    scored.sort(compareMatches);
    matches.push(...scored.slice(0, VECTOR_CANDIDATES_PER_PROPOSAL));
  });

  // Each existing item stands beside at most one proposal, and each proposal
  // gets at most one: the best pairs first.
  matches.sort(compareMatches);
  const byProposal = new Map<number, ScoredMatch>();
  const usedTargets = new Set<string>();
  for (const match of matches) {
    if (byProposal.has(match.proposalIndex)) continue;
    if (usedTargets.has(match.candidate.key)) continue;
    byProposal.set(match.proposalIndex, match);
    usedTargets.add(match.candidate.key);
  }

  const rows: MaterialReviewRow[] = [];
  for (let index = 0; index < set.proposals.length; index++) {
    const proposal = set.proposals[index];
    const match = byProposal.get(index);
    if (!match) {
      rows.push({
        kind: "proposal",
        id: `p:${index}`,
        proposalIndex: index,
        preset: presetFor(proposal),
      });
      continue;
    }
    const held = await holdsTarget(db, userId, match.candidate.target);
    rows.push({
      kind: "proposal",
      id: `p:${index}`,
      proposalIndex: index,
      preset: null,
    });
    rows.push({
      kind: "existing",
      id: `e:${index}`,
      besideProposal: index,
      preset: held ? null : presetFor(proposal),
      held,
      score: Math.round(match.score * 1000) / 1000,
      via: match.via,
      ...content(match.candidate),
    });
  }

  for (const candidate of await continuationCandidates(
    db,
    userId,
    set,
    candidates,
    usedTargets,
  )) {
    rows.push({
      kind: "continuation",
      id: `c:${targetTokenId(candidate.target)}`,
      preset: "bonus",
      ...content(candidate),
    });
  }
  return rows;
}

function compareMatches(a: ScoredMatch, b: ScoredMatch): number {
  if (a.via !== b.via) return a.via === "vector" ? -1 : 1;
  if (Math.abs(a.score - b.score) > 1e-9) return b.score - a.score;
  if (a.candidate.rank !== b.candidate.rank) {
    return a.candidate.rank - b.candidate.rank;
  }
  if (a.proposalIndex !== b.proposalIndex) {
    return a.proposalIndex - b.proposalIndex;
  }
  return a.candidate.key.localeCompare(b.candidate.key);
}

function content(candidate: Candidate): MaterialRowContent {
  return {
    target: candidate.target,
    question: candidate.question,
    answer: candidate.answer,
    title: candidate.title,
    area: candidate.area,
  };
}

function targetTokenId(target: MaterialTarget): string {
  return target.type === "token" ? target.tokenId : target.itemId;
}

/** True when the learner holds an attached card for the target. */
async function holdsTarget(
  db: Database,
  userId: string,
  target: MaterialTarget,
): Promise<boolean> {
  const card = await getCard(db, targetTokenId(target), userId);
  return card !== undefined && !card.detached_at;
}

/**
 * Atoms the material leads to (`analysis.leadsTo`), one item each, same
 * subject only, at most {@link MAX_CONTINUATION_ITEMS}. Items the learner
 * already holds, or that already stand beside a proposal, are left out.
 */
async function continuationCandidates(
  db: Database,
  userId: string,
  set: MaterialProposalSet,
  candidates: Candidate[],
  usedTargets: Set<string>,
): Promise<Candidate[]> {
  const leadsTo = set.analysis.leadsTo;
  if (!leadsTo) return [];
  const leadStems = materialStems(leadsTo);
  const subjects = set.analysis.subjects;
  const usedAtoms = new Set(
    candidates
      .filter((candidate) => usedTargets.has(candidate.key))
      .map((candidate) => candidate.atomId)
      .filter((atomId): atomId is string => atomId !== null),
  );
  const byAtom = new Map<string, { candidate: Candidate; score: number }>();
  for (const candidate of candidates) {
    // Atoms only: a curated item the material leads to, same subject.
    if (candidate.atomId === null || usedAtoms.has(candidate.atomId)) continue;
    if (
      candidate.target.type === "token" &&
      !subjectMatches(subjects, candidate.area)
    ) {
      continue;
    }
    const titleStems = materialStems(candidate.title);
    const lexical = overlap(leadStems, titleStems);
    if (
      lexical.score < CONTINUATION_THRESHOLD ||
      lexical.shared < CONTINUATION_MIN_SHARED
    ) {
      continue;
    }
    const atomKey = candidate.atomId;
    const best = byAtom.get(atomKey);
    // One item per atom: the first in tile order (the recall item, before the
    // synthesis task), which is the gentler offer.
    if (!best || lexical.score > best.score) {
      byAtom.set(atomKey, { candidate, score: lexical.score });
    }
  }
  const ranked = [...byAtom.values()].sort((a, b) => {
    if (Math.abs(a.score - b.score) > 1e-9) return b.score - a.score;
    if (a.candidate.rank !== b.candidate.rank) {
      return a.candidate.rank - b.candidate.rank;
    }
    return a.candidate.key.localeCompare(b.candidate.key);
  });
  const result: Candidate[] = [];
  for (const { candidate } of ranked) {
    if (result.length >= MAX_CONTINUATION_ITEMS) break;
    if (await holdsTarget(db, userId, candidate.target)) continue;
    result.push(candidate);
  }
  return result;
}

// ── Commit ───────────────────────────────────────────────────────────────────

export interface MaterialCommitInput {
  set: MaterialProposalSet;
  rows: MaterialReviewRow[];
  /** The learner's choice per row id. A row without one is not saved. */
  decisions: Record<string, MaterialChoice>;
  /** Proposed area → the area the learner confirmed (Decision 7). */
  areas?: Record<string, string>;
  /**
   * Proposal rows whose `standsFor` the learner ticked: with a Yes, the new
   * card's unit stands in for that published unit (ADR 2026-10-13, Decision
   * 12).
   */
  variants?: string[];
  /**
   * The kind the learner confirmed per proposal row, over the producer's
   * (ADR 2026-10-13, Decision 2): `welt`, or the library's own planet
   * (`firma` and `privat` both mean it).
   */
  kinds?: Record<string, PlanetKind>;
}

export interface MaterialCommitResult {
  sourceId: string;
  /** Cards that entered the learner's queue. */
  cardsCreated: number;
  /** Items kept as Bonus: a token without a card. */
  bonusKept: number;
  /** Proposals that turned out to be an exact duplicate of a held token. */
  linkedExisting: number;
  /** Rows without a choice, or with "no". */
  notSaved: number;
  /** New units put at the import's place on the atlas. */
  placed?: number;
  /** Published units a new card now stands in for. */
  variantsChosen?: number;
  /**
   * New units whose kind the learner confirmed against the place: put on
   * the world planet, or on the library's own.
   */
  kinds?: { welt: number; own: number };
}

function sourceLinkFor(file: MaterialFile, page: number | null): string {
  const isPdf =
    /\.pdf$/i.test(file.name) || /\.pdf(#.*)?$/i.test(file.sourceLink);
  if (isPdf && page !== null && !file.sourceLink.includes("#")) {
    return `${file.sourceLink}#page=${page}`;
  }
  return file.sourceLink;
}

function sourceTypeFor(files: MaterialFile[]): "file" | "scan" {
  return files.every((file) => file.sourceLink.startsWith("photo:"))
    ? "scan"
    : "file";
}

function normaliseQuestion(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

async function linkToSource(
  db: Database,
  tokenId: string,
  sourceId: string,
  page: number | null,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO token_sources (token_id, source_id, excerpt, page_number)
       VALUES (?, ?, '', ?)
       ON CONFLICT(token_id, source_id) DO UPDATE SET
         page_number = excluded.page_number`,
    )
    .run(tokenId, sourceId, page === null ? null : String(page));
}

/** Give the learner an attached card; true when that changed anything. */
async function takeCard(
  db: Database,
  tokenId: string,
  userId: string,
): Promise<boolean> {
  const card = await getCard(db, tokenId, userId);
  if (!card) {
    await ensureCard(db, tokenId, userId);
    return true;
  }
  if (card.detached_at) {
    await reattachCardForUser(db, tokenId, userId);
    return true;
  }
  return false;
}

function findReplacingBundledItem(itemId: string): {
  tile: BundledTile;
  atomId: string;
  item: BundledTile["atoms"][number]["practice_items"][number];
} | null {
  for (const tile of Object.values(BUNDLED_TILES)) {
    for (const atom of tile.atoms) {
      for (const item of atom.practice_items ?? []) {
        if (item.replaces?.includes(itemId)) {
          return { tile, atomId: atom.id, item };
        }
      }
    }
  }
  return null;
}

/**
 * Write the learner's choices (Decisions 5, 6, 8, 9) in one transaction:
 *
 * - `yes` on a proposal: a published token, its card, the source link;
 * - `bonus` on a proposal: the same token without a card;
 * - `yes` / `bonus` on an existing or continuation row: a card for, or a
 *   link to, what the library holds — no new token;
 * - `no`, or no choice: nothing.
 *
 * One `sources` row records the import: its title, the files' fingerprints
 * and the learner. A cell tile that a chosen row needs is installed first and
 * outside the transaction: installing creates no card (ADR 2026-08-14
 * Decision 3), so a failed commit leaves nothing the learner sees.
 */
export async function commitMaterialImport(
  db: Database,
  userId: string,
  input: MaterialCommitInput,
): Promise<MaterialCommitResult> {
  if (!userId.trim()) throw new Error("userId is required");
  const { set, rows, decisions } = input;
  const rowIds = new Set(rows.map((row) => row.id));
  for (const [rowId, choice] of Object.entries(decisions)) {
    if (!rowIds.has(rowId)) throw new Error(`Unknown review row: ${rowId}`);
    if (choice !== "yes" && choice !== "bonus" && choice !== "no") {
      throw new Error(`Invalid choice for ${rowId}: ${String(choice)}`);
    }
  }
  for (const row of rows) {
    if (
      (row.kind === "proposal" && !set.proposals[row.proposalIndex]) ||
      (row.kind === "existing" && !set.proposals[row.besideProposal])
    ) {
      throw new Error(`Review row ${row.id} does not fit the proposals`);
    }
  }

  const chosen = (row: MaterialReviewRow): MaterialChoice | null => {
    if (row.kind === "existing" && row.held) return null;
    const choice = decisions[row.id];
    return choice === "yes" || choice === "bonus" ? choice : null;
  };

  const tilesToInstall = new Map<string, BundledTile>();
  const orphanedRows = new Set<MaterialReviewRow>();
  const resolvedTargets = new Map<MaterialReviewRow, MaterialTarget>();
  for (const row of rows) {
    if (row.kind === "proposal" || chosen(row) === null) continue;
    if (row.target.type !== "cell-item") continue;
    let target: MaterialTarget = row.target;
    let tile = getBundledCellTile(target.cellId);
    if (!tile) {
      const replacement = findReplacingBundledItem(target.itemId);
      if (replacement) {
        target = {
          type: "cell-item",
          cellId: replacement.tile.tile_id,
          atomId: replacement.atomId,
          itemId: replacement.item.id,
        };
        resolvedTargets.set(row, target);
        tile = replacement.tile;
      }
    }
    if (!tile) {
      orphanedRows.add(row);
      continue;
    }
    if (!tilesToInstall.has(target.cellId)) {
      tilesToInstall.set(target.cellId, tile);
    }
  }
  for (const tile of tilesToInstall.values()) {
    await installKvtTile(db, tile);
  }

  const fingerprints = [
    ...new Set(
      set.files
        .map((file) => file.sha256)
        .filter((sha): sha is string => sha !== null),
    ),
  ];
  const areaFor = (proposal: MaterialProposal): string => {
    const confirmed = input.areas?.[proposal.area];
    const area = normaliseMaterialArea(confirmed ?? proposal.area);
    return area.length > 0 ? area : proposal.area;
  };
  // The atlas's lenses must exist before the commit places anything; a
  // transaction cannot open another.
  const placeLens = set.place
    ? await resolveLensKind(db, set.place.lens)
    : null;
  // A mixed import (Decision 2): a confirmed kind per card, else the
  // producer's. Either may send a unit to the world planet.
  const kindOf = (rowId: string, proposal: MaterialProposal) =>
    input.kinds?.[rowId] ?? proposal.kind;
  const ownPlanet = await ownPlanetOf(db);
  const ticked = new Set(input.variants ?? []);
  // A variant the learner takes goes to world knowledge (Decision 12).
  const mixed =
    Object.keys(input.kinds ?? {}).length > 0 ||
    ticked.size > 0 ||
    set.proposals.some((proposal) => proposal.kind !== undefined);
  if (placeLens?.planet === "welt" || mixed) await ensureWorldLenses(db);
  if (placeLens && placeLens.planet !== "welt") {
    await ensureLensRow(db, placeLens);
  }

  return db.transaction(async (tx) => {
    const sourceId = ulid();
    await tx
      .prepare(
        `INSERT INTO sources (id, type, uri, content, created_at, title, fingerprints, imported_by)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?)`,
      )
      .run(
        sourceId,
        sourceTypeFor(set.files),
        `${IMPORT_SOURCE_PREFIX}${ulid()}`,
        new Date().toISOString(),
        set.analysis.title,
        fingerprints.length > 0 ? JSON.stringify(fingerprints) : null,
        userId,
      );

    const result: MaterialCommitResult = {
      sourceId,
      cardsCreated: 0,
      bonusKept: 0,
      linkedExisting: 0,
      notSaved: 0,
    };
    // New own units for the place, and the variants the learner ticked.
    const placed: PlacedUnit[] = [];
    // New units whose kind differs from the place's, or that have no place.
    const toPlanet: Record<"welt" | "own", UnitKey[]> = { welt: [], own: [] };
    const chosenVariants: Array<{ variant: UnitKey; standsFor: UnitKey }> = [];

    for (const row of rows) {
      if (orphanedRows.has(row)) {
        result.notSaved++;
        continue;
      }
      const choice = chosen(row);
      if (row.kind === "existing" && row.held) continue;
      if (choice === null) {
        result.notSaved++;
        continue;
      }

      if (row.kind === "proposal") {
        const proposal = set.proposals[row.proposalIndex];
        const area = areaFor(proposal);
        const standsIn =
          choice === "yes" &&
          proposal.standsFor !== undefined &&
          ticked.has(row.id);
        // An exact duplicate — same area, same question — is linked, not
        // written twice (the existing slug-level dedupe, by meaning). Only a
        // token the queue deals counts: a draft or one in maintenance would
        // take the learner's choice and never show it.
        const duplicate = (await tx
          .prepare(
            `SELECT id, question FROM tokens
              WHERE domain = ? AND question IS NOT NULL
                AND deprecated_at IS NULL AND maintenance_at IS NULL
                AND editorial_state = 'published'`,
          )
          .all(area)) as Array<{ id: string; question: string }>;
        const same = duplicate.find(
          (token) =>
            normaliseQuestion(token.question) ===
            normaliseQuestion(proposal.question),
        );
        let tokenId: string;
        if (same) {
          tokenId = same.id;
          result.linkedExisting++;
        } else {
          const token = await createToken(tx, {
            slug: await generateTokenSlug(
              tx,
              area,
              proposal.answer,
              proposal.question,
            ),
            title: proposal.title ?? "",
            concept: proposal.answer,
            domain: area,
            bloom_level: proposal.bloom,
            question: proposal.question,
            question_segments: proposal.questionSegments ?? null,
            concept_segments: proposal.answerSegments ?? null,
            question_source: "llm",
            source_link: sourceLinkFor(set.files[proposal.file], proposal.page),
            editorial_state: "published",
          });
          tokenId = token.id;
          // Only a unit this import wrote moves to its place: a linked
          // duplicate keeps where it is. A kind the place does not have
          // sends it to that planet instead (Decision 2). A variant the
          // learner takes is world knowledge (Decision 12).
          const kind = standsIn ? "welt" : kindOf(row.id, proposal);
          const wanted =
            kind === undefined ? null : kind === "welt" ? "welt" : "own";
          const placePlanet =
            placeLens === null
              ? null
              : placeLens.planet === "welt"
                ? "welt"
                : "own";
          if (placeLens && (wanted === null || wanted === placePlanet)) {
            placed.push({
              unitKey: `token:${tokenId}`,
              below: proposal.placeBelow ?? [],
            });
          } else if (wanted !== null) {
            toPlanet[wanted].push(`token:${tokenId}`);
          }
        }
        if (standsIn && proposal.standsFor) {
          chosenVariants.push({
            variant: `token:${tokenId}`,
            standsFor: proposal.standsFor,
          });
        }
        await linkToSource(tx, tokenId, sourceId, proposal.page);
        if (choice === "yes") {
          if (await takeCard(tx, tokenId, userId)) result.cardsCreated++;
        } else if (
          !(await holdsTarget(tx, userId, { type: "token", tokenId }))
        ) {
          result.bonusKept++;
        }
        continue;
      }

      const target = resolvedTargets.get(row) ?? row.target;
      const tokenId = targetTokenId(target);
      if (!(await getTokenById(tx, tokenId))) {
        throw new Error(`Library item not found: ${tokenId}`);
      }
      const page =
        row.kind === "existing" ? set.proposals[row.besideProposal].page : null;
      await linkToSource(tx, tokenId, sourceId, page);
      if (choice === "yes") {
        if (await takeCard(tx, tokenId, userId)) result.cardsCreated++;
      } else if (!(await holdsTarget(tx, userId, { type: "token", tokenId }))) {
        result.bonusKept++;
      }
    }

    if (placeLens && set.place && placed.length > 0) {
      result.placed = await placeUnits(
        tx,
        placeLens,
        set.place.regionKey,
        placed,
      );
    }
    if (toPlanet.welt.length > 0 || toPlanet.own.length > 0) {
      const welt = await moveUnitsToPlanet(tx, {
        units: toPlanet.welt,
        planet: "welt",
        placedBy: "import",
      });
      const own = await moveUnitsToPlanet(tx, {
        units: toPlanet.own,
        planet: ownPlanet,
        placedBy: "import",
      });
      result.kinds = {
        welt: welt.moved.length + welt.unchanged.length,
        own: own.moved.length + own.unchanged.length,
      };
    }
    for (const pair of chosenVariants) {
      await chooseVariantIn(tx, { userId, ...pair });
    }
    if (chosenVariants.length > 0) {
      result.variantsChosen = chosenVariants.length;
    }
    return result;
  });
}

// ── Re-import and Bonus ──────────────────────────────────────────────────────

export interface MaterialImportRecord {
  sourceId: string;
  title: string | null;
  createdAt: string;
}

/**
 * Earlier imports of any of these files (Decision 9). The answer informs the
 * learner ("imported on 5 Oct"); it never blocks an import.
 */
export async function findImportsByFingerprints(
  db: Database,
  sha256s: string[],
): Promise<MaterialImportRecord[]> {
  const wanted = new Set(sha256s.map((sha) => sha.toLowerCase()));
  if (wanted.size === 0) return [];
  const rows = (await db
    .prepare(
      `SELECT id, title, fingerprints, created_at FROM sources
        WHERE uri LIKE ? AND fingerprints IS NOT NULL
        ORDER BY created_at DESC, id`,
    )
    .all(`${IMPORT_SOURCE_PREFIX}%`)) as Array<{
    id: string;
    title: string | null;
    fingerprints: string;
    created_at: string;
  }>;
  const records: MaterialImportRecord[] = [];
  for (const row of rows) {
    let stored: unknown;
    try {
      stored = JSON.parse(row.fingerprints);
    } catch {
      continue;
    }
    if (
      Array.isArray(stored) &&
      stored.some((sha) => typeof sha === "string" && wanted.has(sha))
    ) {
      records.push({
        sourceId: row.id,
        title: row.title,
        createdAt: row.created_at,
      });
    }
  }
  return records;
}

export interface MaterialBonusItem {
  tokenId: string;
  title: string;
  question: string | null;
  concept: string;
  domain: string;
  sourceId: string;
  sourceTitle: string | null;
  importedAt: string;
}

const BONUS_ITEMS_SQL = `
  SELECT t.id AS token_id, t.title, t.question, t.concept, t.domain,
         s.id AS source_id, s.title AS source_title, s.created_at AS imported_at
    FROM token_sources ts
    JOIN sources s ON s.id = ts.source_id
    JOIN tokens t ON t.id = ts.token_id
    LEFT JOIN cards c ON c.token_id = t.id AND c.user_id = ?
   WHERE s.imported_by = ?
     AND s.uri LIKE ?
     AND (c.id IS NULL OR c.detached_at < s.created_at)
     AND t.deprecated_at IS NULL
     AND t.maintenance_at IS NULL
     AND t.editorial_state = 'published'
   ORDER BY s.created_at DESC, s.id, t.id`;

/**
 * Items the learner kept as Bonus from their own imports: linked to one of
 * their imports, no card of theirs in the queue (Decision 6). Newest import
 * first. A card set aside as "not for me" counts as absent only when that
 * came before the import: keeping it as Bonus then is the newer choice, while
 * setting it aside after the import keeps it out of every offer.
 */
export async function listMaterialBonusItems(
  db: Database,
  userId: string,
  opts: { limit?: number } = {},
): Promise<MaterialBonusItem[]> {
  const limit = opts.limit ?? 20;
  const rows = (await db
    .prepare(BONUS_ITEMS_SQL)
    .all(userId, userId, `${IMPORT_SOURCE_PREFIX}%`)) as Array<{
    token_id: string;
    title: string;
    question: string | null;
    concept: string;
    domain: string;
    source_id: string;
    source_title: string | null;
    imported_at: string;
  }>;
  const seen = new Set<string>();
  const items: MaterialBonusItem[] = [];
  for (const row of rows) {
    if (seen.has(row.token_id)) continue;
    seen.add(row.token_id);
    items.push({
      tokenId: row.token_id,
      title: row.title,
      question: row.question,
      concept: row.concept,
      domain: row.domain,
      sourceId: row.source_id,
      sourceTitle: row.source_title,
      importedAt: row.imported_at,
    });
    if (items.length >= limit) break;
  }
  return items;
}

/**
 * Take one bonus item: the learner's card for it. Refuses anything not linked
 * to one of the learner's own imports.
 */
export async function takeMaterialBonusItem(
  db: Database,
  userId: string,
  tokenId: string,
): Promise<{ cardId: string }> {
  const link = await db
    .prepare(
      `SELECT ts.token_id FROM token_sources ts
         JOIN sources s ON s.id = ts.source_id
        WHERE ts.token_id = ? AND s.imported_by = ? AND s.uri LIKE ?`,
    )
    .get(tokenId, userId, `${IMPORT_SOURCE_PREFIX}%`);
  if (!link) {
    throw new Error(`Not a bonus item from your imports: ${tokenId}`);
  }
  return db.transaction(async (tx) => {
    await takeCard(tx, tokenId, userId);
    const card = await getCard(tx, tokenId, userId);
    if (!card) throw new Error(`Card could not be created for ${tokenId}`);
    return { cardId: card.id };
  });
}
