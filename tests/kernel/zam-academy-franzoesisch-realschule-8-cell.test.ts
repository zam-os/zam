import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deriveSchule,
  loadBindings,
  loadUnits,
  weltwissenSeedRows,
} from "../../src/kernel/atlas/index.js";
import {
  buildReviewQueue,
  type Database,
  enrolBundledCell,
  ensureCard,
  evaluateRating,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellTile,
  getTokenById,
  installKvtTile,
  kvtItemPlainTexts,
  listLibraryTopics,
  needsGenericCurriculumImport,
  openDatabase,
  reconcileInstalledBundledTiles,
} from "../../src/kernel/index.js";
import mapping from "../fixtures/legacy/zam-academy-franzoesisch-realschule-8-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:franzoesisch-realschule-8";
const APP = "https://academy.zam-os.org/franzoesisch-realschule-8/";
const LEGACY_ID =
  "de-by:realschule-8-franzoesisch-passe-compose-relativsaetze-adjektive";
const tile = getBundledCellTile(CELL_ID)!;
const legacy = getBundledCellTile(LEGACY_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const itemIds = new Set(items.map((item) => item.id));
const oldItems = legacy.atoms.flatMap((atom) => atom.practice_items);
const core = tile.atoms.filter(
  (atom) => atom.domain !== "franzoesisch/extension",
);
const stages = [
  "rencontres",
  "marche",
  "quotidien",
  "hier",
  "echanges",
  "voyage",
  "comprendre",
  "outils",
  "extension",
];
const scope = (track?: string, grade = 8) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject: "franzoesisch",
  ...(track ? { track } : {}),
});

