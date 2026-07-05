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

/**
 * Create a new knowledge context.
 */
export async function createKnowledgeContext(
  db: Database,
  input: CreateKnowledgeContextInput,
): Promise<KnowledgeContext> {
  const id = ulid();
  const now = new Date().toISOString();

  // Validate name is not empty
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Context name cannot be empty");
  }

  // Check for duplicate name
  const existing = await getKnowledgeContextByName(db, input.name);
  if (existing) {
    throw new Error(
      `Knowledge context with name "${input.name}" already exists`,
    );
  }

  await db
    .prepare(
      `INSERT INTO contexts (id, name, label, language, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, input.name, input.label ?? null, input.language ?? null, now);

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
  return (await db
    .prepare("SELECT * FROM contexts WHERE name = ?")
    .get(name)) as KnowledgeContext | undefined;
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
    if (!updates.name || updates.name.trim().length === 0) {
      throw new Error("Context name cannot be empty");
    }
    if (updates.name !== context.name) {
      const existing = await getKnowledgeContextByName(db, updates.name);
      if (existing) {
        throw new Error(
          `Knowledge context with name "${updates.name}" already exists`,
        );
      }
      fields.push("name = ?");
      values.push(updates.name);
    }
  }

  if (updates.label !== undefined) {
    fields.push("label = ?");
    values.push(updates.label);
  }

  if (updates.language !== undefined) {
    fields.push("language = ?");
    values.push(updates.language);
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
