/**
 * Library topics (ADR 2026-10-02, phase 1).
 *
 * A library topic is a derived grouping, never stored: the published tokens
 * that cite the same source, keyed by their `source_link` without its
 * `#fragment`. The OKF import writes the article's resource URL plus an anchor
 * per token, so one article is one topic.
 *
 * Starting a topic creates the learner's own cards and nothing else, so it
 * needs no curator rights on a team library and behaves the same on a
 * personal one. The catalog reports the learner's own numbers only — never
 * how many colleagues learn a topic (ADR 2026-07-04 Decision 11).
 *
 * Not to be confused with `tokens.topic_id`, which carries a curriculum
 * provider's topic code.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";
import { escapeLike } from "../models/token.js";

export interface LibraryTopic {
  /** `source_link` without its fragment — the topic's identity. */
  key: string;
  /** Readable name derived from the key. */
  name: string;
  /** Most frequent domain among the topic's tokens, if any. */
  domain: string | null;
  /** Published tokens in the topic. */
  itemCount: number;
  /** Of those, how many the learner holds an attached card for. */
  heldCount: number;
  /** Of those, how many the learner set aside ("not for me"). */
  setAsideCount: number;
}

export interface StartLibraryTopicResult {
  key: string;
  name: string;
  itemCount: number;
  /** Cards created by this call. */
  created: number;
  /** Attached cards the learner already held. */
  alreadyHeld: number;
  /** Detached cards, left detached — starting a topic is voluntary. */
  setAside: number;
}

interface TopicRow {
  token_id: string;
  source_link: string;
  domain: string;
  card_id: string | null;
  detached_at: string | null;
}

/**
 * The topic key of a source link: everything before the first `#`, compared
 * literally — the rule `getTokensBySourceLinkBase` applies to one article, so
 * the catalog, a start and an OKF re-import agree on an article's members.
 * A trailing slash, another casing or a query string is another key.
 */
export function libraryTopicKey(
  sourceLink: string | null | undefined,
): string | null {
  if (!sourceLink) return null;
  const hash = sourceLink.indexOf("#");
  const key = hash === -1 ? sourceLink : sourceLink.slice(0, hash);
  return key.trim().length > 0 ? key : null;
}

/**
 * A readable name for a topic key: the last path segment of the URL or file
 * path, decoded, without extension, dashes and underscores as spaces.
 * `index` and `readme` name their folder instead. A URL that names its file
 * in a `path` query parameter — an Azure DevOps file link,
 * `…/_git/<repo>?path=/docs/x.md` — is named after that path, not after the
 * repository its URL path ends at.
 */
export function libraryTopicName(key: string): string {
  let segments: string[];
  let host: string | null = null;
  try {
    const url = new URL(key);
    if (url.protocol === "http:" || url.protocol === "https:") {
      host = url.hostname;
      const filePath = url.searchParams.get("path")?.trim();
      segments = (filePath || url.pathname)
        .split("/")
        .filter((s) => s.length > 0);
    } else {
      segments = key.split(/[\\/]+/).filter((s) => s.length > 0);
    }
  } catch {
    segments = key.split(/[\\/]+/).filter((s) => s.length > 0);
  }
  if (segments.length === 0 && host) return capitalise(host);
  let name = "";
  while (segments.length > 0) {
    const segment = humanise(stripExtension(decode(segments.pop() ?? "")));
    if (!segment) continue;
    if (/^(index|readme)$/i.test(segment) && (segments.length > 0 || host))
      continue;
    name = segment;
    break;
  }
  if (!name) return host ? capitalise(host) : key;
  return capitalise(name);
}

// Locale-independent on purpose: the bridge output must not depend on the
// machine's locale (tr-TR would turn "index" into "İndex").
function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function decode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** `.md`, `.html` — but not a version tail like `dotnet-8.0`. */
function stripExtension(segment: string): string {
  return segment.replace(/\.[A-Za-z][A-Za-z0-9]{0,4}$/, "");
}

