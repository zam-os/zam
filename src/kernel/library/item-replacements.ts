import type { Database } from "../db/types.js";
import { getCard } from "../models/card.js";
import { lockLearnerRatings } from "../scheduler/blocker.js";

interface Successor {
  new_item_id: string;
  active: boolean;
}

function finalSuccessor(
  successors: ReadonlyMap<string, Successor[]>,
  itemId: string,
): string | null {
  const seen = new Set<string>();
  let current = itemId;
  while (!seen.has(current)) {
    seen.add(current);
    const next = successors.get(current);
    if (next?.length !== 1) return null;
    const [successor] = next;
    if (successor.active) return successor.new_item_id;
    current = successor.new_item_id;
  }
  return null;
}

/**
 * A curator records the succession in shared knowledge. On PostgreSQL, the
 * learner moves their own card and logs under the ordinary row policies when
 * they next review or enrol. Ambiguous chains and card merges keep all evidence.
 */
export async function applyPendingItemReplacements(
  db: Database,
  userId: string,
): Promise<void> {
  if (db.dialect !== "postgres") return;
  const pending = db.prepare(
    `SELECT c.id, c.token_id FROM cards c
     JOIN tokens t ON t.id = c.token_id
     WHERE c.user_id = ? AND t.deprecated_at IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM practice_item_replacements p WHERE p.old_item_id = c.token_id
       )`,
  );
  if (!(await pending.get(userId))) return;
  await db.transaction(async (tx) => {
    await lockLearnerRatings(tx, userId);
    const rows = (await tx
      .prepare(
        `WITH RECURSIVE succession(old_item_id, new_item_id) AS (
           SELECT p.old_item_id, p.new_item_id
             FROM practice_item_replacements p
             JOIN cards c ON c.token_id = p.old_item_id
             JOIN tokens t ON t.id = p.old_item_id
            WHERE c.user_id = ? AND t.deprecated_at IS NOT NULL
           UNION
           SELECT p.old_item_id, p.new_item_id
             FROM succession s
             JOIN practice_item_replacements p ON p.old_item_id = s.new_item_id
             JOIN tokens t ON t.id = p.old_item_id
            WHERE t.deprecated_at IS NOT NULL
         )
         SELECT s.old_item_id, s.new_item_id, c.id AS card_id,
                COALESCE(t.editorial_state = 'published' AND t.deprecated_at IS NULL, false) AS active
           FROM succession s
           LEFT JOIN tokens t ON t.id = s.new_item_id
           LEFT JOIN cards c ON c.token_id = s.old_item_id AND c.user_id = ?`,
      )
      .all(userId, userId)) as Array<
      Successor & { old_item_id: string; card_id: string | null }
    >;
    const successors = new Map<string, Successor[]>();
    const cards = new Map<string, string>();
    for (const row of rows) {
      const targets = successors.get(row.old_item_id) ?? [];
      targets.push(row);
      successors.set(row.old_item_id, targets);
      if (row.card_id) cards.set(row.old_item_id, row.card_id);
    }

    const moves = new Map<string, Array<{ itemId: string; cardId: string }>>();
    for (const [itemId, cardId] of cards) {
      const target = finalSuccessor(successors, itemId);
      if (!target) continue;
      const sources = moves.get(target) ?? [];
      sources.push({ itemId, cardId });
      moves.set(target, sources);
    }
    for (const [target, sources] of moves) {
      if (sources.length !== 1 || (await getCard(tx, target, userId))) continue;
      const [card] = sources;
      await tx
        .prepare("UPDATE cards SET token_id = ? WHERE id = ? AND user_id = ?")
        .run(target, card.cardId, userId);
      await tx
        .prepare(
          `UPDATE review_logs SET token_id = ?
            WHERE card_id = ? AND user_id = ? AND token_id = ?`,
        )
        .run(target, card.cardId, userId, card.itemId);
    }
  });
}
