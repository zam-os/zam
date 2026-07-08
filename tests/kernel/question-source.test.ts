import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildReviewQueue,
  createToken,
  type Database,
  ensureCard,
  getTokenBySlug,
  openDatabase,
  updateToken,
} from "../../src/kernel/index.js";

describe("question_source provenance", () => {
  let db: Database;
  let tempDir: string;
  let dbPath: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-question-source-"));
    dbPath = join(tempDir, "zam-test.db");
    db = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("createToken defaults question_source to manual", async () => {
    const token = await createToken(db, {
      slug: "hand-written",
      concept: "A concept with a hand-written question",
      domain: "testing",
      question: "What did the human ask?",
    });

    expect(token.question_source).toBe("manual");
  });

  it("createToken honors an explicit question_source", async () => {
    const token = await createToken(db, {
      slug: "agent-written",
      concept: "A concept whose question came from an agent",
      domain: "testing",
      question: "What did the agent ask?",
      question_source: "llm",
    });

    expect(token.question_source).toBe("llm");
  });

  it("createToken rejects an invalid question_source", async () => {
    await expect(
      createToken(db, {
        slug: "bad-source",
        concept: "Invalid provenance value",
        // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid input
        question_source: "robot" as any,
      }),
    ).rejects.toThrow(/question_source/);
  });

  it("updateToken marks question edits as manual when no source is given", async () => {
    await createToken(db, {
      slug: "refreshable",
      concept: "Question was LLM-generated",
      question: "Generated question?",
      question_source: "llm",
    });

    const updated = await updateToken(db, "refreshable", {
      question: "A better, hand-written question?",
    });

    expect(updated.question_source).toBe("manual");
  });

  it("updateToken honors an explicit question_source alongside a question", async () => {
    await createToken(db, {
      slug: "healed",
      concept: "Question will be LLM-healed",
      question: "Original?",
    });

    const updated = await updateToken(db, "healed", {
      question: "Freshly generated?",
      question_source: "llm",
    });

    expect(updated.question_source).toBe("llm");
  });

  it("updateToken leaves question_source untouched when question is not updated", async () => {
    await createToken(db, {
      slug: "unrelated-edit",
      concept: "Provenance must survive unrelated edits",
      question: "Generated?",
      question_source: "llm",
    });

    const updated = await updateToken(db, "unrelated-edit", {
      title: "A new title",
    });

    expect(updated.question_source).toBe("llm");
  });

  it("updateToken can reclassify provenance without touching the question", async () => {
    await createToken(db, {
      slug: "keep-this-one",
      concept: "User wants to pin the current LLM question",
      question: "A great generated question?",
      question_source: "llm",
    });

    const updated = await updateToken(db, "keep-this-one", {
      question_source: "manual",
    });

    expect(updated.question_source).toBe("manual");
    expect(updated.question).toBe("A great generated question?");
  });

  it("migration backfills pre-provenance tokens as llm", async () => {
    // Emulate a pre-M013 database: drop the column, then reopen so the
    // migration re-adds it and backfills.
    await createToken(db, {
      slug: "legacy-token",
      concept: "Existed before provenance tracking",
      question: "A question of unknown origin?",
    });
    await db.exec("ALTER TABLE tokens DROP COLUMN question_source");
    await db.close();

    db = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });

    const legacy = await getTokenBySlug(db, "legacy-token");
    expect(legacy?.question_source).toBe("llm");
  });

  it("treats raw inserts without provenance as llm (old snapshot restores)", async () => {
    // Old snapshots INSERT with an explicit column list that predates
    // question_source, so restored rows must fall back to 'llm', not
    // 'manual' — mirroring the migration backfill.
    await db
      .prepare(
        `INSERT INTO tokens (id, slug, title, concept, domain, bloom_level, context, created_at, updated_at)
         VALUES ('01LEGACY', 'restored-token', '', 'Restored from an old backup', 'testing', 1, '', '2026-01-01', '2026-01-01')`,
      )
      .run();

    const restored = await getTokenBySlug(db, "restored-token");
    expect(restored?.question_source).toBe("llm");
  });

  it("review queue items carry the question source", async () => {
    const token = await createToken(db, {
      slug: "queued",
      concept: "Appears in the review queue",
      domain: "testing",
      question: "Hand-written question?",
    });
    await ensureCard(db, token.id, "thomas");

    const queue = await buildReviewQueue(db, { userId: "thomas" });

    expect(queue.items).toHaveLength(1);
    expect(queue.items[0].questionSource).toBe("manual");
  });
});
