import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AssistedSuccessError,
  AttemptConflictError,
  addPrerequisite,
  appendUiObservationReport,
  applySessionSynthesis,
  buildReviewQueue,
  createAgentSkill,
  createToken,
  type Database,
  ensureCard,
  executeReviewAction,
  getCard,
  getReviewsForCard,
  getSessionSummary,
  getSessionSynthesisRecords,
  openDatabase,
  prepareSessionSynthesis,
  startSession,
} from "../../src/kernel/index.js";
import type { CommandRecord } from "../../src/kernel/observation/analyzer.js";

function command(
  seq: number,
  text: string,
  options: { exitCode?: number; offsetSeconds?: number } = {},
): CommandRecord {
  const offset = options.offsetSeconds ?? seq * 2;
  const startedAt = new Date(Date.UTC(2026, 0, 1, 0, 0, offset));
  const endedAt = new Date(startedAt.getTime() + 500);
  return {
    seq,
    pid: 1,
    command: text,
    cwd: "/project",
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationMs: 500,
    exitCode: options.exitCode ?? 0,
  };
}

/** Wrap a Database so every prepare() call is counted. */
function countPrepares(db: Database, counter: { count: number }): Database {
  return {
    prepare(sql: string) {
      counter.count++;
      return db.prepare(sql);
    },
    exec: (sql: string) => db.exec(sql),
    pragma: (source: string) => db.pragma(source),
    transaction: <T>(fn: (tx: Database) => Promise<T>) => db.transaction(fn),
    close: () => db.close(),
  };
}

const cleanEvidence = {
  matchedCommands: 2,
  helpSeeking: false,
  errorCount: 0,
  selfCorrections: 0,
  medianGapMs: 1500,
  thinkingGapMs: null,
};

