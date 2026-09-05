import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addPrerequisite,
  buildReviewQueue,
  createToken,
  type Database,
  ensureCard,
  evaluatePublicationReadiness,
  isSlugEcho,
  openDatabase,
  publishTokenRevision,
  structuralPublicationChecks,
} from "../../src/kernel/index.js";

describe("structural publication checks", () => {
  it("detects empty criteria, missing questions, and slug echoes", () => {
    expect(
      structuralPublicationChecks({
        slug: "pythagorean-theorem",
        concept: "  ",
        question: null,
        requireQuestion: true,
      }).map((check) => check.code),
    ).toEqual(["empty_criterion", "missing_question"]);

    expect(
      structuralPublicationChecks({
        slug: "pythagorean-theorem",
        concept: "Pythagorean theorem",
        question: "pythagorean-theorem",
        requireQuestion: true,
      }).map((check) => check.code),
    ).toEqual(["criterion_slug_echo", "question_slug_echo"]);

    expect(
      structuralPublicationChecks({
        slug: "pythagorean-theorem",
        concept:
          "The square of the hypotenuse equals the sum of the squares of the legs.",
        question:
          "What does the Pythagorean theorem relate in a right triangle?",
        requireQuestion: true,
      }),
    ).toEqual([]);
  });

  it("treats hyphen and space variants as slug echoes", () => {
    expect(
      isSlugEcho(
        "force-equals-mass-times-accel",
        "Force equals mass times accel",
      ),
    ).toBe(true);
    expect(isSlugEcho("force-equals-mass-times-accel", "F = m a")).toBe(false);
  });
});

describe("publishTokenRevision publication gate", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-publication-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("keeps createToken published by default so curated callers stay explicit", async () => {
    const token = await createToken(db, {
      slug: "curated-default",
      concept: "A curated criterion that is not a slug echo.",
      question: "What is the curated criterion?",
    });
    expect(token.editorial_state).toBe("published");
  });

  it("blocks first publication of a draft without a question", async () => {
    const token = await createToken(db, {
      slug: "draft-no-question",
      concept: "A real criterion that is not the slug.",
      editorial_state: "draft",
    });
    await expect(
      publishTokenRevision(db, {
        tokenId: token.id,
        materiality: "cosmetic",
      }),
    ).rejects.toThrow(/question is required/i);
    expect((await evaluatePublicationReadiness(db, token.id)).ready).toBe(
      false,
    );
  });

  it("publishes a reviewed draft and keeps it out of the queue until then", async () => {
    const token = await createToken(db, {
      slug: "draft-ready",
      concept: "Force equals mass times acceleration.",
      question: "How are force, mass and acceleration related?",
      domain: "physics",
      editorial_state: "draft",
    });
    await ensureCard(db, token.id, "alice");
    await db
      .prepare("UPDATE cards SET due_at = '2000-01-01T00:00:00.000Z'")
      .run();

    const before = await buildReviewQueue(db, { userId: "alice" });
    expect(before.items.some((item) => item.tokenId === token.id)).toBe(false);

    const result = await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "cosmetic",
    });
    expect(result.cardsRetested).toBe(0);

    const after = await buildReviewQueue(db, { userId: "alice" });
    expect(after.items.some((item) => item.tokenId === token.id)).toBe(true);
  });

  it("grandfathers already-published tokens that never had a question", async () => {
    const token = await createToken(db, {
      slug: "legacy-no-question",
      concept: "A legacy criterion that is not the slug.",
    });
    const result = await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "cosmetic",
      changes: { context: "clarified wording" },
    });
    expect(result.contentVersion).toBe(1);
  });

  it("rejects clearing the question on a later revision", async () => {
    const token = await createToken(db, {
      slug: "has-question",
      concept: "A criterion that is not the slug.",
      question: "What is the criterion?",
    });
    await expect(
      publishTokenRevision(db, {
        tokenId: token.id,
        materiality: "cosmetic",
        changes: { question: "  " },
      }),
    ).rejects.toThrow(/question is required/i);
  });

  it("flags a missing referenced learning atom", async () => {
    const token = await createToken(db, {
      slug: "orphan-atom-item",
      concept: "A criterion that is not the slug.",
      question: "What is the criterion?",
      editorial_state: "draft",
      atom_id: "01INVALIDATOMID00000000000",
    });
    const review = await evaluatePublicationReadiness(db, token.id);
    expect(
      review.blocking.some((check) => check.code === "invalid_referenced_item"),
    ).toBe(true);
  });

  it("accepts valid prerequisite edges", async () => {
    const parent = await createToken(db, {
      slug: "parent-item",
      concept: "A parent criterion that is not the slug.",
      question: "What is the parent criterion?",
    });
    const child = await createToken(db, {
      slug: "child-item",
      concept: "A child criterion that is not the slug.",
      question: "What is the child criterion?",
      editorial_state: "draft",
    });
    await addPrerequisite(db, child.id, parent.id);
    expect((await evaluatePublicationReadiness(db, child.id)).ready).toBe(true);
  });
});
