import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  enrolBundledCellHandler,
  listBundledCellsHandler,
} from "../../src/cli/bridge-handlers.js";
import {
  buildReviewQueue,
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellEnrolment,
  getBundledCellsWithStatus,
  getBundledCellTile,
  isBundledCellInstalled,
  listBundledCells,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";

describe("Bundled learning cells (Phase 1)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-bundled-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists all bundled learning cells with static metadata", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(8);

    const ids = cells.map((c) => c.id);
    expect(ids).toContain("de-by:realschule-optik");
    expect(ids).toContain("de-by:gymnasium-8-optik");
    expect(ids).toContain("de-by:realschule-optik-erweiterung");
    expect(ids).toContain("de-by:bos-10-optik");

    const rsOptik = cells.find((c) => c.id === "de-by:realschule-optik")!;
    expect(rsOptik.title).toBe("Optik und Lichtbrechung (Realschule 8)");
    expect(rsOptik.gradeLabel).toBe("Realschule Klasse 7/8 (Bayern)");
    expect(rsOptik.publisher).toBe("ZAM Curriculum Working Group");
    expect(rsOptik.atomCount).toBe(4);
  });

  it("retrieves individual bundled cells and full KVT tiles", () => {
    const cell = getBundledCell("de-by:realschule-optik");
    expect(cell).toBeDefined();
    expect(cell?.id).toBe("de-by:realschule-optik");

    const tile = getBundledCellTile("de-by:realschule-optik");
    expect(tile).toBeDefined();
    expect(tile?.tile_id).toBe("de-by:realschule-optik");
    expect(tile?.atoms).toHaveLength(4);
    expect(tile?.atoms.flatMap((a) => a.practice_items)).toHaveLength(7);

    expect(getBundledCell("non-existent")).toBeUndefined();
    expect(getBundledCellTile("non-existent")).toBeUndefined();
  });

  it("reports initial uninstalled and unenrolled status", async () => {
    const user = "test-learner";

    const statusList = await getBundledCellsWithStatus(db, user);
    expect(statusList.length).toBeGreaterThanOrEqual(8);
    for (const status of statusList) {
      expect(status.installed).toBe(false);
      expect(status.enrolled).toBe(false);
      expect(status.cardCount).toBe(0);
    }

    const isInstalled = await isBundledCellInstalled(
      db,
      "de-by:realschule-optik",
    );
    expect(isInstalled).toBe(false);

    const enrolment = await getBundledCellEnrolment(
      db,
      user,
      "de-by:realschule-optik",
    );
    expect(enrolment.installed).toBe(false);
    expect(enrolment.enrolled).toBe(false);
    expect(enrolment.cardCount).toBe(0);
  });

  it("enrols in a bundled cell, materialises scoped cards, and is idempotent", async () => {
    const user = "test-learner";

    // 1. First enrolment
    const res1 = await enrolBundledCell(db, user, "de-by:realschule-optik");
    expect(res1.success).toBe(true);
    expect(res1.cellId).toBe("de-by:realschule-optik");
    expect(res1.installed).toBe(true);
    expect(res1.cardsCreated).toBe(6); // 3 in-scope curriculum atoms * 2 practice items (T1 + T2)
    expect(res1.alreadyEnrolled).toBe(false);

    // Verify status
    const status1 = await getBundledCellEnrolment(
      db,
      user,
      "de-by:realschule-optik",
    );
    expect(status1.installed).toBe(true);
    expect(status1.enrolled).toBe(true);
    expect(status1.cardCount).toBe(6);

    // 2. Idempotent second enrolment
    const res2 = await enrolBundledCell(db, user, "de-by:realschule-optik");
    expect(res2.success).toBe(true);
    expect(res2.cardsCreated).toBe(0);
    expect(res2.cardsReused).toBe(6);
    expect(res2.alreadyEnrolled).toBe(true);

    // 3. Review queue has the newly enrolled cards
    const queue = await buildReviewQueue(db, { userId: user });
    expect(queue.items.length).toBeGreaterThanOrEqual(1);
  });

  it("handles bridge commands for bundled cells", async () => {
    const user = "bridge-learner";

    // List via handler
    const listRes = await listBundledCellsHandler(db, { user });
    expect(listRes.success).toBe(true);
    expect(listRes.cells.length).toBeGreaterThanOrEqual(8);
    expect(listRes.cells[0]?.enrolled).toBe(false);

    // Enrol via handler
    const enrolRes = await enrolBundledCellHandler(db, {
      cellId: "de-by:realschule-optik",
      user,
    });
    expect(enrolRes.success).toBe(true);
    expect(enrolRes.cardsCreated).toBe(6);

    // Re-list via handler reflects enrolment
    const listRes2 = await listBundledCellsHandler(db, { user });
    const rsCell = listRes2.cells.find(
      (c) => c.id === "de-by:realschule-optik",
    );
    expect(rsCell?.enrolled).toBe(true);
    expect(rsCell?.cardCount).toBe(6);
  });

  it("does not mark overlapping cells enrolled after a partial shared-atom enrol", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const statuses = await getBundledCellsWithStatus(db, user);
    const rs = statuses.find((cell) => cell.id === "de-by:realschule-optik");
    const gym = statuses.find((cell) => cell.id === "de-by:gymnasium-8-optik");
    const ext = statuses.find(
      (cell) => cell.id === "de-by:realschule-optik-erweiterung",
    );
    const bos = statuses.find((cell) => cell.id === "de-by:bos-10-optik");

    expect(rs?.enrolled).toBe(true);
    expect(gym?.enrolled).toBe(false);
    expect(ext?.enrolled).toBe(false);
    expect(bos?.enrolled).toBe(false);
    expect(gym?.cardCount).toBeGreaterThan(0);

    const gymEnrol = await enrolBundledCell(
      db,
      user,
      "de-by:gymnasium-8-optik",
    );
    expect(gymEnrol.alreadyEnrolled).toBe(false);
    expect(gymEnrol.cardsCreated).toBeGreaterThan(0);

    const gymAfter = await getBundledCellEnrolment(
      db,
      user,
      "de-by:gymnasium-8-optik",
    );
    expect(gymAfter.enrolled).toBe(true);
  });

  it("does not call a cell installed when only overlapping atoms are present", async () => {
    await enrolBundledCell(db, "other-learner", "de-by:gymnasium-8-optik");
    await enrolBundledCell(db, "other-learner", "de-by:bos-10-optik");

    // Together those tiles contain every Realschule atom, but not its unique
    // Tier-2 practice items. Atom-only detection used to produce a false
    // installed badge and made enrolment look like an idempotent no-op.
    expect(await isBundledCellInstalled(db, "de-by:realschule-optik")).toBe(
      false,
    );
  });

  // The bulk status query replaced one round trip per cell so a 228-cell
  // library stays usable on mobile. It has to answer exactly what the
  // per-cell path answers, including for a scoped subset.
  it("gives a requested subset the same status as the per-cell query", async () => {
    const user = "subset-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const ids = [
      "de-by:realschule-optik",
      "de-by:gymnasium-8-optik",
      "de-by:bos-10-optik",
    ];
    const subset = await getBundledCellsWithStatus(
      db,
      user,
      ids.map((id) => getBundledCell(id)!),
    );

    expect(subset.map((cell) => cell.id)).toEqual(ids);
    for (const cell of subset) {
      const perCell = await getBundledCellEnrolment(db, user, cell.id);
      expect({
        installed: cell.installed,
        enrolled: cell.enrolled,
        cardCount: cell.cardCount,
      }).toEqual(perCell);
    }

    expect(await getBundledCellsWithStatus(db, user, [])).toEqual([]);
  });
  /**
   * Owner decision 2026-08-15: the cell has precedence. Import goes through a
   * cell wherever one exists; the generic curriculum importer is what covers
   * the positions no cell reaches yet, and that remainder shrinks as cells are
   * added.
   */
  describe("cell precedence over generic import", () => {
    it("finds the cell that covers a learner's curriculum position", () => {
      const cells = findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 8,
        track: "II_III",
        subject: "physik",
      });
      expect(cells.map((cell) => cell.id)).toContain("de-by:realschule-optik");
      expect(
        needsGenericCurriculumImport({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 8,
          track: "II_III",
          subject: "physik",
        }),
      ).toBe(false);
    });

    it("keeps the generic importer for a position no cell covers", () => {
      // Same provider and school type, a subject no cell touches.
      expect(
        needsGenericCurriculumImport({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 8,
          subject: "sport",
        }),
      ).toBe(true);
      // And a grade no cell reaches.
      expect(
        needsGenericCurriculumImport({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 5,
          subject: "physik",
        }),
      ).toBe(true);
    });

    it("does not offer another school type's cell", () => {
      const cells = findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "gymnasium",
        grade: 8,
        subject: "physik",
      });
      const cellIds = cells.map((cell) => cell.id);
      expect(cellIds).toContain("de-by:gymnasium-8-optik");
      expect(cellIds.every((id) => id.startsWith("de-by:gymnasium-8-"))).toBe(
        true,
      );
    });

    it("ignores a provider it does not publish for", () => {
      expect(
        findBundledCellsForScope({ provider: "kernlehrplan-nrw", grade: 8 }),
      ).toEqual([]);
    });

    /**
     * The contract the curriculum wizard depends on. It must be able to tell
     * "no cell here, carry on" from "the call failed" — an empty list alone
     * would read as permission to run the generic import.
     */
    it("answers the precedence question over the bridge, with enrolment status", async () => {
      const user = "scoped-learner";

      const unscoped = await listBundledCellsHandler(db, { user });
      expect(unscoped.scoped).toBe(false);
      expect(unscoped.cells.length).toBeGreaterThanOrEqual(8);
      expect("needsGenericImport" in unscoped).toBe(false);

      const covered = await listBundledCellsHandler(db, {
        user,
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 8,
        track: "II_III",
        subject: "physik",
      });
      expect(covered.scoped).toBe(true);
      expect(covered.needsGenericImport).toBe(false);
      expect(covered.cells.map((cell) => cell.id)).toContain(
        "de-by:realschule-optik",
      );
      // Status travels with the offer, so the wizard can say "already active"
      // instead of offering the same cell twice.
      expect(covered.cells.every((cell) => "enrolled" in cell)).toBe(true);
      expect(covered.cells[0]?.enrolled).toBe(false);

      await enrolBundledCell(db, user, "de-by:realschule-optik");
      const afterEnrol = await listBundledCellsHandler(db, {
        user,
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 8,
        track: "II_III",
        subject: "physik",
      });
      expect(
        afterEnrol.cells.find((cell) => cell.id === "de-by:realschule-optik")
          ?.enrolled,
      ).toBe(true);

      const uncovered = await listBundledCellsHandler(db, {
        user,
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 8,
        subject: "sport",
      });
      expect(uncovered.needsGenericImport).toBe(true);
      expect(uncovered.cells).toEqual([]);
    });
  });
});
