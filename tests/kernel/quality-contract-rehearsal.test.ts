import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AtomSiblingOccupiedError,
  admitPresentation,
  applySessionSynthesis,
  buildReviewQueue,
  createToken,
  type Database,
  endSession,
  ensureCard,
  executeReviewAction,
  getCard,
  getReviewsForCard,
  getSessionSummary,
  installKvtTile,
  type KvtTile,
  materialiseKvtCards,
  openDatabase,
  PRECONDITION_BURIED_REASON,
  publishTokenRevision,
  recordAssistedStep,
  startSession,
} from "../../src/kernel/index.js";

const FIXTURES = resolve(__dirname, "../fixtures/curriculum");
const H = "01K4T9M0000000000000000AH0";
const P = "01K4T9M0000000000000000A01";
const U = "01K4T9M0000000000000000AV0";
const P1 = "01K4T9M0000000000000000PP1";
const P2 = "01K4T9M0000000000000000PP2";
const P3 = "01K4T9M0000000000000000PA0";
const H1 = "01K4T9M0000000000000000HH1";
const U1 = "01K4T9M0000000000000000VV1";
const USER = "rehearsal-learner";
const DAY0 = new Date("2026-09-07T12:00:00.000Z");
const DAY1 = new Date("2026-09-08T12:00:00.000Z");

function loadTile(): KvtTile {
  return JSON.parse(
    readFileSync(
      join(
        FIXTURES,
        "de-by-realschule-9-mathematik-pythagoras-trigonometrie-kvt.json",
      ),
      "utf-8",
    ),
  ) as KvtTile;
}

const synthesisEvidence = {
  matchedCommands: 2,
  helpSeeking: false,
  errorCount: 0,
  selfCorrections: 0,
  medianGapMs: 1500,
  thinkingGapMs: null,
};

