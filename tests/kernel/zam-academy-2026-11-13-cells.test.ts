import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  ensureCard,
  evaluateRating,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellTile,
  getTokenById,
  installKvtTile,
  type KvtTile,
  listLibraryTopics,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";

// The eleven Academy cells newly bundled in 0.63.0: Deutsch 5 Realschule
// (preview, approved 8 transfers + 5 retirements across its two archived
// school cells), Biologie 11 Einführungsklasse (preview, approved 1 transfer
// keeping its two Gymnasium 11 school cells active), Physik 11 Gymnasium
// (approved 3 transfers keeping its five Gymnasium 10/11 school cells active),
// and the eight Deutsch/Mathematik 5–8 Mittelschule cells (with R/M <->
// regelklasse/mittlere-reife-klasse track matching in grades 7–8).

interface Mapping {
  status: string;
  approved: string | null;
  sources: Array<{ file: string; sha256: string; tile_id?: string }>;
  rows: Array<{
    de_by_cell: string;
    de_by_id: string;
    category: string;
    action?: string;
    academy_slug: string | null;
  }>;
}

const MAPPED_CELLS = [
  {
    app: "deutsch-realschule-5",
    version: "2026.11.2",
    atoms: 37,
    items: 77,
    provider: "lehrplanplus-bayern",
    schoolType: "realschule",
    grade: 5,
    subject: "deutsch",
    approved: "2026-11-13",
    transfers: 8,
    retired: 5,
    kept: 3,
    oldCellsRetired: true,
    preview: true,
  },
  {
    app: "biologie-gymnasium-11",
    version: "2026.11.3",
    atoms: 28,
    items: 84,
    provider: "isb-bayern-einfuehrungsklasse",
    schoolType: "gymnasium",
    grade: 11,
    track: "einfuehrungsklasse",
    subject: "biologie",
    approved: "2026-11-10",
    transfers: 1,
    retired: 0,
    kept: 7,
    oldCellsRetired: false,
    preview: true,
  },
  {
    app: "physik-gymnasium-11",
    version: "2026.11.1",
    atoms: 34,
    items: 102,
    provider: "lehrplanplus-bayern",
    schoolType: "gymnasium",
    grade: 11,
    subject: "physik",
    approved: "2026-11-10",
    transfers: 3,
    retired: 0,
    kept: 17,
    oldCellsRetired: false,
  },
] as const;

const MITTELSCHULE_CELLS = [
  {
    app: "deutsch-mittelschule-5",
    version: "2026.11.2",
    atoms: 51,
    items: 102,
    grade: 5,
    subject: "deutsch",
    tracks: [undefined],
  },
  {
    app: "deutsch-mittelschule-6",
    version: "2026.11.2",
    atoms: 52,
    items: 104,
    grade: 6,
    subject: "deutsch",
    tracks: [undefined],
  },
  {
    app: "deutsch-mittelschule-7",
    version: "2026.11.1",
    atoms: 37,
    items: 74,
    grade: 7,
    subject: "deutsch",
    tracks: [undefined, "R", "M", "regelklasse", "mittlere-reife-klasse"],
  },
  {
    app: "deutsch-mittelschule-8",
    version: "2026.11.1",
    atoms: 37,
    items: 74,
    grade: 8,
    subject: "deutsch",
    tracks: [undefined, "R", "M", "regelklasse", "mittlere-reife-klasse"],
  },
  {
    app: "mathematik-mittelschule-5",
    version: "2026.11.1",
    atoms: 32,
    items: 64,
    grade: 5,
    subject: "mathematik",
    tracks: [undefined],
  },
  {
    app: "mathematik-mittelschule-6",
    version: "2026.11.1",
    atoms: 35,
    items: 70,
    grade: 6,
    subject: "mathematik",
    tracks: [undefined],
  },
  {
    app: "mathematik-mittelschule-7",
    version: "2026.11.1",
    atoms: 32,
    items: 96,
    grade: 7,
    subject: "mathematik",
    tracks: [undefined, "R", "M", "regelklasse", "mittlere-reife-klasse"],
  },
  {
    app: "mathematik-mittelschule-8",
    version: "2026.11.1",
    atoms: 31,
    items: 93,
    grade: 8,
    subject: "mathematik",
    tracks: [undefined, "R", "M", "regelklasse", "mittlere-reife-klasse"],
  },
] as const;

const fixtures = join(__dirname, "../fixtures");
const sha256 = (path: string) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

function loadOldTile(filePath: string, retired: boolean): KvtTile {
  const base = filePath.split("/").pop() as string;
  const dir = retired ? "legacy" : "curriculum";
  return JSON.parse(readFileSync(join(fixtures, dir, base), "utf8")) as KvtTile;
}

