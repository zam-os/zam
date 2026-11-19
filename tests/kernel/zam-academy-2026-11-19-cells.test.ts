import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  enrolBundledCell,
  ensureCard,
  evaluateRating,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellTile,
  installKvtTile,
  type KvtTile,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";

interface Mapping {
  approved: string | null;
  sources: { file: string; tile_id?: string; sha256: string }[];
  rows: {
    old_id?: string;
    de_by_id?: string;
    academy_slug?: string;
    category: string;
    action: string;
  }[];
}

const cells = [
  {
    app: "deutsch-gymnasium-6",
    schoolType: "gymnasium",
    grade: 6,
    subject: "deutsch",
    version: "2026.11.1",
    lessons: 49,
    items: 98,
    replacements: 0,
  },
  {
    app: "englisch-gymnasium-6",
    schoolType: "gymnasium",
    grade: 6,
    subject: "englisch",
    version: "2026.11.1",
    lessons: 40,
    items: 120,
    replacements: 3,
  },
  {
    app: "geographie-realschule-6",
    schoolType: "realschule",
    grade: 6,
    subject: "geographie",
    version: "2026.11.2",
    lessons: 25,
    items: 50,
    replacements: 3,
  },
  {
    app: "geschichte-gymnasium-6",
    schoolType: "gymnasium",
    grade: 6,
    subject: "geschichte",
    version: "2026.11.1",
    lessons: 36,
    items: 72,
    replacements: 8,
  },
  {
    app: "geschichte-realschule-6",
    schoolType: "realschule",
    grade: 6,
    subject: "geschichte",
    version: "2026.11.1",
    lessons: 42,
    items: 126,
    replacements: 4,
  },
  {
    app: "biologie-gymnasium-6",
    schoolType: "gymnasium",
    subject: "nt_gym",
    grade: 6,
    version: "2026.11.2",
    lessons: 44,
    items: 88,
    replacements: 3,
  },
  {
    app: "deutsch-gymnasium-5",
    schoolType: "gymnasium",
    subject: "deutsch",
    grade: 5,
    version: "2026.11.2",
    lessons: 50,
    items: 100,
    replacements: 1,
  },
  {
    app: "deutsch-realschule-6",
    schoolType: "realschule",
    subject: "deutsch",
    grade: 6,
    version: "2026.11.2",
    lessons: 50,
    items: 100,
    replacements: 4,
  },
  {
    app: "englisch-realschule-6",
    schoolType: "realschule",
    subject: "englisch",
    grade: 6,
    version: "2026.11.2",
    lessons: 42,
    items: 126,
    replacements: 5,
  },
  {
    app: "physik-realschule-7",
    schoolType: "realschule",
    subject: "physik",
    grade: 7,
    version: "2026.11.2",
    lessons: 24,
    items: 73,
    replacements: 2,
    track: "I",
  },
] as const;

const fixtures = join(__dirname, "../fixtures");
const retiredTiles = new Set([
  "de-by:gymnasium-5-deutsch-erzaehlen-maerchen-fabeln",
  "de-by:gymnasium-5-deutsch-grammatik-faelle-rechtschreibung",
  "de-by:gymnasium-6-biologie-fische-amphibien-reptilien-evolution",
  "de-by:gymnasium-6-biologie-saeugetiere-voegel-leichtbau-flug",
  "de-by:realschule-6-deutsch-texte-bericht-vorgangsbeschreibung",
  "de-by:realschule-6-deutsch-wortarten-satzglieder-rechtschreibung",
  "de-by:realschule-6-englisch-grammatik-grundlagen",
  "de-by:realschule-7-physik-mechanik-bewegung-geschwindigkeit",
  "de-by:realschule-7-physik-waermelehre-temperatur-ausdehnung",
  "de-by:realschule-6-geographie-deutschland-bayern-raum",
  "de-by:realschule-6-geschichte-urgeschichte-antike",
  "de-by:gymnasium-6-englisch-past-tenses-present-perfect-adjectives",
  "de-by:gymnasium-6-geschichte-urgeschichte-aegypten-griechenland",
  "de-by:gymnasium-6-geschichte-rom-imperium-limes-bayern",
]);

