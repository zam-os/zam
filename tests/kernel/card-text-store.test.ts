import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildReviewQueue,
  type CardText,
  CardTextError,
  choiceSourceHash,
  countAnswerPoints,
  createToken,
  type Database,
  ensureCard,
  getTokenById,
  listActiveDistractors,
  openDatabase,
  parseReviewFastCheck,
  parseStoredCardText,
  presentFastCheck,
  publishTokenRevision,
  storeDistractors,
  type Token,
  updateToken,
  writeCardText,
} from "../../src/kernel/index.js";

const PNG = "b".repeat(64);
const SVG = "c".repeat(64);

const FORMULA: CardText = [
  { type: "text", text: "Wie ändert sich " },
  {
    type: "math",
    tex: "W_{\\text{el}} = \\frac{1}{2} C U^2",
    speech: "W el gleich ein halb C U Quadrat",
  },
  { type: "text", text: ", wenn d verdoppelt wird?" },
];

describe("card text storage (ADR 2026-10-14b, plan Phase 2)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-card-text-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    for (const [hash, mime] of [
      [PNG, "image/png"],
      [SVG, "image/svg+xml"],
    ]) {
      await db
        .prepare(
          "INSERT INTO media_assets (hash, mime_type, byte_size, data) VALUES (?, ?, ?, ?)",
        )
        .run(hash, mime, 3, Buffer.from([1, 2, 3]));
    }
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function token(slug = "kondensator"): Promise<Token> {
    return createToken(db, {
      slug,
      concept: "Die Energie verdoppelt sich.",
      question: "Platzhalter",
      domain: "physik/elektrizitaet",
      bloom_level: 1,
    });
  }

  async function embed(tokenId: string): Promise<void> {
    await db
      .prepare(
        "INSERT INTO token_embeddings (token_id, embedding, model, dims, content_hash) VALUES (?, ?, 'test', 1, 'x')",
      )
      .run(tokenId, Buffer.from([0]));
  }

  async function hasEmbedding(tokenId: string): Promise<boolean> {
    return Boolean(
      await db
        .prepare("SELECT 1 AS hit FROM token_embeddings WHERE token_id = ?")
        .get(tokenId),
    );
  }

  it("migrates the segment columns, placement and installed_tiles", async () => {
    const cols = async (table: string) =>
      (
        (await db.pragma(`table_info(${table})`)) as Array<{ name: string }>
      ).map((row) => row.name);
    expect(await cols("tokens")).toEqual(
      expect.arrayContaining(["question_segments", "concept_segments"]),
    );
    expect(await cols("token_media")).toContain("placement");
    expect(await cols("choice_distractors")).toContain("text_segments");
    expect(await cols("installed_tiles")).toEqual(
      expect.arrayContaining(["tile_id", "version", "failed_at"]),
    );
  });

  it("writes segments and derives the plain column", async () => {
    const t = await token();
    const result = await writeCardText(db, t.id, { question: FORMULA });
    expect(result.question).toBe(
      "Wie ändert sich W_el = ½CU², wenn d verdoppelt wird?",
    );
    const stored = await getTokenById(db, t.id);
    expect(stored?.question).toBe(result.question);
    expect(parseStoredCardText(stored?.question_segments)).toEqual(FORMULA);
  });

  it("requires speech when asked and refuses invalid segments", async () => {
    const t = await token();
    await expect(
      writeCardText(
        db,
        t.id,
        { question: [{ type: "math", tex: "x^2" }] },
        { requireSpeech: true },
      ),
    ).rejects.toBeInstanceOf(CardTextError);
    await expect(
      writeCardText(db, t.id, { question: [{ type: "text", text: "$x^2$" }] }),
    ).rejects.toThrow(/LaTeX/);
  });

  it("drops the embedding only when a projection changed", async () => {
    const t = await token();
    await writeCardText(db, t.id, { question: FORMULA });
    await embed(t.id);
    // Same formula, other speech: the plain text is unchanged.
    const respoken = FORMULA.map((segment) =>
      segment.type === "math"
        ? { ...segment, speech: "anders gelesen" }
        : segment,
    );
    expect(
      (await writeCardText(db, t.id, { question: respoken })).projectionChanged,
    ).toBe(false);
    expect(await hasEmbedding(t.id)).toBe(true);

    await writeCardText(db, t.id, {
      question: [{ type: "text", text: "Eine ganz andere Frage?" }],
    });
    expect(await hasEmbedding(t.id)).toBe(false);
  });

  it("keeps inline images as token_media rows and leaves attachments alone", async () => {
    const t = await token();
    await db
      .prepare(
        `INSERT INTO token_media (token_id, asset_hash, side, kind, ordinal, original_name)
         VALUES (?, ?, 'question', 'image', 0, 'anki.png')`,
      )
      .run(t.id, PNG);
    await writeCardText(db, t.id, {
      question: [
        { type: "text", text: "Was zeigt das Bild " },
        { type: "image", media: PNG, alt: "ein Dreieck", inline: true },
        { type: "text", text: "?" },
      ],
    });
    const rows = async () =>
      (await db
        .prepare(
          "SELECT ordinal, placement, alt_text FROM token_media WHERE token_id = ? ORDER BY ordinal",
        )
        .all(t.id)) as Array<{
        ordinal: number;
        placement: string;
        alt_text: string | null;
      }>;
    expect(await rows()).toEqual([
      { ordinal: 0, placement: "attached", alt_text: null },
      { ordinal: 1, placement: "inline", alt_text: "ein Dreieck" },
    ]);

    // The orphan cleanup of the importer (pruneOrphanedMediaAssets) counts
    // every token_media row, so an inline image keeps its asset.
    await db
      .prepare(
        `DELETE FROM media_assets WHERE NOT EXISTS (
           SELECT 1 FROM token_media tm WHERE tm.asset_hash = media_assets.hash)`,
      )
      .run();
    expect(
      await db
        .prepare("SELECT 1 AS hit FROM media_assets WHERE hash = ?")
        .get(PNG),
    ).toBeTruthy();

    await writeCardText(db, t.id, {
      question: [{ type: "text", text: "Ohne Bild?" }],
    });
    expect(await rows()).toEqual([
      { ordinal: 0, placement: "attached", alt_text: null },
    ]);
  });

  it("refuses an image that is not stored or not a raster image", async () => {
    const t = await token();
    await expect(
      writeCardText(db, t.id, {
        question: [{ type: "image", media: "d".repeat(64), alt: "fehlt" }],
      }),
    ).rejects.toThrow(/not stored/);
    await expect(
      writeCardText(db, t.id, {
        question: [{ type: "image", media: SVG, alt: "Vektorgrafik" }],
      }),
    ).rejects.toThrow(/PNG, JPEG, WebP or GIF/);
  });

  it("refuses a plain edit of a segmented field, but accepts an echo", async () => {
    const t = await token();
    await writeCardText(db, t.id, { question: FORMULA });
    const stored = (await getTokenById(db, t.id)) as Token;
    await expect(
      updateToken(db, t.slug, { question: "Eine andere Frage" }),
    ).rejects.toThrow(/has formulas. Change it in the card editor/);
    await expect(
      updateToken(db, t.slug, { question: stored.question }),
    ).resolves.toBeTruthy();
    // The answer is still plain, so it edits as before.
    await expect(
      updateToken(db, t.slug, { concept: "Sie verdoppelt sich." }),
    ).resolves.toBeTruthy();
  });

  it("publishes a revision with segments through the one write path", async () => {
    const t = await token();
    await embed(t.id);
    const result = await publishTokenRevision(db, {
      tokenId: t.id,
      materiality: "cosmetic",
      changes: { questionSegments: FORMULA },
    });
    expect(result.cardsRetested).toBe(0);
    const stored = (await getTokenById(db, t.id)) as Token;
    expect(stored.question).toContain("W_el = ½CU²");
    expect(parseStoredCardText(stored.question_segments)).toEqual(FORMULA);
    expect(await hasEmbedding(t.id)).toBe(false);

    await expect(
      publishTokenRevision(db, {
        tokenId: t.id,
        materiality: "cosmetic",
        changes: { question: "Plain drüber" },
      }),
    ).rejects.toThrow(/has formulas. Change it in the card editor/);
  });

  it("puts segments and spoken text into the review queue", async () => {
    const t = await token();
    await writeCardText(db, t.id, { question: FORMULA });
    await ensureCard(db, t.id, "learner");
    const queue = await buildReviewQueue(db, { userId: "learner", maxNew: 5 });
    const item = queue.items.find((entry) => entry.tokenId === t.id);
    expect(item?.questionSegments).toEqual(FORMULA);
    expect(item?.spokenQuestion).toBe(
      "Wie ändert sich W el gleich ein halb C U Quadrat, wenn d verdoppelt wird?",
    );
    expect(item?.conceptSegments).toBeNull();
    expect(item?.spokenConcept).toBeNull();
  });

  it("counts answer points on the projection of a segmented answer", async () => {
    const t = await token();
    await writeCardText(db, t.id, {
      concept: [
        { type: "text", text: "- Punkt eins\n- " },
        { type: "math", tex: "x^2", speech: "x Quadrat" },
        { type: "text", text: "\n- drei" },
      ],
    });
    const stored = (await getTokenById(db, t.id)) as Token;
    expect(stored.concept).toBe("- Punkt eins\n- x²\n- drei");
    expect(countAnswerPoints(stored.concept)).toBe(3);
  });

  it("keeps the options' hash for a speech-only change, not for a new formula", async () => {
    const t = await token();
    await writeCardText(db, t.id, { question: FORMULA });
    const before = choiceSourceHash((await getTokenById(db, t.id)) as Token);
    await writeCardText(db, t.id, {
      question: FORMULA.map((s) =>
        s.type === "math" ? { ...s, speech: "anders" } : s,
      ),
    });
    expect(choiceSourceHash((await getTokenById(db, t.id)) as Token)).toBe(
      before,
    );
    await writeCardText(db, t.id, {
      question: FORMULA.map((s) =>
        s.type === "math" ? { ...s, tex: "W = Q U" } : s,
      ),
    });
    expect(choiceSourceHash((await getTokenById(db, t.id)) as Token)).not.toBe(
      before,
    );
  });

  it("stores distractor segments with their plain projection", async () => {
    const t = await token();
    await storeDistractors(db, {
      tokenId: t.id,
      sourceHash: "h",
      source: "curated",
      entries: [
        {
          text: "ignored",
          segments: [
            { type: "text", text: "Sie wird " },
            { type: "math", tex: "\\frac{1}{4}", speech: "ein Viertel" },
          ],
        },
      ],
    });
    const [option] = await listActiveDistractors(db, t.id, "h");
    expect(option.text).toBe("Sie wird ¼");
    expect(option.segments).toEqual([
      { type: "text", text: "Sie wird " },
      { type: "math", tex: "\\frac{1}{4}", speech: "ein Viertel" },
    ]);
  });
});

