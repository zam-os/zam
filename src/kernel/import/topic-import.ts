/**
 * The topic import (ADR 2026-10-14, Decision 1): a topic in the learner's
 * own words, with its context, from which the model proposes subtopics and
 * cards.
 *
 * It writes no file. Like a material import (ADR 2026-10-05, Decision 9),
 * one source row records it: keyed `zam-topic:<ULID>`, with the topic's
 * title, the date and the learner, and nothing of the context. Every card
 * links to that row through `token_sources`. The cards cite no source of
 * their knowledge (Decision 3).
 */

import { ulid } from "ulid";
import { nowIso } from "../db/sql.js";
import type { Database } from "../db/types.js";

export const TOPIC_SOURCE_PREFIX = "zam-topic:";

/** A topic's name is a short line, not a description. */
export const MAX_TOPIC_TITLE = 200;

export interface TopicImportRecord {
  sourceId: string;
  /** `zam-topic:<ULID>`. */
  uri: string;
  title: string;
}

/**
 * A topic's name as stored: one line, trimmed. Checked before the first
 * model call, so a name that is too long never costs the learner a proposal.
 */
export function normalizeTopicTitle(raw: string): string {
  const title = raw.replace(/\s+/g, " ").trim();
  if (!title) throw new Error("A topic import needs the topic's name.");
  if (title.length > MAX_TOPIC_TITLE) {
    throw new Error(
      `A topic's name holds at most ${MAX_TOPIC_TITLE} characters; say the rest in its context.`,
    );
  }
  return title;
}

/** Whether a source row records a topic import (`zam-topic:<ULID>`). */
export async function isTopicImportSource(
  db: Database,
  sourceId: string,
): Promise<boolean> {
  const row = (await db
    .prepare("SELECT uri FROM sources WHERE id = ?")
    .get(sourceId)) as { uri: string | null } | undefined;
  return row?.uri?.startsWith(TOPIC_SOURCE_PREFIX) === true;
}

/** Record a topic import as its source row. */
export async function recordTopicImport(
  db: Database,
  input: { title: string; userId: string; now?: Date },
): Promise<TopicImportRecord> {
  const title = normalizeTopicTitle(input.title);
  const sourceId = ulid();
  const uri = `${TOPIC_SOURCE_PREFIX}${ulid()}`;
  // `file` like a material import's row: the schema's source types predate
  // imports that store nothing of their material.
  await db
    .prepare(
      `INSERT INTO sources (id, type, uri, content, created_at, title, fingerprints, imported_by)
       VALUES (?, 'file', ?, NULL, ?, ?, NULL, ?)`,
    )
    .run(sourceId, uri, nowIso(input.now), title, input.userId);
  return { sourceId, uri, title };
}
