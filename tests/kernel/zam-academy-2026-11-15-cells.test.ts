import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
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

// The five Academy cells newly bundled in 0.65.0:
// - 3 approved migration cells (biologie-gymnasium-5, englisch-gymnasium-5,
//   informatik-gymnasium-6)
// - 2 unmapped cells (englisch-mittelschule-5, nt-mittelschule-6 [preview])

interface Mapping {
  status: string;
  approved: string | null;
  // Informatik 6 names the snapshot `fixture`, the others `file`.
  sources: Array<{
    file?: string;
    fixture?: string;
    sha256: string;
    tile_id?: string;
  }>;
  rows: Array<{
    de_by_cell: string;
    de_by_id: string;
    category: string;
    action?: string;
    academy_slug: string | null;
  }>;
}

// Old cells an approved mapping draws from that stay bundled and active.
const ACTIVE_KEEP_CELLS = new Set([
  "de-by:gymnasium-5-englisch-starter-grammar-tenses",
  "de-by:gymnasium-6-natur-technik-informatik-vektorgrafik-texte",
]);

const MAPPED_CELLS = [
  {
    app: "biologie-gymnasium-5",
    version: "2026.11.1",
    atoms: 44,
    items: 88,
    provider: "lehrplanplus-bayern",
    schoolType: "gymnasium",
    grade: 5,
    subject: "nt_gym",
    approved: "2026-11-14",
    transfers: 4,
    retired: 1,
    kept: 19,
  },
  {
    app: "englisch-gymnasium-5",
    version: "2026.11.2",
    atoms: 40,
    items: 120,
    provider: "lehrplanplus-bayern",
    schoolType: "gymnasium",
    grade: 5,
    subject: "englisch",
    approved: "2026-11-15",
    transfers: 4,
    retired: 0,
    kept: 4,
  },
  {
    app: "informatik-gymnasium-6",
    version: "2026.11.2",
    atoms: 12,
    items: 36,
    provider: "lehrplanplus-bayern",
    schoolType: "gymnasium",
    grade: 6,
    subject: "nt_gym",
    approved: "2026-11-15",
    transfers: 2,
    retired: 0,
    kept: 6,
  },
] as const;

const UNMAPPED_CELLS = [
  {
    app: "englisch-mittelschule-5",
    version: "2026.11.1",
    atoms: 36,
    items: 108,
    schoolType: "mittelschule",
    grade: 5,
    subject: "englisch",
    tracks: [undefined],
    preview: false,
  },
  {
    app: "nt-mittelschule-6",
    version: "2026.11.2",
    atoms: 38,
    items: 114,
    schoolType: "mittelschule",
    grade: 6,
    subject: "nt",
    tracks: [undefined],
    preview: false,
  },
] as const;

const fixtures = join(__dirname, "../fixtures");
const sha256 = (path: string) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");

