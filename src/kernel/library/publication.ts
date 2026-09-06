/**
 * Structural publication checks for the flashcard quality contract.
 *
 * Semantic review (scope, answer leakage, target competence, sets, subject
 * dependencies) stays outside the kernel. These checks are the inexpensive
 * lints that block a draft from becoming `published`.
 */

import type { Database } from "../db/types.js";
import { getPrerequisites } from "../models/prerequisite.js";
import {
  buildTokenSlug,
  type EditorialState,
  getTokenById,
  slugify,
  type Token,
} from "../models/token.js";

/** Subset of revision fields that affect structural publication checks. */
export interface PublicationFieldChanges {
  question?: string;
  concept?: string;
}

export type PublicationCheckCode =
  | "missing_question"
  | "empty_criterion"
  | "criterion_slug_echo"
  | "question_slug_echo"
  | "invalid_referenced_item"
  | "invalid_prerequisite_edge";

export interface PublicationCheck {
  code: PublicationCheckCode;
  blocking: boolean;
  message: string;
}

export interface PublicationReview {
  tokenId: string;
  editorialState: EditorialState;
  checks: PublicationCheck[];
  blocking: PublicationCheck[];
  ready: boolean;
}

export interface PublicationFields {
  slug: string;
  concept: string;
  question?: string | null;
  /** Domain the slug may carry as its prefix; used to recognise derived slugs. */
  domain?: string | null;
  /** When true, an empty question is a blocking error (new curated items). */
  requireQuestion: boolean;
}

/** True when `text` is only the slug with punctuation or spacing changed. */
export function isSlugEcho(slug: string, text: string): boolean {
  const normalizedText = slugify(text);
  const normalizedSlug = slugify(slug);
  if (!normalizedText || !normalizedSlug) return false;
  return normalizedText === normalizedSlug;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A raw slug pasted as text: lowercase tokens joined by hyphens, no prose. */
function looksLikeSlug(text: string): boolean {
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(text.trim());
}

/**
 * True when `slug` is what ZAM's own slug derivation produces from these
 * fields — from the question, or from the concept for a token whose question
 * was added after capture — with or without the domain prefix, optionally
 * carrying a collision suffix. Such a slug is downstream of the text, so the
 * text cannot be echoing it; the echo rule exists for the reverse case, a
 * criterion that is only the slug re-worded.
 *
 * Text that is itself slug-shaped never counts as a derivation source: an
 * author who pasted the slug into a field did not derive anything.
 */
export function isDerivedSlug(
  slug: string,
  fields: Pick<PublicationFields, "concept" | "question" | "domain">,
): boolean {
  const concept = fields.concept.trim();
  const question = fields.question?.trim() ?? "";
  if (!concept || looksLikeSlug(concept)) return false;
  if (question && looksLikeSlug(question)) return false;

  const never = () => false;
  const domain = fields.domain ?? "";
  const bases = new Set<string>();
  for (const base of [question || null, null]) {
    bases.add(buildTokenSlug(domain, concept, base, never));
    bases.add(buildTokenSlug("", concept, base, never));
  }
  const actual = slug.replace(/-+$/, "");
  return [...bases].some(
    (base) =>
      base === actual ||
      new RegExp(`^${escapeRegExp(base)}-\\d+$`).test(actual),
  );
}

export function structuralPublicationChecks(
  fields: PublicationFields,
): PublicationCheck[] {
  const checks: PublicationCheck[] = [];
  const concept = fields.concept.trim();
  const question = fields.question?.trim() ?? "";
  // A slug derived from the token's own text carries no information of its
  // own, so neither field can be an echo of it. The one case this cannot
  // tell apart — an authored slug that happens to equal the slugified
  // criterion next to a real question — is a semantic-review question, not
  // a structural one.
  const derived = isDerivedSlug(fields.slug, {
    concept,
    question: question || null,
    domain: fields.domain,
  });

  if (!concept) {
    checks.push({
      code: "empty_criterion",
      blocking: true,
      message: "Criterion (concept) must not be empty.",
    });
  } else if (!derived && isSlugEcho(fields.slug, concept)) {
    checks.push({
      code: "criterion_slug_echo",
      blocking: true,
      message: "Criterion must not merely echo the slug.",
    });
  }

  if (!question) {
    if (fields.requireQuestion) {
      checks.push({
        code: "missing_question",
        blocking: true,
        message: "A question is required to publish.",
      });
    }
  } else if (!derived && isSlugEcho(fields.slug, question)) {
    checks.push({
      code: "question_slug_echo",
      blocking: true,
      message: "Question must not merely echo the slug.",
    });
  }

  return checks;
}

function mergeTokenFields(
  token: Token,
  changes?: PublicationFieldChanges,
): { slug: string; concept: string; question: string | null; domain: string } {
  return {
    slug: token.slug,
    concept: changes?.concept ?? token.concept,
    question:
      changes?.question !== undefined ? changes.question : token.question,
    domain: token.domain,
  };
}

function isFirstPublication(state: EditorialState): boolean {
  return state === "draft" || state === "in_review";
}

/**
 * Structural readiness of one token, including optional pending revision
 * fields. Blocking errors must be fixed before publication.
 */
export async function evaluatePublicationReadiness(
  db: Database,
  tokenId: string,
  changes?: PublicationFieldChanges,
): Promise<PublicationReview> {
  const token = await getTokenById(db, tokenId);
  if (!token) throw new Error(`Token not found: ${tokenId}`);

  const merged = mergeTokenFields(token, changes);
  const firstPublication = isFirstPublication(token.editorial_state);
  const questionCleared =
    changes?.question !== undefined && !changes.question.trim();
  const requireQuestion = firstPublication || questionCleared;

  const checks = structuralPublicationChecks({
    slug: merged.slug,
    concept: merged.concept,
    question: merged.question,
    domain: merged.domain,
    requireQuestion,
  });

  if (token.atom_id) {
    const atom = (await db
      .prepare("SELECT id FROM learning_atoms WHERE id = ?")
      .get(token.atom_id)) as { id: string } | undefined;
    if (!atom) {
      checks.push({
        code: "invalid_referenced_item",
        blocking: true,
        message: `Referenced learning atom does not exist: ${token.atom_id}`,
      });
    }
  }

  const prerequisites = await getPrerequisites(db, token.id);
  for (const edge of prerequisites) {
    const parent = await getTokenById(db, edge.requires_id);
    if (!parent) {
      checks.push({
        code: "invalid_prerequisite_edge",
        blocking: true,
        message: `Prerequisite token does not exist: ${edge.requires_id}`,
      });
    }
  }

  const blocking = checks.filter((check) => check.blocking);
  return {
    tokenId: token.id,
    editorialState: token.editorial_state,
    checks,
    blocking,
    ready: blocking.length === 0,
  };
}

export async function assertReadyToPublish(
  db: Database,
  tokenId: string,
  changes?: PublicationFieldChanges,
): Promise<PublicationReview> {
  const review = await evaluatePublicationReadiness(db, tokenId, changes);
  if (!review.ready) {
    throw new Error(
      `Cannot publish: ${review.blocking.map((check) => check.message).join(" ")}`,
    );
  }
  return review;
}

export function assertFieldsReadyToPublish(fields: PublicationFields): void {
  const blocking = structuralPublicationChecks(fields).filter(
    (check) => check.blocking,
  );
  if (blocking.length > 0) {
    throw new Error(
      `Cannot publish: ${blocking.map((check) => check.message).join(" ")}`,
    );
  }
}
