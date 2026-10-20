import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installScopeCells } from "../../src/cli/atlas.js";
import { setLastCurriculumSelection } from "../../src/cli/curriculum/breadcrumb.js";
import {
  buildReviewQueue,
  type Database,
  ensureCard,
  evaluateRating,
  getBundledCellTile,
  getCard,
  getTokenById,
  installKvtTile,
  type KvtTile,
  materialiseKvtCards,
  openDatabase,
} from "../../src/kernel/index.js";
import legacyAtombau from "../fixtures/legacy/de-by-realschule-9-chemie-atombau-pse-kvt.json" with {
  type: "json",
};
import legacyBindung from "../fixtures/legacy/de-by-realschule-9-chemie-chemische-bindung-kvt.json" with {
  type: "json",
};
import legacyDatenbanken from "../fixtures/legacy/de-by-realschule-9-informatik-datenbanken-sql-kvt.json" with {
  type: "json",
};

type EvidenceRow = { id: string; token_id: string } & Record<string, unknown>;
async function evidence(db: Database) {
  return {
    cards: (await db
      .prepare("SELECT * FROM cards ORDER BY id")
      .all()) as EvidenceRow[],
    reviews: (await db
      .prepare("SELECT * FROM review_logs ORDER BY id")
      .all()) as EvidenceRow[],
  };
}

/**
 * *Neue Inhalte zeigen* installs the cells of the learner's year (ADR
 * 2026-10-13 Decision 1). Installing a cell applies its `replaces`, so a
 * learner who still holds the de-by database cards gets them moved to
 * zam-academy:sql without enrolling in it (ADR 2026-08-14 Decision 9).
 */
describe("installing the cells of the learner's year", () => {
  let tempDir: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-atlas-scope-cells-"));
    db = await openDatabase({
      dbPath: join(tempDir, "test.db"),
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true, maxRetries: 10 });
  });

  it("installs nothing without a known position", async () => {
    expect(await installScopeCells(db)).toEqual([]);
  });

  it("installs the SQL cell at Realschule 9 and moves a de-by holder's cards, enrolling nobody", async () => {
    const legacy = legacyDatenbanken as unknown as KvtTile;
    await installKvtTile(db, legacy);
    await materialiseKvtCards(
      db,
      "learner",
      legacy.atoms.map((atom) => atom.id),
    );
    const whereId = "01K4D9B0000000000000000J05";
    const held = await getCard(db, whereId, "learner");
    expect(held).toBeTruthy();

    // The position as the wizard stores it: the manifest's subject id `it`.
    await setLastCurriculumSelection(db, {
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: "9",
      subject: "it",
    });
    const installed = await installScopeCells(db);
    expect(installed).toContain("zam-academy:sql");

    const successor = getBundledCellTile("zam-academy:sql")
      ?.atoms.flatMap((atom) => atom.practice_items)
      .find((item) => item.replaces?.includes(whereId));
    expect(successor).toBeDefined();
    const moved = await getCard(db, successor!.id, "learner");
    expect(moved?.id).toBe(held!.id);
    expect(await getCard(db, whereId, "learner")).toBeFalsy();
    expect((await getTokenById(db, whereId))?.deprecated_at).toBeTruthy();

    // Installing enrols nobody: the learner holds only the eight moved cards.
    const academy = (await db
      .prepare(
        `SELECT COUNT(*) AS n FROM cards
          WHERE user_id = 'learner' AND token_id LIKE '01K8ACADSQ%'`,
      )
      .get()) as { n: number };
    expect(academy.n).toBe(8);
  });

  it.each(["wpfg1", "wpfg2-3"])(
    "upgrades Chemie 9 from the wizard's %s position, preserving every review and enrolling nobody",
    async (track) => {
      const learner = "chemie-history-learner";
      const legacy = [legacyAtombau, legacyBindung] as unknown as KvtTile[];
      const ids = legacy.flatMap((tile) =>
        tile.atoms.flatMap((atom) =>
          atom.practice_items.map((item) => item.id),
        ),
      );
      for (const tile of legacy) await installKvtTile(db, tile);
      for (const [index, tokenId] of ids.entries()) {
        const card = await ensureCard(db, tokenId, learner);
        const now = new Date("2026-10-01T10:00:00.000Z");
        await evaluateRating(db, {
          cardId: card.id,
          tokenId,
          userId: learner,
          rating: index % 3 === 0 ? 1 : 3,
          answerFormat: "recall",
          responseTimeMs: 1000 + index * 300,
          now,
        });
        await evaluateRating(db, {
          cardId: card.id,
          tokenId,
          userId: learner,
          rating: index % 2 === 0 ? 3 : 4,
          answerFormat: "recall",
          responseTimeMs: 1600 + index * 200,
          now: new Date(now.getTime() + (index + 1) * 86_400_000),
        });
      }
      const before = await evidence(db);
      expect(before.cards).toHaveLength(16);
      expect(before.reviews).toHaveLength(32);
      const academy = getBundledCellTile("zam-academy:chemie-realschule-9")!;
      const successors = new Map(
        academy.atoms.flatMap((atom) =>
          atom.practice_items.flatMap((item) =>
            (item.replaces ?? []).map((old) => [old, item.id] as const),
          ),
        ),
      );
      expect(successors.size).toBe(11);
      const retiredIds = academy.retired_items!.map((item) => item.id);
      expect(retiredIds).toHaveLength(5);
      const queueOptions = {
        userId: learner,
        tokenIds: retiredIds,
        maxNew: 0,
        maxReviews: 100,
        now: new Date(
          Math.max(
            ...before.cards.map((card) => Date.parse(String(card.due_at))),
          ) + 86_400_000,
        ),
        buryNewSiblings: false,
        buryReviewSiblings: false,
      };
      // These cards really were reviewable before the update, so an empty
      // queue afterwards proves the retirement, not an unrelated filter.
      expect(
        (await buildReviewQueue(db, queueOptions)).items
          .map((item) => item.tokenId)
          .sort(),
      ).toEqual([...retiredIds].sort());

      await setLastCurriculumSelection(db, {
        providerId: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: "9",
        subject: "chemie",
        track,
      });
      expect(await installScopeCells(db)).toContain(academy.tile_id);
      const after = await evidence(db);
      expect(after.cards).toHaveLength(16);
      expect(after.reviews).toHaveLength(32);
      for (const card of before.cards)
        expect(after.cards.find((row) => row.id === card.id)).toEqual({
          ...card,
          token_id: successors.get(card.token_id) ?? card.token_id,
        });
      for (const review of before.reviews)
        expect(after.reviews.find((row) => row.id === review.id)).toEqual({
          ...review,
          token_id: successors.get(review.token_id) ?? review.token_id,
        });
      for (const id of ids)
        expect((await getTokenById(db, id))?.deprecated_at).toBeTruthy();
      expect((await buildReviewQueue(db, queueOptions)).items).toEqual([]);
      for (const id of retiredIds) {
        expect(await getCard(db, id, learner)).toBeTruthy();
        expect(successors.has(id)).toBe(false);
      }
      expect(await installScopeCells(db)).not.toContain(academy.tile_id);
      expect(await evidence(db)).toEqual(after);
    },
  );
});
