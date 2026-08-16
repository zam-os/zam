import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  openDatabase,
  type Database,
  createToken,
  listTokens,
  ensureCard,
  createKnowledgeContext,
  getKnowledgeContextByName,
  getKnowledgeContextById,
  listKnowledgeContexts,
  updateKnowledgeContext,
  deleteKnowledgeContext,
  assignTokenToContext,
  unassignTokenFromContext,
  listContextsForToken,
  buildReviewQueue,
  getDueCards,
} from "../../src/kernel/index.js";

describe("Knowledge Contexts (Phase 1)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-core-contexts-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
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
      // Best-effort cleanup
    }
  });

  describe("CRUD operations", () => {
    it("can create, get, update, and delete knowledge contexts", async () => {
      // Create
      const context = await createKnowledgeContext(db, {
        name: "work-company",
        label: "Company Work",
        language: "en",
      });
      expect(context.id).toBeDefined();
      expect(context.name).toBe("work-company");
      expect(context.label).toBe("Company Work");
      expect(context.language).toBe("en");

      // Get by ID
      const byId = await getKnowledgeContextById(db, context.id);
      expect(byId).toEqual(context);

      // Get by name
      const byName = await getKnowledgeContextByName(db, "work-company");
      expect(byName).toEqual(context);

      // List
      const contexts = await listKnowledgeContexts(db);
      expect(contexts).toHaveLength(1);
      expect(contexts[0]).toEqual(context);

      // Update
      const updated = await updateKnowledgeContext(db, context.id, {
        label: "Company Work Update",
        language: "de",
      });
      expect(updated.label).toBe("Company Work Update");
      expect(updated.language).toBe("de");

      // Delete
      await deleteKnowledgeContext(db, context.id);
      const afterDelete = await getKnowledgeContextById(db, context.id);
      expect(afterDelete).toBeUndefined();
    });

    it("throws if name is empty or already exists", async () => {
      await expect(createKnowledgeContext(db, { name: "" })).rejects.toThrow(
        "Context name cannot be empty",
      );

      await createKnowledgeContext(db, { name: "school" });

      await expect(
        createKnowledgeContext(db, { name: "school" }),
      ).rejects.toThrow('Knowledge context with name "school" already exists');
    });

    it("normalizes names and optional text before persistence", async () => {
      const context = await createKnowledgeContext(db, {
        name: "  school  ",
        label: "  School  ",
        language: "  de  ",
      });

      expect(context).toMatchObject({
        name: "school",
        label: "School",
        language: "de",
      });
      expect(await getKnowledgeContextByName(db, " school ")).toEqual(context);
      await expect(
        createKnowledgeContext(db, { name: " school" }),
      ).rejects.toThrow('Knowledge context with name "school" already exists');

      const cleared = await updateKnowledgeContext(db, context.id, {
        label: "   ",
        language: "   ",
      });
      expect(cleared.label).toBeNull();
      expect(cleared.language).toBeNull();
    });
  });

  describe("n:m assignment", () => {
    it("supports assigning a token to multiple contexts and vice versa", async () => {
      const c1 = await createKnowledgeContext(db, { name: "work" });
      const c2 = await createKnowledgeContext(db, { name: "private" });

      const t1 = await createToken(db, {
        slug: "git-merge",
        concept: "Merge branches in Git",
        domain: "git",
      });
      const t2 = await createToken(db, {
        slug: "company-operations",
        concept: "Company Cloud Operations",
        domain: "company",
      });

      // Assign t1 to both work and private
      await assignTokenToContext(db, t1.id, c1.id);
      await assignTokenToContext(db, t1.id, c2.id);

      // Assign t2 only to work
      await assignTokenToContext(db, t2.id, c1.id);

      // Verify contexts for t1
      const contextsForT1 = await listContextsForToken(db, t1.id);
      expect(contextsForT1.map((c) => c.name)).toEqual(["private", "work"]);

      // Verify contexts for t2
      const contextsForT2 = await listContextsForToken(db, t2.id);
      expect(contextsForT2.map((c) => c.name)).toEqual(["work"]);

      // Unassign t1 from private
      await unassignTokenFromContext(db, t1.id, c2.id);
      const contextsForT1After = await listContextsForToken(db, t1.id);
      expect(contextsForT1After.map((c) => c.name)).toEqual(["work"]);
    });

    it("avoids duplicate entries on double assignment", async () => {
      const c = await createKnowledgeContext(db, { name: "work" });
      const t = await createToken(db, {
        slug: "git",
        concept: "Git VCS",
      });

      await assignTokenToContext(db, t.id, c.id);
      await assignTokenToContext(db, t.id, c.id); // idempotent insert or ignore

      const contexts = await listContextsForToken(db, t.id);
      expect(contexts).toHaveLength(1);
    });
  });

  describe("filtering in listTokens", () => {
    it("filters tokens by knowledge context using EXISTS", async () => {
      const work = await createKnowledgeContext(db, { name: "work" });
      const school = await createKnowledgeContext(db, { name: "school" });

      const t1 = await createToken(db, { slug: "work-t1", concept: "C1" });
      const t2 = await createToken(db, { slug: "school-t2", concept: "C2" });
      const t3 = await createToken(db, { slug: "both-t3", concept: "C3" });
      const tUnassigned = await createToken(db, {
        slug: "unassigned",
        concept: "C4",
      });

      await assignTokenToContext(db, t1.id, work.id);
      await assignTokenToContext(db, t2.id, school.id);
      await assignTokenToContext(db, t3.id, work.id);
      await assignTokenToContext(db, t3.id, school.id);

      // Unscoped listing returns all 4 non-deprecated tokens
      const all = await listTokens(db);
      expect(all).toHaveLength(4);

      // Filtered by 'work'
      const workTokens = await listTokens(db, { knowledgeContext: "work" });
      expect(workTokens.map((t) => t.slug).sort()).toEqual([
        "both-t3",
        "work-t1",
      ]);

      // Filtered by 'school'
      const schoolTokens = await listTokens(db, { knowledgeContext: "school" });
      expect(schoolTokens.map((t) => t.slug).sort()).toEqual([
        "both-t3",
        "school-t2",
      ]);

      // Unassigned behaves correctly
      expect(workTokens.some((t) => t.id === tUnassigned.id)).toBe(false);
    });
  });

  describe("scheduler queue scoping", () => {
    it("restricts review queue selection to the given context", async () => {
      const userId = "test-user";
      const work = await createKnowledgeContext(db, { name: "work" });
      const school = await createKnowledgeContext(db, { name: "school" });

      const t1 = await createToken(db, { slug: "work-t1", concept: "C1" });
      const t2 = await createToken(db, { slug: "school-t2", concept: "C2" });

      await assignTokenToContext(db, t1.id, work.id);
      await assignTokenToContext(db, t2.id, school.id);

      // Ensure cards exist for user
      await ensureCard(db, t1.id, userId);
      await ensureCard(db, t2.id, userId);

      // Unscoped review queue should contain both cards
      const unscopedQueue = await buildReviewQueue(db, { userId });
      expect(unscopedQueue.items).toHaveLength(2);
      expect(unscopedQueue.items.map((i) => i.slug).sort()).toEqual([
        "school-t2",
        "work-t1",
      ]);

      // Scoped to 'work'
      const workQueue = await buildReviewQueue(db, {
        userId,
        knowledgeContext: "work",
      });
      expect(workQueue.items).toHaveLength(1);
      expect(workQueue.items[0].slug).toBe("work-t1");

      // Scoped to 'school'
      const schoolQueue = await buildReviewQueue(db, {
        userId,
        knowledgeContext: "school",
      });
      expect(schoolQueue.items).toHaveLength(1);
      expect(schoolQueue.items[0].slug).toBe("school-t2");

      const workDue = await getDueCards(
        db,
        userId,
        undefined,
        undefined,
        "work",
      );
      expect(workDue.map((card) => card.slug)).toEqual(["work-t1"]);
    });
  });

  describe("deletion cascades", () => {
    it("cascades deletions from contexts to token assignments", async () => {
      const c = await createKnowledgeContext(db, { name: "work" });
      const t = await createToken(db, { slug: "git", concept: "Git" });

      await assignTokenToContext(db, t.id, c.id);
      expect(await listContextsForToken(db, t.id)).toHaveLength(1);

      // Delete context
      await deleteKnowledgeContext(db, c.id);

      // Mappings should be gone
      expect(await listContextsForToken(db, t.id)).toHaveLength(0);
    });

    it("cascades deletions from tokens to token assignments", async () => {
      const c = await createKnowledgeContext(db, { name: "work" });
      const t = await createToken(db, { slug: "git", concept: "Git" });

      await assignTokenToContext(db, t.id, c.id);
      expect(await listContextsForToken(db, t.id)).toHaveLength(1);

      // Delete token
      await db.prepare("DELETE FROM tokens WHERE id = ?").run(t.id);

      // Checking token_contexts directly
      const mappings = await db
        .prepare("SELECT * FROM token_contexts WHERE context_id = ?")
        .all(c.id);
      expect(mappings).toHaveLength(0);
    });
  });
});
