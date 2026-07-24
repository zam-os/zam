import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  getKnowledgeContextByName,
  isPersonaId,
  listKnowledgeContexts,
  openDatabase,
  PERSONA_DESCRIPTORS,
  seedPersonaKnowledgeContext,
  updateKnowledgeContext,
} from "../../src/kernel/index.js";

describe("start personas (ADR 2026-07-24 §2)", () => {
  it("ships the four personas as data with unique ids and context slugs", () => {
    expect(PERSONA_DESCRIPTORS.map((p) => p.id)).toEqual([
      "school",
      "study",
      "work",
      "private",
    ]);
    const slugs = PERSONA_DESCRIPTORS.map((p) => p.knowledgeContextSlug);
    expect(new Set(slugs).size).toBe(PERSONA_DESCRIPTORS.length);
    for (const persona of PERSONA_DESCRIPTORS) {
      expect(persona.labelKey).toMatch(/^onboarding_persona_/);
      expect(persona.descriptionKey).toMatch(/^onboarding_persona_/);
      expect(persona.contextLabelKey).toMatch(/^onboarding_persona_/);
      expect(persona.defaultImportPath).toBeTruthy();
    }
  });

  it("recognizes only known persona ids", () => {
    expect(isPersonaId("school")).toBe(true);
    expect(isPersonaId("private")).toBe(true);
    expect(isPersonaId("astronaut")).toBe(false);
    expect(isPersonaId("")).toBe(false);
  });

  describe("knowledge-context seeding", () => {
    let db: Database;
    let tempDir: string;

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-persona-"));
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

    it("seeds exactly one context per persona, with the localized label", async () => {
      const first = await seedPersonaKnowledgeContext(db, "school", "Schule");
      expect(first.created).toBe(true);
      expect(first.context.name).toBe("school");
      expect(first.context.label).toBe("Schule");
      expect(await listKnowledgeContexts(db)).toHaveLength(1);
    });

    it("is idempotent: re-seeding neither duplicates nor resets the context", async () => {
      await seedPersonaKnowledgeContext(db, "work", "Arbeit");
      // The user may have renamed the label since; a re-run must keep it.
      const existing = await getKnowledgeContextByName(db, "work");
      await updateKnowledgeContext(db, existing!.id, {
        label: "Mein Projekt",
      });

      const again = await seedPersonaKnowledgeContext(db, "work", "Arbeit");
      expect(again.created).toBe(false);
      expect(again.context.id).toBe(existing!.id);
      expect(again.context.label).toBe("Mein Projekt");
      expect(await listKnowledgeContexts(db)).toHaveLength(1);
    });

    it("keeps each persona's context separate", async () => {
      for (const persona of PERSONA_DESCRIPTORS) {
        await seedPersonaKnowledgeContext(db, persona.id);
      }
      const contexts = await listKnowledgeContexts(db);
      expect(contexts.map((c) => c.name).sort()).toEqual(
        [...PERSONA_DESCRIPTORS.map((p) => p.knowledgeContextSlug)].sort(),
      );
    });

    it("seeds with a null label when none is provided", async () => {
      const result = await seedPersonaKnowledgeContext(db, "private");
      expect(result.created).toBe(true);
      expect(result.context.label).toBeNull();
    });
  });
});
