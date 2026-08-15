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
      .prepare("UPDATE cards SET reps = 1, state = 'review', stability = 5 WHERE id = ?")
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
      .prepare("UPDATE cards SET reps = 1, state = 'review', stability = 5 WHERE id = ?")
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
      .prepare("UPDATE cards SET reps = 1, state = 'review', stability = 5 WHERE id = ?")
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
  });
});