describe("quality-contract technical rehearsal (Phase 6)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-rehearsal-"));
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

  it("runs draft publish, sibling exclusion, H deferral, assisted, independent, and duplicate synthesis on one test library", async () => {
    const draft = await createToken(db, {
      slug: "rehearsal-draft-force",
      concept: "Force equals mass times acceleration.",
      question: "How are force, mass and acceleration related?",
      domain: "physics",
      editorial_state: "draft",
    });
    const draftCard = await ensureCard(db, draft.id, USER);
    const beforePublish = await buildReviewQueue(db, { userId: USER });
    expect(beforePublish.items.some((item) => item.tokenId === draft.id)).toBe(
      false,
    );

    await publishTokenRevision(db, {
      tokenId: draft.id,
      materiality: "cosmetic",
    });
    const afterPublish = await buildReviewQueue(db, { userId: USER });
    expect(afterPublish.items.some((item) => item.tokenId === draft.id)).toBe(
      true,
    );

    await installKvtTile(db, loadTile());
    await materialiseKvtCards(db, USER, [H, P, U]);
    const p1 = await getCard(db, P1, USER);
    const p2 = await getCard(db, P2, USER);
    const p3 = await getCard(db, P3, USER);
    const h1 = await getCard(db, H1, USER);
    const u1 = await getCard(db, U1, USER);
    expect(p1 && p2 && p3 && h1 && u1).toBeTruthy();

    const shown = await admitPresentation(db, {
      userId: USER,
      cardId: p1!.id,
      timeZone: "UTC",
      now: DAY0,
      confirm: true,
    });
    expect(shown.presented).toBe(true);

    await expect(
      admitPresentation(db, {
        userId: USER,
        cardId: p2!.id,
        timeZone: "UTC",
        now: DAY0,
        confirm: true,
      }),
    ).rejects.toBeInstanceOf(AtomSiblingOccupiedError);
    await expect(
      admitPresentation(db, {
        userId: USER,
        cardId: p3!.id,
        timeZone: "UTC",
        now: DAY0,
        confirm: true,
      }),
    ).rejects.toBeInstanceOf(AtomSiblingOccupiedError);

    const retryP1 = await admitPresentation(db, {
      userId: USER,
      cardId: p1!.id,
      timeZone: "UTC",
      now: DAY0,
      confirm: true,
    });
    expect(retryP1.attemptId).toBe(shown.attemptId);
    expect(await getReviewsForCard(db, p1!.id)).toHaveLength(0);

    const assistedSession = await startSession(db, {
      user_id: USER,
      task: "Rehearsal assisted converse",
    });
    const u1Before = await getCard(db, U1, USER);
    const assisted = await recordAssistedStep(db, {
      cardId: u1!.id,
      userId: USER,
      sessionId: assistedSession.id,
      actor: "user",
      reason: "Followed a demonstrated converse check",
    });
    expect(assisted.replayed).toBe(false);
    expect(assisted.sessionStep.rating).toBeNull();
    const u1AfterAssist = await getCard(db, U1, USER);
    expect(u1AfterAssist?.reps).toBe(u1Before?.reps ?? 0);
    expect(await getReviewsForCard(db, u1!.id)).toHaveLength(0);
    const assistedSummary = await getSessionSummary(db, assistedSession.id);
    expect(assistedSummary.steps.some((step) => step.token_id === U1)).toBe(
      true,
    );

    const independent = await executeReviewAction(db, {
      action: "rate",
      cardId: draftCard.id,
      userId: USER,
      rating: 3,
      independent: true,
      actor: "user",
      now: DAY0,
    });
    expect(independent.applied).toBe(true);
    const draftAfter = await getCard(db, draft.id, USER);
    expect(draftAfter?.reps).toBe(1);
    expect(await getReviewsForCard(db, draftCard.id)).toHaveLength(1);

    const work = await createToken(db, {
      slug: "rehearsal-git-status",
      concept: "git status lists uncommitted worktree changes.",
      question: "Which git command lists uncommitted worktree changes?",
      domain: "git",
    });
    await ensureCard(db, work.id, USER);
    const synthSession = await startSession(db, {
      user_id: USER,
      task: "Inspect a repository",
    });
    await endSession(db, synthSession.id);
    const synthInput = {
      sessionId: synthSession.id,
      tokenSlug: work.slug,
      inferredRating: null as 1 | 2 | 3 | 4 | null,
      confirmedRating: 3 as const,
      confidence: "medium" as const,
      evidence: synthesisEvidence,
      matchedCommandTexts: ["git status --short", "git diff --check"],
    };
    const firstSynth = await applySessionSynthesis(db, synthInput);
    expect(firstSynth.applied).toBe(true);
    const replaySynth = await applySessionSynthesis(db, synthInput);
    expect(replaySynth.applied).toBe(false);
    const workCard = await getCard(db, work.id, USER);
    expect(workCard?.reps).toBe(1);
    expect(await getReviewsForCard(db, workCard!.id)).toHaveLength(1);

    const buriedUntil = "2026-12-01T00:00:00.000Z";
    await db
      .prepare(
        `UPDATE cards
            SET buried_until = ?, buried_reason = ?, stability = 18,
                difficulty = 5, reps = 6, state = 'review'
          WHERE id = ?`,
      )
      .run(buriedUntil, PRECONDITION_BURIED_REASON, h1!.id);

    const p3Admit = await admitPresentation(db, {
      userId: USER,
      cardId: p3!.id,
      timeZone: "UTC",
      now: DAY1,
      confirm: true,
    });
    expect(p3Admit.presented).toBe(true);
    await executeReviewAction(db, {
      action: "rate",
      cardId: p3!.id,
      userId: USER,
      rating: 1,
      attemptId: p3Admit.attemptId,
      now: DAY1,
    });

    const hAfter = await getCard(db, H1, USER);
    expect(hAfter?.buried_reason).toBeNull();
    expect(hAfter?.buried_until).toBeNull();
    expect(hAfter?.stability).toBe(18);
    expect(hAfter?.reps).toBe(6);
    expect(hAfter?.state).toBe("review");
    const p1After = await getCard(db, P1, USER);
    expect(p1After?.reps).toBe(0);
    expect(p1After?.state).toBe("new");

    const presentations = (await db
      .prepare(
        `SELECT card_id, atom_id, learning_day, presented_at, abandoned_at
           FROM card_presentations
          WHERE user_id = ?
          ORDER BY reserved_at`,
      )
      .all(USER)) as Array<{
      card_id: string;
      atom_id: string | null;
      learning_day: string;
      presented_at: string | null;
      abandoned_at: string | null;
    }>;
    const shownP = presentations.filter(
      (row) => row.presented_at && row.abandoned_at === null,
    );
    expect(shownP.some((row) => row.card_id === p1!.id)).toBe(true);
    expect(shownP.some((row) => row.card_id === p3!.id)).toBe(true);
    expect(shownP.some((row) => row.card_id === p2!.id)).toBe(false);
  });
});
