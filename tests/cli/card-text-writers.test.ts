import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  editedCardText,
  publishRevision,
} from "../../src/cli/bridge-handlers.js";
import {
  ensureHighQualityQuestion,
  fixCardTextViaLLM,
  importCurriculumViaLLM,
  parseTranslatedSegments,
} from "../../src/cli/llm/client.js";
import { buildMaterialInstructions } from "../../src/cli/llm/material-prompt.js";
import { parseFormulaSpeechReply } from "../../src/cli/llm/speech-prompt.js";
import {
  CARD_SHAPE_RULES,
  CARD_TEXT_RULE,
  type CardText,
  createToken,
  type Database,
  ensureCard,
  fromPlaceholderText,
  getTokenBySlug,
  listPersonalCards,
  openDatabase,
  readCardTextInput,
  setSetting,
  toPlaceholderText,
  updateToken,
} from "../../src/kernel/index.js";

/**
 * The writers of card text (ADR 2026-10-14b, Decision 6; plan Phase 6):
 * prompts state the segment contract, parsers read it, variation and
 * translation work on placeholders. Model replies are scripted.
 */

const ENERGY: CardText = [
  { type: "text", text: "Wie groß ist " },
  {
    type: "math",
    tex: "W_{\\text{el}} = \\frac{1}{2} C U^2",
    speech: "W el gleich ein halb C U Quadrat",
  },
  { type: "text", text: " bei " },
  { type: "math", tex: "U = 5\\,\\text{V}", speech: "U gleich 5 Volt" },
  { type: "text", text: "?" },
];

function chatReply(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }));
}

describe("the segment rule in card prompts", () => {
  it("is one of the card-shape rules, and its example is valid agent card text", () => {
    expect(CARD_SHAPE_RULES).toContain(CARD_TEXT_RULE);
    expect(CARD_TEXT_RULE).toContain("aligned, array, cases, pmatrix");
    const example = CARD_TEXT_RULE.slice(
      CARD_TEXT_RULE.indexOf("Example: ") + "Example: ".length,
      CARD_TEXT_RULE.indexOf("]. ") + 1,
    );
    const read = readCardTextInput(JSON.parse(example), "agent");
    expect(read.ok && read.value.missingSpeech).toEqual([]);
  });

  it("reaches the material prompt", () => {
    const prompt = buildMaterialInstructions({
      locale: "de",
      areas: [],
      subjects: ["physik"],
    });
    expect(prompt).toContain(CARD_TEXT_RULE);
  });
});

describe("placeholders for variation and translation", () => {
  it("round-trips the formulas byte for byte, also when reordered", () => {
    const held = toPlaceholderText(ENERGY);
    expect(held.text).toBe("Wie groß ist [[1]] bei [[2]]?");
    expect(held.readings).toEqual([
      "W el gleich ein halb C U Quadrat",
      "U gleich 5 Volt",
    ]);
    const varied = fromPlaceholderText(
      "Bei [[2]]: welchen Wert hat [[1]]?",
      ENERGY,
    );
    expect(varied?.filter((s) => s.type === "math")).toEqual([
      ENERGY[3],
      ENERGY[1],
    ]);
  });

  it("refuses a reply that drops, repeats or invents a placeholder, or writes markup", () => {
    expect(fromPlaceholderText("Wie groß ist [[1]]?", ENERGY)).toBeNull();
    expect(fromPlaceholderText("[[1]] [[1]] [[2]]", ENERGY)).toBeNull();
    expect(fromPlaceholderText("[[1]] [[2]] [[3]]", ENERGY)).toBeNull();
    expect(
      fromPlaceholderText("Wie groß ist [[1]] bei [[2]] und $x^2$?", ENERGY),
    ).toBeNull();
  });

  it("takes translated readings, and keeps the stored one for an invalid reading", () => {
    const translated = parseTranslatedSegments(
      JSON.stringify({
        question: "How large is [[1]] at [[2]]?",
        readings: ["W el equals one half C U squared", "U \\ 5"],
      }),
      ENERGY,
    );
    expect(translated?.[1]).toEqual({
      ...ENERGY[1],
      speech: "W el equals one half C U squared",
    });
    expect(translated?.[3]).toEqual(ENERGY[3]);
    expect(
      parseTranslatedSegments('{"question":"How large is it?"}', ENERGY),
    ).toBeNull();
  });

  it("reads a speech reply even when a formula's backslash was eaten", () => {
    const reply = '[{"tex":"\\frac{1}{2}","speech":"ein halb"}]';
    expect(parseFormulaSpeechReply(reply).get("\\frac{1}{2}")).toBe("ein halb");
  });
});

