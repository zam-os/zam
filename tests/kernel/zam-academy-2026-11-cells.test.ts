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

// The nine Academy cells first bundled in November 2026: the first Gymnasium
// cells (Mathematik 5, 6, 11, 12, 13) and the first grade 5/6 Realschule
// cells, plus Geographie 8. Their superseded de-by school cells have now
// retired from tests/fixtures/curriculum/ to tests/fixtures/legacy/.
//
// Thomas approved the mappings in tests/fixtures/legacy/ (byte-exact copies of
// each package's replaces-de-by.json): Mathematik 5/11/12/13 Gymnasium before
// their first publication, Englisch 5, Mathematik 5/6 Realschule and
// Mathematik 6 Gymnasium on 2026-11-08, published as 2026.11.2. Every A row
// moves exactly one history to its successor; C rows stay active in existing
// libraries; nothing is retired. Geographie 8 maps all four old cards as C and
// keeps existing learner histories intact on enrolment.
interface Mapping {
  status: string;
  approved: string | null;
  sources: Array<{ file: string; sha256: string }>;
  rows: Array<{
    de_by_cell: string;
    de_by_id: string;
    category: string;
    academy_slug: string | null;
  }>;
}

const CELLS = [
  {
    app: "englisch-realschule-5",
    version: "2026.11.2",
    atoms: 43,
    items: 86,
    schoolType: "realschule",
    grade: 5,
    subject: "englisch",
    language: "en",
    approved: "2026-11-08",
    transfers: 4,
    kept: 4,
  },
  {
    app: "geographie-realschule-8",
    version: "2026.10.1",
    atoms: 34,
    items: 68,
    schoolType: "realschule",
    grade: 8,
    subject: "geographie",
    language: "de",
    approved: null,
    transfers: 0,
    kept: 4,
  },
  {
    app: "mathematik-realschule-5",
    version: "2026.11.2",
    atoms: 52,
    items: 156,
    schoolType: "realschule",
    grade: 5,
    subject: "mathematik",
    language: "de",
    approved: "2026-11-08",
    transfers: 8,
    kept: 8,
  },
  {
    app: "mathematik-realschule-6",
    version: "2026.11.2",
    atoms: 47,
    items: 141,
    schoolType: "realschule",
    grade: 6,
    subject: "mathematik",
    language: "de",
    approved: "2026-11-08",
    transfers: 6,
    kept: 10,
  },
  {
    app: "mathematik-gymnasium-5",
    version: "2026.11.1",
    atoms: 55,
    items: 165,
    schoolType: "gymnasium",
    grade: 5,
    subject: "mathematik",
    language: "de",
    approved: "2026-11-07",
    transfers: 5,
    kept: 11,
  },
  {
    app: "mathematik-gymnasium-6",
    version: "2026.11.2",
    atoms: 47,
    items: 141,
    schoolType: "gymnasium",
    grade: 6,
    subject: "mathematik",
    language: "de",
    approved: "2026-11-08",
    transfers: 7,
    kept: 9,
  },
  {
    app: "mathematik-gymnasium-11",
    version: "2026.11.1",
    atoms: 28,
    items: 84,
    schoolType: "gymnasium",
    grade: 11,
    subject: "mathematik",
    language: "de",
    approved: "2026-11-08",
    transfers: 1,
    kept: 15,
  },
  {
    app: "mathematik-gymnasium-12",
    version: "2026.11.1",
    atoms: 30,
    items: 90,
    schoolType: "gymnasium",
    grade: 12,
    subject: "mathematik",
    language: "de",
    approved: "2026-11-08",
    transfers: 2,
    kept: 10,
  },
  {
    app: "mathematik-gymnasium-13",
    version: "2026.11.1",
    atoms: 27,
    items: 84,
    schoolType: "gymnasium",
    grade: 13,
    subject: "mathematik",
    language: "de",
    approved: "2026-11-08",
    transfers: 5,
    kept: 7,
    preview: true,
  },
] as const;

const fixtures = join(__dirname, "../fixtures");
const sha256 = (path: string) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