describe("fast-check option segments", () => {
  const segment = (tex: string): CardText => [
    { type: "math", tex, speech: tex },
  ];

  it("reads option segments parallel to the plain options", () => {
    const parsed = parseReviewFastCheck({
      type: "binary_choice",
      options: ["x²", "x³"],
      correct_index: 0,
      option_segments: [segment("x^2"), null],
    });
    expect(parsed?.optionSegments).toEqual([segment("x^2"), null]);
  });

  it("keeps the plain options when a segment is malformed", () => {
    const parsed = parseReviewFastCheck({
      type: "binary_choice",
      options: ["x²", "x³"],
      correct_index: 0,
      option_segments: [[{ type: "math", tex: "\\href{x}{y}" }], null],
    });
    expect(parsed?.options).toEqual(["x²", "x³"]);
    expect(parsed?.optionSegments).toBeUndefined();
  });

  it("moves the segments with their options when presenting", () => {
    const parsed = parseReviewFastCheck({
      type: "multiple_choice",
      options: ["a", "b", "c", "d"],
      correct_index: 0,
      option_segments: [segment("a"), segment("b"), segment("c"), segment("d")],
    });
    for (const seed of ["s1", "s2", "s3"]) {
      const shown = presentFastCheck(parsed, seed);
      shown?.options.forEach((option, index) => {
        expect(shown.optionSegments?.[index]).toEqual(segment(option));
      });
    }
  });
});
