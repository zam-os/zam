/**
 * Types for the committed repository knowledge map.
 *
 * Implements the data model from ADR 2026-10-03 (Repo Knowledge Map).
 */

export const KNOWLEDGE_MAP_RELATION_KINDS = [
  "elaborates",
  "requires",
  "leads_to",
  "because",
  "instead_of",
  "example",
] as const;

export type KnowledgeMapRelationKind =
  (typeof KNOWLEDGE_MAP_RELATION_KINDS)[number];

export interface KnowledgeMapStatement {
  id: string;
  statement: string;
  sources: string[];
  detail?: string;
}

export interface KnowledgeMapRelation {
  from: string;
  to: string;
  kind: KnowledgeMapRelationKind;
}

export interface KnowledgeMapProbe {
  id: string;
  question: string;
  answers: string[];
}

export interface KnowledgeMap {
  root: string;
  focus_question: string;
  statements: KnowledgeMapStatement[];
  relations: KnowledgeMapRelation[];
  probes?: KnowledgeMapProbe[];
}

export interface KnowledgeMapValidationResult {
  valid: boolean;
  errors: string[];
}