describe.each(CELLS)("ZAM Academy $app cell", (cell) => {
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
  const oldTiles = mapping.sources.map(
    (source) =>
      JSON.parse(
        readFileSync(
          join(fixtures, "legacy", source.file.split("/").pop() as string),
          "utf8",
        ),
      ) as KvtTile,
  );
  const oldCellIds = oldTiles.map((old) => old.tile_id);
  const oldItems = oldTiles.flatMap((old) =>
    old.atoms.flatMap((atom) => atom.practice_items),
  );
  const scope = (changes: Record<string, unknown> = {}) => ({
    provider: "lehrplanplus-bayern",
    schoolType: cell.schoolType,
    grade: cell.grade,
    subject: cell.subject,
    ...changes,
  });

  it("bundles the published cell", () => {
    expect(tile.version).toBe(cell.version);
    expect(getBundledCell(id)).toMatchObject({
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: cell.atoms,
      preview: "preview" in cell,
    });
    expect(items).toHaveLength(cell.items);
    expect(tile.retired_items ?? []).toEqual([]);
  });

  it("is offered at its grade while the retired school cells stay unbundled, and nowhere else", () => {
    const offered = findBundledCellsForScope(scope()).map((c) => c.id);
    expect(offered).toContain(id);
    for (const oldCell of oldCellIds) {
      expect(getBundledCell(oldCell)).toBeUndefined();
      expect(offered).not.toContain(oldCell);
    }
    expect(needsGenericCurriculumImport(scope())).toBe(false);
    for (const other of [
      scope({ grade: cell.grade - 1 }),
      scope({ grade: cell.grade + 1 }),
      scope({
        schoolType:
          cell.schoolType === "gymnasium" ? "realschule" : "gymnasium",
      }),
    ])
      expect(findBundledCellsForScope(other).map((c) => c.id)).not.toContain(
        id,
      );
  });

  it("links every card to a lesson of its own app", () => {
    for (const item of items) {
      expect(item.source_link, item.id).toMatch(
        new RegExp(
          `^https://academy\\.zam-os\\.org/${cell.app}/#lesson=[a-z0-9-]+$`,
        ),
      );
      expect(item.language, item.id).toBe(cell.language);
    }
  });

  it("declares exactly the approved transfers of its pinned mapping", () => {
    expect(mapping.approved).toBe(cell.approved);
    expect(mapping.status).toBe(cell.approved ? "approved" : "proposal-only");
    // The mapping was made against the archived school cells in fixtures/legacy/.
    for (const source of mapping.sources)
      expect(
        sha256(
          join(fixtures, "legacy", source.file.split("/").pop() as string),
        ),
        source.file,
      ).toBe(source.sha256);
    expect(mapping.rows.map((row) => row.de_by_id).sort()).toEqual(
      oldItems.map((item) => item.id).sort(),
    );
    expect(transfers.size).toBe(cell.transfers);
    expect(mapping.rows.filter((row) => row.category === "C")).toHaveLength(
      cell.kept,
    );
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

    it("moves each approved history and keeps every other old card as it was", async () => {
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
      // On an atom where the learner already holds the moved card, each
      // enrolment adds one new sibling; the others follow on later rounds.
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
      for (const group of ["cards", "reviews"] as const)
        for (const row of before[group]) {
          const next = after[group].find((other) => other.id === row.id)!;
          expect(withoutToken(next)).toEqual(withoutToken(row));
          const old = String(row.token_id);
          expect(next.token_id).toBe(transfers.get(old) ?? old);
        }
      for (const item of oldItems)
        expect(
          Boolean((await getTokenById(db, item.id))?.deprecated_at),
          item.id,
        ).toBe(transfers.has(item.id));

      expect(await enrolBundledCell(db, userId, id)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(after);
    });
  });
});

describe("the November 2026 Academy cells in the lock", () => {
  it("record only Mathematik 13 Gymnasium as a preview", () => {
    const lock = JSON.parse(
      readFileSync(
        join(fixtures, "curriculum", "zam-academy-cells.lock.json"),
        "utf8",
      ),
    ) as Array<{ id: string; preview?: boolean }>;
    expect(
      lock
        .filter((entry) =>
          CELLS.some((cell) => entry.id === `zam-academy:${cell.app}`),
        )
        .filter((entry) => entry.preview)
        .map((entry) => entry.id),
    ).toEqual(["zam-academy:mathematik-gymnasium-13"]);
  });
});
