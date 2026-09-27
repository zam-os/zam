/**
 * Generated choice options (ADR 2026-09-27 Decision 6, source 3): prompts,
 * parsing, the reject filter, and filling the cache ahead of the review.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prepareMobileChoiceOptions } from "../../mobile/src/choice-generate.js";
import { prepareChoiceOptionsForCards } from "../../src/cli/llm/choice-prepare.js";
import {
  buildChoiceFilterPrompt,
  buildChoiceGenerationPrompt,
  type ChoiceGenerationItem,
  type ChoicePrompt,
  parseChoiceFilter,
  parseChoiceGeneration,
  runChoiceGeneration,
} from "../../src/cli/llm/choice-prompt.js";
import {
  choiceSourceHash,
  createToken,
  type Database,
  ensureCard,
  listActiveDistractors,
  openDatabase,
  resolveAnswerPresentation,
} from "../../src/kernel/index.js";

const item: ChoiceGenerationItem = {
  id: "01K8TESTITEM000000000000A1",
  question: "Wie heißt die Richtungsänderung von Licht an einer Grenzfläche?",
  concept: "Brechung",
  domain: "Physik",
  bloomLevel: 1,
  language: "de",
};

const generated = JSON.stringify([
  { text: "Reflexion", reason: "Reflexion wirft Licht zurück." },
  { text: "Streuung", reason: "Streuung lenkt in viele Richtungen." },
  { text: "Brechung", reason: "the answer itself" },
  { text: "Lichtbrechung", reason: "a synonym" },
  { text: "Alle genannten", reason: "all of the above" },
]);

describe("choice prompts", () => {
  it("asks for plausible wrong options in the item's language", () => {
    const prompt = buildChoiceGenerationPrompt(item);
    expect(prompt.system).toContain("in German");
    expect(prompt.system).toContain("JSON only");
    expect(prompt.user).toContain("Correct answer: Brechung");
    expect(
      buildChoiceGenerationPrompt({ ...item, language: null }).system,
    ).toContain("the language the question and answer are written in");
    expect(buildChoiceGenerationPrompt(item)).toEqual(prompt);
  });

  it("parses fenced, prose-wrapped and broken replies", () => {
    expect(
      parseChoiceGeneration(`Here you go:\n\`\`\`json\n${generated}\n\`\`\``),
    ).toHaveLength(5);
    expect(
      parseChoiceGeneration('["Reflexion", {"text": "Streuung"}]'),
    ).toEqual([
      { text: "Reflexion", reason: null },
      { text: "Streuung", reason: null },
    ]);
    expect(parseChoiceGeneration("no JSON at all")).toEqual([]);
  });

  it("reads the filter's one-based numbers and ignores the rest", () => {
    expect(parseChoiceFilter('[2, 4, 9, "1"]', 4)).toEqual([0, 1, 3]);
    expect(() => parseChoiceFilter("I think option 2", 3)).toThrow(
      "did not return a list",
    );
    expect(
      buildChoiceFilterPrompt({
        question: item.question,
        concept: item.concept,
        options: ["A", "B"],
      }).user,
    ).toContain("1. A\n2. B");
  });
});

describe("runChoiceGeneration", () => {
  it("checks, shuffles, filters, and never trusts the model's order", async () => {
    let filterPrompt: ChoicePrompt | undefined;
    const result = await runChoiceGeneration({
      item,
      complete: async () => generated,
      completeFilter: async (prompt) => {
        filterPrompt = prompt;
        // Call "Streuung" correct as well as the answer.
        const lines = prompt.user.split("\n");
        const number = (text: string) =>
          lines.find((line) => line.endsWith(` ${text}`))!.split(".")[0];
        return `[${number("Brechung")}, ${number("Streuung")}]`;
      },
    });
    expect(result.accepted.map((entry) => entry.text)).toEqual(["Reflexion"]);
    expect(result.accepted[0]!.filterVerdict.answerRecognised).toBe(true);
    expect(
      Object.fromEntries(
        result.rejected.map((entry) => [entry.text, entry.reason]),
      ),
    ).toEqual({
      Brechung: "equals_answer",
      Lichtbrechung: "contains_answer",
      "Alle genannten": "all_or_none",
      Streuung: "filter",
    });
    // The filter saw the answer among the survivors, in a derived order.
    expect(filterPrompt!.user).toContain("Brechung");
    const again = await runChoiceGeneration({
      item,
      complete: async () => generated,
      completeFilter: async (prompt) => {
        expect(prompt).toEqual(filterPrompt);
        return "[]";
      },
    });
    expect(again.accepted).toHaveLength(2);
  });

  it("fails the item when the filter fails, so nothing unfiltered is stored", async () => {
    await expect(
      runChoiceGeneration({
        item,
        complete: async () => generated,
        completeFilter: async () => {
          throw new Error("HTTP 429");
        },
      }),
    ).rejects.toThrow("HTTP 429");
  });
});

describe("filling the option cache", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-choice-generation-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function card(slug: string, extra: Record<string, unknown> = {}) {
    const token = await createToken(db, {
      slug,
      concept: "Brechung",
      question: item.question,
      domain: "Physik",
      bloom_level: 1,
      ...extra,
    });
    return { token, cardId: (await ensureCard(db, token.id, "learner")).id };
  }

  const fakeGenerate = async (generationItem: ChoiceGenerationItem) => ({
    result: await runChoiceGeneration({
      item: generationItem,
      complete: async () => generated,
      completeFilter: async () => "[]",
    }),
    model: "writer",
    filterModel: "checker",
  });

  it("generates only for cards that would otherwise lack options", async () => {
    const needs = await card("needs-options");
    const unsuitable = await card("unsuitable", { bloom_level: 5 });
    const authored = await card("authored", {
      fast_check: JSON.stringify({
        type: "binary_choice",
        options: ["Brechung", "Reflexion"],
        correct_index: 0,
      }),
    });
    const outcome = await prepareChoiceOptionsForCards(
      db,
      {
        userId: "learner",
        cardIds: [needs.cardId, unsuitable.cardId, authored.cardId],
      },
      fakeGenerate,
    );
    expect(outcome).toEqual({
      prepared: 1,
      skipped: 2,
      failed: [],
      modelCalls: 2,
    });
    const rows = await listActiveDistractors(
      db,
      needs.token.id,
      choiceSourceHash(needs.token),
    );
    expect(rows.map((row) => row.text).sort()).toEqual([
      "Reflexion",
      "Streuung",
    ]);
    const presentation = await resolveAnswerPresentation(db, {
      userId: "learner",
      cardId: needs.cardId,
      mode: "choice",
    });
    expect(presentation.format).toBe("choice");

    // A second pass finds enough options and spends nothing.
    const second = await prepareChoiceOptionsForCards(
      db,
      { userId: "learner", cardIds: [needs.cardId] },
      fakeGenerate,
    );
    expect(second).toMatchObject({ prepared: 0, skipped: 1, modelCalls: 0 });
  });

  it("reports a failing card without failing the others", async () => {
    const first = await card("first");
    const second = await card("second");
    let calls = 0;
    const outcome = await prepareChoiceOptionsForCards(
      db,
      { userId: "learner", cardIds: [first.cardId, second.cardId] },
      async (generationItem) => {
        calls += 1;
        if (calls === 1) throw new Error("HTTP 500");
        return fakeGenerate(generationItem);
      },
    );
    expect(outcome.prepared).toBe(1);
    expect(outcome.failed).toEqual([
      { cardId: first.cardId, error: "HTTP 500" },
    ]);
  });

  it("generates on Mobile through the text chain, never under device-only", async () => {
    const needs = await card("mobile-needs");
    const endpoint = {
      enabled: true,
      local: false,
      url: "https://openrouter.ai/api/v1",
      model: "test/model",
      label: "Test model",
      apiFlavor: "chat-completions",
      apiKey: "test-key",
    } as never;

    const refused = await prepareMobileChoiceOptions(
      db,
      { userId: "learner", cardIds: [needs.cardId], preference: "device-only" },
      {},
      async () => endpoint,
    );
    expect(refused.reason).toBe("device-only");

    const sent: string[] = [];
    const outcome = await prepareMobileChoiceOptions(
      db,
      {
        userId: "learner",
        cardIds: [needs.cardId],
        preference: "device-first",
      },
      {
        fetchText: async (_url, init) => {
          const body = JSON.parse(String(init.body)) as {
            messages: Array<{ content: string }>;
          };
          sent.push(body.messages[0]!.content);
          return sent.length === 1 ? generated : "[]";
        },
      },
      async () => endpoint,
    );
    expect(outcome).toMatchObject({ prepared: 1, modelCalls: 2 });
    expect(sent[0]).toContain("distractors");
    expect(sent[1]).toContain("Correct option numbers");

    const none = await prepareMobileChoiceOptions(
      db,
      {
        userId: "learner",
        cardIds: [needs.cardId],
        preference: "device-first",
      },
      {},
      async () => null,
    );
    expect(none.reason).toBe("no_model");
  });
});