describe.each(cells)("ZAM Academy $app in 0.66.0", (cell) => {
  const id = `zam-academy:${cell.app}`;
  const tile = getBundledCellTile(id)!;
  const scope = {
    provider: "lehrplanplus-bayern",
    schoolType: cell.schoolType,
    subject: cell.subject,
    grade: cell.grade,
    ...("track" in cell ? { track: cell.track } : {}),
  };
  const mapping = JSON.parse(
    readFileSync(
      join(fixtures, "legacy", `zam-academy-${cell.app}-replaces-de-by.json`),
      "utf8",
    ),
  ) as Mapping;
  const oldTiles = mapping.sources.map((source) => {
    const fileName = source.file.split("/").at(-1)!;
    const tileId =
      source.tile_id ??
      fileName.replace(/^de-by-/, "de-by:").replace(/-kvt\.json$/, "");
    const retired = retiredTiles.has(tileId);
    const folder = retired ? "legacy" : "curriculum";
    const bytes = readFileSync(join(fixtures, folder, fileName));
    return {
      source,
      tileId,
      retired,
      fileName,
      bytes,
      tile: JSON.parse(bytes.toString("utf8")) as KvtTile,
    };
  });
  const oldItems = oldTiles.flatMap(({ tile: old }) =>
    old.atoms.flatMap((atom) => atom.practice_items),
  );
  const items = tile.atoms.flatMap((atom) => atom.practice_items);
  const replacements = mapping.rows
    .filter((row) => row.category === "A" || row.category === "B")
    .map(
      (row) =>
        [
          row.old_id ?? row.de_by_id!,
          items.find((item) => item.slug === row.academy_slug)!.id,
        ] as const,
    );

  it("offers the Academy cell with the published edition only in its curriculum scope", () => {
    expect(tile.version).toBe(cell.version);
    expect(tile.atoms).toHaveLength(cell.lessons);
    expect(items).toHaveLength(cell.items);
    expect(findBundledCellsForScope(scope).map((c) => c.id)).toContain(id);
    expect(needsGenericCurriculumImport(scope)).toBe(false);
    for (const grade of [cell.grade - 1, cell.grade + 1])
      expect(
        findBundledCellsForScope({ ...scope, grade }).map((c) => c.id),
      ).not.toContain(id);
    for (const item of items)
      expect(item.source_link).toMatch(
        new RegExp(
          `^https://academy\\.zam-os\\.org/${cell.app}/#lesson=[a-z0-9-]+$`,
        ),
      );
  });

  it("matches the approved transfers and preserves the original source fixtures", () => {
    expect(
      mapping.rows.map((row) => row.old_id ?? row.de_by_id).sort(),
    ).toEqual(oldItems.map((item) => item.id).sort());
    if (replacements.length > 0)
      expect(mapping.approved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    else expect(mapping.approved).toBeNull();
    expect(replacements).toHaveLength(cell.replacements);
    expect(
      items
        .flatMap((item) => (item.replaces ?? []).map((old) => [old, item.id]))
        .sort(),
    ).toEqual([...replacements].sort());
    expect(tile.retired_items ?? []).toEqual([]);
    for (const { source, tileId, retired, fileName, bytes } of oldTiles) {
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        source.sha256,
      );
      if (retired) {
        expect(getBundledCell(tileId)).toBeUndefined();
        expect(existsSync(join(fixtures, "curriculum", fileName))).toBe(false);
      } else {
        expect(getBundledCell(tileId)).toBeDefined();
      }
    }
  });

  it("enrols once and preserves review histories for both mapped and keep-active cards", async () => {
    const dir = mkdtempSync(join(tmpdir(), "zam-066-academy-"));
    const db = await openDatabase({
      dbPath: join(dir, "library.db"),
      useConfiguredCloud: false,
    });
    const user = "release-test";
    try {
      for (const { tile: old } of oldTiles) await installKvtTile(db, old);
      const originalCards = new Map<string, string>();
      for (const item of oldItems) {
        const card = await ensureCard(db, item.id, user);
        await evaluateRating(db, {
          cardId: card.id,
          tokenId: item.id,
          userId: user,
          rating: 3,
          answerFormat: "recall",
        });
        originalCards.set(item.id, card.id);
      }
      const reviewSnapshot = (await db
        .prepare("SELECT * FROM review_logs ORDER BY id")
        .all()) as Record<string, unknown>[];
      const cardSnapshot = (await db
        .prepare("SELECT * FROM cards ORDER BY id")
        .all()) as Record<string, unknown>[];
      expect(reviewSnapshot).toHaveLength(oldItems.length);
      const updatedEvidence = (rows: Record<string, unknown>[]) =>
        rows.map((row) => ({
          ...row,
          token_id: expectedTokens.get(String(row.token_id)) ?? row.token_id,
        }));
      const expectedTokens = new Map(replacements);
      const first = await enrolBundledCell(db, user, id);
      expect(first).toMatchObject({
        success: true,
        cardsReused: replacements.length,
      });
      let cardsCreated = first.cardsCreated;
      // An atom with an existing card adds at most one missing sibling per enrolment.
      while (cardsCreated < cell.items - replacements.length) {
        const next = await enrolBundledCell(db, user, id);
        expect(next.success).toBe(true);
        expect(next.cardsCreated).toBeGreaterThan(0);
        cardsCreated += next.cardsCreated;
      }
      expect(cardsCreated).toBe(cell.items - replacements.length);
      for (const [oldId, cardId] of originalCards) {
        expect(
          await db
            .prepare("SELECT id, token_id, reps FROM cards WHERE id = ?")
            .get(cardId),
        ).toMatchObject({
          id: cardId,
          token_id: expectedTokens.get(oldId) ?? oldId,
          reps: 1,
        });
      }
      const cardsAfter = (await db
        .prepare("SELECT * FROM cards ORDER BY id")
        .all()) as Record<string, unknown>[];
      expect(
        cardsAfter.filter((card) =>
          cardSnapshot.some(({ id }) => id === card.id),
        ),
      ).toEqual(updatedEvidence(cardSnapshot));
      expect(
        await db.prepare("SELECT * FROM review_logs ORDER BY id").all(),
      ).toEqual(updatedEvidence(reviewSnapshot));
      expect(await enrolBundledCell(db, user, id)).toMatchObject({
        success: true,
        cardsCreated: 0,
      });
    } finally {
      await db.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
