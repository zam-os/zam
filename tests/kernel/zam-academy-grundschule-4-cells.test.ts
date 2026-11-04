import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  ensureCard,
  evaluateRating,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellTile,
  installKvtTile,
  listLibraryTopics,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";

// Mathematik, Deutsch and HSU 4 (zam-os/zam-academy#81) are public previews:
// primary-teacher review and videos are open and each covers only part of its
// Fachlehrplan. ZAM has no earlier Grundschule cell, so they replace and retire
// nothing. They bind only their Academy stations, so the school curriculum path
// keeps its generic import instead of treating a part as the whole subject.
const CELLS = [
  {
    id: "zam-academy:mathematik-grundschule-4",
    app: "mathematik-grundschule-4",
    subject: "mathematik",
    version: "2026.11.14",
    atoms: 43,
    items: 159,
  },
  {
    id: "zam-academy:deutsch-grundschule-4",
    app: "deutsch-grundschule-4",
    subject: "deutsch",
    version: "2026.11.2",
    atoms: 26,
    items: 78,
  },
  {
    id: "zam-academy:hsu-grundschule-4",
    app: "hsu-grundschule-4",
    subject: "hsu",
    version: "2026.11.1",
    atoms: 20,
    items: 60,
  },
];

describe.each(CELLS)("ZAM Academy $app preview cell", (cell) => {
  const tile = getBundledCellTile(cell.id)!;
  const items = tile.atoms.flatMap((atom) => atom.practice_items);
  const scope = {
    provider: "lehrplanplus-bayern",
    schoolType: "grundschule",
    grade: 4,
    subject: cell.subject,
  };

  it("bundles the published preview as a new cell", () => {
    expect(tile.version).toBe(cell.version);
    expect(getBundledCell(cell.id)).toMatchObject({
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: cell.atoms,
    });
    expect(items).toHaveLength(cell.items);
    expect(tile.description).toContain("Vorschau");
    expect(tile.retired_items ?? []).toEqual([]);
    for (const item of items) expect(item.replaces ?? [], item.id).toEqual([]);
  });

  it("stays out of the school curriculum path and leaves its generic import", () => {
    expect(findBundledCellsForScope(scope).map((c) => c.id)).not.toContain(
      cell.id,
    );
    expect(needsGenericCurriculumImport(scope)).toBe(true);
    for (const atom of tile.atoms)
      for (const binding of atom.curricula ?? [])
        expect(binding.provider, atom.slug).toBe("zam-academy");
  });

  it("links every German card to a lesson of its published app", () => {
    for (const atom of tile.atoms)
      for (const item of atom.practice_items) {
        expect(item.source_link, item.id).toMatch(
          new RegExp(
            `^https://academy\\.zam-os\\.org/${cell.app}/#lesson=[a-z0-9-]+$`,
          ),
        );
        expect(item.language).toBe("de");
      }
  });

  describe("enrolment", () => {
    let dir: string;
    let db: Database;
    let userId: string;

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-grundschule-4-"));
      db = await openDatabase({
        dbPath: join(dir, "test.db"),
        useConfiguredCloud: false,
      });
      userId = ulid();
    });
    afterEach(async () => {
      await db.close();
      rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
    });

    async function snapshot() {
      return {
        cards: await db.prepare("SELECT * FROM cards ORDER BY id").all(),
        reviews: await db
          .prepare("SELECT * FROM review_logs ORDER BY id")
          .all(),
      };
    }

    it("enrols every card once and keeps a review through a repeat install", async () => {
      await installKvtTile(db, tile);
      expect((await snapshot()).cards).toEqual([]);
      expect(await enrolBundledCell(db, userId, cell.id)).toMatchObject({
        success: true,
        cardsCreated: cell.items,
      });
      const topics = (await listLibraryTopics(db, userId)).filter(
        (topic) => topic.itemCount === cell.items,
      );
      expect(topics.length).toBeGreaterThan(0);

      const tokenId = items[0].id;
      const card = await ensureCard(db, tokenId, userId);
      await evaluateRating(db, {
        cardId: card.id,
        tokenId,
        userId,
        rating: 3,
        answerFormat: "recall",
        responseTimeMs: 1500,
      });
      const before = await snapshot();
      expect(before.reviews).toHaveLength(1);

      await installKvtTile(db, tile);
      expect(await enrolBundledCell(db, userId, cell.id)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });
  });
});
