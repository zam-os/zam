import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getReview } from "../../src/cli/bridge-handlers.js";
import {
  admitPresentation,
  type Database,
  installKvtTile,
  nextPracticeCard,
  openDatabase,
  readAtlas,
  regionTokenIds,
  setSetting,
  updateCard,
  WELTWISSEN_LENS,
} from "../../src/kernel/index.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";
import { materialiseKvtCards } from "../../src/kernel/library/kvt-attach.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const REGION = "natur.physik.optik";

interface CardInfo {
  id: string;
  tokenId: string;
  atomId: string;
}

/**
 * A region review shows only what the queue would serve, and a small region
 * with nothing due can be gone through again, one card at a time (ADR
 * 2026-10-13, Decision 10).
 */
describe("atlas region review: due count and going through again", () => {
  let dir: string;
  let db: Database;
  let cards: CardInfo[];
  let tokenIds: string[];

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-atlas-practice-"));
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "user.id", "thomas");
    await setSetting(db, "system.timezone", "UTC");
    const tile = listBundledTiles().find((t) =>
      t.atoms.some((a) => a.domain.startsWith("physik/optik")),
    );
    if (!tile) throw new Error("no bundled optics tile");
    await installKvtTile(db, tile);
    await materialiseKvtCards(
      db,
      "thomas",
      tile.atoms.map((a) => a.id),
    );
    tokenIds = await regionTokenIds(db, WELTWISSEN_LENS, REGION);
    cards = (
      (await db
        .prepare(
          `SELECT c.id, c.token_id, t.atom_id FROM cards c
             JOIN tokens t ON t.id = c.token_id
            WHERE c.user_id = ? AND t.atom_id IS NOT NULL
            ORDER BY c.id`,
        )
        .all("thomas")) as Array<{
        id: string;
        token_id: string;
        atom_id: string;
      }>
    )
      .filter((row) => tokenIds.includes(row.token_id))
      .map((row) => ({
        id: row.id,
        tokenId: row.token_id,
        atomId: row.atom_id,
      }));
    expect(cards.length).toBeGreaterThan(2);
  });

  afterEach(async () => {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  /** Every card practised; `dueIn` decides when each is due (negative = due). */
  async function practise(dueIn: (index: number) => number): Promise<void> {
    const now = Date.now();
    for (const [index, card] of cards.entries()) {
      await updateCard(db, card.id, {
        state: "review",
        stability: 20,
        due_at: new Date(now + dueIn(index)).toISOString(),
        last_review_at: new Date(now - 10 * DAY_MS).toISOString(),
      });
    }
  }

  async function view() {
    return readAtlas(db, {
      userId: "thomas",
      lens: WELTWISSEN_LENS,
      timeZone: "UTC",
    });
  }

  it("counts one item per atom and day, as the queue serves them", async () => {
    await practise(() => -DAY_MS);
    const before = await view();
    const atomUnits = before.units.filter((u) => u.key.startsWith("atom:"));
    expect(atomUnits.length).toBeGreaterThan(0);
    for (const unit of atomUnits) expect(unit.due).toBe(1);
    expect(before.own.dueByRegion[REGION]).toBe(atomUnits.length);

    // One item of an atom answered today: its siblings wait for tomorrow,
    // although they are still due.
    const first = cards[0];
    await admitPresentation(db, {
      userId: "thomas",
      cardId: first.id,
      timeZone: "UTC",
    });
    await updateCard(db, first.id, {
      due_at: new Date(Date.now() + 5 * DAY_MS).toISOString(),
      last_review_at: new Date().toISOString(),
    });
    const after = await view();
    const unit = after.units.find((u) => u.key === `atom:${first.atomId}`);
    expect(unit?.due).toBe(0);
    const siblings = cards.filter(
      (c) => c.atomId === first.atomId && c.id !== first.id,
    );
    if (siblings.length > 0) expect(unit?.condition).not.toBe("known");
    expect(after.own.dueByRegion[REGION]).toBe(atomUnits.length - 1);
  });

  it("does not count a card waiting for its short step, or a blocked one", async () => {
    await practise(() => 5 * DAY_MS);
    const [waiting, blocked] = cards;
    await updateCard(db, waiting.id, {
      state: "relearning",
      due_at: new Date(Date.now() + 10 * MINUTE_MS).toISOString(),
    });
    await updateCard(db, blocked.id, {
      due_at: new Date(Date.now() - DAY_MS).toISOString(),
      blocked: 1,
    });
    const atlas = await view();
    const waitingUnit = atlas.units.find(
      (u) => u.key === `atom:${waiting.atomId}`,
    );
    // Its condition says due, but a review would show nothing yet.
    expect(waitingUnit?.condition).toBe("due");
    expect(waitingUnit?.due).toBe(0);
    expect(atlas.own.dueByRegion[REGION] ?? 0).toBe(0);
    const empty = await getReview(db, {
      user: "thomas",
      tokenIds,
      timeZone: "UTC",
      noDynamicQuestion: true,
      noResolve: true,
    });
    expect(empty.hasReview).toBe(false);
  });

  it("goes through a region with nothing due, earliest due first, one card at a time", async () => {
    // Nothing due; the last card is due soonest.
    await practise((index) => (cards.length - index) * DAY_MS);
    const ask = (since: Date) =>
      getReview(db, {
        user: "thomas",
        tokenIds,
        timeZone: "UTC",
        noDynamicQuestion: true,
        noResolve: true,
        practiceSince: since,
      });
    const plain = await getReview(db, {
      user: "thomas",
      tokenIds,
      timeZone: "UTC",
      noDynamicQuestion: true,
      noResolve: true,
    });
    expect(plain.hasReview).toBe(false);

    const since = new Date();
    const first = await ask(since);
    expect(first.hasReview).toBe(true);
    const soonest = cards[cards.length - 1];
    expect(first.card?.cardId).toBe(soonest.id);

    // Only that card was pulled forward.
    const dueNow = (await db
      .prepare(
        `SELECT id FROM cards WHERE user_id = ? AND due_at <= ? AND state <> 'new'`,
      )
      .all("thomas", new Date().toISOString())) as Array<{ id: string }>;
    expect(dueNow.map((row) => row.id)).toEqual([soonest.id]);

    // Answered: it does not come again, and neither does its atom's sibling.
    await admitPresentation(db, {
      userId: "thomas",
      cardId: soonest.id,
      timeZone: "UTC",
    });
    await updateCard(db, soonest.id, {
      due_at: new Date(Date.now() + 9 * DAY_MS).toISOString(),
      last_review_at: new Date(Date.now() + 1000).toISOString(),
    });
    const second = await ask(since);
    expect(second.hasReview).toBe(true);
    expect(second.card?.cardId).not.toBe(soonest.id);
    const secondCard = cards.find((c) => c.id === second.card?.cardId);
    expect(secondCard?.atomId).not.toBe(soonest.atomId);
  });

  it("never offers a new card or one answered since the run began", async () => {
    await practise(() => 3 * DAY_MS);
    const [fresh, ...rest] = cards;
    await updateCard(db, fresh.id, {
      state: "new",
      last_review_at: null,
    });
    const since = new Date(Date.now() + 60 * 1000);
    for (const card of rest) {
      await updateCard(db, card.id, {
        last_review_at: new Date(since.getTime() + 1000).toISOString(),
      });
    }
    expect(
      await nextPracticeCard(db, "thomas", tokenIds, {
        since,
        timeZone: "UTC",
      }),
    ).toBeNull();
    expect(
      await nextPracticeCard(db, "thomas", [], { since, timeZone: "UTC" }),
    ).toBeNull();
  });
});
