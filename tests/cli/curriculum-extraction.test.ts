import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { bildungsplanBremenProvider } from "../../src/cli/curriculum/providers/bildungsplan-bremen/index.js";
import { bildungsplanBwProvider } from "../../src/cli/curriculum/providers/bildungsplan-bw/index.js";
import { bildungsplanHamburgProvider } from "../../src/cli/curriculum/providers/bildungsplan-hamburg/index.js";
import { fachanforderungenShProvider } from "../../src/cli/curriculum/providers/fachanforderungen-sh/index.js";
import { kerncurriculumHessenProvider } from "../../src/cli/curriculum/providers/kerncurriculum-hessen/index.js";
import { kerncurriculumNiedersachsenProvider } from "../../src/cli/curriculum/providers/kerncurriculum-niedersachsen/index.js";
import { kernlehrplanNrwProvider } from "../../src/cli/curriculum/providers/kernlehrplan-nrw/index.js";
import { lehrplaeneRpProvider } from "../../src/cli/curriculum/providers/lehrplaene-rp/index.js";
import { lehrplanSaarlandProvider } from "../../src/cli/curriculum/providers/lehrplan-saarland/index.js";
import { lehrplanSachsenProvider } from "../../src/cli/curriculum/providers/lehrplan-sachsen/index.js";
import { lehrplanThueringenProvider } from "../../src/cli/curriculum/providers/lehrplan-thueringen/index.js";
import { lehrplanplusBayernProvider as provider } from "../../src/cli/curriculum/providers/lehrplanplus-bayern/index.js";
import { rahmenlehrplanBerlinBrandenburgProvider } from "../../src/cli/curriculum/providers/rahmenlehrplan-berlin-brandenburg/index.js";
import { rahmenplanMvProvider } from "../../src/cli/curriculum/providers/rahmenplan-mv/index.js";
import { rahmenrichtlinienStProvider } from "../../src/cli/curriculum/providers/rahmenrichtlinien-st/index.js";
import type { CurriculumProvider } from "../../src/cli/curriculum/types.js";
import { openDatabase } from "../../src/kernel/index.js";
import { ensureCard } from "../../src/kernel/models/card.ts";
import {
  countUserCardsForCurriculumTopic,
  createToken,
  getTokenById,
  getTokenBySlug,
  importCurriculumCards,
  listPersonalCards,
  listUserCardsForCurriculumTopic,
} from "../../src/kernel/models/token.ts";

