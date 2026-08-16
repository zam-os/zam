import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { connectCloudModel } from "../../mobile/src/ai/connect.js";
import {
  applyMobileCurriculumChoice,
  initialMobileCurriculumState,
  mobileCurriculumOptions,
  nextMobileCurriculumView,
  NoMobileCurriculumModelError,
  parseMobileCurriculumCards,
  previewMobileCurriculumTopic,
  resolveMobileCurriculumPosition,
  type MobileCurriculumState,
} from "../../mobile/src/curriculum.js";
import { openDatabase } from "../../src/kernel/db/connection.js";
import type { Database } from "../../src/kernel/db/types.js";

describe("mobile curriculum navigation", () => {
  it("walks the same provider taxonomy as Desktop and skips empty tracks", () => {
    let state = initialMobileCurriculumState();
    const region = mobileCurriculumOptions("region", state).find(
      (option) => option.providerId === "lehrplanplus-bayern",
    );
    expect(region?.label).toBe("Bayern");

    state = applyMobileCurriculumChoice(state, "region", region!);
    expect(nextMobileCurriculumView(state, "region")?.step).toBe("schoolType");

    const school = mobileCurriculumOptions("schoolType", state).find(
      (option) => option.id === "realschule",
    );
    state = applyMobileCurriculumChoice(state, "schoolType", school!);
    const grade = mobileCurriculumOptions("grade", state).find(
      (option) => option.id === "5",
    );
    state = applyMobileCurriculumChoice(state, "grade", grade!);
    const subject = mobileCurriculumOptions("subject", state).find(
      (option) => option.id === "mathematik",
    );
    state = applyMobileCurriculumChoice(state, "subject", subject!);

    expect(nextMobileCurriculumView(state, "subject")?.step).toBe("topic");
    expect(mobileCurriculumOptions("topic", state).length).toBeGreaterThan(0);
  });
});

describe("mobile cell precedence", () => {
  let db: Database;
  let dir: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-mobile-curriculum-"));
    db = await openDatabase({
      dbPath: join(dir, "curriculum.db"),
      initialize: true,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("offers reviewed cells before the generic topic fallback", async () => {
    const state: MobileCurriculumState = {
      country: "DE",
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: "9",
      subject: "mathematik",
      track: "wpfg1",
    };

    const position = await resolveMobileCurriculumPosition(
      db,
      "student-9",
      state,
    );
    expect(position.needsGenericImport).toBe(false);
    expect(position.cells.map((cell) => cell.id)).toContain(
      "de-by:realschule-9-mathematik-pythagoras-trigonometrie",
    );
    expect(position.topics.length).toBeGreaterThan(0);
  });

  it("strictly extracts a topic and turns model output into editable drafts", async () => {
    await connectCloudModel(db, "test-key", {
      verify: async () => ({ valid: true }),
    });
    const state: MobileCurriculumState = {
      country: "DE",
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: "5",
      subject: "mathematik",
    };
    const topic = mobileCurriculumOptions("topic", state)[0]!;
    const source = `<!doctype html><div id="thema_50001" class="headline_lvl1"><a class="paragraph_toggle">${topic.label}</a><div class="thema_absch"><p>Natürliche Zahlen werden auf der Zahlengeraden geordnet und miteinander verglichen. Stellenwerte erklären den Aufbau großer Zahlen.</p><ul><li>Die Lernenden addieren und subtrahieren natürliche Zahlen in Sachzusammenhängen.</li><li>Sie wenden Rechengesetze an und begründen ihre Ergebnisse mit passenden Gegenproben.</li><li>Sie übersetzen Alltagssituationen in Terme und prüfen, ob das Ergebnis zur Ausgangsfrage passt.</li></ul></div></div>`;

    const drafts = await previewMobileCurriculumTopic(db, {
      providerId: "lehrplanplus-bayern",
      topic,
      category: `Mathematik/Klasse 5/${topic.label}`,
      locale: "de",
      ports: {
        fetchSource: async () => source,
        generateText: async (endpoint, prompt) => {
          expect(endpoint.model).toBeTruthy();
          expect(prompt).toContain(topic.label);
          return JSON.stringify([
            {
              title: "Stellenwert",
              question: "Was beschreibt der Stellenwert einer Ziffer?",
              concept: "Er bestimmt den Wert der Ziffer durch ihre Position.",
              context: "Stellenwerte erklären den Aufbau großer Zahlen.",
              bloom_level: 2,
              prerequisites: [],
            },
            {
              title: "Gegenprobe",
              question: "Wozu dient eine Gegenprobe?",
              concept: "Sie prüft, ob ein Rechenergebnis konsistent ist.",
              context:
                "Sie wenden Rechengesetze an und begründen ihre Ergebnisse mit passenden Gegenproben.",
              bloom_level: 2,
              prerequisites: ["Stellenwert"],
            },
          ]);
        },
      },
    });

    expect(drafts).toHaveLength(2);
    expect(drafts[1]).toMatchObject({
      origin: "curriculum",
      provider: "lehrplanplus-bayern",
      topicId: expect.stringContaining("realschule|5|mathematik"),
      prerequisites: [drafts[0]?.slug],
      source_link: expect.stringContaining("lehrplanplus.bayern.de"),
    });
  });

  it("asks for a model before downloading an official source", async () => {
    const state: MobileCurriculumState = {
      country: "DE",
      providerId: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: "5",
      subject: "kunst",
    };
    const topic = mobileCurriculumOptions("topic", state)[0]!;
    let fetched = false;

    await expect(
      previewMobileCurriculumTopic(db, {
        providerId: "lehrplanplus-bayern",
        topic,
        category: "Kunst/Klasse 5",
        locale: "de",
        ports: {
          fetchSource: async () => {
            fetched = true;
            return "";
          },
          generateText: async () => "[]",
        },
      }),
    ).rejects.toBeInstanceOf(NoMobileCurriculumModelError);
    expect(fetched).toBe(false);
  });
});

describe("mobile curriculum response validation", () => {
  it("rejects an answer that cannot become grounded cards", () => {
    expect(() => parseMobileCurriculumCards("[]")).toThrow(/between 1 and 60/);
    expect(() =>
      parseMobileCurriculumCards(
        JSON.stringify([
          {
            title: "Ohne Beleg",
            question: "Frage?",
            concept: "Antwort",
            context: "",
            bloom_level: 1,
            prerequisites: [],
          },
        ]),
      ),
    ).toThrow(/has no context/);
  });
});
