/**
 * Start personas (ADR 2026-07-24 §2) — the only branching variable in
 * first-run onboarding. The same product serves different learning economies,
 * and what differs per persona is the *default import path*, not the
 * scheduler or the UI. Kept as a descriptor list, not a switch: adding a
 * fifth persona is a new row (plus its i18n copy), never wizard control-flow.
 *
 * A persona selects defaults, it locks nothing — every import path stays
 * reachable for every persona. Its only lasting data-model side effect is
 * seeding a matching knowledge context (ADR 2026-07-04) if absent.
 */

import type { Database } from "../db/types.js";
import {
  createKnowledgeContext,
  getKnowledgeContextByName,
  type KnowledgeContext,
} from "./knowledge-context.js";

export type PersonaId = "school" | "study" | "work" | "private";

/** Default content path on onboarding page 6 (wired in plan Phase 8). */
export type PersonaImportPath =
  | "curriculum"
  | "free-import"
  | "okf-import"
  | "goal-import";

export interface PersonaDescriptor {
  id: PersonaId;
  /** Desktop i18n key for the persona card label. */
  labelKey: string;
  /** Desktop i18n key for the card's one-line "why this matters". */
  descriptionKey: string;
  /** Desktop i18n key for the seeded knowledge context's human label. */
  contextLabelKey: string;
  /** `contexts.name` row seeded on selection (ADR 2026-07-04). */
  knowledgeContextSlug: string;
  defaultImportPath: PersonaImportPath;
}

export const PERSONA_DESCRIPTORS: readonly PersonaDescriptor[] = [
  {
    id: "school",
    labelKey: "onboarding_persona_school_label",
    descriptionKey: "onboarding_persona_school_why",
    contextLabelKey: "onboarding_persona_school_context",
    knowledgeContextSlug: "school",
    defaultImportPath: "curriculum",
  },
  {
    id: "study",
    labelKey: "onboarding_persona_study_label",
    descriptionKey: "onboarding_persona_study_why",
    contextLabelKey: "onboarding_persona_study_context",
    knowledgeContextSlug: "study",
    defaultImportPath: "free-import",
  },
  {
    id: "work",
    labelKey: "onboarding_persona_work_label",
    descriptionKey: "onboarding_persona_work_why",
    contextLabelKey: "onboarding_persona_work_context",
    knowledgeContextSlug: "work",
    defaultImportPath: "okf-import",
  },
  {
    id: "private",
    labelKey: "onboarding_persona_private_label",
    descriptionKey: "onboarding_persona_private_why",
    contextLabelKey: "onboarding_persona_private_context",
    knowledgeContextSlug: "private",
    defaultImportPath: "goal-import",
  },
];

/** ADR open question 4, resolved in the plan: skipping yields "free learner". */
export const DEFAULT_PERSONA_ID: PersonaId = "private";

export function isPersonaId(value: string): value is PersonaId {
  return PERSONA_DESCRIPTORS.some((persona) => persona.id === value);
}

export function getPersonaDescriptor(id: PersonaId): PersonaDescriptor {
  const descriptor = PERSONA_DESCRIPTORS.find((persona) => persona.id === id);
  if (!descriptor) throw new Error(`Unknown persona: ${id}`);
  return descriptor;
}

export interface PersonaContextSeedResult {
  context: KnowledgeContext;
  created: boolean;
}

/**
 * Seed the persona's knowledge context if absent. Idempotent by name: an
 * existing context with the persona's slug is returned untouched (its label
 * may have been edited by the user and must not be overwritten), so re-running
 * onboarding or clicking through personas never duplicates or resets contexts.
 */
export async function seedPersonaKnowledgeContext(
  db: Database,
  personaId: PersonaId,
  contextLabel?: string,
): Promise<PersonaContextSeedResult> {
  const descriptor = getPersonaDescriptor(personaId);
  const existing = await getKnowledgeContextByName(
    db,
    descriptor.knowledgeContextSlug,
  );
  if (existing) return { context: existing, created: false };
  const context = await createKnowledgeContext(db, {
    name: descriptor.knowledgeContextSlug,
    label: contextLabel?.trim() || null,
  });
  return { context, created: true };
}
