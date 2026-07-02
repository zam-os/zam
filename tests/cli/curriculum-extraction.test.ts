import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { lehrplanplusBayernProvider as provider } from "../../src/cli/curriculum/providers/lehrplanplus-bayern/index.js";
import { openDatabase } from "../../src/kernel/index.js";
import {
  createToken,
  getTokenById,
  getTokenBySlug,
  listPersonalCards,
  listTokens,
  importCurriculumCards,
} from "../../src/kernel/models/token.ts";
import { ensureCard } from "../../src/kernel/models/card.ts";

describe("LehrplanPLUS Content Extraction & Stable Identity", () => {
  let deutschHtml: string;
  let mathematikHtml: string;
  let englischHtml: string;

  beforeAll(() => {
    const fixturesDir = path.resolve("tests/fixtures/curriculum/lehrplanplus-bayern");
    deutschHtml = fs.readFileSync(path.join(fixturesDir, "deutsch.html"), "utf-8");
    mathematikHtml = fs.readFileSync(path.join(fixturesDir, "mathematik-wpfg1.html"), "utf-8");
    englischHtml = fs.readFileSync(path.join(fixturesDir, "englisch.html"), "utf-8");
  });

  it("extracts specific Lernbereich texts from Deutsch HTML fixture", () => {
    const extracted = provider.extractTopics!(deutschHtml, [
      "realschule|9|deutsch#lb1",
      "realschule|9|deutsch#lb2",
    ]);
    
    expect(extracted["realschule|9|deutsch#lb1"]).toBeDefined();
    expect(extracted["realschule|9|deutsch#lb2"]).toBeDefined();

    const lb1Content = extracted["realschule|9|deutsch#lb1"];
    const lb2Content = extracted["realschule|9|deutsch#lb2"];

    // Check content of Lernbereich 1: Sprechen und Zuhören
    expect(lb1Content).toContain("Lernbereich 1:");
    expect(lb1Content).toContain("Sprechen und Zuhören");
    expect(lb1Content).toContain("Verstehend zuhören");
    expect(lb1Content).toContain("Zu und vor anderen sprechen");
    // Should NOT contain content from Lernbereich 2
    expect(lb1Content).not.toContain("Lernbereich 2:");
    expect(lb1Content).not.toContain("Lesetechniken und -strategien anwenden");

    // Check content of Lernbereich 2: Lesen – mit Texten und weiteren Medien umgehen
    expect(lb2Content).toContain("Lernbereich 2:");
    expect(lb2Content).toContain("Lesen – mit Texten und weiteren Medien umgehen");
    expect(lb2Content).toContain("Lesetechniken und -strategien anwenden");
    expect(lb2Content).not.toContain("Lernbereich 1:");
  });

  it("extracts specific Lernbereich texts from Mathematik wpfg1 HTML fixture", () => {
    const extracted = provider.extractTopics!(mathematikHtml, [
      "realschule|9|mathematik|wpfg1#lb1",
      "realschule|9|mathematik|wpfg1#lb7",
    ]);

    expect(extracted["realschule|9|mathematik|wpfg1#lb1"]).toBeDefined();
    expect(extracted["realschule|9|mathematik|wpfg1#lb7"]).toBeDefined();

    const lb1Content = extracted["realschule|9|mathematik|wpfg1#lb1"];
    const lb7Content = extracted["realschule|9|mathematik|wpfg1#lb7"];

    // Lernbereich 1: Reelle Zahlen
    expect(lb1Content).toContain("Lernbereich 1:");
    expect(lb1Content).toContain("Reelle Zahlen");
    expect(lb1Content).not.toContain("Lernbereich 7:");
    expect(lb1Content).not.toContain("Quadratische Funktionen und quadratische Gleichungen");

    // Lernbereich 7: Quadratische Funktionen und quadratische Gleichungen
    expect(lb7Content).toContain("Lernbereich 7:");
    expect(lb7Content).toContain("Quadratische Funktionen und quadratische Gleichungen");
    expect(lb7Content).not.toContain("Lernbereich 1:");
  });

  it("extracts specific Lernbereich texts from Englisch HTML fixture", () => {
    const extracted = provider.extractTopics!(englischHtml, [
      "realschule|9|englisch#lb1",
      "realschule|9|englisch#lb5",
    ]);

    expect(extracted["realschule|9|englisch#lb1"]).toBeDefined();
    expect(extracted["realschule|9|englisch#lb5"]).toBeDefined();

    const lb1Content = extracted["realschule|9|englisch#lb1"];
    const lb5Content = extracted["realschule|9|englisch#lb5"];

    // Lernbereich 1: Kommunikative Kompetenzen
    expect(lb1Content).toContain("Kommunikative Kompetenzen");
    expect(lb1Content).toContain("Kommunikative Fertigkeiten");
    expect(lb1Content).not.toContain("Alltägliche Lebensumstände");

    // Lernbereich 5: Themengebiete
    expect(lb5Content).toContain("Themengebiete");
    expect(lb5Content).not.toContain("Kommunikative Kompetenzen");
  });

  it("saves provider and topic_id columns and supports fallback parsing", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });

    const token = await createToken(db, {
      slug: "test-token",
      concept: "Concept A",
      domain: "Math",
      provider: "lehrplanplus-bayern",
      topic_id: "realschule|9|mathematik|wpfg1#lb1",
      source_link: "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=wpfg1#realschule|9|mathematik|wpfg1#lb1",
    });

    expect(token.provider).toBe("lehrplanplus-bayern");
    expect(token.topic_id).toBe("realschule|9|mathematik|wpfg1#lb1");

    // Test query fetches
    const bySlug = await getTokenBySlug(db, "test-token");
    expect(bySlug?.provider).toBe("lehrplanplus-bayern");
    expect(bySlug?.topic_id).toBe("realschule|9|mathematik|wpfg1#lb1");

    const byId = await getTokenById(db, token.id);
    expect(byId?.provider).toBe("lehrplanplus-bayern");
    expect(byId?.topic_id).toBe("realschule|9|mathematik|wpfg1#lb1");

    // Test fallback resolution when columns are empty
    await db.prepare("UPDATE tokens SET provider = NULL, topic_id = NULL WHERE id = ?").run(token.id);

    const fallbackSlug = await getTokenBySlug(db, "test-token");
    expect(fallbackSlug?.provider).toBe("lehrplanplus-bayern");
    expect(fallbackSlug?.topic_id).toBe("realschule|9|mathematik|wpfg1#lb1");

    // Test listPersonalCards fallback
    await ensureCard(db, token.id, "user-123");
    const personalCards = await listPersonalCards(db, "user-123");
    expect(personalCards).toHaveLength(1);
    expect(personalCards[0].provider).toBe("lehrplanplus-bayern");
    expect(personalCards[0].topicId).toBe("realschule|9|mathematik|wpfg1#lb1");

    await db.close();
  });

  it("handles duplicate prevention on re-import and retains history", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });

    const cardsInput = [
      {
        question: "What is a real number?",
        concept: "Real numbers",
        domain: "Mathematik",
        provider: "lehrplanplus-bayern",
        topic_id: "realschule|9|mathematik|wpfg1#lb1",
      },
    ];

    const res1 = await importCurriculumCards(db, "user-123", cardsInput);
    expect(res1.createdCount).toBe(1);
    expect(res1.ensuredCount).toBe(1);

    // Re-importing same card should yield 0 new creations
    const res2 = await importCurriculumCards(db, "user-123", cardsInput);
    expect(res2.createdCount).toBe(0);
    expect(res2.ensuredCount).toBe(0);

    await db.close();
  });
});
