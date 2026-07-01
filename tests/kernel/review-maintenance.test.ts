import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addPrerequisite,
  confirmCardSplit,
  confirmFoundations,
  confirmSourceImport,
  createAgentSkill,
  createToken,
  type Database,
  deleteCardForUser,
  deleteToken,
  ensureCard,
  executeReviewAction,
  generateTokenSlug,
  getCard,
  getCardDeletionImpact,
  getPrerequisites,
  getReviewsForCard,
  getSessionSummary,
  getTokenBySlug,
  getTokenDeleteImpact,
  importCurriculumCards,
  listAgentSkills,
  listPersonalCards,
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

  it("generates a clean slug and handles collisions", async () => {
    const baseSlug = await generateTokenSlug(db, "Git", "git branch list");
    expect(baseSlug).toBe("git-git-branch-list");

    await createToken(db, {
      slug: baseSlug,
      concept: "concept 1",
    });

    const collisionSlug1 = await generateTokenSlug(
      db,
      "Git",
      "git branch list",
    );
    expect(collisionSlug1).toBe("git-git-branch-list-1");

    await createToken(db, {
      slug: collisionSlug1,
      concept: "concept 2",
    });

    const collisionSlug2 = await generateTokenSlug(
      db,
      "Git",
      "git branch list",
    );
    expect(collisionSlug2).toBe("git-git-branch-list-2");
  });

  it("lists personal cards with queries and filters", async () => {
    const t1 = await createToken(db, {
      slug: "git-commit",
      concept: "saves staged changes",
      domain: "git",
      bloom_level: 1,
    });
    await ensureCard(db, t1.id, "thomas");

    const t2 = await createToken(db, {
      slug: "git-push",
      concept: "uploads commits",
      domain: "git",
      bloom_level: 2,
    });

    const t3 = await createToken(db, {
      slug: "docker-build",
      concept: "builds images",
      domain: "docker",
      bloom_level: 3,
    });
    await ensureCard(db, t3.id, "thomas");

    const allCards = await listPersonalCards(db, "thomas");
    expect(allCards).toHaveLength(2);

    const slugs = allCards.map((c) => c.slug);
    expect(slugs).toContain("docker-build");
    expect(slugs).not.toContain("git-push");
    expect(slugs).toContain("git-commit");

    const c1 = allCards.find((c) => c.slug === "git-commit")!;
    const c3 = allCards.find((c) => c.slug === "docker-build")!;

    expect(c1.cardId).not.toBeNull();
    expect(c1.state).toBe("new");

    expect(c3.cardId).not.toBeNull();
    expect(c3.state).toBe("new");

    const gitCards = await listPersonalCards(db, "thomas", { domain: "git" });
    expect(gitCards).toHaveLength(1);
    expect(gitCards.map((c) => c.slug)).toContain("git-commit");

    const searchCards1 = await listPersonalCards(db, "thomas", {
      query: "staged",
    });
    expect(searchCards1).toHaveLength(1);
    expect(searchCards1[0].slug).toBe("git-commit");

    const searchCards2 = await listPersonalCards(db, "thomas", {
      query: "git",
    });
    expect(searchCards2).toHaveLength(1);
  });

  it("imports curriculum cards atomically resolving duplicates", async () => {
    const batch1 = [
      {
        question: "What is git checkout?",
        concept: "Switches branches or restores files",
        domain: "git",
        bloom_level: 2,
        context: "checkout is used for branch switching",
      },
      {
        question: "What is git status?",
        concept: "Shows the working tree status",
        domain: "git",
        bloom_level: 1,
        context: "status shows modified files",
      },
    ];

    const res1 = await importCurriculumCards(db, "thomas", batch1);
    expect(res1.createdCount).toBe(2);
    expect(res1.ensuredCount).toBe(2);

    const list1 = await listPersonalCards(db, "thomas", { domain: "git" });
    expect(list1.map((c) => c.slug)).toContain("git-what-is-git-checkout");
    expect(list1.map((c) => c.slug)).toContain("git-what-is-git-status");

    const batch2 = [
      {
        question: "What is git checkout?",
        concept: "Switches branches or restores files",
        domain: "git",
        bloom_level: 2,
        context: "checkout is used for branch switching",
      },
      {
        question: "What is git diff?",
        concept: "Shows changes between commits",
        domain: "git",
        bloom_level: 3,
        context: "diff compares commits",
      },
    ];

    const res2 = await importCurriculumCards(db, "thomas", batch2);
    expect(res2.createdCount).toBe(1);
    expect(res2.ensuredCount).toBe(1);

    const res3 = await importCurriculumCards(db, "user-2", [batch1[0]]);
    expect(res3.createdCount).toBe(0);
    expect(res3.ensuredCount).toBe(1);

    const batchFail = [
      {
        question: "What is git log?",
        concept: "Shows commit history",
        domain: "git",
        bloom_level: 10,
        context: "log displays commits",
      },
    ];
    await expect(
      importCurriculumCards(db, "thomas", batchFail),
    ).rejects.toThrow();

    const listFinal = await listPersonalCards(db, "thomas", { query: "log" });
    expect(listFinal).toHaveLength(0);
  });

  it("splits card atomically linking prerequisites or removing card", async () => {
    const token = await createToken(db, {
      slug: "math-advanced",
      concept: "Solves integrals and derivatives",
      domain: "math",
      bloom_level: 2,
    });
    await ensureCard(db, token.id, "thomas");

    const proposals = [
      {
        question: "How do you solve integrals?",
        concept: "Anti-derivative calculation rules",
        domain: "math",
        bloom_level: 3,
      },
      {
        question: "How do you solve derivatives?",
        concept: "Rates of change rules",
        domain: "math",
        bloom_level: 2,
      },
    ];

    const splitRes = await confirmCardSplit(
      db,
      "thomas",
      "math-advanced",
      "block",
      "What is calculus?",
      "Integrals and derivatives studies",
      proposals,
    );

    expect(splitRes.createdCount).toBe(2);
    expect(splitRes.ensuredCount).toBe(2);

    const updatedOriginal = await getTokenBySlug(db, "math-advanced");
    expect(updatedOriginal?.question).toBe("What is calculus?");
    expect(updatedOriginal?.concept).toBe("Integrals and derivatives studies");

    const originalCard = await getCard(db, token.id, "thomas");
    expect(originalCard?.blocked).toBe(1);

    const prop1 = await getTokenBySlug(db, "math-how-do-you-solve-integrals");
    expect(prop1).toBeDefined();
    const propCard1 = await getCard(db, prop1!.id, "thomas");
    expect(propCard1?.blocked).toBe(0);

    const token2 = await createToken(db, {
      slug: "science-broad",
      concept: "Covers physics and chemistry",
      domain: "science",
      bloom_level: 2,
    });
    await ensureCard(db, token2.id, "thomas");

    const splitRes2 = await confirmCardSplit(
      db,
      "thomas",
      "science-broad",
      "remove",
      "Rewritten science",
      "physics chem summary",
      proposals,
    );

    expect(splitRes2.createdCount).toBe(0);
    expect(splitRes2.ensuredCount).toBe(0);

    const originalCard2 = await getCard(db, token2.id, "thomas");
    expect(originalCard2).toBeUndefined();
  });

  it("imports foundations atomically, linking existing or creating new prerequisites", async () => {
    const token = await createToken(db, {
      slug: "js-advanced",
      concept: "Advanced JS topics like Event Loop and Closures",
      domain: "js",
      bloom_level: 3,
    });
    await ensureCard(db, token.id, "thomas");

    const prereqToken = await createToken(db, {
      slug: "js-closures",
      concept: "Functions that close over outer variables",
      domain: "js",
      bloom_level: 2,
    });

    const proposals = [
      {
        question: "What is a closure?",
        concept: "Functions that close over outer variables",
        domain: "js",
        bloom_level: 2,
        exists: true,
        slug: "js-closures",
      },
      {
        question: "What is the Event Loop?",
        concept: "Checks call stack and queue",
        domain: "js",
        bloom_level: 2,
        exists: false,
      },
    ];

    const result = await confirmFoundations(
      db,
      "thomas",
      "js-advanced",
      proposals,
    );

    expect(result.createdCount).toBe(1);
    expect(result.linkedCount).toBe(1);

    const resolvedPrereqToken = await getTokenBySlug(
      db,
      "js-what-is-the-event-loop",
    );
    expect(resolvedPrereqToken).toBeDefined();

    const links = (await db
      .prepare("SELECT * FROM prerequisites WHERE token_id = ?")
      .all(token.id)) as any[];

    expect(links).toHaveLength(2);
    const requiresIds = links.map((l) => l.requires_id);
    expect(requiresIds).toContain(prereqToken.id);
    expect(requiresIds).toContain(resolvedPrereqToken!.id);

    const invalidProposals = [
      {
        question: "Advanced JS topics?",
        concept: "Advanced JS topics like Event Loop and Closures",
        domain: "js",
        bloom_level: 3,
        exists: true,
        slug: "js-advanced",
      },
    ];
    await expect(
      confirmFoundations(db, "thomas", "js-advanced", invalidProposals),
    ).rejects.toThrow();
  });

  it("imports and maps tokens to a source references with page numbers", async () => {
    await db
      .prepare(
        "INSERT INTO sources (id, type, uri, content) VALUES (?, ?, ?, ?)",
      )
      .run(
        "src-1",
        "file",
        "C:/textbook.txt",
        "Excerpts about testing and compilation",
      );

    const proposals = [
      {
        question: "What is testing?",
        concept: "Executing code to verify correctness",
        domain: "cs",
        bloom_level: 2,
        symbiosis_mode: "copilot",
        excerpt: "testing validates implementation",
        page_number: "42",
      },
      {
        question: "What is compiler compilation?",
        concept: "Translating source code to machine target code",
        domain: "cs",
        bloom_level: 2,
        symbiosis_mode: "none",
        excerpt: "compilers produce targets",
        page_number: "45",
      },
    ];

    const result = await confirmSourceImport(db, "thomas", "src-1", proposals);

    expect(result.createdCount).toBe(2);
    expect(result.linkedCount).toBe(0);

    const token1 = await getTokenBySlug(db, "cs-what-is-testing");
    expect(token1).toBeDefined();

    const mapping = (await db
      .prepare(
        "SELECT * FROM token_sources WHERE token_id = ? AND source_id = ?",
      )
      .get(token1!.id, "src-1")) as any;

    expect(mapping).toBeDefined();
    expect(mapping.excerpt).toBe("testing validates implementation");
    expect(mapping.page_number).toBe("42");
  });
});
