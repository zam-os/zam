import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { bildungsplanBwProvider } from "../../src/cli/curriculum/providers/bildungsplan-bw/index.js";
import { kerncurriculumHessenProvider } from "../../src/cli/curriculum/providers/kerncurriculum-hessen/index.js";
import { kernlehrplanNrwProvider } from "../../src/cli/curriculum/providers/kernlehrplan-nrw/index.js";
import { lehrplanplusBayernProvider as provider } from "../../src/cli/curriculum/providers/lehrplanplus-bayern/index.js";
import { lehrplanSachsenProvider } from "../../src/cli/curriculum/providers/lehrplan-sachsen/index.js";
import { rahmenlehrplanBerlinBrandenburgProvider } from "../../src/cli/curriculum/providers/rahmenlehrplan-berlin-brandenburg/index.js";
import { openDatabase } from "../../src/kernel/index.js";
import { ensureCard } from "../../src/kernel/models/card.ts";
import {
  createToken,
  getTokenById,
  getTokenBySlug,
  importCurriculumCards,
  listPersonalCards,
} from "../../src/kernel/models/token.ts";

describe("LehrplanPLUS Content Extraction & Stable Identity", () => {
  let deutschHtml: string;
  let mathematikHtml: string;
  let englischHtml: string;

  beforeAll(() => {
    const fixturesDir = path.resolve(
      "tests/fixtures/curriculum/lehrplanplus-bayern",
    );
    deutschHtml = fs.readFileSync(
      path.join(fixturesDir, "deutsch.html"),
      "utf-8",
    );
    mathematikHtml = fs.readFileSync(
      path.join(fixturesDir, "mathematik-wpfg1.html"),
      "utf-8",
    );
    englischHtml = fs.readFileSync(
      path.join(fixturesDir, "englisch.html"),
      "utf-8",
    );
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
    expect(lb2Content).toContain(
      "Lesen – mit Texten und weiteren Medien umgehen",
    );
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
    expect(lb1Content).not.toContain(
      "Quadratische Funktionen und quadratische Gleichungen",
    );

    // Lernbereich 7: Quadratische Funktionen und quadratische Gleichungen
    expect(lb7Content).toContain("Lernbereich 7:");
    expect(lb7Content).toContain(
      "Quadratische Funktionen und quadratische Gleichungen",
    );
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
      source_link:
        "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/mathematik/inhalt/fachlehrplaene?w_schulart=realschule&wt_1=schulart&w_fach=mathematik&wt_2=fach&w_jgs=9&wt_3=jgs&w_auspraegung=wpfg1#realschule|9|mathematik|wpfg1#lb1",
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
    await db
      .prepare(
        "UPDATE tokens SET provider = NULL, topic_id = NULL WHERE id = ?",
      )
      .run(token.id);

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

  describe("Baden-Württemberg (Bildungsplan BW) Provider", () => {
    let bwMathHtml: string;

    beforeAll(() => {
      const fixturesDir = path.resolve(
        "tests/fixtures/curriculum/bildungsplan-bw",
      );
      bwMathHtml = fs.readFileSync(
        path.join(fixturesDir, "mathematik-gym-10.html"),
        "utf-8",
      );
    });

    it("extracts specific topics from Baden-Württemberg math Klasse 10 HTML fixture", () => {
      const extracted = bildungsplanBwProvider.extractTopics!(bwMathHtml, [
        "gymnasium|10|mathematik#leitidee-zahl",
        "gymnasium|10|mathematik#leitidee-raum",
      ]);

      expect(extracted["gymnasium|10|mathematik#leitidee-zahl"]).toBeDefined();
      expect(extracted["gymnasium|10|mathematik#leitidee-raum"]).toBeDefined();

      const zahlContent = extracted["gymnasium|10|mathematik#leitidee-zahl"];
      const raumContent = extracted["gymnasium|10|mathematik#leitidee-raum"];

      expect(zahlContent).toContain("Leitidee Zahl - Variable - Operation");
      expect(zahlContent).toContain("Potenzfunktionen");
      expect(zahlContent).not.toContain("Vektoren im dreidimensionalen Raum");

      expect(raumContent).toContain("Leitidee Raum und Form");
      expect(raumContent).toContain("Vektoren im dreidimensionalen Raum");
      expect(raumContent).not.toContain("Potenzfunktionen");
    });

    it("gracefully handles unknown topics", () => {
      const extracted = bildungsplanBwProvider.extractTopics!(bwMathHtml, [
        "gymnasium|10|mathematik#nonexistent-topic-id",
      ]);
      expect(
        extracted["gymnasium|10|mathematik#nonexistent-topic-id"],
      ).toBeUndefined();
    });
  });

  describe("Nordrhein-Westfalen (Kernlehrplan NRW) Provider", () => {
    let nrwMathHtml: string;

    beforeAll(() => {
      const fixturesDir = path.resolve(
        "tests/fixtures/curriculum/kernlehrplan-nrw",
      );
      nrwMathHtml = fs.readFileSync(
        path.join(fixturesDir, "mathematik-realschule-10.html"),
        "utf-8",
      );
    });

    it("extracts topics from a minimal NRW Realschule Math fixture", () => {
      const extracted = kernlehrplanNrwProvider.extractTopics!(
        nrwMathHtml,
        [
          "realschule|10|mathematik#arithmetik-algebra",
          "realschule|10|mathematik#funktionen",
        ],
      );

      expect(extracted["realschule|10|mathematik#arithmetik-algebra"]).toBeDefined();
      expect(extracted["realschule|10|mathematik#funktionen"]).toBeDefined();
      expect(extracted["realschule|10|mathematik#arithmetik-algebra"]).toContain("Arithmetik und Algebra");
    });

    it("gracefully handles unknown NRW topics", () => {
      const extracted = kernlehrplanNrwProvider.extractTopics!(nrwMathHtml, [
        "realschule|10|mathematik#nonexistent",
      ]);
      expect(extracted["realschule|10|mathematik#nonexistent"]).toBeUndefined();
    });
  });

  describe("Hessen (Kerncurriculum) Provider", () => {
    let hessenPhysikHtml: string;

    beforeAll(() => {
      const fixturesDir = path.resolve(
        "tests/fixtures/curriculum/kerncurriculum-hessen",
      );
      hessenPhysikHtml = fs.readFileSync(
        path.join(fixturesDir, "sample-gym-9-physik.html"),
        "utf-8",
      );
    });

    it("extracts topics from a minimal Hessen Gymnasium Physik fixture", () => {
      const extracted = kerncurriculumHessenProvider.extractTopics!(
        hessenPhysikHtml,
        [
          "gymnasium|9|physik#optik",
          "gymnasium|9|physik#elektromagnetismus",
        ],
      );

      expect(extracted["gymnasium|9|physik#optik"]).toBeDefined();
      expect(extracted["gymnasium|9|physik#optik"]).toContain("Optik");
    });

    it("gracefully handles unknown Hessen topics", () => {
      const extracted = kerncurriculumHessenProvider.extractTopics!(hessenPhysikHtml, [
        "gymnasium|9|physik#nonexistent",
      ]);
      expect(extracted["gymnasium|9|physik#nonexistent"]).toBeUndefined();
    });
  });

  describe("Sachsen (Lehrplan) Provider", () => {
    let sachsenBioHtml: string;

    beforeAll(() => {
      const fixturesDir = path.resolve(
        "tests/fixtures/curriculum/lehrplan-sachsen",
      );
      sachsenBioHtml = fs.readFileSync(
        path.join(fixturesDir, "sample-gym-9-biologie.html"),
        "utf-8",
      );
    });

    it("extracts topics from a minimal Sachsen Gymnasium Biologie fixture", () => {
      const extracted = lehrplanSachsenProvider.extractTopics!(
        sachsenBioHtml,
        [
          "gymnasium|9|biologie#genetik",
          "gymnasium|9|biologie#evolution",
        ],
      );

      expect(extracted["gymnasium|9|biologie#genetik"]).toBeDefined();
      expect(extracted["gymnasium|9|biologie#genetik"]).toContain("Genetik");
    });

    it("gracefully handles unknown Sachsen topics", () => {
      const extracted = lehrplanSachsenProvider.extractTopics!(sachsenBioHtml, [
        "gymnasium|9|biologie#nonexistent",
      ]);
      expect(extracted["gymnasium|9|biologie#nonexistent"]).toBeUndefined();
    });
  });

  describe("Berlin-Brandenburg (Rahmenlehrplan) Provider", () => {
    let berlinChemieHtml: string;

    beforeAll(() => {
      const fixturesDir = path.resolve(
        "tests/fixtures/curriculum/rahmenlehrplan-berlin-brandenburg",
      );
      berlinChemieHtml = fs.readFileSync(
        path.join(fixturesDir, "sample-gym-9-chemie.html"),
        "utf-8",
      );
    });

    it("extracts topics from a minimal Berlin-Brandenburg Gymnasium Chemie fixture", () => {
      const extracted = rahmenlehrplanBerlinBrandenburgProvider.extractTopics!(
        berlinChemieHtml,
        [
          "gymnasium|9|chemie#bindungen",
          "gymnasium|9|chemie#saeuren",
        ],
      );

      expect(extracted["gymnasium|9|chemie#bindungen"]).toBeDefined();
      expect(extracted["gymnasium|9|chemie#bindungen"]).toContain("Bindungen");
    });

    it("gracefully handles unknown Berlin-Brandenburg topics", () => {
      const extracted = rahmenlehrplanBerlinBrandenburgProvider.extractTopics!(berlinChemieHtml, [
        "gymnasium|9|chemie#nonexistent",
      ]);
      expect(extracted["gymnasium|9|chemie#nonexistent"]).toBeUndefined();
    });
  });
});
