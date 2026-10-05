import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildReviewQueue,
  commitMaterialImport,
  createToken,
  type Database,
  detachCardForUser,
  ensureCard,
  findImportsByFingerprints,
  getCard,
  IMPORT_SOURCE_PREFIX,
  listMaterialAreaContext,
  listMaterialBonusItems,
  MAX_CONTINUATION_ITEMS,
  type MaterialProposalSet,
  MaterialProposalSetError,
  type MaterialReviewRow,
  matchMaterialProposals,
  normaliseMaterialArea,
  openDatabase,
  parseMaterialProposalSet,
  presetFor,
  takeMaterialBonusItem,
} from "../../src/kernel/index.js";

/**
 * Learning cards from photos and files — the kernel contract (ADR
 * 2026-10-05, Decisions 4–9). The fixture is synthetic: it describes the
 * ADR's worked example and was written for this test.
 */

const FIXTURE = JSON.parse(
  readFileSync(
    join(__dirname, "../fixtures/material-import/chemie-sinne.json"),
    "utf8",
  ),
) as Record<string, unknown>;

const SHA = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
/** Chemie 8 cell (Realschule): "Stoffeigenschaften zur Stoffidentifikation". */
const CELL_ID = "de-by:realschule-8-chemie-stoffe-stoffgemische-trennung";
const ATOM_A02 = "01K4C8S0000000000000000A02";
const ITEM_J03 = "01K4C8S0000000000000000J03";
const ITEM_J04 = "01K4C8S0000000000000000J04";
const USER = "learner";

function fixture(): Record<string, unknown> {
  return structuredClone(FIXTURE);
}

function proposals(raw: Record<string, unknown>): Record<string, unknown>[] {
  return raw.proposals as Record<string, unknown>[];
}

function withProposals(
  ...entries: Record<string, unknown>[]
): MaterialProposalSet {
  const raw = fixture();
  raw.proposals = entries;
  return parseMaterialProposalSet(raw);
}

function proposal(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    question: "Welche Eigenschaften eines Stoffes erkennt man am Aussehen?",
    answer: "Farbe, Aggregatzustand bei Raumtemperatur, metallischer Glanz.",
    bloom: 1,
    file: 0,
    page: 1,
    area: "chemie/stoffe-und-eigenschaften",
    origin: "page",
    ...overrides,
  };
}

function decide(
  rows: MaterialReviewRow[],
): Record<string, "yes" | "bonus" | "no"> {
  const decisions: Record<string, "yes" | "bonus" | "no"> = {};
  for (const row of rows) {
    if (row.preset) decisions[row.id] = row.preset;
  }
  return decisions;
}

async function count(db: Database, sql: string, ...args: unknown[]) {
  const row = (await db.prepare(sql).get(...args)) as { n: number | string };
  return Number(row.n);
}

describe("parseMaterialProposalSet", () => {
  it("accepts the fixture and normalises subjects and areas", () => {
    const set = parseMaterialProposalSet(fixture());
    expect(set.analysis.subjects).toEqual(["chemie"]);
    expect(set.analysis.leadsTo).toContain("Dichte");
    expect(set.proposals).toHaveLength(4);
    expect(set.proposals[0].area).toBe("chemie/stoffe-und-eigenschaften");
    expect(set.proposals[0].hardToRead).toBe(false);
    expect(set.proposals[3].hardToRead).toBe(true);
    expect(set.files[0].sha256).toBe(SHA);
  });

  it("lists every offending path in one error", () => {
    const raw = fixture();
    const list = proposals(raw);
    list[0].origin = "guessed";
    list[1].file = 4;
    list[2].bloom = 7;
    delete list[3].answer;
    try {
      parseMaterialProposalSet(raw);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(MaterialProposalSetError);
      const issues = (error as MaterialProposalSetError).issues;
      expect(issues).toEqual(
        expect.arrayContaining([
          expect.stringContaining("proposals[0].origin"),
          expect.stringContaining("proposals[1].file"),
          expect.stringContaining("proposals[2].bloom"),
          expect.stringContaining("proposals[3].answer"),
        ]),
      );
    }
  });

  it("rejects unstructured input and a wrong version", () => {
    expect(() => parseMaterialProposalSet("Here are your cards")).toThrow(
      MaterialProposalSetError,
    );
    const raw = fixture();
    raw.version = 2;
    expect(() => parseMaterialProposalSet(raw)).toThrow(/version/);
  });

  it("rejects a malformed fingerprint and an area that is only 'schule'", () => {
    const raw = fixture();
    (raw.files as Record<string, unknown>[])[0].sha256 = "abc";
    proposals(raw)[0].area = "schule";
    expect(() => parseMaterialProposalSet(raw)).toThrow(
      /files\[0\]\.sha256.*proposals\[0\]\.area|proposals\[0\]\.area.*files\[0\]\.sha256/,
    );
  });
});

