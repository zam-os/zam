/**
 * Learning Analytics
 *
 * Progress statistics, competence tracking, and session summaries.
 * Ported from PoC's `stats` command with additions for FSRS and symbiosis modes.
 */

import type { Database } from "libsql";

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

function q(db: Database, sql: string, ...params: unknown[]) {
  return db.prepare(sql).get(...params) as Record<string, unknown>;
}

/**
 * Get overall learning stats for a user (ported from PoC's `stats` command).
 */
export function getUserStats(db: Database, userId: string): UserStats {
  return {
    userId,
    totalTokens: (q(db, "SELECT COUNT(*) as n FROM tokens") as { n: number }).n,
    cardsInDeck: (q(db, "SELECT COUNT(*) as n FROM cards WHERE user_id = ?", userId) as { n: number }).n,
    dueToday: (q(
      db,
      "SELECT COUNT(*) as n FROM cards WHERE user_id = ? AND blocked = 0 AND due_at <= datetime('now')",
      userId,
    ) as { n: number }).n,
    blocked: (q(db, "SELECT COUNT(*) as n FROM cards WHERE user_id = ? AND blocked = 1", userId) as { n: number }).n,
    mature: (q(
      db,
      "SELECT COUNT(*) as n FROM cards WHERE user_id = ? AND reps >= 3 AND stability >= 21",
      userId,
    ) as { n: number }).n,
    avgStability: (() => {
      const v = q(db, "SELECT AVG(stability) as v FROM cards WHERE user_id = ? AND reps > 0", userId) as { v: number | null };
      return v.v ? Math.round(v.v * 100) / 100 : null;
    })(),
    totalSessions: (q(db, "SELECT COUNT(*) as n FROM sessions WHERE user_id = ?", userId) as { n: number }).n,
    lastSession: (() => {
      const r = db
        .prepare(
          "SELECT started_at FROM sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 1",
        )
        .get(userId) as { started_at: string } | undefined;
      return r?.started_at ?? null;
    })(),
  };
}

/**
 * Get competence per domain for a user.
 * Used to suggest symbiosis mode transitions.
 */
export function getDomainCompetence(
  db: Database,
  userId: string,
): DomainCompetence[] {
  const domains = db
    .prepare(
      `SELECT DISTINCT t.domain FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND t.domain != ''`,
    )
    .all(userId) as { domain: string }[];

  return domains.map((d) => {
    const total = (q(
      db,
      `SELECT COUNT(*) as n FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND t.domain = ?`,
      userId,
      d.domain,
    ) as { n: number }).n;

    const mature = (q(
      db,
      `SELECT COUNT(*) as n FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND t.domain = ? AND c.reps >= 3 AND c.stability >= 21`,
      userId,
      d.domain,
    ) as { n: number }).n;

    const avgStab = (q(
      db,
      `SELECT AVG(c.stability) as v FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND t.domain = ? AND c.reps > 0`,
      userId,
      d.domain,
    ) as { v: number | null }).v ?? 0;

    // Estimate retention from review history
    const reviews = q(
      db,
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN rating >= 2 THEN 1 ELSE 0 END) as passed
       FROM review_logs
       WHERE user_id = ? AND token_id IN (SELECT id FROM tokens WHERE domain = ?)`,
      userId,
      d.domain,
    ) as { total: number; passed: number };

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

    return {
      domain: d.domain,
      totalCards: total,
      matureCards: mature,
      avgStability: Math.round(avgStab * 100) / 100,
      retentionRate: Math.round(retentionRate * 1000) / 1000,
      suggestedMode,
    };
  });
}