function humanise(segment: string): string {
  return segment.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Tokens that can belong to a topic — the queue's own eligibility rules. */
const TOPIC_TOKEN_FILTER = `t.source_link IS NOT NULL
          AND t.source_link <> ''
          AND t.deprecated_at IS NULL
          AND t.maintenance_at IS NULL
          AND t.editorial_state = 'published'`;

const TOPIC_ROW_SELECT = `SELECT t.id AS token_id, t.source_link, t.domain,
              c.id AS card_id, c.detached_at
         FROM tokens t
         LEFT JOIN cards c ON c.token_id = t.id AND c.user_id = ?`;

/** Every token that can belong to a topic, with the learner's card if any. */
async function loadTopicRows(
  db: Database,
  userId: string,
): Promise<TopicRow[]> {
  return (await db
    .prepare(`${TOPIC_ROW_SELECT} WHERE ${TOPIC_TOKEN_FILTER} ORDER BY t.id`)
    .all(userId)) as TopicRow[];
}

/** One topic's tokens: `key` itself or `key#<anchor>`, matched literally. */
async function loadTopicMembers(
  db: Database,
  userId: string,
  key: string,
): Promise<TopicRow[]> {
  return (await db
    .prepare(
      `${TOPIC_ROW_SELECT}
        WHERE (t.source_link = ? OR t.source_link LIKE ? || '#%' ESCAPE '\\')
          AND ${TOPIC_TOKEN_FILTER}
        ORDER BY t.id`,
    )
    .all(userId, key, escapeLike(key))) as TopicRow[];
}

function mostFrequentDomain(domains: string[]): string | null {
  const counts = new Map<string, number>();
  for (const domain of domains) {
    if (!domain) continue;
    counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [domain, count] of counts) {
    if (
      count > bestCount ||
      (count === bestCount && best !== null && domain < best)
    ) {
      best = domain;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The library's topics with the learner's own coverage. Topics the learner
 * has not started come first, then by name.
 */
export async function listLibraryTopics(
  db: Database,
  userId: string,
): Promise<LibraryTopic[]> {
  const groups = new Map<string, TopicRow[]>();
  for (const row of await loadTopicRows(db, userId)) {
    const key = libraryTopicKey(row.source_link);
    if (!key) continue;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const topics: LibraryTopic[] = [];
  for (const [key, rows] of groups) {
    topics.push({
      key,
      name: libraryTopicName(key),
      domain: mostFrequentDomain(rows.map((row) => row.domain)),
      itemCount: rows.length,
      heldCount: rows.filter((row) => row.card_id && !row.detached_at).length,
      setAsideCount: rows.filter((row) => row.card_id && row.detached_at)
        .length,
    });
  }

  const started = (topic: LibraryTopic) =>
    topic.heldCount + topic.setAsideCount > 0 ? 1 : 0;
  return topics.sort(
    (a, b) =>
      started(a) - started(b) ||
      a.name.localeCompare(b.name, "en") ||
      (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
  );
}

/**
 * Give the learner a card for every published token of the topic they do not
 * hold yet. Idempotent; a card they set aside stays set aside. Throws for a
 * key that names no topic.
 */
export async function startLibraryTopic(
  db: Database,
  userId: string,
  key: string,
): Promise<StartLibraryTopicResult> {
  const topicKey = libraryTopicKey(key);
  if (!topicKey) throw new Error("A library topic key is required");

  return db.transaction(async (tx) => {
    const members = await loadTopicMembers(tx, userId, topicKey);
    if (members.length === 0) {
      throw new Error(`Library topic not found: ${topicKey}`);
    }

    let created = 0;
    let alreadyHeld = 0;
    let setAside = 0;
    const now = new Date().toISOString();
    for (const row of members) {
      if (row.card_id) {
        if (row.detached_at) setAside++;
        else alreadyHeld++;
        continue;
      }
      // ON CONFLICT: another client of the same learner (a second window,
      // `zam mcp`) may create the card between the read and this insert; on
      // PostgreSQL a plain insert would then abort the whole start.
      const insert = await tx
        .prepare(
          `INSERT INTO cards (id, token_id, user_id, due_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (token_id, user_id) DO NOTHING`,
        )
        .run(ulid(), row.token_id, userId, now);
      if (insert.changes > 0) created++;
      else alreadyHeld++;
    }

    return {
      key: topicKey,
      name: libraryTopicName(topicKey),
      itemCount: members.length,
      created,
      alreadyHeld,
      setAside,
    };
  });
}
