/**
 * Knowledge Context repository — typed wrappers around the contexts and token_contexts tables.
 *
 * A context represents a first-class facet (e.g. work, school, private) that can have
 * attributes like default generation language.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";

export interface KnowledgeContext {
  id: string;
  name: string;
  label: string | null;
  language: string | null;
  created_at: string;
}

export interface CreateKnowledgeContextInput {
  name: string;
  label?: string | null;
  language?: string | null;
}

export interface UpdateKnowledgeContextInput {
  name?: string;
  label?: string | null;
  language?: string | null;
}

function normalizeContextName(name: string): string {
  const normalized = name.trim();
  if (!normalized) {
    throw new Error("Context name cannot be empty");
  }
  return normalized;
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const normalized = value.trim();
  return normalized || null;
}

/**
 * Create a new knowledge context.
 */
export async function createKnowledgeContext(
  db: Database,
  input: CreateKnowledgeContextInput,
): Promise<KnowledgeContext> {
  const id = ulid();
  const now = new Date().toISOString();
  const name = normalizeContextName(input.name);

  // Check for duplicate name
  const existing = await getKnowledgeContextByName(db, name);
  if (existing) {
    throw new Error(`Knowledge context with name "${name}" already exists`);
  }

  await db
    .prepare(
      `INSERT INTO contexts (id, name, label, language, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      name,
      normalizeOptionalText(input.label),
      normalizeOptionalText(input.language),
      now,
    );

  const context = await getKnowledgeContextById(db, id);
  if (!context) {
    throw new Error(
      `Failed to retrieve newly created knowledge context: ${id}`,
    );
  }
  return context;
}

/**
 * Retrieve a knowledge context by its unique name.
 */
export async function getKnowledgeContextByName(
  db: Database,
  name: string,
): Promise<KnowledgeContext | undefined> {
  const normalized = name.trim();
  if (!normalized) return undefined;
  return (await db
    .prepare("SELECT * FROM contexts WHERE name = ?")
    .get(normalized)) as KnowledgeContext | undefined;
}

/**
 * Retrieve a knowledge context by its ULID.
 */
export async function getKnowledgeContextById(
  db: Database,
  id: string,
): Promise<KnowledgeContext | undefined> {
  return (await db.prepare("SELECT * FROM contexts WHERE id = ?").get(id)) as
    | KnowledgeContext
    | undefined;
}

/**
 * List all knowledge contexts ordered by creation date (oldest first) or name.
 */
export async function listKnowledgeContexts(
  db: Database,
): Promise<KnowledgeContext[]> {
  return (await db
    .prepare("SELECT * FROM contexts ORDER BY name ASC")
    .all()) as KnowledgeContext[];
}

/**
 * Update mutable fields on a knowledge context.
 */
export async function updateKnowledgeContext(
  db: Database,
  id: string,
  updates: UpdateKnowledgeContextInput,
): Promise<KnowledgeContext> {
  const context = await getKnowledgeContextById(db, id);
  if (!context) {
    throw new Error(`Knowledge context not found: ${id}`);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    const name = normalizeContextName(updates.name);
    if (name !== context.name) {
      const existing = await getKnowledgeContextByName(db, name);
      if (existing) {
        throw new Error(`Knowledge context with name "${name}" already exists`);
      }
      fields.push("name = ?");
      values.push(name);
    }
  }

  if (updates.label !== undefined) {
    fields.push("label = ?");
    values.push(normalizeOptionalText(updates.label));
  }

  if (updates.language !== undefined) {
    fields.push("language = ?");
    values.push(normalizeOptionalText(updates.language));
  }

  if (fields.length === 0) {
    return context;
  }

  values.push(id);

  await db
    .prepare(`UPDATE contexts SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);

  return (await getKnowledgeContextById(db, id)) as KnowledgeContext;
}

/**
 * Delete a knowledge context. Cascades deletion of associated token mappings.
 */
export async function deleteKnowledgeContext(
  db: Database,
  id: string,
): Promise<void> {
  await db.prepare("DELETE FROM contexts WHERE id = ?").run(id);
}

/**
 * Assign a token to a knowledge context.
 * Safe to call repeatedly (noop if already assigned).
 */
export async function assignTokenToContext(
  db: Database,
  tokenId: string,
  contextId: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO token_contexts (token_id, context_id)
       VALUES (?, ?)`,
    )
    .run(tokenId, contextId);
}

/**
 * Remove a token from a knowledge context.
 */
export async function unassignTokenFromContext(
  db: Database,
  tokenId: string,
  contextId: string,
): Promise<void> {
  await db
    .prepare("DELETE FROM token_contexts WHERE token_id = ? AND context_id = ?")
    .run(tokenId, contextId);
}

/**
 * List all knowledge contexts assigned to a given token.
 */
export async function listContextsForToken(
  db: Database,
  tokenId: string,
): Promise<KnowledgeContext[]> {
  return (await db
    .prepare(
      `SELECT c.* FROM contexts c
       INNER JOIN token_contexts tc ON tc.context_id = c.id
       WHERE tc.token_id = ?
       ORDER BY c.name ASC`,
    )
    .all(tokenId)) as KnowledgeContext[];
}
