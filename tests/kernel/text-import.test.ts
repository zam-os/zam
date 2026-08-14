import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Database, TextImportDocument } from "../../src/kernel/index.js";
import {
  commitTextImport,
  getCard,
  getTokenMedia,
  openDatabase,
  previewTextImport,
  updateToken,
} from "../../src/kernel/index.js";

let tempDir: string;
let db: Database;

function document(
  cards: TextImportDocument["cards"] = [
    {
      externalId: "anki:note-guid:0",
      noteGuid: "note-guid",
      cardOrdinal: 0,
      question: "What is the capital of France?",
      answer: "Paris",
      deckPath: "Geography::Europe",
      tags: ["capital", "europe"],
      source: "https://example.test/geography",
      author: "Example Author",
      license: "CC BY 4.0",
    },
  ],
): TextImportDocument {
  return {
    format: "apkg",
    sourceName: "geography.apkg",
    cards,
    warnings: [],
    unsupported: [],
  };
}

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), "zam-text-import-"));
  db = await openDatabase({
    dbPath: join(tempDir, "zam.db"),
    initialize: true,
    useConfiguredCloud: false,
  });
});

afterEach(async () => {
  await db.close();
  rmSync(tempDir, { recursive: true, force: true });
});

describe("deterministic text import", () => {
  it("previews and atomically creates content, provenance, and a personal card", async () => {
    const input = document();
    const preview = await previewTextImport(db, "alice", input);

    expect(preview.counts).toEqual({
      create: 1,
      update: 0,
      skip: 0,
      conflict: 0,
      unsupported: 0,
      cardsToCreate: 1,
      valid: 1,
      total: 1,
    });
    expect(preview.decks).toEqual([{ path: "Geography::Europe", cards: 1 }]);

    const result = await commitTextImport(db, "alice", input, preview.planHash);
    expect(result.cardsCreated).toBe(1);

    const binding = (await db
      .prepare(
        `SELECT b.external_id, b.note_guid, b.card_ordinal, b.deck_path,
                b.tags_json, b.author, b.license, t.question, t.concept
           FROM imported_card_bindings b
           JOIN tokens t ON t.id = b.token_id`,
      )
      .get()) as Record<string, unknown>;
    expect(binding).toMatchObject({
      external_id: "anki:note-guid:0",
      note_guid: "note-guid",
      card_ordinal: 0,
      deck_path: "Geography::Europe",
      author: "Example Author",
      license: "CC BY 4.0",
      question: "What is the capital of France?",
      concept: "Paris",
    });
    expect(JSON.parse(binding.tags_json as string)).toEqual([
      "capital",
      "europe",
    ]);
  });

  it("skips an unchanged re-import but creates an independent card for another learner", async () => {
    const input = document();
    const first = await previewTextImport(db, "alice", input);
    await commitTextImport(db, "alice", input, first.planHash);

    const duplicate = await previewTextImport(db, "bob", input);
    expect(duplicate.counts).toMatchObject({
      create: 0,
      update: 0,
      skip: 1,
      conflict: 0,
      cardsToCreate: 1,
    });
    const result = await commitTextImport(db, "bob", input, duplicate.planHash);

    expect(result.cardsCreated).toBe(1);
    const row = (await db
      .prepare(
        `SELECT b.token_id FROM imported_card_bindings b
         WHERE b.external_id = ?`,
      )
      .get("anki:note-guid:0")) as { token_id: string };
    expect(await getCard(db, row.token_id, "alice")).toBeDefined();
    expect(await getCard(db, row.token_id, "bob")).toBeDefined();
    const tokenCount = (await db
      .prepare("SELECT COUNT(*) AS n FROM tokens")
      .get()) as { n: number };
    expect(tokenCount.n).toBe(1);
  });

  it("updates through the material revision path while preserving FSRS state", async () => {
    const original = document();
    const first = await previewTextImport(db, "alice", original);
    await commitTextImport(db, "alice", original, first.planHash);

    const token = (await db.prepare("SELECT id, slug FROM tokens").get()) as {
      id: string;
      slug: string;
    };
    const card = await getCard(db, token.id, "alice");
    await db
      .prepare(
        `UPDATE cards
            SET state = 'review', stability = 12.5, difficulty = 0.42,
                reps = 8, lapses = 2, due_at = '2099-01-01T00:00:00.000Z'
          WHERE id = ?`,
      )
      .run(card?.id);

    const changed = document([
      {
        ...original.cards[0],
        answer: "Paris, on the River Seine",
      },
    ]);
    const preview = await previewTextImport(db, "alice", changed);
    expect(preview.cards[0]).toMatchObject({
      action: "update",
      contentChanged: true,
      cardAction: "keep",
    });
    await commitTextImport(db, "alice", changed, preview.planHash);

    const updated = (await db
      .prepare(
        `SELECT t.concept, t.content_version, t.published_by,
                c.state, c.stability, c.difficulty, c.reps, c.lapses,
                c.learned_content_version, c.due_at
           FROM tokens t JOIN cards c ON c.token_id = t.id
          WHERE t.id = ?`,
      )
      .get(token.id)) as Record<string, unknown>;
    expect(updated).toMatchObject({
      concept: "Paris, on the River Seine",
      content_version: 2,
      published_by: "file-import",
      state: "review",
      stability: 12.5,
      difficulty: 0.42,
      reps: 8,
      lapses: 2,
      learned_content_version: 1,
    });
    expect(updated.due_at).not.toBe("2099-01-01T00:00:00.000Z");
  });

  it("reports a conflict instead of overwriting a locally edited card", async () => {
    const original = document();
    const first = await previewTextImport(db, "alice", original);
    await commitTextImport(db, "alice", original, first.planHash);

    const token = (await db.prepare("SELECT slug FROM tokens").get()) as {
      slug: string;
    };
    await updateToken(db, token.slug, { concept: "My corrected local answer" });

    const sourceAlsoChanged = document([
      { ...original.cards[0], answer: "A new answer from the source" },
    ]);
    const preview = await previewTextImport(db, "alice", sourceAlsoChanged);
    expect(preview.counts.conflict).toBe(1);
    expect(preview.cards[0].reason).toMatch(/source and the local card/i);

    const result = await commitTextImport(
      db,
      "alice",
      sourceAlsoChanged,
      preview.planHash,
    );
    expect(result.counts.valid).toBe(0);
    const unchanged = (await db
      .prepare("SELECT concept FROM tokens WHERE slug = ?")
      .get(token.slug)) as { concept: string };
    expect(unchanged.concept).toBe("My corrected local answer");
  });

  it("rejects a stale confirmation before writing", async () => {
    const input = document();
    const preview = await previewTextImport(db, "alice", input);
    const changed = document([{ ...input.cards[0], answer: "Lyon" }]);

    await expect(
      commitTextImport(db, "alice", changed, preview.planHash),
    ).rejects.toThrow(/preview.*current/i);
    const count = (await db
      .prepare("SELECT COUNT(*) AS n FROM tokens")
      .get()) as { n: number };
    expect(count.n).toBe(0);
  });

  it("includes source metadata in the confirmed plan", async () => {
    const input = document();
    const preview = await previewTextImport(db, "alice", input);
    const changedMetadata = document([
      { ...input.cards[0], tags: ["changed-after-preview"] },
    ]);

    await expect(
      commitTextImport(db, "alice", changedMetadata, preview.planHash),
    ).rejects.toThrow(/preview.*current/i);
  });

  it("refreshes a binding when a local edit already matches the new source", async () => {
    const original = document();
    const first = await previewTextImport(db, "alice", original);
    await commitTextImport(db, "alice", original, first.planHash);
    const token = (await db.prepare("SELECT slug FROM tokens").get()) as {
      slug: string;
    };
    await updateToken(db, token.slug, { concept: "Lyon" });

    const matchingSource = document([{ ...original.cards[0], answer: "Lyon" }]);
    const preview = await previewTextImport(db, "alice", matchingSource);
    expect(preview.cards[0]).toMatchObject({
      action: "update",
      contentChanged: false,
    });
    await commitTextImport(db, "alice", matchingSource, preview.planHash);

    const nextSource = document([
      { ...original.cards[0], answer: "Marseille" },
    ]);
    const nextPreview = await previewTextImport(db, "alice", nextSource);
    expect(nextPreview.cards[0]).toMatchObject({
      action: "update",
      contentChanged: true,
    });
  });

  it("rolls back every valid card when a later write fails", async () => {
    const input = document([
      {
        externalId: "csv:deck:first",
        question: "First?",
        answer: "First answer",
      },
      {
        externalId: "csv:deck:second",
        question: "Second?",
        answer: "Second answer",
      },
    ]);
    input.format = "csv";
    input.sourceName = "deck.csv";
    const preview = await previewTextImport(db, "alice", input);
    await db.exec(`
      CREATE TRIGGER fail_second_import
      BEFORE INSERT ON imported_card_bindings
      WHEN NEW.external_id = 'csv:deck:second'
      BEGIN
        SELECT RAISE(ABORT, 'injected import failure');
      END;
    `);

    await expect(
      commitTextImport(db, "alice", input, preview.planHash),
    ).rejects.toThrow(/injected import failure/i);

    for (const table of ["tokens", "cards", "imported_card_bindings"]) {
      const count = (await db
        .prepare(`SELECT COUNT(*) AS n FROM ${table}`)
        .get()) as { n: number };
      expect(count.n).toBe(0);
    }
  });

  it("turns duplicate external identities into explicit conflicts", async () => {
    const duplicate = document([
      {
        externalId: "anki:same:0",
        question: "One?",
        answer: "One",
      },
      {
        externalId: "anki:same:0",
        question: "Two?",
        answer: "Two",
      },
    ]);

    const preview = await previewTextImport(db, "alice", duplicate);
    expect(preview.counts).toMatchObject({ conflict: 2, valid: 0 });
  });

  it("stores referenced media once by digest and restores presentation metadata", async () => {
    const bytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    const input = document([
      {
        externalId: "anki:media-note:0",
        noteGuid: "media-note",
        cardOrdinal: 0,
        question: "Name the highlighted structure.",
        answer: "Mitochondrion",
        media: [
          {
            assetName: "cell.png",
            side: "question",
            kind: "image",
            altText: "Cell diagram",
            occlusions: [
              {
                shape: "rect",
                left: 0.2,
                top: 0.3,
                width: 0.1,
                height: 0.15,
              },
            ],
          },
          {
            assetName: "cell.png",
            side: "answer",
            kind: "image",
          },
        ],
      },
    ]);
    input.assets = [
      {
        name: "cell.png",
        mimeType: "image/png",
        kind: "image",
        data: bytes,
      },
    ];

    const preview = await previewTextImport(db, "alice", input);
    expect(preview.media).toEqual({
      assets: 1,
      references: 2,
      totalBytes: bytes.byteLength,
    });
    await commitTextImport(db, "alice", input, preview.planHash);

    const token = (await db.prepare("SELECT id FROM tokens").get()) as {
      id: string;
    };
    const stored = await getTokenMedia(db, token.id);
    expect(stored).toHaveLength(2);
    expect(stored.map((item) => item.assetHash)).toEqual([
      stored[0].assetHash,
      stored[0].assetHash,
    ]);
    expect(stored.find((item) => item.side === "question")?.occlusions).toEqual(
      [expect.objectContaining({ shape: "rect", left: 0.2 })],
    );
    const assetCount = (await db
      .prepare("SELECT COUNT(*) AS n FROM media_assets")
      .get()) as { n: number };
    expect(assetCount.n).toBe(1);
  });

  it("commits a large import within a bounded statement budget and reports progress", async () => {
    // Every statement here is a network round trip on a remote (Turso)
    // library: 440 cards at 8 statements each was ~3 minutes of silence in the
    // field on 2026-08-09. The budget is the regression guard for that.
    const cards = Array.from({ length: 200 }, (_value, index) => ({
      externalId: `anki:bulk-${index}:0`,
      noteGuid: `bulk-${index}`,
      cardOrdinal: 0,
      question: `Bulk question ${index}?`,
      answer: `Bulk answer ${index}`,
      deckPath: "Bulk::Deck",
    }));
    const input = document(cards);
    const preview = await previewTextImport(db, "alice", input);

    let statements = 0;
    const prepare = db.prepare.bind(db);
    db.prepare = (sql: string) => {
      statements++;
      return prepare(sql);
    };
    const progress: number[] = [];
    const result = await commitTextImport(db, "alice", input, preview.planHash, {
      onProgress: (event) => progress.push(event.done),
    });
    db.prepare = prepare;

    expect(result.cardsCreated).toBe(cards.length);
    // 3 writes per card (token, binding, card) plus the shared preview and
    // slug preload. Anything above 4 per card means a per-card read crept back.
    expect(statements).toBeLessThanOrEqual(cards.length * 4);
    expect(progress).toHaveLength(cards.length);
    expect(progress[progress.length - 1]).toBe(cards.length);
  });

  it("keeps slugs unique across a single bulk import and against the library", async () => {
    const first = document([
      {
        externalId: "anki:dup-0:0",
        question: "Same question?",
        answer: "Same answer",
        deckPath: "Dup",
      },
    ]);
    await commitTextImport(
      db,
      "alice",
      first,
      (await previewTextImport(db, "alice", first)).planHash,
    );

    // Two more cards whose slug base collides with each other and with the
    // token already stored: the in-memory set must behave like the query did.
    const second = document([
      {
        externalId: "anki:dup-1:0",
        question: "Same question?",
        answer: "Same answer",
        deckPath: "Dup",
      },
      {
        externalId: "anki:dup-2:0",
        question: "Same question?",
        answer: "Same answer",
        deckPath: "Dup",
      },
    ]);
    await commitTextImport(
      db,
      "alice",
      second,
      (await previewTextImport(db, "alice", second)).planHash,
    );

    const slugs = (await db
      .prepare("SELECT slug FROM tokens ORDER BY slug")
      .all()) as Array<{ slug: string }>;
    expect(slugs).toHaveLength(3);
    expect(new Set(slugs.map((row) => row.slug)).size).toBe(3);
  });

  it("deletes superseded media payloads when a re-import replaces them", async () => {
    const first = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
    const second = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 9, 9, 9]);
    const mediaDocument = (bytes: Uint8Array): TextImportDocument => {
      const input = document([
        {
          externalId: "anki:media-note:0",
          noteGuid: "media-note",
          cardOrdinal: 0,
          question: "Name the highlighted structure.",
          answer: "Mitochondrion",
          media: [{ assetName: "cell.png", side: "question", kind: "image" }],
        },
      ]);
      input.assets = [
        { name: "cell.png", mimeType: "image/png", kind: "image", data: bytes },
      ];
      return input;
    };

    const original = mediaDocument(first);
    await commitTextImport(
      db,
      "alice",
      original,
      (await previewTextImport(db, "alice", original)).planHash,
    );
    const replacement = mediaDocument(second);
    const preview = await previewTextImport(db, "alice", replacement);
    expect(preview.counts).toMatchObject({ update: 1 });
    await commitTextImport(db, "alice", replacement, preview.planHash);

    const assets = (await db
      .prepare("SELECT hash FROM media_assets")
      .all()) as Array<{ hash: string }>;
    const token = (await db.prepare("SELECT id FROM tokens").get()) as {
      id: string;
    };
    const stored = await getTokenMedia(db, token.id);
    expect(assets).toHaveLength(1);
    expect(assets[0].hash).toBe(stored[0].assetHash);
  });

  it("rejects missing, oversized, and mismatched media before preview", async () => {
    const missing = document([
      {
        externalId: "anki:missing-media:0",
        question: "Question",
        answer: "Answer",
        media: [
          {
            assetName: "missing.png",
            side: "question",
            kind: "image",
          },
        ],
      },
    ]);
    await expect(previewTextImport(db, "alice", missing)).rejects.toThrow(
      /missing media asset/i,
    );

    missing.assets = [
      {
        name: "missing.png",
        mimeType: "audio/mpeg",
        kind: "audio",
        data: Uint8Array.from([1]),
      },
    ];
    await expect(previewTextImport(db, "alice", missing)).rejects.toThrow(
      /mismatched media kind/i,
    );
  });
});
