/**
 * Variants: one goal, one method (ADR 2026-10-13, Decision 12).
 *
 * The school prescribes the method, and one is enough: written addition in
 * one country, a hand calculation system in another. A variant stands in for
 * a published unit on that unit's hex. Choosing it detaches the learner's
 * cards on the published unit, the "Not for me" mechanism (ADR 2026-07-04,
 * Decision 10): nothing is merged, moved or deleted, and undoing the choice
 * re-attaches exactly the cards it detached.
 *
 * A curator may set a variant for the whole library. That never touches a
 * member's cards: they are the member's own learning state, and the member
 * decides.
 */

import type { Database } from "../db/types.js";
import { hasStandingAssignment } from "../models/card.js";
import type { UnitKey } from "./types.js";

export interface VariantChoice {
  userId: string;
  /** The unit that stands in: own or published. */
  variant: UnitKey;
  /** The published unit it stands for. */
  standsFor: UnitKey;
}

export interface EffectiveVariant {
  variant: UnitKey;
  standsFor: UnitKey;
  /** The learner chose it; otherwise the library's curator did. */
  chosen: boolean;
}

function parseKey(key: string): { kind: "atom" | "token"; id: string } {
  const match = /^(atom|token):(.+)$/.exec(key);
  if (!match) throw new Error(`Not a unit key: ${key}`);
  return { kind: match[1] as "atom" | "token", id: match[2] };
}

/** Token ids of a unit: an atom's practice items, or the token itself. */
export async function unitTokenIds(
  db: Database,
  key: UnitKey,
): Promise<string[]> {
  const { kind, id } = parseKey(key);
  const rows = (await db
    .prepare(
      kind === "atom"
        ? "SELECT id FROM tokens WHERE atom_id = ? ORDER BY id"
        : "SELECT id FROM tokens WHERE id = ? AND atom_id IS NULL",
    )
    .all(id)) as Array<{ id: string }>;
  return rows.map((row) => row.id);
}

/** A variant stands for a published unit, and is another unit that exists. */
async function assertPair(
  db: Database,
  variant: UnitKey,
  standsFor: UnitKey,
): Promise<void> {
  if (variant === standsFor) {
    throw new Error(
      "A variant must be another unit than the one it stands for.",
    );
  }
  const target = parseKey(standsFor);
  const published =
    target.kind === "atom" &&
    (await db
      .prepare("SELECT 1 AS found FROM learning_atoms WHERE id = ?")
      .get(target.id)) !== undefined;
  if (!published) {
    throw new Error(
      `${standsFor} is not a published unit; a variant stands in only for published content.`,
    );
  }
  if ((await unitTokenIds(db, variant)).length === 0) {
    throw new Error(`Unit ${variant} does not exist in this library.`);
  }
}

/**
 * The core of {@link chooseVariant}, without a transaction of its own: the
 * material import calls it inside its commit.
 */
export async function chooseVariantIn(
  db: Database,
  choice: VariantChoice,
): Promise<{ detached: number }> {
  const { userId, variant, standsFor } = choice;
  if (!userId.trim()) throw new Error("userId is required");
  await assertPair(db, variant, standsFor);
  const tokenIds = await unitTokenIds(db, standsFor);
  const cards: Array<{ id: string; token_id: string }> = [];
  for (const tokenId of tokenIds) {
    const card = (await db
      .prepare(
        `SELECT id, token_id FROM cards
          WHERE user_id = ? AND token_id = ? AND detached_at IS NULL`,
      )
      .get(userId, tokenId)) as { id: string; token_id: string } | undefined;
    if (!card) continue;
    if (await hasStandingAssignment(db, card.token_id, userId)) {
      throw new Error(
        `Cannot stand in for ${standsFor}: one of its cards is bound by an active assignment.`,
      );
    }
    cards.push(card);
  }
  const now = new Date().toISOString();
  for (const card of cards) {
    await db
      .prepare("UPDATE cards SET detached_at = ? WHERE id = ?")
      .run(now, card.id);
  }
  const previous = (await db
    .prepare(
      `SELECT detached_card_ids FROM learner_variants
        WHERE user_id = ? AND stands_for = ?`,
    )
    .get(userId, standsFor)) as { detached_card_ids: string } | undefined;
  const ids = new Set<string>(
    previous ? (JSON.parse(previous.detached_card_ids) as string[]) : [],
  );
  for (const card of cards) ids.add(card.id);
  await db
    .prepare(
      `INSERT INTO learner_variants (user_id, stands_for, variant_key, detached_card_ids, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (user_id, stands_for) DO UPDATE SET
         variant_key = excluded.variant_key,
         detached_card_ids = excluded.detached_card_ids`,
    )
    .run(userId, standsFor, variant, JSON.stringify([...ids].sort()), now);
  return { detached: cards.length };
}

