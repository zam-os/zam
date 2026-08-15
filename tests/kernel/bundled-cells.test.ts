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
  getBundledCell,
  getBundledCellEnrolment,
  getBundledCellsWithStatus,
  getBundledCellTile,
  isBundledCellInstalled,
  listBundledCells,
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

  it("lists all 4 bundled learning cells with static metadata", () => {
    const cells = listBundledCells();
    expect(cells).toHaveLength(4);

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
    expect(statusList).toHaveLength(4);
    for (const status of statusList) {
      expect(status.installed).toBe(false);
      expect(status.enrolled).toBe(false);
      expect(status.cardCount).toBe(0);
    }

    const isInstalled = await isBundledCellInstalled(db, "de-by:realschule-optik");
    expect(isInstalled).toBe(false);

    const enrolment = await getBundledCellEnrolment(db, user, "de-by:realschule-optik");
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
    const status1 = await getBundledCellEnrolment(db, user, "de-by:realschule-optik");
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
    expect(listRes.cells).toHaveLength(4);
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
    const rsCell = listRes2.cells.find((c) => c.id === "de-by:realschule-optik");
    expect(rsCell?.enrolled).toBe(true);
    expect(rsCell?.cardCount).toBe(6);
  });
});