describe("normaliseMaterialArea", () => {
  it("drops a leading schule/, tidies separators and keeps case", () => {
    expect(normaliseMaterialArea("schule/chemie/stoffe")).toBe("chemie/stoffe");
    expect(normaliseMaterialArea("Schule/Schule/physik")).toBe("physik");
    expect(normaliseMaterialArea(" chemie // stoffe/ ")).toBe("chemie/stoffe");
    expect(normaliseMaterialArea("Deutsch")).toBe("Deutsch");
    expect(normaliseMaterialArea("schule")).toBe("");
  });
});

describe("presetFor (Decision 5)", () => {
  it("presets page to Yes, extra to Bonus, and leaves completed and hard-to-read open", () => {
    const set = parseMaterialProposalSet(fixture());
    expect(set.proposals.map(presetFor)).toEqual(["yes", null, "bonus", null]);
    expect(presetFor({ ...set.proposals[2], hardToRead: true })).toBeNull();
  });
});

describe("material import against a library", () => {
  let tempDir: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-material-import-"));
    db = await openDatabase({ dbPath: join(tempDir, "material.db") });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("matchMaterialProposals (Decision 8)", () => {
    it("stands a library match beside its proposal and moves the preset to it", async () => {
      const existing = await createToken(db, {
        slug: "stoffe-aussehen",
        title: "Stoffe am Aussehen erkennen",
        concept:
          "Am Aussehen: Farbe, Aggregatzustand bei Raumtemperatur und metallischer Glanz",
        question: "Woran erkennt man Stoffe am Aussehen?",
        domain: "chemie/stoffe",
      });
      const set = withProposals(proposal());
      const rows = await matchMaterialProposals(db, USER, set);
      const [own, beside] = rows;
      expect(own).toMatchObject({ kind: "proposal", id: "p:0", preset: null });
      expect(beside).toMatchObject({
        kind: "existing",
        id: "e:0",
        besideProposal: 0,
        preset: "yes",
        held: false,
        via: "lexical",
        target: { type: "token", tokenId: existing.id },
      });
    });

    it("marks an item the learner already holds and takes its preset away", async () => {
      const existing = await createToken(db, {
        slug: "stoffe-aussehen",
        concept:
          "Am Aussehen: Farbe, Aggregatzustand bei Raumtemperatur und metallischer Glanz",
        question: "Woran erkennt man Stoffe am Aussehen?",
        domain: "chemie",
      });
      await ensureCard(db, existing.id, USER);
      const rows = await matchMaterialProposals(
        db,
        USER,
        withProposals(proposal()),
      );
      expect(rows[1]).toMatchObject({
        kind: "existing",
        held: true,
        preset: null,
      });

      // A detached card is not held: Yes would re-attach it.
      await detachCardForUser(db, existing.id, USER);
      const again = await matchMaterialProposals(
        db,
        USER,
        withProposals(proposal()),
      );
      expect(again[1]).toMatchObject({ held: false, preset: "yes" });
    });

    it("finds the grade-8 cell item for a grade-9 learner (rank, not filter)", async () => {
      const set = withProposals(
        proposal({
          question: "Wie ist die Dichte eines Stoffes definiert?",
          answer: "Dichte ist Masse pro Volumen, ρ = m / V.",
          area: "chemie/stoffeigenschaften",
        }),
      );
      const rows = await matchMaterialProposals(db, USER, set, {
        scope: {
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 9,
          subject: "chemie",
        },
      });
      const beside = rows.find((row) => row.kind === "existing");
      expect(beside).toMatchObject({
        target: { type: "cell-item", cellId: CELL_ID, itemId: ITEM_J03 },
        preset: "yes",
      });
      // The matched atom is not offered again as a continuation.
      expect(
        rows.some(
          (row) =>
            row.kind === "continuation" &&
            row.target.type === "cell-item" &&
            row.target.atomId === ATOM_A02,
        ),
      ).toBe(false);
    });

    it("offers what the material leads to as Bonus, capped", async () => {
      const rows = await matchMaterialProposals(
        db,
        USER,
        withProposals(proposal()),
        {
          scope: {
            provider: "lehrplanplus-bayern",
            schoolType: "realschule",
            grade: 9,
          },
        },
      );
      const continuations = rows.filter((row) => row.kind === "continuation");
      expect(continuations.length).toBeGreaterThan(0);
      expect(continuations.length).toBeLessThanOrEqual(MAX_CONTINUATION_ITEMS);
      expect(continuations.every((row) => row.preset === "bonus")).toBe(true);
      expect(
        continuations.some(
          (row) =>
            row.kind === "continuation" &&
            row.target.type === "cell-item" &&
            row.target.atomId === ATOM_A02,
        ),
      ).toBe(true);
    });

    it("leaves a proposal alone when nothing is close, and is deterministic", async () => {
      await createToken(db, {
        slug: "dichte",
        concept: "Dichte ist Masse durch Volumen",
        question: "Wie ist die Dichte definiert?",
        domain: "chemie",
      });
      const set = withProposals(proposal(), proposal({ origin: "extra" }));
      const first = await matchMaterialProposals(db, USER, set);
      const second = await matchMaterialProposals(db, USER, set);
      expect(second).toEqual(first);
      expect(first.filter((row) => row.kind === "existing")).toHaveLength(0);
      expect(first.slice(0, 2)).toEqual([
        { kind: "proposal", id: "p:0", proposalIndex: 0, preset: "yes" },
        { kind: "proposal", id: "p:1", proposalIndex: 1, preset: "bonus" },
      ]);
    });

    it("uses injected embeddings when given", async () => {
      const token = await createToken(db, {
        slug: "glanz",
        concept: "Metalle glänzen",
        question: "Was zeigt metallischer Glanz?",
        domain: "chemie",
      });
      const embeddings = await import(
        "../../src/kernel/models/token-embedding.js"
      );
      await embeddings.upsertTokenEmbedding(db, {
        tokenId: token.id,
        embedding: [1, 0, 0],
        model: "test-model",
        contentHash: embeddings.computeContentHash(
          embeddings.embeddingContentForToken(token),
        ),
      });
      const rows = await matchMaterialProposals(
        db,
        USER,
        withProposals(proposal()),
        {
          embeddingModel: "test-model",
          embed: async (texts) => texts.map(() => [1, 0, 0]),
        },
      );
      expect(rows[1]).toMatchObject({
        kind: "existing",
        via: "vector",
        target: { type: "token", tokenId: token.id },
      });
    });
  });

  describe("commitMaterialImport (Decisions 5, 6, 9)", () => {
    it("writes Yes as a published card, Bonus without a card, and nothing else", async () => {
      const set = parseMaterialProposalSet(fixture());
      const rows = await matchMaterialProposals(db, USER, set);
      const own = rows.filter((row) => row.kind === "proposal");
      const decisions = { ...decide(own), "p:3": "no" as const };
      expect(decisions).toEqual({ "p:0": "yes", "p:2": "bonus", "p:3": "no" });
      const result = await commitMaterialImport(db, USER, {
        set,
        rows,
        decisions,
      });
      // p:1 (completed, no preset), p:3 (no) and every undecided
      // continuation row are not saved.
      expect(result).toMatchObject({
        cardsCreated: 1,
        bonusKept: 1,
        linkedExisting: 0,
        notSaved: rows.length - 2,
      });

      const source = (await db
        .prepare("SELECT * FROM sources WHERE id = ?")
        .get(result.sourceId)) as Record<string, string>;
      expect(source.uri.startsWith(IMPORT_SOURCE_PREFIX)).toBe(true);
      expect(source.type).toBe("scan");
      expect(source.content).toBeNull();
      expect(source.title).toBe("Stofferkennung mit den Sinnen");
      expect(JSON.parse(source.fingerprints)).toEqual([SHA]);
      expect(source.imported_by).toBe(USER);

      const yes = (await db
        .prepare("SELECT * FROM tokens WHERE question = ?")
        .get(set.proposals[0].question)) as Record<string, string>;
      expect(yes.editorial_state).toBe("published");
      expect(yes.domain).toBe("chemie/stoffe-und-eigenschaften");
      expect(yes.source_link).toBe("photo:IMG_1234.HEIC@2026-10-05");
      expect(yes.question_source).toBe("llm");
      expect(await getCard(db, yes.id, USER)).toBeDefined();
      expect(
        await count(
          db,
          "SELECT COUNT(*) AS n FROM token_sources WHERE token_id = ? AND source_id = ? AND page_number = '1'",
          yes.id,
          result.sourceId,
        ),
      ).toBe(1);

      const bonus = (await db
        .prepare("SELECT * FROM tokens WHERE question = ?")
        .get(set.proposals[2].question)) as Record<string, string>;
      expect(bonus.editorial_state).toBe("published");
      expect(await getCard(db, bonus.id, USER)).toBeUndefined();

      for (const index of [1, 3]) {
        expect(
          await count(
            db,
            "SELECT COUNT(*) AS n FROM tokens WHERE question = ?",
            set.proposals[index].question,
          ),
        ).toBe(0);
      }
    });

    it("puts a Yes card into the queue and keeps a Bonus token out of it", async () => {
      const set = parseMaterialProposalSet(fixture());
      const rows = await matchMaterialProposals(db, USER, set);
      await commitMaterialImport(db, USER, {
        set,
        rows,
        decisions: { "p:0": "yes", "p:2": "bonus" },
      });
      const queue = await buildReviewQueue(db, { userId: USER, maxNew: 20 });
      const questions = queue.items.map((item) => item.question);
      expect(questions).toContain(set.proposals[0].question);
      expect(questions).not.toContain(set.proposals[2].question);
    });

    it("adds #page to a PDF link and applies a confirmed area", async () => {
      const raw = fixture();
      raw.files = [
        {
          name: "Arbeitsblatt-Stoffe.pdf",
          sourceLink: "file:///Users/learner/Downloads/Arbeitsblatt-Stoffe.pdf",
        },
      ];
      proposals(raw)[0].page = 2;
      const set = parseMaterialProposalSet(raw);
      const rows = await matchMaterialProposals(db, USER, set);
      const result = await commitMaterialImport(db, USER, {
        set,
        rows,
        decisions: { "p:0": "yes" },
        areas: { "chemie/stoffe-und-eigenschaften": "schule/Chemie/Stoffe" },
      });
      const token = (await db
        .prepare("SELECT * FROM tokens WHERE question = ?")
        .get(set.proposals[0].question)) as Record<string, string>;
      expect(token.source_link).toBe(
        "file:///Users/learner/Downloads/Arbeitsblatt-Stoffe.pdf#page=2",
      );
      expect(token.domain).toBe("Chemie/Stoffe");
      const source = (await db
        .prepare("SELECT type, fingerprints FROM sources WHERE id = ?")
        .get(result.sourceId)) as Record<string, string | null>;
      expect(source.type).toBe("file");
      expect(source.fingerprints).toBeNull();
    });

    it("gives a card for an existing item without writing a token", async () => {
      const existing = await createToken(db, {
        slug: "stoffe-aussehen",
        concept:
          "Am Aussehen: Farbe, Aggregatzustand bei Raumtemperatur und metallischer Glanz",
        question: "Woran erkennt man Stoffe am Aussehen?",
        domain: "chemie",
      });
      const set = withProposals(proposal());
      const rows = await matchMaterialProposals(db, USER, set);
      const before = await count(db, "SELECT COUNT(*) AS n FROM tokens");
      const result = await commitMaterialImport(db, USER, {
        set,
        rows,
        decisions: { "e:0": "yes" },
      });
      expect(await count(db, "SELECT COUNT(*) AS n FROM tokens")).toBe(before);
      expect(result.cardsCreated).toBe(1);
      expect(await getCard(db, existing.id, USER)).toBeDefined();
    });

    it("installs a cell for a chosen cell item and creates exactly that card", async () => {
      const set = withProposals(
        proposal({
          question: "Wie ist die Dichte eines Stoffes definiert?",
          answer: "Dichte ist Masse pro Volumen, ρ = m / V.",
        }),
      );
      const rows = await matchMaterialProposals(db, USER, set);
      expect(rows[1]).toMatchObject({
        target: { type: "cell-item", itemId: ITEM_J03 },
      });
      const result = await commitMaterialImport(db, USER, {
        set,
        rows,
        decisions: { "e:0": "yes" },
      });
      expect(result.cardsCreated).toBe(1);
      expect(await getCard(db, ITEM_J03, USER)).toBeDefined();
      // Installed, but not enrolled: the sibling item gets no card.
      expect(
        await count(
          db,
          "SELECT COUNT(*) AS n FROM tokens WHERE id = ?",
          ITEM_J04,
        ),
      ).toBe(1);
      expect(await getCard(db, ITEM_J04, USER)).toBeUndefined();
      expect(
        await count(
          db,
          "SELECT COUNT(*) AS n FROM cards WHERE user_id = ?",
          USER,
        ),
      ).toBe(1);
    });

    it("links an exact duplicate instead of writing it twice", async () => {
      const existing = await createToken(db, {
        slug: "dup",
        concept: "Farbe, Aggregatzustand, Glanz",
        question:
          "  welche Eigenschaften eines Stoffes erkennt man am AUSSEHEN? ",
        domain: "chemie/stoffe-und-eigenschaften",
      });
      const set = withProposals(proposal({ title: "Doppelt" }));
      const rows: MaterialReviewRow[] = [
        { kind: "proposal", id: "p:0", proposalIndex: 0, preset: "yes" },
      ];
      const result = await commitMaterialImport(db, USER, {
        set,
        rows,
        decisions: { "p:0": "yes" },
      });
      expect(result.linkedExisting).toBe(1);
      expect(
        await count(
          db,
          "SELECT COUNT(*) AS n FROM tokens WHERE domain = ?",
          "chemie/stoffe-und-eigenschaften",
        ),
      ).toBe(1);
      expect(await getCard(db, existing.id, USER)).toBeDefined();
    });

    it("rolls back the whole import when one row fails", async () => {
      const set = withProposals(proposal());
      const rows: MaterialReviewRow[] = [
        { kind: "proposal", id: "p:0", proposalIndex: 0, preset: "yes" },
        {
          kind: "existing",
          id: "e:0",
          besideProposal: 0,
          preset: "yes",
          held: false,
          score: 1,
          via: "lexical",
          target: { type: "token", tokenId: "01JMISSINGTOKEN000000000000" },
          question: "?",
          answer: "?",
          title: "",
          area: "chemie",
        },
      ];
      await expect(
        commitMaterialImport(db, USER, {
          set,
          rows,
          decisions: { "p:0": "yes", "e:0": "yes" },
        }),
      ).rejects.toThrow(/Library item not found/);
      expect(await count(db, "SELECT COUNT(*) AS n FROM sources")).toBe(0);
      expect(await count(db, "SELECT COUNT(*) AS n FROM tokens")).toBe(0);
    });

    it("refuses a decision for a row that does not exist", async () => {
      const set = withProposals(proposal());
      const rows = await matchMaterialProposals(db, USER, set);
      await expect(
        commitMaterialImport(db, USER, {
          set,
          rows,
          decisions: { "p:7": "yes" },
        }),
      ).rejects.toThrow(/Unknown review row/);
    });
  });

  describe("re-import and Bonus", () => {
    it("recognises an imported file by its fingerprint", async () => {
      const set = parseMaterialProposalSet(fixture());
      const rows = await matchMaterialProposals(db, USER, set);
      const { sourceId } = await commitMaterialImport(db, USER, {
        set,
        rows,
        decisions: { "p:0": "yes" },
      });
      expect(await findImportsByFingerprints(db, [SHA.toUpperCase()])).toEqual([
        expect.objectContaining({
          sourceId,
          title: "Stofferkennung mit den Sinnen",
        }),
      ]);
      expect(await findImportsByFingerprints(db, ["0".repeat(64)])).toEqual([]);
    });

    it("lists the learner's bonus items and takes one", async () => {
      const set = parseMaterialProposalSet(fixture());
      const rows = await matchMaterialProposals(db, USER, set);
      await commitMaterialImport(db, USER, {
        set,
        rows,
        decisions: { "p:0": "yes", "p:2": "bonus" },
      });
      const items = await listMaterialBonusItems(db, USER);
      expect(items.map((item) => item.question)).toEqual([
        set.proposals[2].question,
      ]);
      expect(items[0].sourceTitle).toBe("Stofferkennung mit den Sinnen");
      expect(await listMaterialBonusItems(db, "someone-else")).toEqual([]);

      await expect(
        takeMaterialBonusItem(db, "someone-else", items[0].tokenId),
      ).rejects.toThrow(/Not a bonus item/);
      const { cardId } = await takeMaterialBonusItem(
        db,
        USER,
        items[0].tokenId,
      );
      expect(cardId).toBeTruthy();
      expect(await listMaterialBonusItems(db, USER)).toEqual([]);
    });
  });

  describe("listMaterialAreaContext", () => {
    it("lists areas in use and cell subjects, the learner's school type first", async () => {
      await createToken(db, {
        slug: "a",
        concept: "a",
        domain: "chemie/stoffe",
      });
      await createToken(db, { slug: "b", concept: "b", domain: "Deutsch" });
      const context = await listMaterialAreaContext(db, {
        schoolType: "realschule",
      });
      expect(context.areas).toEqual([
        { path: "Deutsch", tokenCount: 1 },
        { path: "chemie/stoffe", tokenCount: 1 },
      ]);
      expect(context.cellSubjects).toContain("chemie");
      expect(context.cellSubjects).toContain("bwr");
    });
  });
});