/** A learner takes a variant: the published unit's cards are detached. */
export async function chooseVariant(
  db: Database,
  choice: VariantChoice,
): Promise<{ detached: number }> {
  return db.transaction((tx) => chooseVariantIn(tx, choice));
}

/** Undo a learner's variant: re-attach exactly the cards it detached. */
export async function undoVariant(
  db: Database,
  input: { userId: string; standsFor: UnitKey },
): Promise<{ reattached: number }> {
  return db.transaction(async (tx) => {
    const row = (await tx
      .prepare(
        `SELECT detached_card_ids FROM learner_variants
          WHERE user_id = ? AND stands_for = ?`,
      )
      .get(input.userId, input.standsFor)) as
      | { detached_card_ids: string }
      | undefined;
    if (!row) return { reattached: 0 };
    let reattached = 0;
    for (const id of JSON.parse(row.detached_card_ids) as string[]) {
      const result = await tx
        .prepare(
          `UPDATE cards SET detached_at = NULL
            WHERE id = ? AND user_id = ? AND detached_at IS NOT NULL`,
        )
        .run(id, input.userId);
      reattached += Number(result.changes ?? 0);
    }
    await tx
      .prepare(
        "DELETE FROM learner_variants WHERE user_id = ? AND stands_for = ?",
      )
      .run(input.userId, input.standsFor);
    return { reattached };
  });
}

/**
 * A curator sets a variant for the library. Members' cards stay as they are:
 * a member who holds the published unit sees a hint and decides.
 */
export async function setLibraryVariant(
  db: Database,
  input: { variant: UnitKey; standsFor: UnitKey; curatorId: string },
): Promise<void> {
  await assertPair(db, input.variant, input.standsFor);
  await db
    .prepare(
      `INSERT INTO unit_variants (stands_for, variant_key, decided_by, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (stands_for) DO UPDATE SET
         variant_key = excluded.variant_key,
         decided_by = excluded.decided_by`,
    )
    .run(
      input.standsFor,
      input.variant,
      input.curatorId,
      new Date().toISOString(),
    );
}

export async function clearLibraryVariant(
  db: Database,
  standsFor: UnitKey,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM unit_variants WHERE stands_for = ?")
    .run(standsFor);
  return Number(result.changes ?? 0) > 0;
}

/** Variant units the library itself sets: settle gives them no land of their own. */
export async function libraryVariantUnits(db: Database): Promise<Set<UnitKey>> {
  const rows = (await db
    .prepare("SELECT variant_key FROM unit_variants")
    .all()) as Array<{ variant_key: string }>;
  return new Set(rows.map((row) => row.variant_key as UnitKey));
}

/**
 * The variants that hold for one learner: their own choices, then the
 * library's for every published unit they have not chosen for themselves.
 */
export async function effectiveVariants(
  db: Database,
  userId: string,
): Promise<Map<UnitKey, EffectiveVariant>> {
  const out = new Map<UnitKey, EffectiveVariant>();
  const own = (await db
    .prepare(
      "SELECT stands_for, variant_key FROM learner_variants WHERE user_id = ?",
    )
    .all(userId)) as Array<{ stands_for: string; variant_key: string }>;
  for (const row of own) {
    out.set(row.stands_for as UnitKey, {
      variant: row.variant_key as UnitKey,
      standsFor: row.stands_for as UnitKey,
      chosen: true,
    });
  }
  const library = (await db
    .prepare("SELECT stands_for, variant_key FROM unit_variants")
    .all()) as Array<{ stands_for: string; variant_key: string }>;
  for (const row of library) {
    if (out.has(row.stands_for as UnitKey)) continue;
    out.set(row.stands_for as UnitKey, {
      variant: row.variant_key as UnitKey,
      standsFor: row.stands_for as UnitKey,
      chosen: false,
    });
  }
  return out;
}
