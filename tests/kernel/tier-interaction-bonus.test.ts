import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  enrolBonusAtomHandler,
  listBonusCandidatesHandler,
} from "../../src/cli/bridge-handlers.js";
import {
  bonusCandidates,
  buildReviewQueue,
  type Database,
  enrolBonusAtom,
  enrolBundledCell,
  getBundledCellTile,
  heldAtomIds,
  installKvtTile,
  openDatabase,
  presentFastCheck,
  TIER1_FIRST_RULE,
} from "../../src/kernel/index.js";

describe("Tier Interaction & Bonus Offer Surface (Phase 5)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-tier-bonus-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  /** Mark an atom as genuinely retrieved, the only way an atom becomes held. */
  async function holdAtom(
    database: Database,
    userId: string,
    atomId: string,
  ): Promise<void> {
    await database
      .prepare(
        `UPDATE cards SET reps = 1, state = 'review', stability = 5
          WHERE user_id = ?
            AND token_id IN (SELECT id FROM tokens WHERE atom_id = ?)`,
      )
      .run(userId, atomId);
  }

  it("surfaces bonus candidates dynamically as prerequisite atoms are mastered", async () => {
    const user = "bonus-explorer";

    // 1. Enrol in Realschule Optik (in-scope: 001, 002, 003)
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    // 2. Install Gymnasium 8 and RS-Erweiterung tiles in the knowledge base (0 cards created)
    await installKvtTile(db, getBundledCellTile("de-by:gymnasium-8-optik")!);
    await installKvtTile(
      db,
      getBundledCellTile("de-by:realschule-optik-erweiterung")!,
    );

    const inScopeAtomIds = [
      "01K3X9A7R4B8C1D2E3F4G5A001",
      "01K3X9A7R4B8C1D2E3F4G5A002",
      "01K3X9A7R4B8C1D2E3F4G5A003",
    ];

    // Initially, no atoms are held (reps = 0)
    let held = await heldAtomIds(db, user);
    expect(held.size).toBe(0);

    let candidates = await bonusCandidates(db, user, { inScopeAtomIds });
    expect(candidates).toHaveLength(0);

    // 3. Learner studies and masters Atom 001 (strahlengang-lot)
    const token001 = (await db
      .prepare(
        "SELECT id FROM tokens WHERE atom_id = '01K3X9A7R4B8C1D2E3F4G5A001' ORDER BY id LIMIT 1",
      )
      .get()) as { id: string };

    const card001 = (await db
      .prepare("SELECT id FROM cards WHERE token_id = ? AND user_id = ?")
      .get(token001.id, user)) as { id: string };

    await db
      .prepare(
        "UPDATE cards SET reps = 1, state = 'review', stability = 5 WHERE id = ?",
      )
      .run(card001.id);

    held = await heldAtomIds(db, user);
    expect(held.has("01K3X9A7R4B8C1D2E3F4G5A001")).toBe(true);

    // Atom 005 (Reflexionsgesetz, which requires 001) is now offerable as a bonus!
    candidates = await bonusCandidates(db, user, { inScopeAtomIds });
    expect(candidates.length).toBeGreaterThanOrEqual(1);

    const cand005 = candidates.find(
      (c) => c.atomId === "01K3X9A7R4B8C1D2E3F4G5A005",
    );
    expect(cand005).toBeDefined();
    expect(cand005?.title).toBe("Reflexionsgesetz");
    expect(cand005?.restsOn).toContain("01K3X9A7R4B8C1D2E3F4G5A001");

    // 4. Learner studies and masters Atom 002 (brechung-qualitativ)
    const token002 = (await db
      .prepare(
        "SELECT id FROM tokens WHERE atom_id = '01K3X9A7R4B8C1D2E3F4G5A002' ORDER BY id LIMIT 1",
      )
      .get()) as { id: string };

    const card002 = (await db
      .prepare("SELECT id FROM cards WHERE token_id = ? AND user_id = ?")
      .get(token002.id, user)) as { id: string };

    await db
      .prepare(
        "UPDATE cards SET reps = 1, state = 'review', stability = 5 WHERE id = ?",
      )
      .run(card002.id);

    // Now Atom 006 (Sammellinse) and Atom 008 (Dispersion) also become offerable!
    candidates = await bonusCandidates(db, user, { inScopeAtomIds });
    const atomIds = candidates.map((c) => c.atomId);
    expect(atomIds).toContain("01K3X9A7R4B8C1D2E3F4G5A005"); // Reflexionsgesetz
    expect(atomIds).toContain("01K3X9A7R4B8C1D2E3F4G5A006"); // Sammellinse
    expect(atomIds).toContain("01K3X9A7R4B8C1D2E3F4G5A008"); // Dispersion
  });

  it("enrols in a bonus atom and creates cards for practice", async () => {
    const user = "bonus-enroller";

    await enrolBundledCell(db, user, "de-by:realschule-optik");
    await installKvtTile(db, getBundledCellTile("de-by:gymnasium-8-optik")!);

    // Reflexionsgesetz rests on Strahlengang/Lot, so that foundation has to be
    // genuinely retrieved first — an offer only exists once it is held.
    await holdAtom(db, user, "01K3X9A7R4B8C1D2E3F4G5A001");

    // Accept bonus atom 005 (Reflexionsgesetz)
    const atom005Id = "01K3X9A7R4B8C1D2E3F4G5A005";
    const result = await enrolBonusAtom(db, user, atom005Id);

    expect(result.success).toBe(true);
    expect(result.atomId).toBe(atom005Id);
    expect(result.cardsCreated).toBeGreaterThanOrEqual(1);

    // Cards are now present in the review queue
    const queue = await buildReviewQueue(db, { userId: user });
    const hasBonusCard = queue.items.some((item) =>
      result.cardIds.includes(item.cardId),
    );
    expect(hasBonusCard).toBe(true);

    // Re-enrolling is idempotent
    const secondResult = await enrolBonusAtom(db, user, atom005Id);
    expect(secondResult.cardsCreated).toBe(0);

    const afterAcceptance = await bonusCandidates(db, user, {
      inScopeAtomIds: [
        "01K3X9A7R4B8C1D2E3F4G5A001",
        "01K3X9A7R4B8C1D2E3F4G5A002",
        "01K3X9A7R4B8C1D2E3F4G5A003",
      ],
    });
    expect(
      afterAcceptance.some((candidate) => candidate.atomId === atom005Id),
    ).toBe(false);
  });

  it("refuses a root atom that has no foundation to justify a bonus offer", async () => {
    const user = "root-bonus-replay";
    await enrolBundledCell(db, user, "de-by:realschule-optik");
    await expect(
      enrolBonusAtom(db, user, "01K3X9A7R4B8C1D2E3F4G5A001"),
    ).rejects.toThrow("rests on no hard prerequisite");
  });

  /**
   * The surface derives the offers, but the enrolment must not trust it. A
   * stale list or a replayed request would otherwise drop the learner into an
   * atom whose foundations they do not hold — the dead end the derivation
   * exists to avoid, arriving through the back door.
   */
  it("refuses a bonus atom whose foundations are not held", async () => {
    const user = "impatient-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");
    await installKvtTile(db, getBundledCellTile("de-by:gymnasium-8-optik")!);

    // Nothing retrieved yet: enrolment alone is not mastery.
    await expect(
      enrolBonusAtom(db, user, "01K3X9A7R4B8C1D2E3F4G5A005"),
    ).rejects.toThrow(/not offerable/);

    const held = await heldAtomIds(db, user);
    expect(held.size).toBe(0);
  });

  it("works seamlessly through bridge handlers", async () => {
    const user = "bridge-bonus-user";

    await enrolBundledCell(db, user, "de-by:realschule-optik");
    await installKvtTile(db, getBundledCellTile("de-by:gymnasium-8-optik")!);

    // Master atom 001
    const token001 = (await db
      .prepare(
        "SELECT id FROM tokens WHERE atom_id = '01K3X9A7R4B8C1D2E3F4G5A001' ORDER BY id LIMIT 1",
      )
      .get()) as { id: string };

    const card001 = (await db
      .prepare("SELECT id FROM cards WHERE token_id = ? AND user_id = ?")
      .get(token001.id, user)) as { id: string };

    await db
      .prepare(
        "UPDATE cards SET reps = 1, state = 'review', stability = 5 WHERE id = ?",
      )
      .run(card001.id);

    // Query bonus candidates via bridge handler
    const listRes = await listBonusCandidatesHandler(db, {
      cellId: "de-by:realschule-optik",
      user,
    });

    expect(listRes.success).toBe(true);
    expect(listRes.candidates.length).toBeGreaterThanOrEqual(1);

    // Enrol via bridge handler
    const enrolRes = await enrolBonusAtomHandler(db, {
      atomId: listRes.candidates[0]!.atomId,
      user,
    });
    expect(enrolRes.success).toBe(true);
    expect(enrolRes.cardsCreated).toBeGreaterThanOrEqual(1);
  });

  it("applies the named tier1-first rule: new Tier 2 stays out while Tier 1 is new", async () => {
    expect(TIER1_FIRST_RULE).toBe("tier1-first");
    const user = "tier-pilot";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const queue = await buildReviewQueue(db, { userId: user, maxNew: 20 });
    const newItems = queue.items.filter((item) => item.state === "new");
    expect(newItems.length).toBeGreaterThan(0);
    expect(newItems.every((item) => item.tier !== "tier2_synthesis")).toBe(
      true,
    );
    expect(newItems.some((item) => item.tier === "tier1_fast")).toBe(true);
    expect(newItems.every((item) => item.atomId)).toBe(true);
    expect(
      newItems
        .filter((item) => item.tier === "tier1_fast")
        .every((item) => item.fastCheck?.type === "binary_choice"),
    ).toBe(true);
  });

  it("does not hide a due Tier 2 review merely because Tier 1 is still new", async () => {
    const user = "tier-due-retention";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const tier2 = (await db
      .prepare(
        `SELECT c.id
           FROM cards c
           JOIN tokens t ON t.id = c.token_id
          WHERE c.user_id = ? AND t.tier = 'tier2_synthesis'
          ORDER BY c.id LIMIT 1`,
      )
      .get(user)) as { id: string };
    await db
      .prepare(
        `UPDATE cards
            SET state = 'review', reps = 1, due_at = '2000-01-01T00:00:00.000Z'
          WHERE id = ?`,
      )
      .run(tier2.id);

    const queue = await buildReviewQueue(db, { userId: user, maxNew: 20 });
    expect(queue.items.some((item) => item.cardId === tier2.id)).toBe(true);
  });

  /**
   * Every fast check authored so far puts the correct answer at index 0. Shown
   * in stored order that is not retrieval practice — the learner reads the
   * position, not the physics, and the rating that follows is evidence of
   * nothing while FSRS schedules on it anyway.
   */
  describe("fast-check presentation", () => {
    it("does not hand the answer to whoever taps first", () => {
      // Asserted over many seeds rather than over one queue: three cards drawn
      // from a binary permutation land on the same side often enough that the
      // queue-level version of this test failed one run in four.
      const stored = {
        type: "binary_choice" as const,
        options: ["richtig", "falsch"],
        correctIndex: 0,
      };
      let first = 0;
      const draws = 400;
      for (let index = 0; index < draws; index++) {
        const shown = presentFastCheck(
          stored,
          `01K3X9A7R4B8C1D2E3F4G5H0${index}:2026-08-15T11:00:00.000Z`,
        );
        expect(shown?.options.slice().sort()).toEqual(
          stored.options.slice().sort(),
        );
        // The correct option is still the correct text, wherever it now sits.
        expect(shown?.options[shown.correctIndex]).toBe("richtig");
        if (shown?.correctIndex === 0) first += 1;
      }
      // Roughly a coin flip, not a habit the learner can tap blind.
      expect(first).toBeGreaterThan(draws * 0.35);
      expect(first).toBeLessThan(draws * 0.65);
    });

    it("keeps one card's options still while it is being answered", async () => {
      const user = "fast-check-learner";
      await enrolBundledCell(db, user, "de-by:realschule-optik");

      const first = await buildReviewQueue(db, { userId: user, maxNew: 50 });
      const second = await buildReviewQueue(db, { userId: user, maxNew: 50 });

      // A re-render must not move a button under the learner's finger, so the
      // permutation is derived from the card rather than drawn at random.
      for (const item of first.items) {
        const twin = second.items.find((other) => other.cardId === item.cardId);
        expect(twin?.fastCheck).toEqual(item.fastCheck);
      }
    });

    it("preserves the answer text through the permutation", async () => {
      const user = "fast-check-learner";
      await enrolBundledCell(db, user, "de-by:realschule-optik");
      const queue = await buildReviewQueue(db, { userId: user, maxNew: 50 });

      for (const item of queue.items) {
        if (!item.fastCheck) continue;
        const stored = (await db
          .prepare("SELECT fast_check FROM tokens WHERE id = ?")
          .get(item.tokenId)) as { fast_check: string };
        const raw = JSON.parse(stored.fast_check) as {
          options: string[];
          correct_index: number;
        };
        expect(item.fastCheck.options.slice().sort()).toEqual(
          raw.options.slice().sort(),
        );
        expect(item.fastCheck.options[item.fastCheck.correctIndex]).toBe(
          raw.options[raw.correct_index],
        );
      }
    });
  });
});
