import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION } from "../../src/kernel/db/provision.js";
import {
  AtomSiblingOccupiedError,
  abandonPresentation,
  admitPresentation,
  buildReviewQueue,
  CardNotDueError,
  CardNotReviewableError,
  createToken,
  type Database,
  endSession,
  ensureCard,
  executeReviewAction,
  exportSnapshot,
  getCard,
  getDueCards,
  getReviewsForCard,
  importSnapshot,
  localLearningDay,
  occupyingAtomCards,
  openDatabase,
  parseStoredTimestamp,
  PRECONDITION_BURIED_REASON,
  PRECONDITION_READY_REASON,
  resolvePresentationTimeZone,
  setSetting,
  startSession,
  TIMEZONE_SETTING,
} from "../../src/kernel/index.js";

describe("atom sibling presentations", () => {
  let tempDir: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-presentation-"));
    db = await openDatabase({
      dbPath: join(tempDir, "test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function insertAtom(title: string): Promise<string> {
    const id = ulid();
    await db
      .prepare("INSERT INTO learning_atoms (id, title) VALUES (?, ?)")
      .run(id, title);
    return id;
  }

  async function siblingCards(
    userId: string,
    atomId: string,
    slugs: string[],
  ): Promise<Array<{ cardId: string; tokenId: string; slug: string }>> {
    const created = [];
    for (const slug of slugs) {
      const token = await createToken(db, {
        slug,
        concept: `Criterion for ${slug}`,
        domain: "math",
        bloom_level: 2,
        question: `Question for ${slug}?`,
        atom_id: atomId,
      });
      const card = await ensureCard(db, token.id, userId);
      created.push({ cardId: card.id, tokenId: token.id, slug });
    }
    return created;
  }

  it("derives the local learning day across DST boundaries", () => {
    expect(
      localLearningDay(
        new Date("2026-03-08T04:30:00.000Z"),
        "America/New_York",
      ),
    ).toBe("2026-03-07");
    expect(
      localLearningDay(
        new Date("2026-03-08T05:00:00.000Z"),
        "America/New_York",
      ),
    ).toBe("2026-03-08");
    expect(
      localLearningDay(
        new Date("2026-03-08T06:30:00.000Z"),
        "America/New_York",
      ),
    ).toBe("2026-03-08");
    expect(
      localLearningDay(
        new Date("2026-03-08T07:30:00.000Z"),
        "America/New_York",
      ),
    ).toBe("2026-03-08");

    expect(
      localLearningDay(new Date("2026-03-28T22:30:00.000Z"), "Europe/Berlin"),
    ).toBe("2026-03-28");
    expect(
      localLearningDay(new Date("2026-03-28T23:00:00.000Z"), "Europe/Berlin"),
    ).toBe("2026-03-29");
    expect(
      localLearningDay(new Date("2026-03-29T00:30:00.000Z"), "Europe/Berlin"),
    ).toBe("2026-03-29");
    expect(
      localLearningDay(new Date("2026-03-29T01:30:00.000Z"), "Europe/Berlin"),
    ).toBe("2026-03-29");

    expect(() => localLearningDay(new Date(), "Not/AZone")).toThrow(
      /Invalid time zone/,
    );
  });

  it("resolves the learner time zone from override, then setting, then host", async () => {
    await setSetting(db, TIMEZONE_SETTING, "Europe/Berlin");
    expect(await resolvePresentationTimeZone(db, "America/New_York")).toBe(
      "America/New_York",
    );
    expect(await resolvePresentationTimeZone(db)).toBe("Europe/Berlin");
    await setSetting(db, TIMEZONE_SETTING, "Not/AZone");
    const host = await resolvePresentationTimeZone(db);
    expect(host.length).toBeGreaterThan(0);
  });

  it("provisions card_presentations on a fresh library", async () => {
    const tables = (await db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'card_presentations'`,
      )
      .all()) as Array<{ name: string }>;
    expect(tables).toEqual([{ name: "card_presentations" }]);
    const marker = (await db
      .prepare("SELECT version FROM zam_schema_version WHERE singleton = 1")
      .get()) as { version: number };
    expect(marker.version).toBe(CURRENT_SCHEMA_VERSION);
    const unique = (await db
      .prepare(
        `SELECT name FROM sqlite_master
          WHERE type = 'index' AND name LIKE 'ux_card_presentations%'
          ORDER BY name`,
      )
      .all()) as Array<{ name: string }>;
    expect(unique.map((row) => row.name)).toEqual([
      "ux_card_presentations_atom_day",
      "ux_card_presentations_card_day",
    ]);
  });

  it("refuses a different atom sibling after a confirmed presentation", async () => {
    const atomId = await insertAtom("Pythagoras");
    const [p1, p2] = await siblingCards("learner", atomId, ["p1", "p2"]);
    const now = new Date("2026-09-05T12:00:00.000Z");

    const first = await admitPresentation(db, {
      userId: "learner",
      cardId: p1.cardId,
      timeZone: "UTC",
      now,
      confirm: true,
    });
    expect(first.presented).toBe(true);

    await expect(
      admitPresentation(db, {
        userId: "learner",
        cardId: p2.cardId,
        timeZone: "UTC",
        now,
        confirm: true,
      }),
    ).rejects.toBeInstanceOf(AtomSiblingOccupiedError);

    const again = await admitPresentation(db, {
      userId: "learner",
      cardId: p1.cardId,
      timeZone: "UTC",
      now,
      confirm: true,
    });
    expect(again.attemptId).toBe(first.attemptId);
  });

  it("releases an abandoned reservation so a sibling can be shown", async () => {
    const atomId = await insertAtom("Pythagoras");
    const [p1, p2] = await siblingCards("learner", atomId, ["p1", "p2"]);
    const now = new Date("2026-09-05T12:00:00.000Z");

    const hold = await admitPresentation(db, {
      userId: "learner",
      cardId: p1.cardId,
      timeZone: "UTC",
      now,
      confirm: false,
    });
    expect(hold.presented).toBe(false);
    expect(await abandonPresentation(db, hold.attemptId, now)).toBe(true);

    const second = await admitPresentation(db, {
      userId: "learner",
      cardId: p2.cardId,
      timeZone: "UTC",
      now,
      confirm: true,
    });
    expect(second.presented).toBe(true);
    expect(second.cardId).toBe(p2.cardId);
  });

  it("keeps the restriction after a confirmed skip without a rating", async () => {
    const atomId = await insertAtom("Pythagoras");
    const [p1, p2] = await siblingCards("learner", atomId, ["p1", "p2"]);
    const now = new Date("2026-09-05T12:00:00.000Z");

    await admitPresentation(db, {
      userId: "learner",
      cardId: p1.cardId,
      timeZone: "UTC",
      now,
      confirm: true,
    });

    await expect(
      admitPresentation(db, {
        userId: "learner",
        cardId: p2.cardId,
        timeZone: "UTC",
        now,
      }),
    ).rejects.toThrow(/already presented today/);
  });

  it("does not treat other learners, other atoms, or historical review logs as presentations", async () => {
    const atomP = await insertAtom("P");
    const atomQ = await insertAtom("Q");
    const [p1, p2] = await siblingCards("anna", atomP, ["p1", "p2"]);
    const [q1] = await siblingCards("anna", atomQ, ["q1"]);
    const [p2b] = await siblingCards("bert", atomP, ["bert-p2"]);
    const now = new Date("2026-09-05T12:00:00.000Z");

    await db
      .prepare(
        `INSERT INTO review_logs (id, card_id, token_id, user_id, rating, scheduled_at, reviewed_at)
         VALUES (?, ?, ?, ?, 3, ?, ?)`,
      )
      .run(
        ulid(),
        p1.cardId,
        p1.tokenId,
        "anna",
        now.toISOString(),
        now.toISOString(),
      );

    const occupying = await occupyingAtomCards(db, "anna", "2026-09-05");
    expect(occupying.size).toBe(0);

    await admitPresentation(db, {
      userId: "anna",
      cardId: p1.cardId,
      timeZone: "UTC",
      now,
    });

    await admitPresentation(db, {
      userId: "anna",
      cardId: q1.cardId,
      timeZone: "UTC",
      now,
    });
    await admitPresentation(db, {
      userId: "bert",
      cardId: p2b.cardId,
      timeZone: "UTC",
      now,
    });

    await expect(
      admitPresentation(db, {
        userId: "anna",
        cardId: p2.cardId,
        timeZone: "UTC",
        now,
      }),
    ).rejects.toBeInstanceOf(AtomSiblingOccupiedError);
  });

  it("filters a presented atom's other items out of the queue", async () => {
    const atomId = await insertAtom("Pythagoras");
    const [p1, p2] = await siblingCards("learner", atomId, ["p-one", "p-two"]);
    const other = await createToken(db, {
      slug: "other-atom-item",
      concept: "A different atom",
      domain: "math",
      bloom_level: 2,
      question: "Other?",
    });
    await ensureCard(db, other.id, "learner");
    const now = new Date("2026-09-05T12:00:00.000Z");

    const before = await buildReviewQueue(db, {
      userId: "learner",
      timeZone: "UTC",
      now,
    });
    expect(before.items.map((item) => item.cardId).sort()).toEqual(
      [
        p1.cardId,
        p2.cardId,
        (await getCard(db, other.id, "learner"))!.id,
      ].sort(),
    );

    await admitPresentation(db, {
      userId: "learner",
      cardId: p1.cardId,
      timeZone: "UTC",
      now,
    });

    const after = await buildReviewQueue(db, {
      userId: "learner",
      timeZone: "UTC",
      now,
    });
    const afterIds = after.items.map((item) => item.cardId);
    expect(afterIds).toContain(p1.cardId);
    expect(afterIds).not.toContain(p2.cardId);
    expect(afterIds).toContain((await getCard(db, other.id, "learner"))!.id);
  });

  it("abandons unconfirmed reservations when a session ends", async () => {
    const atomId = await insertAtom("Pythagoras");
    const [p1, p2] = await siblingCards("learner", atomId, ["p1", "p2"]);
    const session = await startSession(db, {
      user_id: "learner",
      task: "study",
    });
    const now = new Date("2026-09-05T12:00:00.000Z");

    await admitPresentation(db, {
      userId: "learner",
      cardId: p1.cardId,
      sessionId: session.id,
      timeZone: "UTC",
      now,
      confirm: false,
    });
    await endSession(db, session.id);

    const second = await admitPresentation(db, {
      userId: "learner",
      cardId: p2.cardId,
      timeZone: "UTC",
      now,
      confirm: true,
    });
    expect(second.cardId).toBe(p2.cardId);
  });

  it("lifts only matching precondition deferrals on rating 1", async () => {
    const atomH = await insertAtom("Hypotenuse foundation");
    const atomP = await insertAtom("Pythagoras");
    await db
      .prepare(
        `INSERT INTO atom_prerequisites (atom_id, requires_id, kind)
         VALUES (?, ?, 'hard')`,
      )
      .run(atomP, atomH);

    const hToken = await createToken(db, {
      slug: "h-main",
      concept: "Foundation criterion",
      domain: "math",
      question: "Foundation?",
      atom_id: atomH,
    });
    const hReadyToken = await createToken(db, {
      slug: "h-ready",
      concept: "Pulled-forward foundation",
      domain: "math",
      question: "Ready?",
      atom_id: atomH,
    });
    const p3 = await createToken(db, {
      slug: "p3",
      concept: "P3 criterion",
      domain: "math",
      question: "P3?",
      atom_id: atomP,
    });
    const p1 = await createToken(db, {
      slug: "p1-sibling",
      concept: "P1 criterion",
      domain: "math",
      question: "P1?",
      atom_id: atomP,
    });
    const other = await createToken(db, {
      slug: "unrelated",
      concept: "Unrelated",
      domain: "math",
      question: "Other?",
    });

    const hCard = await ensureCard(db, hToken.id, "learner");
    const hReadyCard = await ensureCard(db, hReadyToken.id, "learner");
    const p3Card = await ensureCard(db, p3.id, "learner");
    await ensureCard(db, p1.id, "learner");
    const otherCard = await ensureCard(db, other.id, "learner");

    const buriedUntil = "2026-12-01T00:00:00.000Z";
    await db
      .prepare(
        `UPDATE cards
            SET buried_until = ?, buried_reason = ?, stability = 18,
                difficulty = 5, reps = 6, state = 'review'
          WHERE id = ?`,
      )
      .run(buriedUntil, PRECONDITION_BURIED_REASON, hCard.id);
    await db
      .prepare(
        `UPDATE cards SET buried_until = ?, buried_reason = ? WHERE id = ?`,
      )
      .run(buriedUntil, PRECONDITION_READY_REASON, hReadyCard.id);
    await db
      .prepare(
        `UPDATE cards SET buried_until = ?, buried_reason = 'sibling' WHERE id = ?`,
      )
      .run(buriedUntil, otherCard.id);

    await executeReviewAction(db, {
      action: "rate",
      cardId: p3Card.id,
      userId: "learner",
      rating: 1,
    });

    const hAfter = await getCard(db, hToken.id, "learner");
    expect(hAfter?.buried_reason).toBeNull();
    expect(hAfter?.buried_until).toBeNull();
    expect(hAfter?.stability).toBe(18);
    expect(hAfter?.difficulty).toBe(5);
    expect(hAfter?.reps).toBe(6);
    expect(hAfter?.state).toBe("review");

    const readyAfter = await getCard(db, hReadyToken.id, "learner");
    expect(readyAfter?.buried_reason).toBe(PRECONDITION_READY_REASON);

    const siblingAfter = await getCard(db, other.id, "learner");
    expect(siblingAfter?.buried_reason).toBe("sibling");

    const p1After = await getCard(db, p1.id, "learner");
    expect(p1After?.state).toBe("new");
    expect(p1After?.reps).toBe(0);
  });

  it("hands out one attempt id per attempt, not per presentation", async () => {
    const atomId = await insertAtom("Attempts");
    const [p1] = await siblingCards("learner", atomId, ["attempt-p1"]);
    const now = new Date("2026-09-05T12:00:00.000Z");
    const admit = (at: Date) =>
      admitPresentation(db, {
        userId: "learner",
        cardId: p1.cardId,
        timeZone: "UTC",
        now: at,
      });

    const first = await admit(now);
    // A retry before any submit sees the same pending attempt.
    const retry = await admit(now);
    expect(retry.presentationId).toBe(first.presentationId);
    expect(retry.attemptId).toBe(first.attemptId);

    const rated = await executeReviewAction(db, {
      action: "rate",
      cardId: p1.cardId,
      userId: "learner",
      rating: 1,
      attemptId: first.attemptId,
      now,
    });
    expect(rated.applied).toBe(true);
    // The same attempt cannot write a second review.
    const replay = await executeReviewAction(db, {
      action: "rate",
      cardId: p1.cardId,
      userId: "learner",
      rating: 1,
      attemptId: first.attemptId,
      now,
    });
    expect(replay.applied).toBe(false);
    expect(await getReviewsForCard(db, p1.cardId)).toHaveLength(1);

    // The one-minute learning step brings the card back on the same day:
    // same presentation, new attempt, second review.
    const later = new Date(now.getTime() + 2 * 60_000);
    const again = await admit(later);
    expect(again.presentationId).toBe(first.presentationId);
    expect(again.attemptId).not.toBe(first.attemptId);
    const second = await executeReviewAction(db, {
      action: "rate",
      cardId: p1.cardId,
      userId: "learner",
      rating: 3,
      attemptId: again.attemptId,
      now: later,
    });
    expect(second.applied).toBe(true);
    expect(await getReviewsForCard(db, p1.cardId)).toHaveLength(2);
  });

  it("refuses an attempt id that belongs to another card", async () => {
    const [a, b] = await siblingCards("learner", await insertAtom("A"), [
      "own-a",
    ]).then(async ([a]) => [
      a,
      (await siblingCards("learner", await insertAtom("B"), ["own-b"]))[0],
    ]);
    const now = new Date("2026-09-05T12:00:00.000Z");
    const admission = await admitPresentation(db, {
      userId: "learner",
      cardId: a.cardId,
      timeZone: "UTC",
      now,
    });
    await expect(
      executeReviewAction(db, {
        action: "rate",
        cardId: b.cardId,
        userId: "learner",
        rating: 3,
        attemptId: admission.attemptId,
        now,
      }),
    ).rejects.toThrow("different card");
    await expect(
      executeReviewAction(db, {
        action: "rate",
        cardId: a.cardId,
        userId: "someone-else",
        rating: 3,
        attemptId: admission.attemptId,
        now,
      }),
    ).rejects.toThrow("does not belong");
    expect(await getReviewsForCard(db, b.cardId)).toHaveLength(0);
  });

  it("admits, lists and rates only published content", async () => {
    const draft = await createToken(db, {
      slug: "draft-item",
      concept: "Criterion for a draft",
      domain: "math",
      bloom_level: 1,
      question: "Question for a draft?",
      editorial_state: "draft",
    });
    const card = await ensureCard(db, draft.id, "learner");
    await expect(
      admitPresentation(db, {
        userId: "learner",
        cardId: card.id,
        timeZone: "UTC",
      }),
    ).rejects.toBeInstanceOf(CardNotReviewableError);
    await expect(
      executeReviewAction(db, {
        action: "rate",
        cardId: card.id,
        userId: "learner",
        rating: 3,
      }),
    ).rejects.toThrow("cannot be reviewed");
    expect(
      (await getDueCards(db, "learner")).map((row) => row.token_id),
    ).not.toContain(draft.id);
  });

  it("reads zone-less SQLite timestamps as UTC when judging due dates", async () => {
    const utc = Date.parse("2026-09-06T14:00:00.000Z");
    expect(parseStoredTimestamp("2026-09-06 14:00:00")).toBe(utc);
    expect(parseStoredTimestamp("2026-09-06T14:00:00.000Z")).toBe(utc);

    const [p1] = await siblingCards("learner", await insertAtom("Due"), [
      "due-p1",
    ]);
    await db
      .prepare("UPDATE cards SET last_review_at = ?, due_at = ? WHERE id = ?")
      .run("2026-09-01T10:00:00.000Z", "2026-09-06 14:00:00", p1.cardId);
    await expect(
      admitPresentation(db, {
        userId: "learner",
        cardId: p1.cardId,
        timeZone: "America/New_York",
        now: new Date("2026-09-06T13:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(CardNotDueError);
    const admitted = await admitPresentation(db, {
      userId: "learner",
      cardId: p1.cardId,
      timeZone: "America/New_York",
      now: new Date("2026-09-06T15:00:00.000Z"),
    });
    expect(admitted.presented).toBe(true);
  });

  it("round-trips presentations through a snapshot", async () => {
    const atomId = await insertAtom("Pythagoras");
    const [p1] = await siblingCards("learner", atomId, ["p1"]);
    const now = new Date("2026-09-05T12:00:00.000Z");
    await admitPresentation(db, {
      userId: "learner",
      cardId: p1.cardId,
      timeZone: "UTC",
      now,
    });

    const snapshot = await exportSnapshot(db);
    const targetDir = mkdtempSync(join(tmpdir(), "zam-presentation-snap-"));
    const target = await openDatabase({
      dbPath: join(targetDir, "restored.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    try {
      await importSnapshot(target, snapshot);
      const occupying = await occupyingAtomCards(
        target,
        "learner",
        "2026-09-05",
      );
      expect([...occupying.get(atomId)!]).toEqual([p1.cardId]);
    } finally {
      await target.close();
      rmSync(targetDir, { recursive: true, force: true });
    }
  });
});
