import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseDelimitedText } from "../../src/cli/import/delimited.js";
import {
  buildReviewQueue,
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellEnrolment,
  getBundledCellTile,
  installKvtTile,
  listLibraryTopics,
  listTokens,
  openDatabase,
  startLibraryTopic,
} from "../../src/kernel/index.js";
import { buildZamCsvExport } from "../../uml-learning-app/src/zam/zam-bridge-export.js";

const CELL_ID = "zam:uml-2-5-1-systemdenken";

describe("ZAM UML 2.5.1 & Systemdenken Training Companion Cell", () => {
  let tempDir: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-uml-cell-test-"));
    db = await openDatabase({ dbPath: join(tempDir, "test.db") });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("exposes the built-in UML 2.5.1 cell with its trainingToolUrl and 6 stage atoms", () => {
    const cell = getBundledCell(CELL_ID);
    expect(cell).toBeDefined();
    expect(cell?.title).toBe(
      "UML 2.5.1 & Systemdenken (ZAM Training-Akademie)",
    );
    expect(cell?.gradeLabel).toContain("ZAM Training-Akademie");
    expect(cell?.atomCount).toBe(6);
    expect(cell?.inScopeAtomIds).toHaveLength(6);
    expect(cell?.trainingToolUrl).toBe(
      "uml-learning-app/UML-Studio-Academy.html",
    );

    const scoped = findBundledCellsForScope({
      provider: "zam-academy",
      subject: "uml-2-5-1",
    });
    expect(scoped.map((c) => c.id)).toContain(CELL_ID);
  });

  it("enrols a learner after training and links every card back to its training tool lesson via source_link", async () => {
    const userId = "uml-graduate-learner";

    const res = await enrolBundledCell(db, userId, CELL_ID);
    expect(res.success).toBe(true);
    expect(res.installed).toBe(true);
    expect(res.cardsCreated).toBe(12); // 6 stage atoms * 2 practice items (Tier 1 + Tier 2)
    expect(res.alreadyEnrolled).toBe(false);

    const enrolment = await getBundledCellEnrolment(db, userId, CELL_ID);
    expect(enrolment.installed).toBe(true);
    expect(enrolment.enrolled).toBe(true);
    expect(enrolment.cardCount).toBe(12);

    // Every token must carry a deep-link into the UML training tool (#lesson=...)
    const tokens = await listTokens(db, {
      sourceLinkBases: ["uml-learning-app/UML-Studio-Academy.html"],
    });
    expect(tokens).toHaveLength(12);
    for (const token of tokens) {
      expect(token.source_link).toMatch(
        /^uml-learning-app\/UML-Studio-Academy\.html#lesson=\d+\.\d+$/,
      );
    }

    // Queue schedules the foundational Stage 1 cards first
    const queue = await buildReviewQueue(db, { userId });
    expect(queue.items.length).toBeGreaterThanOrEqual(1);
    expect(queue.items[0]?.sourceLink).toContain(
      "uml-learning-app/UML-Studio-Academy.html#lesson=",
    );
  });

  it("surfaces the installed cell as a ZAM Library Topic ('UML Studio Academy') for other learners", async () => {
    const tile = getBundledCellTile(CELL_ID)!;
    await installKvtTile(db, tile);

    const topics = await listLibraryTopics(db, "colleague-learner");
    const umlTopic = topics.find(
      (t) => t.key === "uml-learning-app/UML-Studio-Academy.html",
    );
    expect(umlTopic).toBeDefined();
    expect(umlTopic?.name).toBe("UML Studio Academy");
    expect(umlTopic?.domain).toBe("informatik/uml-systemdenken");
    expect(umlTopic?.itemCount).toBe(12);
    expect(umlTopic?.heldCount).toBe(0);

    const started = await startLibraryTopic(
      db,
      "colleague-learner",
      "uml-learning-app/UML-Studio-Academy.html",
    );
    expect(started.created).toBe(12);
    expect(started.alreadyHeld).toBe(0);
  });

  it("parses the training app's exported CSV (DE & EN) cleanly with ZAM's delimited importer", () => {
    for (const locale of ["de", "en"] as const) {
      const csv = buildZamCsvExport(locale);
      const doc = parseDelimitedText(
        csv,
        "csv",
        `UML-2.5.1-ZAM-Cards-${locale.toUpperCase()}.csv`,
      );
      expect(doc.cards).toHaveLength(12);
      expect(doc.warnings).toHaveLength(0);
      expect(doc.unsupported).toHaveLength(0);
      expect(doc.cards[0]?.source).toBe(
        "uml-learning-app/UML-Studio-Academy.html#lesson=1.2",
      );
    }
  });
});
