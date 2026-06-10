/**
 * Agent skills: task recipes the agent learns from user guidance.
 *
 * When the agent cannot execute a step, it admits it, asks for guidance,
 * and saves the successful approach here. Skills are linked to tokens so
 * FSRS decay naturally resurfaces them for review — automation ≠ retention.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";

// ── Types ────────────────────────────────────────────────────────────────────

export type SkillSource = "learned" | "builtin";

export interface AgentSkill {
  id: string;
  slug: string;
  description: string;
  steps: string[]; // parsed from JSON
  token_slugs: string[]; // parsed from JSON
  source: SkillSource;
  created_at: string;
  updated_at: string;
}

/** Raw DB row — steps and token_slugs are stored as JSON strings */
interface AgentSkillRow {
  id: string;
  slug: string;
  description: string;
  steps: string;
  token_slugs: string;
  source: SkillSource;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentSkillInput {
  slug: string;
  description: string;
  steps: string[];
  token_slugs?: string[];
  source?: SkillSource;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseRow(row: AgentSkillRow): AgentSkill {
  return {
    ...row,
    steps: JSON.parse(row.steps) as string[],
    token_slugs: JSON.parse(row.token_slugs) as string[],
  };
}

// ── Functions ────────────────────────────────────────────────────────────────

export async function createAgentSkill(
  db: Database,
  input: CreateAgentSkillInput,
): Promise<AgentSkill> {
  const existing = (await db
    .prepare("SELECT * FROM agent_skills WHERE slug = ?")
    .get(input.slug)) as AgentSkillRow | undefined;

  if (existing) {
    throw new Error(`Agent skill already exists: ${input.slug}`);
  }

  const id = ulid();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO agent_skills (id, slug, description, steps, token_slugs, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.slug,
      input.description,
      JSON.stringify(input.steps),
      JSON.stringify(input.token_slugs ?? []),
      input.source ?? "learned",
      now,
      now,
    );

  return parseRow(
    (await db
      .prepare("SELECT * FROM agent_skills WHERE id = ?")
      .get(id)) as AgentSkillRow,
  );
}

export async function getAgentSkill(
  db: Database,
  slug: string,
): Promise<AgentSkill | undefined> {
  const row = (await db
    .prepare("SELECT * FROM agent_skills WHERE slug = ?")
    .get(slug)) as AgentSkillRow | undefined;

  return row ? parseRow(row) : undefined;
}

export async function listAgentSkills(db: Database): Promise<AgentSkill[]> {
  const rows = (await db
    .prepare("SELECT * FROM agent_skills ORDER BY created_at ASC")
    .all()) as AgentSkillRow[];

  return rows.map(parseRow);
}
