import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addPrerequisite,
  createAgentSkill,
  createToken,
  type Database,
  deleteCardForUser,
  deleteToken,
  ensureCard,
  executeReviewAction,
  getCard,
  getCardDeletionImpact,
  getPrerequisites,
  getReviewsForCard,
  getSessionSummary,
  getTokenBySlug,
  getTokenDeleteImpact,
  listAgentSkills,
  logStep,
  openDatabase,
  startSession,
  updateToken,
} from "../../src/kernel/index.js";

describe("review maintenance primitives", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-core-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
    });
  });

  afterEach(async () => {
    await db.close();
    try {
      rmSync(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 50,
      });
    } catch {
      // Best-effort cleanup only: Windows may hold SQLite sidecar files briefly.
    }
  });

  it("updates mutable token fields without changing the slug", async () => {
    const token = await createToken(db, {
      slug: "git-current-branch",
      concept: "git branch shows branches",
      domain: "git",
      bloom_level: 1,
      source_link: "src/git.ts#L10",
    });

    expect(token.source_link).toBe("src/git.ts#L10");

    const updated = await updateToken(db, token.slug, {
      concept: "git branch marks the current branch with *",
      domain: "github",
      bloom_level: 2,
      context: "cli",
      symbiosis_mode: "copilot",
      source_link: "src/git.ts#L25",
    });

    expect(updated.slug).toBe(token.slug);
    expect(updated.concept).toBe("git branch marks the current branch with *");
    expect(updated.domain).toBe("github");
    expect(updated.bloom_level).toBe(2);
    expect(updated.context).toBe("cli");
    expect(updated.symbiosis_mode).toBe("copilot");
    expect(updated.source_link).toBe("src/git.ts#L25");

    const cleared = await updateToken(db, token.slug, {
      source_link: null,
    });
    expect(cleared.source_link).toBeNull();
  });

  it("previews and deletes a token with dependent learning data and skill references", async () => {
    const prerequisite = await createToken(db, {
      slug: "shell-start-dir",
      concept: "find starts from a directory",
      domain: "shell",
      bloom_level: 1,
    });
    const target = await createToken(db, {
      slug: "shell-find-command",
      concept: "find recursively searches directory trees",
      domain: "shell",
      bloom_level: 2,
    });

    await addPrerequisite(db, target.id, prerequisite.id);

    const card = await ensureCard(db, prerequisite.id, "thomas");
    await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "thomas",
      rating: 3,
    });

    const session = await startSession(db, {
      user_id: "thomas",
      task: "Review shell concepts",
    });
    await logStep(db, {
      session_id: session.id,
      token_id: prerequisite.id,
      done_by: "user",
      rating: 3,
    });

    await createAgentSkill(db, {
      slug: "shell-find-workflow",
      description: "Use find to scan a tree",
      steps: ["open terminal", "run find"],
      token_slugs: [prerequisite.slug, target.slug],
    });

    const impact = await getTokenDeleteImpact(db, prerequisite.slug);
    expect(impact).toEqual({
      cards: 1,
      review_logs: 1,
      prerequisite_edges_from_token: 0,
      prerequisite_edges_to_token: 1,
      session_steps: 1,
      sessions_touched: 1,
      agent_skills: 1,
    });

    const deleted = await deleteToken(db, prerequisite.slug);
    expect(deleted.impact).toEqual(impact);
    expect(await getTokenBySlug(db, prerequisite.slug)).toBeUndefined();
    expect(await getCard(db, prerequisite.id, "thomas")).toBeUndefined();
    expect(await getReviewsForCard(db, card.id)).toHaveLength(0);
    expect(await getPrerequisites(db, target.id)).toEqual([]);
    expect((await listAgentSkills(db))[0].token_slugs).toEqual([target.slug]);
  });

  it("deletes one user's card while preserving the token and session history", async () => {
    const token = await createToken(db, {
      slug: "zam-token-vs-card",
      concept: "tokens define concepts while cards track user state",
      domain: "zam",
      bloom_level: 2,
    });

    const card = await ensureCard(db, token.id, "thomas");
    await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "thomas",
      rating: 4,
    });

    const session = await startSession(db, {
      user_id: "thomas",
      task: "Review ZAM concepts",
    });
    await logStep(db, {
      session_id: session.id,
      token_id: token.id,
      done_by: "user",
      rating: 4,
    });

    expect(await getCardDeletionImpact(db, token.id, "thomas")).toEqual({
      review_logs: 1,
    });

    const deleted = await deleteCardForUser(db, token.id, "thomas");
    expect(deleted.impact).toEqual({ review_logs: 1 });
    expect(await getTokenBySlug(db, token.slug)).toBeTruthy();
    expect(await getCard(db, token.id, "thomas")).toBeUndefined();
    expect(await getReviewsForCard(db, card.id)).toHaveLength(0);
    expect((await getSessionSummary(db, session.id)).steps).toHaveLength(1);
  });

  it("routes rating=1 through prerequisite blocking in executeReviewAction", async () => {
    const prerequisite = await createToken(db, {
      slug: "git-branches",
      concept: "branches isolate lines of work",
      domain: "git",
      bloom_level: 1,
    });
    const target = await createToken(db, {
      slug: "git-show-current",
      concept: "git branch --show-current prints the current branch",
      domain: "git",
      bloom_level: 2,
    });

    await addPrerequisite(db, target.id, prerequisite.id);
    const card = await ensureCard(db, target.id, "thomas");

    const result = await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "thomas",
      rating: 1,
    });

    expect(result.evaluation?.state).toBe("learning");
    expect(result.blocked?.blockedSlug).toBe(target.slug);
    expect(result.blocked?.prerequisites).toHaveLength(1);
    expect(result.blocked?.prerequisites[0]?.slug).toBe(prerequisite.slug);
  });

  it("edits and short-circuits review actions without mutating scheduling unexpectedly", async () => {
    const token = await createToken(db, {
      slug: "macos-brew-cask",
      concept: "brew install --cask installs GUI apps",
      domain: "macos",
      bloom_level: 2,
    });
    const card = await ensureCard(db, token.id, "thomas");

    const edited = await executeReviewAction(db, {
      action: "edit-token",
      cardId: card.id,
      userId: "thomas",
      tokenUpdates: { concept: "brew install --cask installs GUI macOS apps" },
    });
    expect(edited.updatedToken?.concept).toBe(
      "brew install --cask installs GUI macOS apps",
    );

    const skipped = await executeReviewAction(db, {
      action: "skip",
      cardId: card.id,
      userId: "thomas",
    });
    expect(skipped.skipped).toBe(true);

    const stopped = await executeReviewAction(db, {
      action: "stop",
      cardId: card.id,
      userId: "thomas",
    });
    expect(stopped.stopped).toBe(true);
  });
});
