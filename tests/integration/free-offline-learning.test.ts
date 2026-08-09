import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readTextImportFile } from "../../src/cli/import/text-file.js";
import type { Database } from "../../src/kernel/index.js";
import {
  commitTextImport,
  evaluateRating,
  exportSnapshot,
  getCardById,
  importSnapshot,
  openDatabase,
  previewTextImport,
  verifySnapshot,
} from "../../src/kernel/index.js";

const tempDirs: string[] = [];

function makeTempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "zam-free-offline-"));
  tempDirs.push(directory);
  return directory;
}

async function open(dbPath: string): Promise<Database> {
  return openDatabase({
    dbPath,
    initialize: true,
    useConfiguredCloud: false,
  });
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop() as string, { recursive: true, force: true });
  }
});

describe("free offline learning path", () => {
  it("imports, learns, relearns, restarts, and restores without network or AI", async () => {
    const directory = makeTempDir();
    const csvPath = join(directory, "offline-cards.csv");
    const dbPath = join(directory, "library.db");
    writeFileSync(
      csvPath,
      [
        "id,question,answer,deck,source,author,license",
        "ohm,What is Ohm's law?,U = R · I,Electronics,local textbook,Ada,CC BY 4.0",
      ].join("\n"),
      "utf8",
    );

    const originalFetch = globalThis.fetch;
    let fetchCalls = 0;
    globalThis.fetch = async () => {
      fetchCalls++;
      throw new Error("Network is disabled in the offline-path test");
    };

    try {
      let db = await open(dbPath);
      const document = await readTextImportFile(csvPath);
      const preview = await previewTextImport(db, "offline-learner", document);
      expect(preview.counts).toMatchObject({
        create: 1,
        conflict: 0,
        cardsToCreate: 1,
      });
      await commitTextImport(db, "offline-learner", document, preview.planHash);

      const cardRow = (await db
        .prepare("SELECT id, token_id FROM cards")
        .get()) as { id: string; token_id: string };
      const firstLearningStep = await evaluateRating(db, {
        cardId: cardRow.id,
        tokenId: cardRow.token_id,
        userId: "offline-learner",
        rating: 3,
      });
      expect(firstLearningStep).toMatchObject({
        state: "learning",
        learningStep: 1,
      });
      const graduated = await evaluateRating(db, {
        cardId: cardRow.id,
        tokenId: cardRow.token_id,
        userId: "offline-learner",
        rating: 3,
      });
      expect(graduated.state).toBe("review");
      const relearning = await evaluateRating(db, {
        cardId: cardRow.id,
        tokenId: cardRow.token_id,
        userId: "offline-learner",
        rating: 1,
      });
      expect(relearning).toMatchObject({
        state: "relearning",
        learningStep: 0,
      });
      expect(relearning.scheduledDays).toBeCloseTo(10 / (24 * 60), 10);

      await db.close();
      db = await open(dbPath);
      const resumed = await getCardById(db, cardRow.id);
      expect(resumed).toMatchObject({
        state: "relearning",
        learning_step: 0,
        reps: 0,
        lapses: 1,
      });

      const snapshot = await exportSnapshot(db, {
        createdAt: "2026-08-09T12:00:00.000Z",
      });
      const manifest = verifySnapshot(snapshot);
      expect(manifest.tables).toMatchObject({
        tokens: 1,
        imported_card_bindings: 1,
        cards: 1,
        review_logs: 3,
      });
      await db.close();

      const restored = await open(join(directory, "restored.db"));
      const result = await importSnapshot(restored, snapshot);
      expect(result.tables.imported_card_bindings).toBe(1);
      expect(await getCardById(restored, cardRow.id)).toMatchObject({
        state: "relearning",
        learning_step: 0,
        lapses: 1,
      });
      const restoredAnswer = (await restored
        .prepare("SELECT concept FROM tokens")
        .get()) as { concept: string };
      expect(restoredAnswer.concept).toBe("U = R · I");
      await restored.close();
      expect(fetchCalls).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