function resolveSourceFixturePath(filePath: string): {
  path: string;
  retired: boolean;
} {
  const name = filePath.split("/").pop() as string;
  // Upstream snapshots may drop the "-kvt" suffix our fixtures carry.
  for (const base of [name, name.replace(/(?<!-kvt)\.json$/, "-kvt.json")]) {
    const legacyPath = join(fixtures, "legacy", base);
    if (existsSync(legacyPath)) {
      return { path: legacyPath, retired: true };
    }
    const activePath = join(fixtures, "curriculum", base);
    if (existsSync(activePath)) {
      return { path: activePath, retired: false };
    }
  }
  throw new Error(`Missing source fixture for ${filePath}`);
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
      .filter((row) => row.category === "A" || row.category === "B")
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
  const oldTiles = mapping.sources.map((source) => {
    const resolved = resolveSourceFixturePath(
      (source.file ?? source.fixture) as string,
    );
    return {
      tile: JSON.parse(readFileSync(resolved.path, "utf8")) as KvtTile,
      retired: resolved.retired,
      resolvedPath: resolved.path,
      source,
    };
  });
  const oldItems = oldTiles.flatMap(({ tile: old }) =>
    old.atoms.flatMap((atom) => atom.practice_items),
  );
  const scope = (changes: Record<string, unknown> = {}) => ({
    provider: cell.provider,
    schoolType: cell.schoolType,
    grade: cell.grade,
    subject: cell.subject,
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

  it("matches discovery at its curriculum scope and retires only superseded school cells", () => {
    const offered = findBundledCellsForScope(scope()).map((c) => c.id);
    expect(offered).toContain(id);
    expect(needsGenericCurriculumImport(scope())).toBe(false);

    for (const { tile: old, retired } of oldTiles) {
      if (ACTIVE_KEEP_CELLS.has(old.tile_id)) {
        expect(retired).toBe(false);
        expect(getBundledCell(old.tile_id)).toBeDefined();
      } else {
        expect(retired).toBe(true);
        expect(getBundledCell(old.tile_id)).toBeUndefined();
        expect(offered).not.toContain(old.tile_id);
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

  it("declares exactly the approved transfers and kept C rows of its pinned mapping", () => {
    expect(mapping.approved).toBe(cell.approved);
    expect(mapping.status).toBe("approved");
    for (const { source, resolvedPath } of oldTiles) {
      expect(sha256(resolvedPath), resolvedPath).toBe(source.sha256);
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

    it("moves approved histories, keeps C cards active, and refuses collisions", async () => {
      for (const { tile: oldTile } of oldTiles) {
        await installKvtTile(db, oldTile);
      }
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

      // Collision guard: a learner holding reviewed cards on both an old A item
      // and its successor fails instead of silently merging two histories.
      const collisionUser = `${userId}-collision`;
      const [[oldItemId, nextItemId]] = [...transfers.entries()];
      for (const { tile: oldTile } of oldTiles) {
        await installKvtTile(db, oldTile);
      }
      await installKvtTile(db, tile);
      for (const itemId of [oldItemId, nextItemId]) {
        const card = await ensureCard(db, itemId, collisionUser);
        await evaluateRating(db, {
          cardId: card.id,
          tokenId: itemId,
          userId: collisionUser,
          rating: 3,
          answerFormat: "recall",
          responseTimeMs: 1200,
          now: new Date("2026-09-02T12:00:00Z"),
        });
      }
      await expect(enrolBundledCell(db, collisionUser, id)).rejects.toThrow();
    });
  });
});

describe.each(UNMAPPED_CELLS)("ZAM Academy $app cell", (cell) => {
  const id = `zam-academy:${cell.app}`;
  const tile = getBundledCellTile(id)!;
  const items = tile.atoms.flatMap((atom) => atom.practice_items);
  const mapping = JSON.parse(
    readFileSync(
      join(fixtures, "legacy", `zam-academy-${cell.app}-replaces-de-by.json`),
      "utf8",
    ),
  ) as Mapping;
  const scope = (changes: Record<string, unknown> = {}) => ({
    provider: "lehrplanplus-bayern",
    schoolType: cell.schoolType,
    grade: cell.grade,
    subject: cell.subject,
    ...changes,
  });

  it("bundles the published cell with empty mapping and clean German lesson links", () => {
    expect(tile.version).toBe(cell.version);
    expect(getBundledCell(id)).toMatchObject({
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: cell.atoms,
      preview: cell.preview,
    });
    expect(items).toHaveLength(cell.items);
    expect(tile.retired_items ?? []).toEqual([]);
    expect(items.filter((i) => i.replaces?.length)).toEqual([]);
    expect(mapping).toMatchObject({
      status: "proposal-only",
      approved: null,
      sources: [],
      rows: [],
    });
    for (const item of items) {
      expect(item.source_link, item.id).toMatch(
        new RegExp(
          `^https://academy\\.zam-os\\.org/${cell.app}/#lesson=[a-z0-9-]+$`,
        ),
      );
      expect(item.language, item.id).toBe("de");
    }
  });

  it("matches its curriculum scope and supported tracks while skipping other scopes", () => {
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
      scope({
        schoolType:
          cell.schoolType === "gymnasium" ? "mittelschule" : "gymnasium",
      }),
      scope({
        subject: cell.subject === "mathematik" ? "deutsch" : "mathematik",
      }),
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