describe("ZAM Academy French 8 Realschule cell", () => {
  it("bundles 40 core lessons, two optional extensions and 84 published cards", () => {
    expect(tile.version).toBe("2026.10.2");
    expect(tile.description).not.toContain("Local draft");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Französisch 8 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 42,
    });
    expect(items).toHaveLength(84);
    expect(itemIds.size).toBe(84);
    expect(new Set(tile.atoms.map((atom) => atom.id)).size).toBe(42);
    expect(new Set(tile.atoms.map((atom) => atom.slug)).size).toBe(42);
    expect(
      stages.map(
        (stage) =>
          tile.atoms.filter((atom) => atom.domain === `franzoesisch/${stage}`)
            .length,
      ),
    ).toEqual([5, 5, 5, 5, 5, 5, 5, 5, 2]);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "franzoesisch-realschule-8",
      }).find((cell) => cell.id === CELL_ID)?.inScopeAtomIds,
    ).toHaveLength(42);
  });

  it("offers the package for Grade 8 IIIa beside the active legacy cell", () => {
    for (const track of [undefined, "IIIa", "wpfg3a"]) {
      const cells = findBundledCellsForScope(scope(track));
      expect(cells.map((cell) => cell.id).sort()).toEqual(
        [CELL_ID, LEGACY_ID].sort(),
      );
      expect(
        cells
          .find((cell) => cell.id === CELL_ID)
          ?.inScopeAtomIds.slice()
          .sort(),
      ).toEqual(tile.atoms.map((atom) => atom.id).sort());
      expect(needsGenericCurriculumImport(scope(track))).toBe(false);
    }
    for (const track of ["I", "II", "IIIb", "wpfg1", "wpfg2", "wpfg3b"])
      expect(
        findBundledCellsForScope(scope(track)).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    for (const position of [
      scope("IIIa", 7),
      scope("IIIa", 9),
      scope("IIIa", 10),
      { ...scope(), schoolType: "gymnasium" },
      { ...scope(), subject: "englisch" },
    ])
      expect(
        findBundledCellsForScope(position).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    for (const atom of core) {
      const bindings = atom.curricula!.filter(
        (binding) => binding.provider === "lehrplanplus-bayern",
      );
      expect(bindings.length, atom.slug).toBeGreaterThan(0);
      for (const binding of bindings) {
        expect(binding).toMatchObject({
          school_type: "realschule",
          grade: 8,
          track: "IIIa",
          subject: "franzoesisch",
        });
        expect(binding.topic_code).toMatch(/^lb[1-5]/);
      }
    }
    for (const atom of tile.atoms.filter((atom) => !core.includes(atom)))
      expect(
        atom.curricula!.filter(
          (binding) => binding.provider === "lehrplanplus-bayern",
        ),
      ).toEqual([]);
  });

  it("keeps card links, fast checks and world-atlas placement without declaring a migration", () => {
    const { aliases } = weltwissenSeedRows();
    for (const stage of stages) {
      const area = ["hier", "echanges", "extension"].includes(stage)
        ? "grammaire"
        : stage === "voyage"
          ? "civilisation"
          : "communication";
      expect(
        aliases.find((alias) => alias.domainPrefix === `franzoesisch/${stage}`)
          ?.regionKey,
      ).toBe(`sprache.franzoesisch.${area}`);
    }
    expect(tile.retired_items ?? []).toEqual([]);
    for (const item of oldItems) expect(itemIds.has(item.id)).toBe(false);
    for (const atom of tile.atoms) {
      expect(atom.source_link).toBe(`${APP}#lesson=${atom.slug}`);
      expect(atom.practice_items.map((item) => item.tier)).toEqual([
        "tier1_fast",
        "tier2_synthesis",
      ]);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
        expect(item.replaces ?? []).toEqual([]);
      }
    }
  });

  it("pins the upstream proposal and byte-exact legacy snapshot without approving it", () => {
    // Copied unchanged from zam-os/zam-academy@8e14b52cfbc63b4b6bc1873da0fe3946ae25c94e.
    const bytes = readFileSync(
      new URL(
        "../fixtures/legacy/zam-academy-franzoesisch-realschule-8-replaces-de-by.json",
        import.meta.url,
      ),
    );
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      "7ccdcc26cfda1ed55223051825edbb464cf3aebd28e078fb45f58ddcf0cce505",
    );
    expect(mapping.status).toBe("proposal-only");
    expect(mapping.approved).toBeNull();
    expect(mapping.source_repository).toBe("zam-os/zam");
    expect(mapping.source_commit).toBe(
      "0dd65c8f58b7ece3edcf6aff1d5eced099b74e6c",
    );
    expect(mapping.sources).toHaveLength(1);
    const source = mapping.sources[0];
    const legacyBytes = readFileSync(
      new URL(
        `../fixtures/curriculum/${source.source_path.split("/").at(-1)}`,
        import.meta.url,
      ),
    );
    expect(createHash("sha256").update(legacyBytes).digest("hex")).toBe(
      source.sha256,
    );
    expect(mapping.rows.map((row) => row.de_by_id).sort()).toEqual(
      oldItems.map((item) => item.id).sort(),
    );
    expect(oldItems).toHaveLength(4);
    for (const row of mapping.rows) {
      expect(row).toMatchObject({
        category: "C",
        academy_slug: null,
        action: "keep-active",
      });
      expect(
        kvtItemPlainTexts(oldItems.find((item) => item.id === row.de_by_id)!)
          .question,
      ).toBe(row.de_by_question.replaceAll("\\rightarrow", "→"));
    }
  });

  describe("installation, enrolment and review evidence", () => {
    let dir: string;
    let db: Database;
    let userId: string;
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-french8-"));
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
        cards: (await db
          .prepare("SELECT * FROM cards ORDER BY id")
          .all()) as Array<Record<string, unknown>>,
        reviews: (await db
          .prepare("SELECT * FROM review_logs ORDER BY id")
          .all()) as Array<Record<string, unknown>>,
      };
    }

    it("projects core lessons into the school atlas and leaves optional extensions outside it", async () => {
      await installKvtTile(db, tile);
      const bindings = (await loadBindings(db)).filter(
        (binding) =>
          binding.provider === "lehrplanplus-bayern" &&
          binding.subject === "franzoesisch",
      );
      expect(new Set(bindings.map((binding) => binding.atomId)).size).toBe(40);
      const units = await loadUnits(db, { tokenIds: [...itemIds] });
      expect(units).toHaveLength(42);
      const placements = deriveSchule(
        units,
        { regions: [], aliases: [], members: [] },
        bindings,
      );
      expect(
        new Set(
          placements
            .filter((placement) => placement.path[0].key === "realschule-8")
            .map((placement) => placement.unitKey),
        ).size,
      ).toBe(40);
      for (const atom of core) {
        const unit = units.find((candidate) => candidate.atomId === atom.id)!;
        const placement = placements.find(
          (candidate) => candidate.unitKey === unit.key,
        )!;
        expect(placement.path[1]).toMatchObject({
          key: "realschule-8.franzoesisch",
          name: "Französisch",
        });
      }
      for (const atom of tile.atoms.filter((atom) => !core.includes(atom))) {
        const unit = units.find((candidate) => candidate.atomId === atom.id)!;
        expect(
          placements.find((candidate) => candidate.unitKey === unit.key)
            ?.path[0].name,
        ).toBe("Außerhalb des Lehrplans");
      }
      expect(await snapshot()).toEqual({ cards: [], reviews: [] });
    });

    it("upgrades the published wording without losing mastery or review logs", async () => {
      const bytes = readFileSync(
        new URL(
          "../fixtures/legacy/zam-academy-franzoesisch-realschule-8-2026.10.1.json",
          import.meta.url,
        ),
      );
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        "4b9b6ecae060b9a4912b7869bf431c1014164271c84e136fdeccb6abbe017c69",
      );
      const previous = JSON.parse(bytes.toString("utf8")) as typeof tile;
      expect(previous.version).toBe("2026.10.1");
      expect(
        tile.atoms.map(({ practice_items: _items, ...atom }) => atom),
      ).toEqual(
        previous.atoms.map(({ practice_items: _items, ...atom }) => atom),
      );
      const previousItems = previous.atoms.flatMap(
        (atom) => atom.practice_items,
      );
      expect(items.map((item) => item.id)).toEqual(
        previousItems.map((item) => item.id),
      );
      const edited = items.find((item) => item.slug === "f8-fetes-recall")!;
      for (const [index, item] of items.entries()) {
        const { question, ...rest } = item;
        const { question: previousQuestion, ...previousRest } =
          previousItems[index];
        expect(rest).toEqual(previousRest);
        if (item.id === edited.id) expect(question).not.toBe(previousQuestion);
        else expect(question).toBe(previousQuestion);
      }
      await installKvtTile(db, previous);
      for (const item of previousItems) {
        const card = await ensureCard(db, item.id, userId);
        await evaluateRating(db, {
          cardId: card.id,
          tokenId: item.id,
          userId,
          rating: 3,
          answerFormat: "recall",
          responseTimeMs: 1500,
          now: new Date("2026-10-24T10:00:00Z"),
        });
      }
      const before = await snapshot();
      const editedVersion = (await getTokenById(db, edited.id))!
        .content_version;
      expect(before.cards).toHaveLength(84);
      expect(before.reviews).toHaveLength(84);
      expect(await reconcileInstalledBundledTiles(db)).toMatchObject({
        reinstalled: [CELL_ID],
        failed: [],
      });
      const after = await snapshot();
      expect(after.reviews).toEqual(before.reviews);
      expect(after.cards).toHaveLength(84);
      for (const card of after.cards) {
        const old = before.cards.find((candidate) => candidate.id === card.id)!;
        if (card.token_id === edited.id) {
          // The normal material-edit policy asks for a re-review, retaining FSRS and logs.
          expect(card.due_at).not.toBe(old.due_at);
          expect({ ...card, due_at: old.due_at }).toEqual(old);
        } else expect(card).toEqual(old);
      }
      expect((await getTokenById(db, edited.id))!.content_version).toBe(
        editedVersion + 1,
      );
      expect((await reconcileInstalledBundledTiles(db)).reinstalled).toEqual(
        [],
      );
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(after);
    });

    it("enrols 84 fresh cards as one topic and presents 42 linked initial fast checks", async () => {
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual({ cards: [], reviews: [] });
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 84,
        cardsReused: 0,
      });
      const before = await snapshot();
      expect(before.cards).toHaveLength(84);
      expect(before.reviews).toEqual([]);
      expect(
        (await listLibraryTopics(db, userId)).filter(
          (topic) => topic.key === APP,
        ),
      ).toEqual([expect.objectContaining({ itemCount: 84, heldCount: 84 })]);
      const queue = await buildReviewQueue(db, {
        userId,
        tokenIds: [...itemIds],
        maxNew: 100,
        maxReviews: 100,
        buryNewSiblings: false,
        buryReviewSiblings: false,
      });
      expect(queue.items).toHaveLength(42);
      for (const entry of queue.items) {
        const source = items.find((item) => item.id === entry.tokenId)!;
        const text = kvtItemPlainTexts(source);
        expect(entry.question).toBe(text.question);
        expect(entry.concept).toBe(text.concept);
        expect(entry.sourceLink).toBe(source.source_link);
        expect(entry.tier).toBe("tier1_fast");
        expect(entry.fastCheck!.options).toHaveLength(2);
        expect(entry.fastCheck!.options[entry.fastCheck!.correctIndex]).toBe(
          text.concept,
        );
      }
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("preserves four active legacy cards and eight reviews while adding 84 unlearned cards", async () => {
      await installKvtTile(db, legacy);
      for (const [index, item] of oldItems.entries()) {
        const card = await ensureCard(db, item.id, userId);
        for (const [day, rating] of ([1, 3] as const).entries())
          await evaluateRating(db, {
            cardId: card.id,
            tokenId: item.id,
            userId,
            rating,
            answerFormat: "recall",
            responseTimeMs: 1500 + index * 100,
            now: new Date(Date.UTC(2026, 9, 23 + day, 10)),
          });
      }
      const before = await snapshot();
      const tokensBefore = await Promise.all(
        oldItems.map((item) => getTokenById(db, item.id)),
      );
      expect(before.cards).toHaveLength(4);
      expect(before.reviews).toHaveLength(8);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 84,
        cardsReused: 0,
      });
      const after = await snapshot();
      expect(
        after.cards.filter((card) => !itemIds.has(String(card.token_id))),
      ).toEqual(before.cards);
      expect(after.reviews).toEqual(before.reviews);
      expect(
        await Promise.all(oldItems.map((item) => getTokenById(db, item.id))),
      ).toEqual(tokensBefore);
      for (const card of after.cards.filter((card) =>
        itemIds.has(String(card.token_id)),
      ))
        expect(card).toMatchObject({
          state: "new",
          stability: 0,
          reps: 0,
          last_review_at: null,
        });
      const queue = await buildReviewQueue(db, {
        userId,
        tokenIds: oldItems.map((item) => item.id),
        now: new Date("2030-01-01T00:00:00Z"),
        buryNewSiblings: false,
        buryReviewSiblings: false,
      });
      expect(queue.items).toHaveLength(4);
      for (const item of oldItems)
        expect((await getTokenById(db, item.id))?.deprecated_at).toBeNull();
      await installKvtTile(db, tile);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(after);
    });
  });
});
