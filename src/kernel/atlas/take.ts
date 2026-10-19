/**
 * Taking content in (ADR 2026-10-13, Decision 1): with *Neue Inhalte zeigen*
 * the map sketches installed units the learner holds no card for. *Aufnehmen*
 * makes them the learner's, through the paths that already exist: the cell
 * enrol's `materialiseKvtCards` for published units, a card for an own one.
 *
 * Only on the learner's click, never automatically. A unit the learner
 * declined (all cards detached) stays declined, and a published unit a
 * variant stands in for is not taken (Decision 12).
 */

import type { Database } from "../db/types.js";
import { materialiseKvtCards } from "../library/kvt-attach.js";
import { ensureCard, getCard } from "../models/card.js";
import type { UnitKey } from "./types.js";
import { effectiveVariants } from "./variants.js";

export interface TakeResult {
  cardsCreated: number;
  /** Units that had a card already, were declined, or are stood in for. */
  skipped: number;
}

export async function takeUnits(
  db: Database,
  userId: string,
  unitKeys: readonly UnitKey[],
): Promise<TakeResult> {
  if (!userId.trim()) throw new Error("userId is required");
  const replaced = new Set((await effectiveVariants(db, userId)).keys());
  const atomIds: string[] = [];
  const tokenIds: string[] = [];
  let skipped = 0;
  for (const key of new Set(unitKeys)) {
    const match = /^(atom|token):(.+)$/.exec(key);
    if (!match) throw new Error(`Not a unit key: ${key}`);
    if (replaced.has(key)) {
      skipped++;
      continue;
    }
    const held = (await db
      .prepare(
        match[1] === "atom"
          ? `SELECT COUNT(*) AS n FROM cards c JOIN tokens t ON t.id = c.token_id
              WHERE c.user_id = ? AND t.atom_id = ?`
          : "SELECT COUNT(*) AS n FROM cards WHERE user_id = ? AND token_id = ?",
      )
      .get(userId, match[2])) as { n: number | string };
    // Held or declined: either way, not in reach.
    if (Number(held.n) > 0) {
      skipped++;
      continue;
    }
    if (match[1] === "atom") atomIds.push(match[2]);
    else tokenIds.push(match[2]);
  }

  let cardsCreated = 0;
  if (atomIds.length > 0) {
    cardsCreated += (await materialiseKvtCards(db, userId, atomIds))
      .cardsCreated;
  }
  if (tokenIds.length > 0) {
    cardsCreated += await db.transaction(async (tx) => {
      let created = 0;
      for (const tokenId of tokenIds) {
        const token = (await tx
          .prepare(
            `SELECT id FROM tokens
              WHERE id = ? AND deprecated_at IS NULL AND atom_id IS NULL`,
          )
          .get(tokenId)) as { id: string } | undefined;
        if (!token || (await getCard(tx, tokenId, userId))) continue;
        await ensureCard(tx, tokenId, userId);
        created++;
      }
      return created;
    });
  }
  return { cardsCreated, skipped };
}