describe("LehrplanPLUS Content Extraction & Stable Identity", () => {
  let deutschHtml: string;
  let mathematikHtml: string;
  let mathematikRs5Html: string;
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
    mathematikRs5Html = fs.readFileSync(
      path.join(fixturesDir, "mathematik-realschule-5.html"),
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

  it("extracts Realschule 5 Mathematik Lernbereiche from the Grade-5 fixture", () => {
    const extracted = provider.extractTopics!(mathematikRs5Html, [
      "realschule|5|mathematik#lb1",
      "realschule|5|mathematik#lb2",
    ]);

    const lb1 = extracted["realschule|5|mathematik#lb1"];
    const lb2 = extracted["realschule|5|mathematik#lb2"];

    expect(lb1).toBeDefined();
    expect(lb1).toContain("Natürliche Zahlen");
    expect(lb1).toContain("100 000");
    expect(lb1).not.toContain("Ganze Zahlen");

    expect(lb2).toBeDefined();
    expect(lb2).toContain("Ganze Zahlen");
    expect(lb2).toContain("Zahlengeraden");
    expect(lb2).not.toContain("Natürliche Zahlen");
  });

  it("extracts Kompetenzabschnitte from Realschule 5 Mathematik lb1", () => {
    const subTopics = provider.extractSubTopics!(
      mathematikRs5Html,
      "realschule|5|mathematik#lb1",
    );

    expect(subTopics).toHaveLength(3);
    expect(subTopics[0].id).toBe("ku1");
    expect(subTopics[0].text).toContain("100 000");
    for (const st of subTopics) {
      expect(st.label).not.toMatch(/servicematerialien/i);
      expect(st.label).not.toMatch(/übergreifende ziele/i);
    }
  });

  it("extracts competence sub-units from a Mathematik Lernbereich", () => {
    const subTopics = provider.extractSubTopics!(
      mathematikHtml,
      "realschule|9|mathematik|wpfg1#lb1",
    );

    expect(subTopics.length).toBeGreaterThanOrEqual(3);
    expect(subTopics[0].id).toBe("ku1");
    expect(subTopics[0].label.length).toBeGreaterThan(10);
    expect(subTopics[0].text).toContain("Quadratwurzel");
    expect(subTopics[0].textLength).toBeGreaterThan(20);
    for (const st of subTopics) {
      expect(st.label).not.toMatch(/servicematerialien/i);
      expect(st.label).not.toMatch(/übergreifende ziele/i);
    }
  });

  it("omits Servicematerialien and Übergreifende Ziele from sub-units", () => {
    const wpfg23Html = fs.readFileSync(
      path.join(
        path.resolve("tests/fixtures/curriculum/lehrplanplus-bayern"),
        "mathematik-wpfg2-3.html",
      ),
      "utf-8",
    );
    const subTopics = provider.extractSubTopics!(
      wpfg23Html,
      "realschule|9|mathematik|wpfg2-3#lb3",
    );

    expect(subTopics.length).toBeGreaterThan(0);
    for (const st of subTopics) {
      expect(st.label).not.toMatch(/servicematerialien/i);
      expect(st.label).not.toMatch(/übergreifende ziele/i);
    }
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

  it("counts user cards per curriculum topic for import-status checks", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });

    const topicId = "realschule|5|mathematik#lb1";
    expect(
      await countUserCardsForCurriculumTopic(
        db,
        "user-123",
        "lehrplanplus-bayern",
        topicId,
      ),
    ).toBe(0);

    await importCurriculumCards(db, "user-123", [
      {
        question: "What is a natural number?",
        concept: "Natural numbers",
        domain: "Mathematik",
        provider: "lehrplanplus-bayern",
        topic_id: topicId,
      },
      {
        question: "What is addition?",
        concept: "Addition",
        domain: "Mathematik",
        provider: "lehrplanplus-bayern",
        topic_id: topicId,
      },
    ]);

    expect(
      await countUserCardsForCurriculumTopic(
        db,
        "user-123",
        "lehrplanplus-bayern",
        topicId,
      ),
    ).toBe(2);

    expect(
      await countUserCardsForCurriculumTopic(
        db,
        "other-user",
        "lehrplanplus-bayern",
        topicId,
      ),
    ).toBe(0);

    expect(
      await countUserCardsForCurriculumTopic(
        db,
        "user-123",
        "lehrplanplus-bayern",
        "realschule|5|mathematik#lb2",
      ),
    ).toBe(0);

    await db.close();
  });

  it("lists user cards across a Lernbereich and its sub-units", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });

    const parentTopic = "realschule|5|mathematik#lb1";

    await importCurriculumCards(db, "user-123", [
      {
        question: "Parent card",
        concept: "Parent",
        domain: "Mathematik",
        provider: "lehrplanplus-bayern",
        topic_id: parentTopic,
      },
      {
        question: "Sub-unit card",
        concept: "Sub",
        domain: "Mathematik",
        provider: "lehrplanplus-bayern",
        topic_id: `${parentTopic}@ku2`,
      },
    ]);

    const cards = await listUserCardsForCurriculumTopic(
      db,
      "user-123",
      "lehrplanplus-bayern",
      parentTopic,
    );
    expect(cards).toHaveLength(2);

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
      const extracted = kernlehrplanNrwProvider.extractTopics!(nrwMathHtml, [
        "realschule|10|mathematik#arithmetik-algebra",
        "realschule|10|mathematik#funktionen",
      ]);

      expect(
        extracted["realschule|10|mathematik#arithmetik-algebra"],
      ).toBeDefined();
      expect(extracted["realschule|10|mathematik#funktionen"]).toBeDefined();
      expect(
        extracted["realschule|10|mathematik#arithmetik-algebra"],
      ).toContain("Arithmetik und Algebra");
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
        ["gymnasium|9|physik#optik", "gymnasium|9|physik#elektromagnetismus"],
      );

      expect(extracted["gymnasium|9|physik#optik"]).toBeDefined();
      expect(extracted["gymnasium|9|physik#optik"]).toContain("Optik");
    });

    it("gracefully handles unknown Hessen topics", () => {
      const extracted = kerncurriculumHessenProvider.extractTopics!(
        hessenPhysikHtml,
        ["gymnasium|9|physik#nonexistent"],
      );
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
      const extracted = lehrplanSachsenProvider.extractTopics!(sachsenBioHtml, [
        "gymnasium|9|biologie#genetik",
        "gymnasium|9|biologie#evolution",
      ]);

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
        ["gymnasium|9|chemie#bindungen", "gymnasium|9|chemie#saeuren"],
      );

      expect(extracted["gymnasium|9|chemie#bindungen"]).toBeDefined();
      expect(extracted["gymnasium|9|chemie#bindungen"]).toContain("Bindungen");
    });

    it("gracefully handles unknown Berlin-Brandenburg topics", () => {
      const extracted = rahmenlehrplanBerlinBrandenburgProvider.extractTopics!(
        berlinChemieHtml,
        ["gymnasium|9|chemie#nonexistent"],
      );
      expect(extracted["gymnasium|9|chemie#nonexistent"]).toBeUndefined();
    });
  });

  /**
   * Seed-manifest providers: minimal HTML fixtures keep extractTopics offline
   * and prove heading-based section isolation for every remaining Bundesland.
   */
  describe.each([
    {
      name: "Niedersachsen",
      provider: kerncurriculumNiedersachsenProvider,
      fixtureDir: "kerncurriculum-niedersachsen",
      fixtureFile: "sample-rs-9-physik.html",
      topicId: "realschule|9|physik#mechanik",
      expectLabel: "Mechanik",
      siblingId: "realschule|9|physik#nonexistent",
    },
    {
      name: "Hamburg",
      provider: bildungsplanHamburgProvider,
      fixtureDir: "bildungsplan-hamburg",
      fixtureFile: "sample-sts-9-physik.html",
      topicId: "stadtteilschule|9|physik#mechanik",
      expectLabel: "Mechanik",
      siblingId: "stadtteilschule|9|physik#nonexistent",
    },
    {
      name: "Bremen",
      provider: bildungsplanBremenProvider,
      fixtureDir: "bildungsplan-bremen",
      fixtureFile: "sample-os-9-informatik.html",
      topicId: "oberschule|9|informatik#algorithmen",
      expectLabel: "Algorithmen",
      siblingId: "oberschule|9|informatik#nonexistent",
    },
    {
      name: "Mecklenburg-Vorpommern",
      provider: rahmenplanMvProvider,
      fixtureDir: "rahmenplan-mv",
      fixtureFile: "sample-rs-9-physik.html",
      topicId: "regionale-schule|9|physik#mechanik",
      expectLabel: "Mechanik",
      siblingId: "regionale-schule|9|physik#nonexistent",
    },
    {
      name: "Rheinland-Pfalz",
      provider: lehrplaeneRpProvider,
      fixtureDir: "lehrplaene-rp",
      fixtureFile: "sample-rsp-9-physik.html",
      topicId: "realschule-plus|9|physik#mechanik",
      expectLabel: "Mechanik",
      siblingId: "realschule-plus|9|physik#nonexistent",
    },
    {
      name: "Saarland",
      provider: lehrplanSaarlandProvider,
      fixtureDir: "lehrplan-saarland",
      fixtureFile: "sample-gs-9-physik.html",
      topicId: "gemeinschaftsschule|9|physik#mechanik",
      expectLabel: "Mechanik",
      siblingId: "gemeinschaftsschule|9|physik#nonexistent",
    },
    {
      name: "Sachsen-Anhalt",
      provider: rahmenrichtlinienStProvider,
      fixtureDir: "rahmenrichtlinien-st",
      fixtureFile: "sample-sek-9-physik.html",
      topicId: "sekundarschule|9|physik#mechanik",
      expectLabel: "Mechanik",
      siblingId: "sekundarschule|9|physik#nonexistent",
    },
    {
      name: "Schleswig-Holstein",
      provider: fachanforderungenShProvider,
      fixtureDir: "fachanforderungen-sh",
      fixtureFile: "sample-gs-9-physik.html",
      topicId: "gemeinschaftsschule|9|physik#mechanik",
      expectLabel: "Mechanik",
      siblingId: "gemeinschaftsschule|9|physik#nonexistent",
    },
    {
      name: "Thüringen",
      provider: lehrplanThueringenProvider,
      fixtureDir: "lehrplan-thueringen",
      fixtureFile: "sample-rs-9-physik.html",
      topicId: "regelschule|9|physik#mechanik",
      expectLabel: "Mechanik",
      siblingId: "regelschule|9|physik#nonexistent",
    },
  ])(
    "$name seed-provider extractTopics",
    ({
      provider: seedProvider,
      fixtureDir,
      fixtureFile,
      topicId,
      expectLabel,
      siblingId,
    }: {
      name: string;
      provider: CurriculumProvider;
      fixtureDir: string;
      fixtureFile: string;
      topicId: string;
      expectLabel: string;
      siblingId: string;
    }) => {
      let html: string;

      beforeAll(() => {
        html = fs.readFileSync(
          path.join(
            path.resolve("tests/fixtures/curriculum", fixtureDir),
            fixtureFile,
          ),
          "utf-8",
        );
      });

      it("extracts the seeded topic from the offline HTML fixture", () => {
        expect(seedProvider.extractTopics).toBeTypeOf("function");
        const extracted = seedProvider.extractTopics!(html, [topicId]);
        expect(extracted[topicId]).toBeDefined();
        expect(extracted[topicId]).toContain(expectLabel);
      });

      it("does not invent text for unknown topic ids", () => {
        const extracted = seedProvider.extractTopics!(html, [siblingId]);
        expect(extracted[siblingId]).toBeUndefined();
      });
    },
  );
});
