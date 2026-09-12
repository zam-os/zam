/**
 * Learning Analytics
 *
 * Progress statistics, competence tracking, and session summaries.
 * Ported from PoC's `stats` command with additions for FSRS and symbiosis modes.
 */

import type { Database } from "../db/types.js";

export interface UserStats {
  userId: string;
  totalTokens: number;
  cardsInDeck: number;
  dueToday: number;
  blocked: number;
  mature: number;
  avgStability: number | null;
  totalSessions: number;
  lastSession: string | null;
}

export interface DomainCompetence {
  domain: string;
  totalCards: number;
  matureCards: number;
  avgStability: number;
  retentionRate: number;
  suggestedMode: "shadowing" | "copilot" | "autonomy";
}

async function q(db: Database, sql: string, ...params: unknown[]) {
  return (await db.prepare(sql).get(...params)) as Record<string, unknown>;
}

async function count(
  db: Database,
  sql: string,
  ...params: unknown[]
): Promise<number> {
  return ((await q(db, sql, ...params)) as { n: number }).n;
}

/**
 * Get overall learning stats for a user (ported from PoC's `stats` command).
 *
 * All aggregates ride one statement: on a remote provider every separate
 * read is a network round trip, and the dashboard bootstrap runs on every
 * start. The per-user card figures are conditional aggregates over the same
 * row set; the token count and the session figures are uncorrelated scalar
 * subqueries, evaluated once. The `dueToday` condition is deliberately the
 * raw scheduling rule (`blocked = 0 AND due_at <= now`), not the review
 * queue's eligibility — the queue applies burial, maintenance and
 * publication filters that must not change this historical count.
 */
export async function getUserStats(
  db: Database,
  userId: string,
): Promise<UserStats> {
  const row = (await q(
    db,
    `SELECT
       (SELECT COUNT(*) FROM tokens) AS totalTokens,
       (SELECT COUNT(*) FROM sessions WHERE user_id = ?) AS totalSessions,
       (SELECT started_at FROM sessions WHERE user_id = ?
         ORDER BY started_at DESC LIMIT 1) AS lastSession,
       COUNT(*) AS cardsInDeck,
       SUM(CASE WHEN blocked = 0 AND due_at <= datetime('now')
                THEN 1 ELSE 0 END) AS dueToday,
       SUM(CASE WHEN blocked = 1 THEN 1 ELSE 0 END) AS blocked,
       SUM(CASE WHEN reps >= 3 AND stability >= 21 THEN 1 ELSE 0 END) AS mature,
       AVG(CASE WHEN reps > 0 THEN stability END) AS avgStability
     FROM cards WHERE user_id = ?`,
    userId,
    userId,
    userId,
  )) as {
    totalTokens: number;
    totalSessions: number;
    lastSession: string | null;
    cardsInDeck: number;
    dueToday: number | null;
    blocked: number | null;
    mature: number | null;
    avgStability: number | null;
  };

  return {
    userId,
    totalTokens: row.totalTokens,
    cardsInDeck: row.cardsInDeck,
    dueToday: row.dueToday ?? 0,
    blocked: row.blocked ?? 0,
    mature: row.mature ?? 0,
    avgStability: row.avgStability
      ? Math.round(row.avgStability * 100) / 100
      : null,
    totalSessions: row.totalSessions,
    lastSession: row.lastSession ?? null,
  };
}

/**
 * Get competence per domain for a user.
 * Used to suggest symbiosis mode transitions.
 */
export async function getDomainCompetence(
  db: Database,
  userId: string,
): Promise<DomainCompetence[]> {
  const domains = (await db
    .prepare(
      `SELECT DISTINCT t.domain FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND t.domain != ''`,
    )
    .all(userId)) as { domain: string }[];

  const competences: DomainCompetence[] = [];
  for (const d of domains) {
    const total = await count(
      db,
      `SELECT COUNT(*) as n FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND t.domain = ?`,
      userId,
      d.domain,
    );

    const mature = await count(
      db,
      `SELECT COUNT(*) as n FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND t.domain = ? AND c.reps >= 3 AND c.stability >= 21`,
      userId,
      d.domain,
    );

    const avgStab =
      (
        (await q(
          db,
          `SELECT AVG(c.stability) as v FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND t.domain = ? AND c.reps > 0`,
          userId,
          d.domain,
        )) as { v: number | null }
      ).v ?? 0;

    // Estimate retention from review history
    const reviews = (await q(
      db,
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN rating >= 2 THEN 1 ELSE 0 END) as passed
       FROM review_logs
       WHERE user_id = ? AND token_id IN (SELECT id FROM tokens WHERE domain = ?)`,
      userId,
      d.domain,
    )) as { total: number; passed: number };

    const retentionRate =
      reviews.total > 0 ? reviews.passed / reviews.total : 0;

    let suggestedMode: DomainCompetence["suggestedMode"];
    if (retentionRate > 0.9 && avgStab > 30) {
      suggestedMode = "autonomy";
    } else if (retentionRate > 0.7 && avgStab > 7) {
      suggestedMode = "copilot";
    } else {
      suggestedMode = "shadowing";
    }

    competences.push({
      domain: d.domain,
      totalCards: total,
      matureCards: mature,
      avgStability: Math.round(avgStab * 100) / 100,
      retentionRate: Math.round(retentionRate * 1000) / 1000,
      suggestedMode,
    });
  }
  return competences;
}
