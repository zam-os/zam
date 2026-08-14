import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  bonusCandidates,
  type Database,
  getCard,
  heldAtomIds,
  installKvtTile,
  type KvtTile,
  materialiseKvtCards,
  openDatabase,
} from "../../src/kernel/index.js";

const FIXTURES = resolve(__dirname, "../fixtures/curriculum");

const REALSCHULE_CELL = [
  "atom:zam:optik:strahlengang-lot",
  "atom:zam:optik:brechung-qualitativ",
  "atom:zam:optik:totalreflexion-grenzwinkel",
];

function loadFixture(name: string): KvtTile {
  return JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), "utf-8"));
}

describe("bonus candidates", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-bonus-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    for (const name of [
      "de-by-realschule-optik-kvt",
      "de-by-gymnasium-8-optik-kvt",
      "de-by-realschule-optik-erweiterung-kvt",
      "de-by-bos-10-optik-kvt",
    ]) {
      await installKvtTile(db, loadFixture(name));
    }
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true, maxRetries: 10 });
  });

  /** Give the learner a card per atom and mark it genuinely recalled. */
  async function learn(atomIds: string[]): Promise<void> {
    await materialiseKvtCards(db, "learner-a", atomIds);
    for (const atomId of atomIds) {
      const item = (await db
        .prepare("SELECT id FROM tokens WHERE atom_id = ? ORDER BY id LIMIT 1")
        .get(atomId)) as { id: string };
      const card = await getCard(db, item.id, "learner-a");
      await db
        .prepare(
          "UPDATE cards SET reps = 1, state = 'review', stability = 5 WHERE id = ?",
        )
        .run(card!.id);
    }
  }

  it("holds nothing before a single observed retrieval", async () => {
    await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL);
    // Cards exist, but reps = 0.
    expect(await heldAtomIds(db, "learner-a")).toEqual(new Set());
  });

  it("never counts a self-assessed card as held", async () => {
    await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL);
    const item = (await db
      .prepare("SELECT id FROM tokens WHERE atom_id = ? ORDER BY id LIMIT 1")
      .get("atom:zam:optik:strahlengang-lot")) as { id: string };
    const card = await getCard(db, item.id, "learner-a");
    // Exactly what precondition self-assessment does: a date, nothing else.
    await db
      .prepare(
        `UPDATE cards SET buried_until = '2099-01-01T00:00:00.000Z',
                          buried_reason = 'precondition' WHERE id = ?`,
      )
      .run(card!.id);

    expect(await heldAtomIds(db, "learner-a")).toEqual(new Set());
  });

  it("offers only atoms outside the cell whose foundations are held", async () => {
    await learn(REALSCHULE_CELL);
    const candidates = await bonusCandidates(db, "learner-a", {
      inScopeAtomIds: REALSCHULE_CELL,
    });
    const ids = candidates.map((c) => c.atomId);

    // Rests on brechung-qualitativ, which is held.
    expect(ids).toContain("atom:zam:optik:brechungsgesetz-snellius-formel");
    expect(ids).toContain("atom:zam:optik:sammellinse-abbildung");
    // Rests on the Snellius formula, which is not held yet.
    expect(ids).not.toContain("atom:zam:optik:brechungsindex-bestimmen");
    // In the learner's own curriculum: not a bonus.
    for (const inScope of REALSCHULE_CELL) expect(ids).not.toContain(inScope);
  });

  it("offers nothing while no foundation is held", async () => {
    const candidates = await bonusCandidates(db, "learner-a", {
      inScopeAtomIds: REALSCHULE_CELL,
    });
    expect(candidates).toEqual([]);
  });

  it("names what each offer rests on", async () => {
    await learn(REALSCHULE_CELL);
    const candidates = await bonusCandidates(db, "learner-a", {
      inScopeAtomIds: REALSCHULE_CELL,
    });
    const formula = candidates.find(
      (c) => c.atomId === "atom:zam:optik:brechungsgesetz-snellius-formel",
    );
    expect(formula?.restsOn).toEqual(["atom:zam:optik:brechung-qualitativ"]);
  });

  it("ranks by what an atom unlocks for this learner", async () => {
    await learn(REALSCHULE_CELL);
    const candidates = await bonusCandidates(db, "learner-a", {
      inScopeAtomIds: REALSCHULE_CELL,
    });

    // Snellius unlocks brechungsindex-bestimmen once totalreflexion is held —
    // and it is. A leaf like sammellinse-abbildung unlocks nothing.
    const formula = candidates.find(
      (c) => c.atomId === "atom:zam:optik:brechungsgesetz-snellius-formel",
    );
    const lens = candidates.find(
      (c) => c.atomId === "atom:zam:optik:sammellinse-abbildung",
    );
    expect(formula?.unlockCount).toBe(1);
    expect(lens?.unlockCount).toBe(0);
    expect(candidates[0]?.atomId).toBe(
      "atom:zam:optik:brechungsgesetz-snellius-formel",
    );

    // Static reachability is the tiebreaker and a different quantity: the
    // formula also reaches brechungsindex-bestimmen transitively.
    expect(formula?.reachabilityCount).toBeGreaterThan(
      lens?.reachabilityCount ?? 0,
    );
  });

  it("is a pure derivation — it writes nothing", async () => {
    await learn(REALSCHULE_CELL);
    const before = (await db
      .prepare(
        `SELECT COUNT(*) AS cards FROM cards WHERE user_id = 'learner-a'`,
      )
      .get()) as { cards: number };

    await bonusCandidates(db, "learner-a", { inScopeAtomIds: REALSCHULE_CELL });

    const after = (await db
      .prepare(
        `SELECT COUNT(*) AS cards FROM cards WHERE user_id = 'learner-a'`,
      )
      .get()) as { cards: number };
    expect(after.cards).toBe(before.cards);
  });

  it("respects the caller's limit", async () => {
    await learn(REALSCHULE_CELL);
    const candidates = await bonusCandidates(db, "learner-a", {
      inScopeAtomIds: REALSCHULE_CELL,
      limit: 1,
    });
    expect(candidates).toHaveLength(1);
  });
});
