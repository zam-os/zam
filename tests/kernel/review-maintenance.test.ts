import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "libsql";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  openDatabase,
  createToken,
  updateToken,
  getTokenBySlug,
  getTokenDeleteImpact,
  deleteToken,
  addPrerequisite,
  getPrerequisites,
  ensureCard,
  getCard,
  getCardDeletionImpact,
  deleteCardForUser,
  getReviewsForCard,
  startSession,
  logStep,
  getSessionSummary,
  createAgentSkill,
  listAgentSkills,
  executeReviewAction,
} from "../../src/kernel/index.js";

describe("review maintenance primitives", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-core-"));
    db = openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
    });
  });

  afterEach(() => {
    db.close();
    try {
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 });
    } catch {
      // Best-effort cleanup only: Windows may hold SQLite sidecar files briefly.
    }
  });

  it("updates mutable token fields without changing the slug", () => {
    const token = createToken(db, {
      slug: "git-current-branch",
      concept: "git branch shows branches",
      domain: "git",
      bloom_level: 1,
    });

    const updated = updateToken(db, token.slug, {
      concept: "git branch marks the current branch with *",
      domain: "github",
      bloom_level: 2,
      context: "cli",
      symbiosis_mode: "copilot",
    });

    expect(updated.slug).toBe(token.slug);
    expect(updated.concept).toBe("git branch marks the current branch with *");
    expect(updated.domain).toBe("github");
    expect(updated.bloom_level).toBe(2);
    expect(updated.context).toBe("cli");
    expect(updated.symbiosis_mode).toBe("copilot");
  });

  it("previews and deletes a token with dependent learning data and skill references", () => {
    const prerequisite = createToken(db, {
      slug: "shell-start-dir",
      concept: "find starts from a directory",
      domain: "shell",
      bloom_level: 1,
    });
    const target = createToken(db, {
      slug: "shell-find-command",
      concept: "find recursively searches directory trees",
      domain: "shell",
      bloom_level: 2,
    });

    addPrerequisite(db, target.id, prerequisite.id);

    const card = ensureCard(db, prerequisite.id, "thomas");
    executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "thomas",
      rating: 3,
    });

    const session = startSession(db, {
      user_id: "thomas",
      task: "Review shell concepts",
    });
    logStep(db, {
      session_id: session.id,
      token_id: prerequisite.id,
      done_by: "user",
      rating: 3,
    });

    createAgentSkill(db, {
      slug: "shell-find-workflow",
      description: "Use find to scan a tree",
      steps: ["open terminal", "run find"],
      token_slugs: [prerequisite.slug, target.slug],
    });

    const impact = getTokenDeleteImpact(db, prerequisite.slug);
    expect(impact).toEqual({
      cards: 1,
      review_logs: 1,
      prerequisite_edges_from_token: 0,
      prerequisite_edges_to_token: 1,
      session_steps: 1,
      sessions_touched: 1,
      agent_skills: 1,
    });

    const deleted = deleteToken(db, prerequisite.slug);
    expect(deleted.impact).toEqual(impact);
    expect(getTokenBySlug(db, prerequisite.slug)).toBeUndefined();
    expect(getCard(db, prerequisite.id, "thomas")).toBeUndefined();
    expect(getReviewsForCard(db, card.id)).toHaveLength(0);
    expect(getPrerequisites(db, target.id)).toEqual([]);
    expect(listAgentSkills(db)[0].token_slugs).toEqual([target.slug]);
  });

  it("deletes one user's card while preserving the token and session history", () => {
    const token = createToken(db, {
      slug: "zam-token-vs-card",
      concept: "tokens define concepts while cards track user state",
      domain: "zam",
      bloom_level: 2,
    });

    const card = ensureCard(db, token.id, "thomas");
    executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "thomas",
      rating: 4,
    });

    const session = startSession(db, {
      user_id: "thomas",
      task: "Review ZAM concepts",
    });
    logStep(db, {
      session_id: session.id,
      token_id: token.id,
      done_by: "user",
      rating: 4,
    });

    expect(getCardDeletionImpact(db, token.id, "thomas")).toEqual({ review_logs: 1 });

    const deleted = deleteCardForUser(db, token.id, "thomas");
    expect(deleted.impact).toEqual({ review_logs: 1 });
    expect(getTokenBySlug(db, token.slug)).toBeTruthy();
    expect(getCard(db, token.id, "thomas")).toBeUndefined();
    expect(getReviewsForCard(db, card.id)).toHaveLength(0);
    expect(getSessionSummary(db, session.id).steps).toHaveLength(1);
  });

  it("routes rating=1 through prerequisite blocking in executeReviewAction", () => {
    const prerequisite = createToken(db, {
      slug: "git-branches",
      concept: "branches isolate lines of work",
      domain: "git",
      bloom_level: 1,
    });
    const target = createToken(db, {
      slug: "git-show-current",
      concept: "git branch --show-current prints the current branch",
      domain: "git",
      bloom_level: 2,
    });

    addPrerequisite(db, target.id, prerequisite.id);
    const card = ensureCard(db, target.id, "thomas");

    const result = executeReviewAction(db, {
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

  it("edits and short-circuits review actions without mutating scheduling unexpectedly", () => {
    const token = createToken(db, {
      slug: "macos-brew-cask",
      concept: "brew install --cask installs GUI apps",
      domain: "macos",
      bloom_level: 2,
    });
    const card = ensureCard(db, token.id, "thomas");

    const edited = executeReviewAction(db, {
      action: "edit-token",
      cardId: card.id,
      userId: "thomas",
      tokenUpdates: { concept: "brew install --cask installs GUI macOS apps" },
    });
    expect(edited.updatedToken?.concept).toBe("brew install --cask installs GUI macOS apps");

    const skipped = executeReviewAction(db, {
      action: "skip",
      cardId: card.id,
      userId: "thomas",
    });
    expect(skipped.skipped).toBe(true);

    const stopped = executeReviewAction(db, {
      action: "stop",
      cardId: card.id,
      userId: "thomas",
    });
    expect(stopped.stopped).toBe(true);
  });
});