describe("model replies with formulas", () => {
  let configDir: string;
  let previousConfig: string | undefined;
  let db: Database;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    configDir = mkdtempSync(join(tmpdir(), "zam-card-text-writers-"));
    const configPath = join(configDir, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify({ ai: { providers: {}, roles: {} } }),
    );
    previousConfig = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = configPath;
    db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "http://dummy/v1");
  });

  afterEach(async () => {
    global.fetch = originalFetch;
    await db.close();
    if (previousConfig === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfig;
    rmSync(configDir, { recursive: true, force: true });
  });

  it("a curriculum import reads segments and asks once for missing speech", async () => {
    const bodies: string[] = [];
    global.fetch = async (_url, init) => {
      const body = String(init?.body ?? "");
      if (!body) return new Response("{}");
      bodies.push(body);
      if (body.includes("teacher reads it aloud")) {
        return chatReply(
          JSON.stringify([{ tex: "x^2 = 4", speech: "x Quadrat gleich 4" }]),
        );
      }
      return chatReply(
        JSON.stringify([
          {
            question: ENERGY,
            concept: "Die im Feld gespeicherte Energie.",
            domain: "physik",
            bloom_level: 1,
            symbiosis_mode: "shadowing",
            context: "Energie im Kondensator",
          },
          {
            question: "Welche Lösungen hat $x^2 = 4$?",
            concept: "**Zwei**: 2 und −2.",
            domain: "mathe",
            bloom_level: 2,
            symbiosis_mode: "shadowing",
            context: "Quadratische Gleichungen",
          },
        ]),
      );
    };

    const cards = await importCurriculumViaLLM(db, "Lehrplantext", "physik");
    expect(cards[0].question_segments).toEqual(ENERGY);
    expect(cards[0].question).toBe("Wie groß ist W_el = ½CU² bei U = 5 V?");
    expect(cards[1].question_segments?.[1]).toEqual({
      type: "math",
      tex: "x^2 = 4",
      speech: "x Quadrat gleich 4",
    });
    expect(cards[1].concept).toBe("Zwei: 2 und −2.");
    expect(cards[1].concept_segments).toBeUndefined();
    // One card request, one follow-up for the missing speech.
    expect(bodies).toHaveLength(2);
  });

  it("varies a segmented question through placeholders, or serves the stored one", async () => {
    const token = await createToken(db, {
      slug: "energie",
      concept: "Ein halb C U Quadrat",
      domain: "physik",
      question_segments: ENERGY,
    });
    let reply = "Welche Energie [[1]] speichert er bei [[2]]?";
    global.fetch = async (_url, init) =>
      init?.body ? chatReply(reply) : new Response("{}");
    const input = {
      id: token.id,
      slug: token.slug,
      concept: token.concept,
      domain: token.domain,
      bloomLevel: 1,
      question: token.question,
      questionSegments: ENERGY,
    };

    const varied = await ensureHighQualityQuestion(db, input);
    expect(varied?.source).toBe("llm");
    expect(
      varied?.segments
        ?.filter((s) => s.type === "math")
        .map((s) => s.type === "math" && s.tex),
    ).toEqual(["W_{\\text{el}} = \\frac{1}{2} C U^2", "U = 5\\,\\text{V}"]);

    reply = "Welche Energie speichert ein Kondensator?";
    const fallback = await ensureHighQualityQuestion(db, input);
    expect(fallback).toMatchObject({
      source: "original",
      question: "Wie groß ist W_el = ½CU² bei U = 5 V?",
    });
    expect(fallback?.segments).toBeUndefined();
  });

  it("the editor's fix asks once for missing speech and refuses a bad formula", async () => {
    let reply = JSON.stringify([
      { type: "text", text: "Die Energie ist " },
      { type: "math", tex: "W = \\frac{1}{2} C U^2" },
    ]);
    global.fetch = async (_url, init) => {
      const body = String(init?.body ?? "");
      if (!body) return new Response("{}");
      if (body.includes("teacher reads it aloud")) {
        return chatReply(
          JSON.stringify([
            {
              tex: "W = \\frac{1}{2} C U^2",
              speech: "W gleich ein halb C U Quadrat",
            },
          ]),
        );
      }
      return chatReply(reply);
    };
    const fixed = await fixCardTextViaLLM(db, {
      side: "answer",
      current: "Die Energie ist ein halb C U Quadrat.",
      instruction: "schreib es als Formel",
    });
    expect(fixed.segments?.[1]).toEqual({
      type: "math",
      tex: "W = \\frac{1}{2} C U^2",
      speech: "W gleich ein halb C U Quadrat",
    });

    reply = JSON.stringify([
      { type: "math", tex: "\\href{x}{y}", speech: "x" },
    ]);
    await expect(
      fixCardTextViaLLM(db, {
        side: "answer",
        current: "x",
        instruction: "verlinke es",
      }),
    ).rejects.toThrow(/not valid card text: \[0\]\.tex/);
  });

  it("the editor's revision round-trips segments and refuses invalid ones with the kernel's message", async () => {
    const token = await createToken(db, {
      slug: "energie-editor",
      concept: "plain",
      question: "Wie groß ist die Energie?",
      domain: "physik",
    });
    await ensureCard(db, token.id, "learner");
    await publishRevision(db, {
      slug: "energie-editor",
      materiality: "cosmetic",
      changes: { conceptSegments: ENERGY },
    });
    const [listed] = await listPersonalCards(db, "learner");
    expect(listed.conceptSegments).toEqual(ENERGY);
    expect(listed.concept).toBe("Wie groß ist W_el = ½CU² bei U = 5 V?");

    await expect(
      publishRevision(db, {
        slug: "energie-editor",
        materiality: "cosmetic",
        changes: {
          conceptSegments: [{ type: "math", tex: "\\href{x}{y}" }],
        },
      }),
    ).rejects.toThrow(/^conceptSegments: \[0\]\.tex: /);

    // Back to plain text: the segments go first, then the plain write.
    const edit = editedCardText({ conceptSegments: null });
    const stored = await getTokenBySlug(db, "energie-editor");
    if (!stored) throw new Error("token missing");
    await db.transaction(async (tx) => {
      await edit.before(tx, stored);
      await updateToken(tx, "energie-editor", {
        concept: "Ein halb C U Quadrat",
      });
      await edit.after(tx, stored.id);
    });
    const plain = await getTokenBySlug(db, "energie-editor");
    expect(plain?.concept).toBe("Ein halb C U Quadrat");
    expect(plain?.concept_segments).toBeNull();
  });
});
