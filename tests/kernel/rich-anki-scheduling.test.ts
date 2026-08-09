import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Database, TextImportDocument } from "../../src/kernel/index.js";
import {
  buildReviewQueue,
  commitTextImport,
  executeReviewAction,
  getStudyWorkloadSettings,
  openDatabase,
  previewTextImport,
  setStudyWorkloadSettings,
  unburySiblingCards,
} from "../../src/kernel/index.js";

let directory: string;
let db: Database;

beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), "zam-rich-scheduling-"));
  db = await openDatabase({
    dbPath: join(directory, "zam.db"),
    initialize: true,
    useConfiguredCloud: false,
  });
});

afterEach(async () => {
  await db.close();
  rmSync(directory, { recursive: true, force: true });
});

function siblingDocument(): TextImportDocument {
  return {
    format: "apkg",
    sourceName: "siblings.apkg",
    cards: [0, 1, 2].map((ordinal) => ({
      externalId: `anki:shared-note:${ordinal}`,
      noteGuid: "shared-note",
      cardOrdinal: ordinal,
      question: `Sibling ${ordinal}?`,
      answer: `Answer ${ordinal}`,
      deckPath: "Exam",
    })),
  };
}

describe("rich Anki scheduling", () => {
  it("uses persisted presets and keeps one enabled sibling in a queue", async () => {
    const input = siblingDocument();
    input.cards.push({
      externalId: "anki:other-note:0",
      noteGuid: "other-note",
      cardOrdinal: 0,
      question: "Independent?",
      answer: "Yes",
      deckPath: "Exam",
    });
    const preview = await previewTextImport(db, "alice", input);
    await commitTextImport(db, "alice", input, preview.planHash);

    const balanced = await buildReviewQueue(db, {
      userId: "alice",
      maxNew: 10,
      maxReviews: 10,
    });
    expect(balanced.items).toHaveLength(2);
    expect(
      balanced.items.filter((item) => item.siblingGroup === "shared-note"),
    ).toHaveLength(1);

    await setStudyWorkloadSettings(db, "alice", { preset: "exam" });
    expect((await getStudyWorkloadSettings(db, "alice")).maxReviews).toBe(200);
    const exam = await buildReviewQueue(db, { userId: "alice" });
    expect(exam.items).toHaveLength(4);

    await setStudyWorkloadSettings(db, "alice", {
      preset: "custom",
      maxNew: 1,
      maxReviews: 7,
      buryNewSiblings: false,
      buryReviewSiblings: true,
    });
    const custom = await buildReviewQueue(db, { userId: "alice" });
    expect(custom.items).toHaveLength(1);
    expect(custom.newCount).toBe(1);
  });

  it("reads a bounded new-card window instead of the whole library", async () => {
    const input: TextImportDocument = {
      format: "apkg",
      sourceName: "large.apkg",
      cards: Array.from({ length: 90 }, (_value, index) => ({
        externalId: `anki:note-${index}:0`,
        noteGuid: `note-${index}`,
        cardOrdinal: 0,
        question: `Question ${index}?`,
        answer: `Answer ${index}`,
        deckPath: "Imported",
      })),
    };
    const preview = await previewTextImport(db, "alice", input);
    await commitTextImport(db, "alice", input, preview.planHash);

    // An imported library can hold tens of thousands of new cards; a remote
    // provider would ship every row on every queue build without the window.
    const fetched: number[] = [];
    const prepare = db.prepare.bind(db);
    db.prepare = (sql: string) => {
      const statement = prepare(sql);
      if (!sql.includes("c.state = 'new'")) return statement;
      const all = statement.all.bind(statement);
      return Object.assign(statement, {
        all: async (...params: unknown[]) => {
          const rows = (await all(...params)) as unknown[];
          fetched.push(rows.length);
          return rows;
        },
      });
    };

    const queue = await buildReviewQueue(db, {
      userId: "alice",
      maxNew: 2,
      maxReviews: 10,
    });
    db.prepare = prepare;

    expect(queue.items).toHaveLength(2);
    expect(fetched).toEqual([2 * 10 + 50]);
  });

  it("buries only eligible siblings until the next local day and can unbury", async () => {
    const input = siblingDocument();
    const preview = await previewTextImport(db, "alice", input);
    await commitTextImport(db, "alice", input, preview.planHash);
    await setStudyWorkloadSettings(db, "alice", { preset: "balanced" });

    const now = new Date("2026-08-09T10:00:00.000Z");
    const rows = (await db
      .prepare(
        `SELECT c.id, c.token_id, b.card_ordinal
           FROM cards c
           JOIN imported_card_bindings b ON b.token_id = c.token_id
          WHERE c.user_id = ? ORDER BY b.card_ordinal`,
      )
      .all("alice")) as Array<{
      id: string;
      token_id: string;
      card_ordinal: number;
    }>;
    const result = await executeReviewAction(db, {
      action: "rate",
      cardId: rows[0].id,
      userId: "alice",
      rating: 3,
      now,
    });
    expect(result.evaluation?.buriedSiblings).toBe(2);
    expect(result.evaluation?.buriedUntil).toBeTruthy();

    const buried = (await db
      .prepare(
        `SELECT state, buried_reason, buried_until FROM cards
          WHERE id IN (?, ?) ORDER BY id`,
      )
      .all(rows[1].id, rows[2].id)) as Array<{
      state: string;
      buried_reason: string | null;
      buried_until: string | null;
    }>;
    expect(buried).toEqual([
      expect.objectContaining({ state: "new", buried_reason: "sibling" }),
      expect.objectContaining({ state: "new", buried_reason: "sibling" }),
    ]);
    const beforeTomorrow = await buildReviewQueue(db, {
      userId: "alice",
      now,
      maxNew: 10,
      maxReviews: 10,
    });
    expect(beforeTomorrow.items).toHaveLength(0);

    expect(await unburySiblingCards(db, "alice")).toBe(2);
    const visible = await buildReviewQueue(db, {
      userId: "alice",
      now,
      maxNew: 10,
      maxReviews: 10,
    });
    expect(visible.items).toHaveLength(1);
  });
});
