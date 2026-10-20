import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { installScopeCells } from "../../src/cli/atlas.js";
import { setLastCurriculumSelection } from "../../src/cli/curriculum/breadcrumb.js";
import {
  type Database,
  getBundledCellTile,
  getCard,
  getTokenById,
  installKvtTile,
  type KvtTile,
  materialiseKvtCards,
  openDatabase,
} from "../../src/kernel/index.js";
import legacyDatenbanken from "../fixtures/legacy/de-by-realschule-9-informatik-datenbanken-sql-kvt.json" with {
  type: "json",
};

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
    db = await openDatabase({ dbPath: join(tempDir, "test.db") });
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
});