describe.each(MAPPED_CELLS)("ZAM Academy $app cell", (cell) => {
  const id = `zam-academy:${cell.app}`;
  const tile = getBundledCellTile(id)!;
  const items = tile.atoms.flatMap((atom) => atom.practice_items);
  const mapping = JSON.parse(
    readFileSync(
      join(fixtures, "legacy", `zam-academy-${cell.app}-replaces-de-by.json`),
      "utf8",
    ),
  ) as Mapping;
  const transfers = new Map(
    mapping.rows
      .filter((row) => row.category === "A")
      .map((row) => [
        row.de_by_id,
        items.find((item) => item.slug === row.academy_slug)!.id,
      ]),
  );
  const retiredIds = new Set(
    mapping.rows
      .filter((row) => row.action === "retire")
      .map((row) => row.de_by_id),
  );
  const oldTiles = mapping.sources.map((source) =>
    loadOldTile(source.file, cell.oldCellsRetired),
  );
  const oldCellIds = oldTiles.map((old) => old.tile_id);
  const oldItems = oldTiles.flatMap((old) =>
    old.atoms.flatMap((atom) => atom.practice_items),
  );
  const scope = (changes: Record<string, unknown> = {}) => ({
    provider: cell.provider,
    schoolType: cell.schoolType,
    grade: cell.grade,
    subject: cell.subject,
    ...("track" in cell ? { track: cell.track } : {}),
    ...changes,
  });

  it("bundles the published cell with expected preview and counts", () => {
    expect(tile.version).toBe(cell.version);
    expect(getBundledCell(id)).toMatchObject({
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: cell.atoms,
      preview: "preview" in cell,
    });
    expect(items).toHaveLength(cell.items);
    expect((tile.retired_items ?? []).map((r) => r.id).sort()).toEqual(
      [...retiredIds].sort(),
    );
  });

  it("matches discovery at its curriculum scope and keeps school cells retired or active as decided", () => {
    const offered = findBundledCellsForScope(scope()).map((c) => c.id);
    expect(offered).toContain(id);
    expect(needsGenericCurriculumImport(scope())).toBe(false);
    for (const oldCell of oldCellIds) {
      if (cell.oldCellsRetired) {
        expect(getBundledCell(oldCell)).toBeUndefined();
        expect(offered).not.toContain(oldCell);
      } else {
        expect(getBundledCell(oldCell)).toBeDefined();
      }
    }
    for (const other of [
      scope({ grade: cell.grade - 1 }),
      scope({ grade: cell.grade + 1 }),
      scope({
        schoolType:
          cell.schoolType === "gymnasium" ? "realschule" : "gymnasium",
      }),
    ]) {
      expect(findBundledCellsForScope(other).map((c) => c.id)).not.toContain(
        id,
      );
    }
  });

  it("links every German card to a lesson of its own app", () => {
    for (const item of items) {
      expect(item.source_link, item.id).toMatch(
        new RegExp(
          `^https://academy\\.zam-os\\.org/${cell.app}/#lesson=[a-z0-9-]+$`,
        ),
      );
      expect(item.language, item.id).toBe("de");
    }
  });

  it("declares exactly the approved transfers and retirements of its pinned mapping", () => {
    expect(mapping.approved).toBe(cell.approved);
    expect(mapping.status).toBe("approved");
    for (const source of mapping.sources) {
      const base = source.file.split("/").pop() as string;
      const dir = cell.oldCellsRetired ? "legacy" : "curriculum";
      expect(sha256(join(fixtures, dir, base)), source.file).toBe(
        source.sha256,
      );
    }
    expect(mapping.rows.map((row) => row.de_by_id).sort()).toEqual(
      oldItems.map((item) => item.id).sort(),
    );
    expect(transfers.size).toBe(cell.transfers);
    expect(retiredIds.size).toBe(cell.retired);
    expect(
      mapping.rows.filter(
        (row) => row.category === "C" && row.action !== "retire",
      ),
    ).toHaveLength(cell.kept);
    expect(
      items
        .filter((item) => item.replaces?.length)
        .map((item) => [item.replaces, item.id])
        .sort(),
    ).toEqual([...transfers].map(([old, next]) => [[old], next]).sort());
  });

  describe("enrolment", () => {
    let dir: string;
    let db: Database;
    const userId = `learner-${cell.app}`;

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), `zam-academy-${cell.app}-`));
      db = await openDatabase({
        dbPath: join(dir, "test.db"),
        useConfiguredCloud: false,
      });
    });
    afterEach(async () => {
      await db.close();
      rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
    });

    async function snapshot() {
      return {
        cards: (await db
          .prepare("SELECT * FROM cards ORDER BY id")
          .all()) as Array<Record<string, unknown>>,
        reviews: (await db
          .prepare("SELECT * FROM review_logs ORDER BY id")
          .all()) as Array<Record<string, unknown>>,
      };
    }
    const withoutToken = ({ token_id, ...rest }: Record<string, unknown>) =>
      rest;

    it("installs without cards, then enrols every card once as one topic", async () => {
      await installKvtTile(db, tile);
      expect((await snapshot()).cards).toEqual([]);
      expect(await enrolBundledCell(db, userId, id)).toMatchObject({
        success: true,
        cardsCreated: cell.items,
      });
      const app = `https://academy.zam-os.org/${cell.app}/`;
      expect(
        (await listLibraryTopics(db, userId)).filter(
          (topic) => topic.key === app,
        ),
      ).toEqual([expect.objectContaining({ itemCount: cell.items })]);
      const before = await snapshot();
      await installKvtTile(db, tile);
      expect(await enrolBundledCell(db, userId, id)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves approved histories, retires only approved items, and leaves all other cards active", async () => {
      for (const oldTile of oldTiles) await installKvtTile(db, oldTile);
      for (const [index, item] of oldItems.entries()) {
        const card = await ensureCard(db, item.id, userId);
        await evaluateRating(db, {
          cardId: card.id,
          tokenId: item.id,
          userId,
          rating: index % 2 === 0 ? 1 : 3,
          answerFormat: "recall",
          responseTimeMs: 1500,
          now: new Date("2026-09-01T12:00:00Z"),
        });
      }
      const before = await snapshot();
      expect(before.reviews).toHaveLength(oldItems.length);

      const first = await enrolBundledCell(db, userId, id);
      expect(first).toMatchObject({
        success: true,
        cardsReused: cell.transfers,
      });
      let created = first.cardsCreated;
      for (let round = 0; round < 5; round++) {
        const next = await enrolBundledCell(db, userId, id);
        if (next.cardsCreated === 0) break;
        created += next.cardsCreated;
      }
      expect(created).toBe(cell.items - cell.transfers);
      const after = await snapshot();
      expect(after.cards).toHaveLength(
        oldItems.length + cell.items - cell.transfers,
      );
      for (const group of ["cards", "reviews"] as const) {
        for (const row of before[group]) {
          const next = after[group].find((other) => other.id === row.id)!;
          expect(withoutToken(next)).toEqual(withoutToken(row));
          const old = String(row.token_id);
          expect(next.token_id).toBe(transfers.get(old) ?? old);
        }
      }
      for (const item of oldItems) {
        expect(
          Boolean((await getTokenById(db, item.id))?.deprecated_at),
          item.id,
        ).toBe(transfers.has(item.id) || retiredIds.has(item.id));
      }

      expect(await enrolBundledCell(db, userId, id)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(after);
    });
  });
});

