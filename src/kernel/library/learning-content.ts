/**
 * Tokens a learner has not taken (ADR 2026-10-10, Decision 2).
 *
 * Persönlich is `listPersonalCards` with `publishedOnly`. Unveröffentlicht
 * stays `listTokens` for `draft` and `in_review`. This module is only the
 * middle list: published tokens with no card row for the learner.
 *
 * Grouping uses the library-topic key (`source_link` without the fragment).
 * Tokens with no source link share the group whose key is `""`. The name of
 * that group is empty; the Studio supplies the label. Tokens in maintenance
 * stay in the list — maintenance already keeps them out of the queue.
 */

import type { Database } from "../db/types.js";
import { libraryTopicKey, libraryTopicName } from "./topics.js";

export interface UnchosenGroup {
  /** Library-topic key, or `""` when the token has no source link. */
  key: string;
  /** Empty when `key` is `""`. */
  name: string;
  /** Most frequent domain in the group, if any. */
  domain: string | null;
  itemCount: number;
}

export interface UnchosenMember {
  tokenId: string;
  slug: string;
  title: string;
  concept: string;
  domain: string;
  sourceLink: string | null;
  question: string | null;
  bloomLevel: number;
  maintenanceAt: string | null;
}

interface UnchosenRow {
  id: string;
  slug: string;
  title: string;
  concept: string;
  domain: string;
  source_link: string | null;
  question: string | null;
  bloom_level: number;
  maintenance_at: string | null;
}

const UNCHOSEN_SQL = `
  SELECT t.id, t.slug, t.title, t.concept, t.domain, t.source_link,
         t.question, t.bloom_level, t.maintenance_at
    FROM tokens t
   WHERE t.editorial_state = 'published'
     AND t.deprecated_at IS NULL
     AND NOT EXISTS (
       SELECT 1 FROM cards c
        WHERE c.token_id = t.id AND c.user_id = ?
     )
   ORDER BY t.slug
`;

async function loadUnchosen(
  db: Database,
  userId: string,
): Promise<UnchosenRow[]> {
  return (await db.prepare(UNCHOSEN_SQL).all(userId)) as UnchosenRow[];
}

/** `""` for a token the library-topic key cannot name. */
function groupKey(sourceLink: string | null): string {
  return libraryTopicKey(sourceLink) ?? "";
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

function toMember(row: UnchosenRow): UnchosenMember {
  return {
    tokenId: row.id,
    slug: row.slug,
    title: row.title,
    concept: row.concept,
    domain: row.domain,
    sourceLink: row.source_link,
    question: row.question,
    bloomLevel: row.bloom_level,
    maintenanceAt: row.maintenance_at,
  };
}

/**
 * Published tokens this learner has no card for, grouped by source.
 * Ordered by name, then key.
 */
export async function listUnchosenGroups(
  db: Database,
  userId: string,
): Promise<UnchosenGroup[]> {
  const groups = new Map<string, UnchosenRow[]>();
  for (const row of await loadUnchosen(db, userId)) {
    const key = groupKey(row.source_link);
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const result: UnchosenGroup[] = [];
  for (const [key, rows] of groups) {
    result.push({
      key,
      name: key ? libraryTopicName(key) : "",
      domain: mostFrequentDomain(rows.map((row) => row.domain)),
      itemCount: rows.length,
    });
  }
  return result.sort(
    (a, b) =>
      a.name.localeCompare(b.name, "en") ||
      (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
  );
}

/**
 * The tokens of one unchosen group. An unknown key, including `""` when
 * nothing lacks a source, returns an empty list.
 */
export async function listUnchosenMembers(
  db: Database,
  userId: string,
  key: string,
): Promise<UnchosenMember[]> {
  const rows = await loadUnchosen(db, userId);
  return rows.filter((row) => groupKey(row.source_link) === key).map(toMember);
}
