import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  enrolBundledCell,
  ensureCard,
  evaluateRating,
  findBundledCellsForScope,
  getBundledCellTile,
  installKvtTile,
  type KvtTile,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";

const cells = [
  ["bwr-realschule-7", "realschule", 7, "bwr", "2026.11.2", 36, 72],
  ["deutsch-gymnasium-7", "gymnasium", 7, "deutsch", "2026.11.1", 50, 100],
  ["englisch-realschule-7", "realschule", 7, "englisch", "2026.11.2", 45, 135],
  [
    "franzoesisch-realschule-7",
    "realschule",
    7,
    "franzoesisch",
    "2026.11.1",
    54,
    162,
  ],
  ["geographie-gymnasium-7", "gymnasium", 7, "geographie", "2026.11.2", 23, 46],
  [
    "geschichte-realschule-7",
    "realschule",
    7,
    "geschichte",
    "2026.11.2",
    41,
    123,
  ],
] as const;

interface Mapping {
  approved: string | null;
  sources: { file: string; tile_id: string; sha256: string }[];
  rows: {
    de_by_id: string;
    category: "A" | "B" | "C";
    academy_slug: string | null;
  }[];
}

const fixtures = join(__dirname, "../fixtures");

const approvals: Readonly<Record<string, { count: number; date: string }>> = {
  "bwr-realschule-7": { count: 4, date: "2026-11-22" },
  "deutsch-gymnasium-7": { count: 3, date: "2026-11-22" },
  "englisch-realschule-7": { count: 2, date: "2026-11-21" },
  "franzoesisch-realschule-7": { count: 2, date: "2026-11-22" },
  "geographie-gymnasium-7": { count: 2, date: "2026-11-22" },
  "geschichte-realschule-7": { count: 4, date: "2026-11-22" },
};

const tracksByApp: Readonly<Record<string, readonly string[]>> = {
  "bwr-realschule-7": ["II", "IIIa"],
  "franzoesisch-realschule-7": ["IIIa"],
};

function readMapping(app: string): Mapping {
  return JSON.parse(
    readFileSync(
      join(fixtures, "legacy", `zam-academy-${app}-replaces-de-by.json`),
      "utf8",
    ),
  );
}

function readSourceFixture(fileName: string): Buffer {
  const inCurriculum = join(fixtures, "curriculum", basename(fileName));
  if (existsSync(inCurriculum)) return readFileSync(inCurriculum);
  return readFileSync(join(fixtures, "legacy", basename(fileName)));
}

describe.each(cells)(
  "ZAM Academy %s in 0.68.0",
  (app, schoolType, grade, subject, version, lessons, count) => {
    const id = `zam-academy:${app}`;
    const scope = {
      provider: "lehrplanplus-bayern",
      schoolType,
      grade,
      subject,
    };

    it("discovers the published lessons and cards in the intended curriculum", () => {
      const tile = getBundledCellTile(id)!;
      const items = tile.atoms.flatMap((atom) => atom.practice_items);
      expect(tile.version).toBe(version);
      expect(tile.atoms).toHaveLength(lessons);
      expect(items).toHaveLength(count);
      expect(findBundledCellsForScope(scope).map((cell) => cell.id)).toContain(
        id,
      );
      expect(needsGenericCurriculumImport(scope)).toBe(false);
      for (const otherGrade of [grade - 1, grade + 1]) {
        expect(
          findBundledCellsForScope({ ...scope, grade: otherGrade }).map(
            (cell) => cell.id,
          ),
        ).not.toContain(id);
      }
      for (const track of tracksByApp[app] ?? []) {
        expect(
          findBundledCellsForScope({ ...scope, track }).map((cell) => cell.id),
        ).toContain(id);
      }
      for (const item of items) {
        const url = new URL(item.source_link!);
        expect(url.origin).toBe("https://academy.zam-os.org");
        expect(url.pathname).toBe(`/${app}/`);
        expect(url.hash).toMatch(/^#lesson=[a-z0-9-]+$/);
      }
    });

    it("enrols the published cards and applies only the approved transfers", async () => {
      const tile = getBundledCellTile(id)!;
      const items = tile.atoms.flatMap((atom) => atom.practice_items);
      const mapping = readMapping(app);
      const replacements = new Map(
        mapping.rows
          .filter((row) => row.category === "A" || row.category === "B")
          .map((row) => [
            row.de_by_id,
            items.find((item) => item.slug === row.academy_slug)!.id,
          ]),
      );
      const declared = items.flatMap((item) =>
        (item.replaces ?? []).map((oldId) => [oldId, item.id]),
      );
      expect(declared.sort()).toEqual([...replacements].sort());
      expect(tile.retired_items ?? []).toEqual([]);
      expect(replacements.size).toBe(approvals[app].count);
      expect(mapping.approved).toBe(approvals[app].date);

      const dir = mkdtempSync(join(tmpdir(), "zam-068-academy-"));
      const db = await openDatabase({
        dbPath: join(dir, "library.db"),
        useConfiguredCloud: false,
      });
      const userId = "release-test";
      try {
        const oldItems = [];
        for (const source of mapping.sources) {
          const bytes = readSourceFixture(source.file);
          expect(createHash("sha256").update(bytes).digest("hex")).toBe(
            source.sha256,
          );
          const legacy = JSON.parse(bytes.toString("utf8")) as KvtTile;
          await installKvtTile(db, legacy);
          oldItems.push(...legacy.atoms.flatMap((atom) => atom.practice_items));
        }
        expect(mapping.rows.map((row) => row.de_by_id).sort()).toEqual(
          oldItems.map((item) => item.id).sort(),
        );
        for (const item of oldItems) {
          const card = await ensureCard(db, item.id, userId);
          await evaluateRating(db, {
            cardId: card.id,
            tokenId: item.id,
            userId,
            rating: 3,
            answerFormat: "recall",
          });
        }
        const cards = db.prepare(
          "SELECT id, token_id, reps FROM cards WHERE reps > 0 ORDER BY id",
        );
        const reviews = db.prepare("SELECT * FROM review_logs ORDER BY id");
        const afterTransfer = (rows: { token_id: string }[]) =>
          rows.map((row) => ({
            ...row,
            token_id: replacements.get(row.token_id) ?? row.token_id,
          }));
        const expectedCards = afterTransfer(
          (await cards.all()) as { token_id: string }[],
        );
        const expectedReviews = afterTransfer(
          (await reviews.all()) as { token_id: string }[],
        );
        const first = await enrolBundledCell(db, userId, id);
        expect(first).toMatchObject({
          success: true,
          cardsReused: replacements.size,
        });
        let created = first.cardsCreated;
        while (created < count - replacements.size) {
          const next = await enrolBundledCell(db, userId, id);
          expect(next.success).toBe(true);
          expect(next.cardsCreated).toBeGreaterThan(0);
          created += next.cardsCreated;
        }
        expect(created).toBe(count - replacements.size);
        expect(await enrolBundledCell(db, userId, id)).toMatchObject({
          success: true,
          cardsCreated: 0,
        });
        expect(await cards.all()).toEqual(expectedCards);
        expect(await reviews.all()).toEqual(expectedReviews);
      } finally {
        await db.close();
        rmSync(dir, { recursive: true, force: true });
      }
    });
  },
);