describe.each(MITTELSCHULE_CELLS)("ZAM Academy $app cell", (cell) => {
  const id = `zam-academy:${cell.app}`;
  const tile = getBundledCellTile(id)!;
  const items = tile.atoms.flatMap((atom) => atom.practice_items);
  const scope = (changes: Record<string, unknown> = {}) => ({
    provider: "lehrplanplus-bayern",
    schoolType: "mittelschule",
    grade: cell.grade,
    subject: cell.subject,
    ...changes,
  });

  it("bundles the published cell with clean German lesson links", () => {
    expect(tile.version).toBe(cell.version);
    expect(getBundledCell(id)).toMatchObject({
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: cell.atoms,
      preview: false,
    });
    expect(items).toHaveLength(cell.items);
    for (const item of items) {
      expect(item.source_link, item.id).toMatch(
        new RegExp(
          `^https://academy\\.zam-os\\.org/${cell.app}/#lesson=[a-z0-9-]+$`,
        ),
      );
      expect(item.language, item.id).toBe("de");
    }
  });

  it("matches every supported Mittelschule track code and skips other scopes", () => {
    for (const track of cell.tracks) {
      const s = scope(track ? { track } : {});
      expect(
        findBundledCellsForScope(s).map((c) => c.id),
        track ?? "default",
      ).toContain(id);
      expect(needsGenericCurriculumImport(s)).toBe(false);
    }
    for (const other of [
      scope({ grade: cell.grade - 1 }),
      scope({ grade: cell.grade + 1 }),
      scope({ schoolType: "realschule" }),
      scope({ subject: cell.subject === "deutsch" ? "mathematik" : "deutsch" }),
    ]) {
      expect(findBundledCellsForScope(other).map((c) => c.id)).not.toContain(
        id,
      );
    }
  });

  describe("enrolment", () => {
    let dir: string;
    let db: Database;
    const userId = `learner-${cell.app}`;

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), `zam-academy-${cell.app}-`));
      db = await openDatabase({
        dbPath: join(dir, "test.db"),
        useConfiguredCloud: false,
      });
    });
    afterEach(async () => {
      await db.close();
      rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
    });

    it("enrols every item into one library topic without duplicating on repeat", async () => {
      expect(await enrolBundledCell(db, userId, id)).toMatchObject({
        success: true,
        cardsCreated: cell.items,
      });
      const app = `https://academy.zam-os.org/${cell.app}/`;
      expect(
        (await listLibraryTopics(db, userId)).filter(
          (topic) => topic.key === app,
        ),
      ).toEqual([expect.objectContaining({ itemCount: cell.items })]);
      expect(await enrolBundledCell(db, userId, id)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
    });
  });
});
