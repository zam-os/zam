import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addPrerequisite,
  applySessionSynthesis,
  createAgentSkill,
  createToken,
  type Database,
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
      inferredRating: 4,
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

    const second = await applySessionSynthesis(db, {
      sessionId: session.id,
      tokenSlug: token.slug,
      inferredRating: 4,
      confirmedRating: 2,
      confidence: "medium",
      evidence: cleanEvidence,
      matchedCommandTexts: ["git status --short", "git diff --check"],
    });

    expect(second.applied).toBe(false);
    expect(second.record.confirmed_rating).toBe(3);
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
    await db.exec("DROP TABLE session_syntheses");
    await db.close();

    db = await openDatabase({
      dbPath,
      useConfiguredCloud: false,
    });

    const columns = (await db.pragma(
      "table_info(session_syntheses)",
    )) as Array<{ name: string }>;
    expect(columns.map((column) => column.name)).toContain("review_log_id");
  });
});