describe("automatic session synthesis", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-synthesis-"));
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

  it("builds medium-confidence candidates from agent-skill steps", async () => {
    const token = await createToken(db, {
      slug: "git-inspect-worktree",
      concept: "git status and git diff inspect pending worktree changes",
      domain: "git",
      bloom_level: 3,
    });
    await createAgentSkill(db, {
      slug: "inspect-worktree",
      description: "Inspect pending Git changes",
      steps: ["Run `git status --short`", "Run `git diff --check`"],
      token_slugs: [token.slug],
    });
    const session = await startSession(db, {
      user_id: "tester",
      task: "Inspect a repository",
    });

    const preview = await prepareSessionSynthesis(db, {
      sessionId: session.id,
      commands: [
        command(1, "git status --short"),
        command(2, "git diff --check"),
      ],
    });

    expect(preview.patternCount).toBe(1);
    expect(preview.commandCount).toBe(2);
    expect(preview.candidates).toHaveLength(1);
    expect(preview.candidates[0]).toMatchObject({
      tokenSlug: token.slug,
      inferredRating: null,
      confidence: "medium",
    });
  });

  it("accepts explicit patterns and filters low-confidence matches", async () => {
    const token = await createToken(db, {
      slug: "npm-build",
      concept: "npm run build executes the package build script",
      domain: "node",
      bloom_level: 3,
    });
    const session = await startSession(db, {
      user_id: "tester",
      task: "Build the package",
    });

    const low = await prepareSessionSynthesis(db, {
      sessionId: session.id,
      explicitPatterns: [{ slug: token.slug, patterns: ["npm run build"] }],
      commands: [command(1, "npm run build")],
    });
    expect(low.candidates).toEqual([]);
    expect(low.skippedLowConfidence).toBe(1);

    const high = await prepareSessionSynthesis(db, {
      sessionId: session.id,
      explicitPatterns: [
        {
          slug: token.slug,
          patterns: ["npm run build", "npm run test", "npm run lint"],
        },
      ],
      minConfidence: "high",
      commands: [
        command(1, "npm run build"),
        command(2, "npm run test"),
        command(3, "npm run lint"),
      ],
    });
    expect(high.candidates).toHaveLength(1);
    expect(high.candidates[0].confidence).toBe("high");
  });

  it("issues a constant number of queries regardless of pattern count", async () => {
    const makeSkillToken = async (i: number) => {
      const token = await createToken(db, {
        slug: `pattern-token-${i}`,
        concept: `pattern command ${i} does something useful`,
        domain: "testing",
        bloom_level: 3,
      });
      await createAgentSkill(db, {
        slug: `pattern-skill-${i}`,
        description: `Skill ${i}`,
        steps: [`Run \`pattern-command-${i}\``],
        token_slugs: [token.slug],
      });
    };

    for (let i = 0; i < 2; i++) await makeSkillToken(i);
    const session = await startSession(db, {
      user_id: "tester",
      task: "Count queries",
    });

    const counter = { count: 0 };
    const counted = countPrepares(db, counter);
    await prepareSessionSynthesis(counted, {
      sessionId: session.id,
      commands: [command(1, "pattern-command-0")],
    });
    const queriesForTwoPatterns = counter.count;

    for (let i = 2; i < 8; i++) await makeSkillToken(i);
    counter.count = 0;
    await prepareSessionSynthesis(counted, {
      sessionId: session.id,
      commands: [command(1, "pattern-command-0")],
    });

    expect(counter.count).toBe(queriesForTwoPatterns);
  });

  it("requires explicit patterns for skills linked to multiple tokens", async () => {
    const first = await createToken(db, {
      slug: "git-status",
      concept: "git status summarizes working tree state",
      domain: "git",
      bloom_level: 2,
    });
    const second = await createToken(db, {
      slug: "git-diff",
      concept: "git diff shows unstaged changes",
      domain: "git",
      bloom_level: 2,
    });
    await createAgentSkill(db, {
      slug: "inspect-worktree",
      description: "Inspect pending Git changes",
      steps: ["Run `git status --short`", "Run `git diff --check`"],
      token_slugs: [first.slug, second.slug],
    });
    const session = await startSession(db, {
      user_id: "tester",
      task: "Inspect a repository",
    });

    const preview = await prepareSessionSynthesis(db, {
      sessionId: session.id,
      commands: [
        command(1, "git status --short"),
        command(2, "git diff --check"),
      ],
    });

    expect(preview.patternCount).toBe(0);
    expect(preview.candidates).toEqual([]);
  });

  it("atomically applies a confirmed rating and is idempotent", async () => {
    const token = await createToken(db, {
      slug: "git-inspect-worktree",
      concept: "git status and git diff inspect pending worktree changes",
      domain: "git",
      bloom_level: 3,
    });
    const session = await startSession(db, {
      user_id: "tester",
      task: "Inspect a repository",
    });

    const first = await applySessionSynthesis(db, {
      sessionId: session.id,
      tokenSlug: token.slug,
      inferredRating: 4,
      confirmedRating: 3,
      confidence: "medium",
      evidence: cleanEvidence,
      matchedCommandTexts: ["git status --short", "git diff --check"],
    });

    expect(first.applied).toBe(true);
    expect(first.record).toMatchObject({
      session_id: session.id,
      token_id: token.id,
      inferred_rating: 4,
      confirmed_rating: 3,
      confidence: "medium",
    });

    const card = await getCard(db, token.id, "tester");
    expect(card?.reps).toBe(1);
    const reviews = await getReviewsForCard(db, card!.id);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].session_id).toBe(session.id);
    expect(reviews[0].rating).toBe(3);

    const summary = await getSessionSummary(db, session.id);
    expect(summary.steps).toHaveLength(1);
    expect(summary.steps[0]).toMatchObject({
      token_id: token.id,
      done_by: "user",
      rating: 3,
    });
    expect(summary.steps[0].notes).toContain("Observation synthesis");

    const replay = await applySessionSynthesis(db, {
      sessionId: session.id,
      tokenSlug: token.slug,
      inferredRating: 4,
      confirmedRating: 3,
      confidence: "medium",
      evidence: cleanEvidence,
      matchedCommandTexts: ["git status --short", "git diff --check"],
    });
    expect(replay.applied).toBe(false);
    expect(replay.record.confirmed_rating).toBe(3);

    await expect(
      applySessionSynthesis(db, {
        sessionId: session.id,
        tokenSlug: token.slug,
        inferredRating: 4,
        confirmedRating: 2,
        confidence: "medium",
        evidence: cleanEvidence,
        matchedCommandTexts: ["git status --short", "git diff --check"],
      }),
    ).rejects.toBeInstanceOf(AttemptConflictError);

    expect((await getCard(db, token.id, "tester"))?.reps).toBe(1);
    expect(await getReviewsForCard(db, card!.id)).toHaveLength(1);
    expect((await getSessionSummary(db, session.id)).steps).toHaveLength(1);
    expect(await getSessionSynthesisRecords(db, session.id)).toHaveLength(1);

    const preview = await prepareSessionSynthesis(db, {
      sessionId: session.id,
      explicitPatterns: [
        {
          slug: token.slug,
          patterns: ["git status --short", "git diff --check"],
        },
      ],
      commands: [
        command(1, "git status --short"),
        command(2, "git diff --check"),
      ],
    });
    expect(preview.alreadyApplied).toBe(1);
    expect(preview.candidates).toEqual([]);
  });

  it("does not re-apply a synthesis recorded before attempt identity existed", async () => {
    const token = await createToken(db, {
      slug: "legacy-synthesis",
      concept: "git stash keeps uncommitted work aside",
      domain: "git",
      bloom_level: 3,
    });
    const session = await startSession(db, {
      user_id: "tester",
      task: "Legacy session",
    });
    const input = {
      sessionId: session.id,
      tokenSlug: token.slug,
      inferredRating: 3 as const,
      confirmedRating: 3 as const,
      confidence: "medium" as const,
      evidence: cleanEvidence,
      matchedCommandTexts: ["git stash push -m wip", "git stash apply"],
    };
    const first = await applySessionSynthesis(db, input);
    expect(first.applied).toBe(true);
    // A row migrated from before M031: no attempt to match, only the
    // (session, token) key.
    await db
      .prepare("UPDATE session_syntheses SET attempt_id = NULL WHERE id = ?")
      .run(first.record.id);
    await db
      .prepare("DELETE FROM review_attempts WHERE session_id = ?")
      .run(session.id);

    const replay = await applySessionSynthesis(db, input);
    expect(replay.applied).toBe(false);
    const card = await getCard(db, token.id, "tester");
    expect(await getReviewsForCard(db, card!.id)).toHaveLength(1);

    const preview = await prepareSessionSynthesis(db, {
      sessionId: session.id,
      explicitPatterns: [
        { slug: token.slug, patterns: ["git stash push", "git stash apply"] },
      ],
      commands: [
        command(1, "git stash push -m wip"),
        command(2, "git stash apply"),
      ],
    });
    expect(preview.alreadyApplied).toBe(1);
    expect(preview.candidates).toEqual([]);
  });

  it("routes a confirmed rating of 1 through prerequisite blocking", async () => {
    const prerequisite = await createToken(db, {
      slug: "git-working-tree",
      concept: "The working tree contains checked-out files and local changes",
      domain: "git",
      bloom_level: 1,
    });
    const target = await createToken(db, {
      slug: "git-inspect-worktree",
      concept: "git status and git diff inspect pending worktree changes",
      domain: "git",
      bloom_level: 3,
    });
    await addPrerequisite(db, target.id, prerequisite.id);
    const session = await startSession(db, {
      user_id: "tester",
      task: "Inspect a repository",
    });

    const result = await applySessionSynthesis(db, {
      sessionId: session.id,
      tokenSlug: target.slug,
      inferredRating: 2,
      confirmedRating: 1,
      confidence: "medium",
      evidence: { ...cleanEvidence, errorCount: 3 },
      matchedCommandTexts: ["git status --short", "git diff --check"],
    });

    expect(result.blocked?.blockedSlug).toBe(target.slug);
    expect((await getCard(db, target.id, "tester"))?.blocked).toBe(1);
    expect(await getCard(db, prerequisite.id, "tester")).toBeDefined();
  });

  it("rolls back card, review, and step writes when the audit insert fails", async () => {
    const token = await createToken(db, {
      slug: "git-inspect-worktree",
      concept: "git status and git diff inspect pending worktree changes",
      domain: "git",
      bloom_level: 3,
    });
    const session = await startSession(db, {
      user_id: "tester",
      task: "Inspect a repository",
    });
    await db.exec("DROP TABLE session_syntheses");

    await expect(
      applySessionSynthesis(db, {
        sessionId: session.id,
        tokenSlug: token.slug,
        inferredRating: 4,
        confirmedRating: 4,
        confidence: "medium",
        evidence: cleanEvidence,
        matchedCommandTexts: ["git status --short", "git diff --check"],
      }),
    ).rejects.toThrow(/session_syntheses/);

    expect(await getCard(db, token.id, "tester")).toBeUndefined();
    expect((await getSessionSummary(db, session.id)).steps).toEqual([]);
    const reviews = (await db
      .prepare("SELECT COUNT(*) AS n FROM review_logs")
      .get()) as { n: number };
    expect(reviews.n).toBe(0);
  });

  it("creates the synthesis audit table when opening an existing database", async () => {
    const dbPath = join(tempDir, "zam-test.db");
    // Emulate a pre-M006 database. Such a database also predates M029's
    // version marker; leaving a current marker behind would describe a corrupt
    // current database rather than a legacy one that needs migrations.
    await db.exec("DROP TABLE session_syntheses");
    await db.exec("DROP TABLE zam_schema_version");
    await db.close();

    db = await openDatabase({
      dbPath,
      useConfiguredCloud: false,
    });

    const columns = (await db.pragma(
      "table_info(session_syntheses)",
    )) as Array<{ name: string }>;
    expect(columns.map((column) => column.name)).toContain("review_log_id");
    expect(columns.map((column) => column.name)).toContain("id");
    expect(columns.map((column) => column.name)).toContain("attempt_id");
  });

  it("builds UI synthesis candidates from persisted observer reports", async () => {
    const originalDir = process.env.ZAM_OBSERVER_DIR;
    const observerDir = mkdtempSync(join(tmpdir(), "zam-ui-synthesis-"));
    process.env.ZAM_OBSERVER_DIR = observerDir;

    try {
      const token = await createToken(db, {
        slug: "explorer-create-folder",
        concept: "Create a folder in File Explorer",
        domain: "windows",
        bloom_level: 3,
      });
      const session = await startSession(db, {
        user_id: "tester",
        task: "Organize invoices",
        execution_context: "ui",
      });

      appendUiObservationReport({
        version: 1,
        sessionId: session.id,
        sequence: 1,
        observedFrom: "2026-06-15T10:00:00Z",
        observedTo: "2026-06-15T10:00:05Z",
        kind: "step-completed",
        application: { processName: "explorer.exe", processId: 42 },
        summary: "Created a folder named Invoices.",
        actions: [{ type: "click", target: "New folder" }],
        evidence: [{ type: "uia", ref: "event:4", redacted: false }],
        candidateTokens: [
          {
            slug: token.slug,
            confidence: 0.91,
            rationale: "Folder creation completed.",
          },
        ],
        confidence: 0.91,
      });

      const preview = await prepareSessionSynthesis(db, {
        sessionId: session.id,
      });

      expect(preview.commandCount).toBe(1);
      expect(preview.candidates).toHaveLength(1);
      expect(preview.candidates[0]).toMatchObject({
        tokenSlug: token.slug,
        inferredRating: 4,
        confidence: "high",
      });
    } finally {
      if (originalDir === undefined) {
        delete process.env.ZAM_OBSERVER_DIR;
      } else {
        process.env.ZAM_OBSERVER_DIR = originalDir;
      }
      rmSync(observerDir, { recursive: true, force: true });
    }
  });

  it("links a direct submit and later synthesis of the same attempt", async () => {
    const token = await createToken(db, {
      slug: "git-inspect-worktree",
      concept: "git status and git diff inspect pending worktree changes",
      domain: "git",
      bloom_level: 3,
    });
    const card = await ensureCard(db, token.id, "tester");
    const session = await startSession(db, {
      user_id: "tester",
      task: "Inspect a repository",
    });
    const attemptId = ulid();

    const first = await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "tester",
      rating: 3,
      sessionId: session.id,
      attemptId,
      channel: "direct",
      activity: "git status in the worktree",
      independent: true,
    });
    expect(first.applied).toBe(true);

    const second = await applySessionSynthesis(db, {
      sessionId: session.id,
      tokenSlug: token.slug,
      inferredRating: null,
      confirmedRating: 3,
      confidence: "medium",
      evidence: cleanEvidence,
      matchedCommandTexts: ["git status --short"],
      attemptId,
    });
    expect(second.applied).toBe(false);
    expect(await getReviewsForCard(db, card.id)).toHaveLength(1);
    expect((await getCard(db, token.id, "tester"))?.reps).toBe(1);
  });

  it("does not collapse two documented attempts that share a session and token", async () => {
    const token = await createToken(db, {
      slug: "git-inspect-worktree",
      concept: "git status and git diff inspect pending worktree changes",
      domain: "git",
      bloom_level: 3,
    });
    const session = await startSession(db, {
      user_id: "tester",
      task: "Inspect a repository",
    });

    await applySessionSynthesis(db, {
      sessionId: session.id,
      tokenSlug: token.slug,
      inferredRating: null,
      confirmedRating: 3,
      confidence: "medium",
      evidence: cleanEvidence,
      matchedCommandTexts: ["git status --short"],
      attemptId: ulid(),
    });
    await applySessionSynthesis(db, {
      sessionId: session.id,
      tokenSlug: token.slug,
      inferredRating: null,
      confirmedRating: 2,
      confidence: "medium",
      evidence: { ...cleanEvidence, errorCount: 1 },
      matchedCommandTexts: ["git diff --check"],
      attemptId: ulid(),
    });

    const card = await getCard(db, token.id, "tester");
    expect(await getReviewsForCard(db, card!.id)).toHaveLength(2);
    expect(await getSessionSynthesisRecords(db, session.id)).toHaveLength(2);
  });

  it("rejects an assisted success and leaves FSRS unchanged", async () => {
    const token = await createToken(db, {
      slug: "git-inspect-worktree",
      concept: "git status and git diff inspect pending worktree changes",
      domain: "git",
      bloom_level: 3,
    });
    const card = await ensureCard(db, token.id, "tester");
    const session = await startSession(db, {
      user_id: "tester",
      task: "Inspect a repository",
    });

    await expect(
      executeReviewAction(db, {
        action: "rate",
        cardId: card.id,
        userId: "tester",
        rating: 3,
        sessionId: session.id,
        independent: false,
      }),
    ).rejects.toBeInstanceOf(AssistedSuccessError);

    expect((await getCard(db, token.id, "tester"))?.reps).toBe(0);
    expect(await getReviewsForCard(db, card.id)).toHaveLength(0);
  });

  it("drops a successfully applied card from a later queue build", async () => {
    const token = await createToken(db, {
      slug: "git-inspect-worktree",
      concept: "git status and git diff inspect pending worktree changes",
      domain: "git",
      bloom_level: 3,
      question: "How do you inspect the worktree?",
    });
    await ensureCard(db, token.id, "tester");
    const session = await startSession(db, {
      user_id: "tester",
      task: "Inspect a repository",
    });

    const before = await buildReviewQueue(db, { userId: "tester" });
    expect(before.items.some((item) => item.tokenId === token.id)).toBe(true);

    await applySessionSynthesis(db, {
      sessionId: session.id,
      tokenSlug: token.slug,
      inferredRating: null,
      confirmedRating: 3,
      confidence: "medium",
      evidence: cleanEvidence,
      matchedCommandTexts: ["git status --short"],
    });

    const after = await buildReviewQueue(db, { userId: "tester" });
    expect(after.items.some((item) => item.tokenId === token.id)).toBe(false);
  });
});
