import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { atlasPlace } from "../../src/cli/atlas.js";
import {
  readAtlas,
  SCHULE_LENS,
  weltwissenSeedRows,
} from "../../src/kernel/atlas/index.js";
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
  matchMaterialProposals,
  needsGenericCurriculumImport,
  openDatabase,
  parseMaterialProposalSet,
} from "../../src/kernel/index.js";

// Mathematik, Deutsch and HSU 4 (zam-os/zam-academy#81) are public previews:
// primary-teacher review and videos are open, and their competences are covered
// in part or with unreviewed depth. ZAM has no earlier
// Grundschule cell, so they replace and retire nothing. They bind their Academy
// stations and name their school place under `zam-academy`, not
// `lehrplanplus-bayern`, so the school curriculum path keeps its generic import
// instead of offering a preview as the whole subject.
const CELLS = [
  {
    id: "zam-academy:mathematik-grundschule-4",
    app: "mathematik-grundschule-4",
    subject: "mathematik",
    version: "2026.11.16",
    atoms: 43,
    items: 159,
  },
  {
    id: "zam-academy:deutsch-grundschule-4",
    app: "deutsch-grundschule-4",
    subject: "deutsch",
    version: "2026.11.6",
    atoms: 45,
    items: 135,
  },
  {
    id: "zam-academy:hsu-grundschule-4",
    app: "hsu-grundschule-4",
    subject: "hsu",
    version: "2026.11.5",
    atoms: 20,
    items: 61,
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

  it("links every German card to a lesson URL of its own app", () => {
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

describe("Grundschule 4 preview cells in the atlas", () => {
  it("places every HSU station in one of the six HSU areas", () => {
    const { aliases } = weltwissenSeedRows();
    const tile = getBundledCellTile("zam-academy:hsu-grundschule-4")!;
    const areas = new Set(
      tile.atoms.map(
        (atom) =>
          aliases.find((alias) => alias.domainPrefix === atom.domain)
            ?.regionKey,
      ),
    );
    expect([...areas].sort()).toEqual([
      "gesellschaft.hsu.demokratie",
      "gesellschaft.hsu.koerper",
      "gesellschaft.hsu.natur",
      "gesellschaft.hsu.raum",
      "gesellschaft.hsu.technik",
      "gesellschaft.hsu.zeit",
    ]);
  });

  describe("in the Schule lens", () => {
    let dir: string;
    let db: Database;
    const userId = ulid();

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-grundschule-4-schule-"));
      db = await openDatabase({
        dbPath: join(dir, "test.db"),
        useConfiguredCloud: false,
      });
      for (const cell of CELLS) {
        await installKvtTile(db, getBundledCellTile(cell.id)!);
        await enrolBundledCell(db, userId, cell.id);
      }
    });
    afterEach(async () => {
      await db.close();
      rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
    });

    it("names them under their grade, with the stage as the Lernbereich", async () => {
      const { regions } = await readAtlas(db, { userId, lens: SCHULE_LENS });
      expect(
        regions.filter((region) => region.level === 0).map((r) => r.name),
      ).toEqual(["4. Klasse"]);
      expect(regions.map((r) => r.name)).toContain(
        "Demokratie und Gesellschaft",
      );
      expect(
        regions
          .filter((region) => region.level === 1)
          .map((r) => r.name)
          .sort(),
      ).toEqual(["Deutsch", "Heimat- und Sachunterricht", "Mathematik"]);
    });

    it("offers the three cells at the grade, its own at a subject, and no generic import", async () => {
      const island = await atlasPlace(db, {
        userId,
        lens: "schule",
        region: "grundschule-4",
      });
      expect(island.scope).toEqual({
        provider: "zam-academy",
        schoolType: "grundschule",
        grade: 4,
      });
      expect(island.cells.map((c) => c.id).sort()).toEqual(
        CELLS.map((cell) => cell.id).sort(),
      );
      expect(island.wizard).toBe(false);
      for (const cell of CELLS) {
        const place = await atlasPlace(db, {
          userId,
          lens: "schule",
          region: `grundschule-4.${cell.subject}`,
        });
        expect(
          place.cells.map((c) => c.id),
          cell.id,
        ).toEqual([cell.id]);
        expect(place.wizard, cell.id).toBe(false);
        // The atlas dialog labels it: no teacher has reviewed it yet.
        expect(place.cells[0].preview, cell.id).toBe(true);
      }
    });

    it("keeps the grade unnamed beside a Realschule grade", async () => {
      const id = "zam-academy:mathematik-realschule-9";
      await installKvtTile(db, getBundledCellTile(id)!);
      await enrolBundledCell(db, userId, id);
      const { regions } = await readAtlas(db, { userId, lens: SCHULE_LENS });
      expect(
        regions
          .filter((region) => region.level === 0)
          .map((r) => r.name)
          .sort(),
      ).toEqual(["4. Klasse", "9. Klasse"]);
    });

    it("keeps a grade-less module to its subject instead of a whole school type", async () => {
      const id = "zam-academy:algorithmen";
      await installKvtTile(db, getBundledCellTile(id)!);
      await enrolBundledCell(db, userId, id);
      const place = await atlasPlace(db, {
        userId,
        lens: "schule",
        region: "realschule-ohne-klasse",
      });
      expect(place.scope).toMatchObject({
        schoolType: "realschule",
        subject: "it",
      });
      const ids = place.cells.map((c) => c.id);
      expect(ids).toContain(id);
      expect(ids.filter((c) => /biologie|mathematik/.test(c))).toEqual([]);
      const { regions } = await readAtlas(db, { userId, lens: SCHULE_LENS });
      expect(regions.map((r) => r.name)).toContain("Informatik");
      expect(regions.map((r) => r.name)).not.toContain("It");
    });
  });

  describe("in the material import", () => {
    let dir: string;
    let db: Database;
    const material = parseMaterialProposalSet({
      version: 1,
      analysis: {
        kind: "own-notes",
        title: "Längen",
        subjects: ["mathematik"],
        topic: "Längeneinheiten",
        level: "Klasse",
        bloom: [1, 2],
        leadsTo: null,
      },
      files: [
        { name: "Notizen", sourceLink: "notes:Laengen@2026", sha256: null },
      ],
      proposals: [
        {
          question: "Wie viele Millimeter sind ein Zentimeter?",
          answer: "10 Millimeter.",
          bloom: 1,
          file: 0,
          page: null,
          area: "mathematik/groessen",
          origin: "page",
        },
      ],
    });
    const offeredCells = async (schoolType?: string) => {
      const rows = await matchMaterialProposals(db, ulid(), material, {
        scope: schoolType
          ? { provider: "lehrplanplus-bayern", schoolType, subject: "mathematik" }
          : undefined,
      });
      return rows.flatMap((row) =>
        row.kind === "existing" && row.target.type === "cell-item"
          ? [row.target.cellId]
          : [],
      );
    };

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-grundschule-4-material-"));
      db = await openDatabase({
        dbPath: join(dir, "test.db"),
        useConfiguredCloud: false,
      });
    });
    afterEach(async () => {
      await db.close();
      rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
    });

    it("proposes a Grundschule cell to Grundschule learners only", async () => {
      const id = "zam-academy:mathematik-grundschule-4";
      expect(await offeredCells("grundschule")).toContain(id);
      expect(await offeredCells("realschule")).not.toContain(id);
      expect(await offeredCells("gymnasium")).not.toContain(id);
      expect(await offeredCells()).not.toContain(id);
    });
  });
});
