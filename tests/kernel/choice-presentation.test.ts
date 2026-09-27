/**
 * Choice presentation in the kernel (ADR 2026-09-27 Decisions 2, 3 and 6–9).
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assignTokenToContext,
  type ChoiceEvidence,
  checkCandidate,
  checkShownSet,
  choiceSourceHash,
  createKnowledgeContext,
  createToken,
  type Database,
  ensureCard,
  executeReviewAction,
  getCardById,
  isChoiceSuitable,
  listActiveDistractors,
  openDatabase,
  ratingForChoice,
  resolveAnswerPresentation,
  type StudyLearningMode,
  storeDistractors,
  syncCuratedDistractors,
  type Token,
} from "../../src/kernel/index.js";

const USER = "learner";
const t0 = new Date("2026-01-01T08:00:00Z");

describe("deterministic option checks", () => {
  it("names why a candidate cannot stand beside the answer", () => {
    expect(checkCandidate("Brechung", "  ")).toBe("empty");
    expect(checkCandidate("Brechung", "brechung.")).toBe("equals_answer");
    expect(checkCandidate("Brechung", "Die Brechung")).toBe("contains_answer");
    expect(checkCandidate("Brechung", "Reflexion", ["reflexion"])).toBe(
      "duplicate",
    );
    expect(checkCandidate("Brechung des Lichts", "Keine der Antworten")).toBe(
      "all_or_none",
    );
    expect(checkCandidate("senkrecht", "nicht senkrecht")).toBe(
      "negated_answer",
    );
    expect(
      checkCandidate(
        "Brechung",
        "Eine sehr lange Erklärung, die niemand für eine Alternative hält",
      ),
    ).toBe("length_outlier");
    expect(checkCandidate("Brechung", "Reflexion")).toBeNull();
  });

  it("rejects a shown set whose form gives the answer away", () => {
    expect(
      checkShownSet(
        ["Entfärbung des Bromwassers (Addition)", "Keine Reaktion", "Trübung"],
        0,
      ),
    ).toBe("length_cue");
    expect(checkShownSet(["Ne (10)", "Helium", "Argon"], 0)).toBe(
      "parenthesis_cue",
    );
    expect(checkShownSet(["Brechung", "Reflexion", "Streuung"], 0)).toBeNull();
  });

  it("asks only single-point answers up to Bloom 3 without answer media", () => {
    const base = { bloomLevel: 2, concept: "Brechung", hasAnswerMedia: false };
    expect(isChoiceSuitable(base)).toBe(true);
    expect(isChoiceSuitable({ ...base, bloomLevel: 4 })).toBe(false);
    expect(isChoiceSuitable({ ...base, hasAnswerMedia: true })).toBe(false);
    expect(
      isChoiceSuitable({ ...base, concept: "Zwei Punkte:\n- eins\n- zwei" }),
    ).toBe(false);
  });
});

describe("resolveAnswerPresentation", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-choice-presentation-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function item(
    slug: string,
    concept: string,
    extra: Record<string, unknown> = {},
  ): Promise<{ token: Token; cardId: string }> {
    const token = await createToken(db, {
      slug,
      concept,
      question: `Frage zu ${slug}?`,
      domain: "Physik",
      bloom_level: 1,
      ...extra,
    });
    const card = await ensureCard(db, token.id, USER);
    return { token, cardId: card.id };
  }

  /** Give the learner a free-recall review of an item, so it counts as met. */
  async function meet(cardId: string): Promise<void> {
    await executeReviewAction(db, {
      action: "rate",
      cardId,
      userId: USER,
      rating: 3,
      now: t0,
    });
  }

  async function present(
    cardId: string,
    mode: StudyLearningMode = "choice",
    now = t0,
  ) {
    return resolveAnswerPresentation(db, { userId: USER, cardId, mode, now });
  }

  async function answer(
    cardId: string,
    pick: "correct" | "wrong" | "dont_know",
    options: { disputed?: boolean; now?: Date; mode?: StudyLearningMode } = {},
  ) {
    const now = options.now ?? t0;
    const shown = await present(cardId, options.mode ?? "choice", now);
    if (shown.format !== "choice") throw new Error("expected a choice");
    const { choice } = shown;
    const evidence: ChoiceEvidence = {
      ...choice,
      chosen:
        pick === "dont_know"
          ? "dont_know"
          : pick === "correct"
            ? choice.correctIndex
            : choice.entries.findIndex((entry) => entry.source !== "correct"),
      disputed: options.disputed,
    };
    return {
      evidence,
      result: await executeReviewAction(db, {
        action: "rate",
        cardId,
        userId: USER,
        rating: ratingForChoice(evidence),
        answerFormat: "choice",
        choiceEvidence: evidence,
        now,
      }),
    };
  }

  it("leaves Flash and the answer modes to their own formats", async () => {
    const { cardId } = await item("mode", "Brechung");
    expect(await present(cardId, "flash")).toEqual({
      format: "recall",
      reason: "mode",
    });
    expect(await present(cardId, "answer_feedback")).toEqual({
      format: "recall",
      reason: "mode",
    });
  });

  it("asks unsuitable items in a recall format", async () => {
    const { cardId } = await item("analyse", "Brechung", { bloom_level: 4 });
    expect(await present(cardId)).toEqual({
      format: "recall",
      reason: "unsuitable",
    });
  });

  it("falls back to recall when no source has two usable distractors", async () => {
    const { cardId } = await item("lonely", "Brechung");
    expect(await present(cardId)).toEqual({
      format: "recall",
      reason: "no_options",
    });
  });

  it("shows an authored fast check with all its options, seeded", async () => {
    const { token, cardId } = await item("fast", "senkrecht", {
      fast_check: JSON.stringify({
        type: "multiple_choice",
        options: ["senkrecht", "parallel", "schräg"],
        correct_index: 0,
      }),
    });
    const first = await present(cardId);
    const again = await present(cardId);
    expect(again).toEqual(first);
    if (first.format !== "choice") throw new Error("expected a choice");
    expect([...first.choice.options].sort()).toEqual(
      ["parallel", "schräg", "senkrecht"].sort(),
    );
    expect(first.choice.options[first.choice.correctIndex]).toBe("senkrecht");
    expect(
      first.choice.entries.filter((e) => e.source === "curated"),
    ).toHaveLength(2);
    expect(token.fast_check).toContain("multiple_choice");
  });

  it("takes derived options only from items the learner has met", async () => {
    const target = await item("target", "Brechung");
    for (const [slug, concept] of [
      ["reflexion", "Reflexion"],
      ["streuung", "Streuung"],
      ["beugung", "Beugung"],
    ] as const) {
      await meet((await item(slug, concept)).cardId);
    }
    // Never asked: must not appear, and would spoil later material.
    await item("absorption", "Absorption");
    // Another learner's history is not this learner's.
    const foreign = await createToken(db, {
      slug: "dispersion",
      concept: "Dispersion",
      domain: "Physik",
      bloom_level: 1,
    });
    const foreignCard = await ensureCard(db, foreign.id, "someone-else");
    await executeReviewAction(db, {
      action: "rate",
      cardId: foreignCard.id,
      userId: "someone-else",
      rating: 3,
      now: t0,
    });

    const shown = await present(target.cardId);
    if (shown.format !== "choice") throw new Error("expected a choice");
    const distractors = shown.choice.options.filter(
      (_, index) => index !== shown.choice.correctIndex,
    );
    expect(distractors).toHaveLength(2);
    for (const text of distractors) {
      expect(["Reflexion", "Streuung", "Beugung"]).toContain(text);
    }
    for (const entry of shown.choice.entries) {
      if (entry.source === "correct") continue;
      expect(entry.source).toBe("derived");
      expect(entry.reason).toMatch(/^Frage zu /);
    }
  });

  it("keeps derived donors inside the studied knowledge context", async () => {
    const target = await item("ctx-target", "Brechung");
    const school = await createKnowledgeContext(db, { name: "school" });
    for (const [slug, concept, inSchool] of [
      ["ctx-a", "Reflexion", true],
      ["ctx-b", "Streuung", false],
      ["ctx-c", "Beugung", false],
    ] as const) {
      const donor = await item(slug, concept);
      await meet(donor.cardId);
      if (inSchool) await assignTokenToContext(db, donor.token.id, school.id);
    }
    const scoped = await resolveAnswerPresentation(db, {
      userId: USER,
      cardId: target.cardId,
      mode: "choice",
      now: t0,
      knowledgeContext: "school",
    });
    // Only one donor in the context: not enough for a choice.
    expect(scoped).toEqual({ format: "recall", reason: "no_options" });
  });

  it("uses generated options from the cache for the current wording", async () => {
    const { token, cardId } = await item("generated", "Brechung");
    await storeDistractors(db, {
      tokenId: token.id,
      sourceHash: choiceSourceHash(token),
      source: "generated",
      entries: [
        { text: "Reflexion", reason: "Zurückwerfen, nicht Richtungsänderung" },
        { text: "Streuung", reason: "Ablenkung in viele Richtungen" },
        { text: "Brechung", reason: "the answer itself" },
      ],
      model: "test-model",
    });
    const shown = await present(cardId);
    if (shown.format !== "choice") throw new Error("expected a choice");
    expect(shown.choice.options).toHaveLength(3);
    expect(
      shown.choice.options.filter((option) => option === "Brechung"),
    ).toHaveLength(1);
    // Another wording asks for new options.
    expect(
      await listActiveDistractors(
        db,
        token.id,
        choiceSourceHash({ ...token, concept: "neu" }),
      ),
    ).toHaveLength(0);
  });

  it("grades a choice by the kernel's rule and counts exposures", async () => {
    const { token, cardId } = await item("graded", "Brechung");
    await storeDistractors(db, {
      tokenId: token.id,
      sourceHash: choiceSourceHash(token),
      source: "generated",
      entries: [{ text: "Reflexion" }, { text: "Streuung" }],
    });
    const shown = await present(cardId);
    if (shown.format !== "choice") throw new Error("expected a choice");
    const evidence: ChoiceEvidence = {
      ...shown.choice,
      chosen: shown.choice.correctIndex,
    };
    await expect(
      executeReviewAction(db, {
        action: "rate",
        cardId,
        userId: USER,
        rating: 1,
        answerFormat: "choice",
        choiceEvidence: evidence,
        now: t0,
      }),
    ).rejects.toThrow("A choice earns rating 3, not 1");
    await expect(
      executeReviewAction(db, {
        action: "rate",
        cardId,
        userId: USER,
        rating: 3,
        answerFormat: "choice",
        now: t0,
      }),
    ).rejects.toThrow("requires its choice evidence");

    const { result } = await answer(cardId, "wrong");
    expect(result.evaluation?.state).toBe("learning");
    const rows = await listActiveDistractors(
      db,
      token.id,
      choiceSourceHash(token),
    );
    expect(rows.map((row) => row.shownCount)).toEqual([1, 1]);
    expect(rows.reduce((sum, row) => sum + row.chosenCount, 0)).toBe(1);
  });

  it("retires generated options almost nobody picks", async () => {
    const { token, cardId } = await item("unchosen", "Brechung");
    const sourceHash = choiceSourceHash(token);
    await storeDistractors(db, {
      tokenId: token.id,
      sourceHash,
      source: "generated",
      entries: [{ text: "Reflexion" }, { text: "Streuung" }],
    });
    await db
      .prepare(
        "UPDATE choice_distractors SET shown_count = 29, chosen_count = 1 WHERE token_id = ?",
      )
      .run(token.id);
    await answer(cardId, "correct");
    // 1 of 30 is under 5 %: both are retired, and the card has no options.
    expect(await listActiveDistractors(db, token.id, sourceHash)).toHaveLength(
      0,
    );
  });

  it("retires a disputed generated option for everyone", async () => {
    const { token, cardId } = await item("disputed", "Brechung");
    await storeDistractors(db, {
      tokenId: token.id,
      sourceHash: choiceSourceHash(token),
      source: "generated",
      entries: [
        { text: "Reflexion" },
        { text: "Streuung" },
        { text: "Beugung" },
      ],
    });
    const { result, evidence } = await answer(cardId, "wrong", {
      disputed: true,
    });
    // A dispute counts as correct and stays a choice rating.
    expect(ratingForChoice(evidence)).toBe(3);
    expect(result.evaluation?.state).toBe("learning");
    const log = (await db
      .prepare(
        "SELECT rating, answer_format FROM review_logs WHERE card_id = ?",
      )
      .get(cardId)) as { rating: number; answer_format: string };
    expect(log).toEqual({ rating: 3, answer_format: "choice" });
    const active = await listActiveDistractors(
      db,
      token.id,
      choiceSourceHash(token),
    );
    const disputedText = evidence.options[evidence.chosen as number];
    expect(active.map((row) => row.text)).not.toContain(disputedText);
    expect(active).toHaveLength(2);
  });

  it("excludes a disputed derived donor for this learner only", async () => {
    const target = await item("donor-target", "Brechung");
    for (const [slug, concept] of [
      ["d1", "Reflexion"],
      ["d2", "Streuung"],
      ["d3", "Beugung"],
    ] as const) {
      await meet((await item(slug, concept)).cardId);
    }
    const { evidence } = await answer(target.cardId, "wrong", {
      disputed: true,
    });
    const disputed = evidence.entries[evidence.chosen as number]!;
    expect(disputed.source).toBe("derived");
    const next = await getCardById(db, target.cardId);
    const again = await present(
      target.cardId,
      "choice",
      new Date(next!.due_at),
    );
    if (again.format !== "choice") throw new Error("expected a choice");
    expect(again.choice.entries.map((e) => e.donorTokenId)).not.toContain(
      disputed.donorTokenId,
    );
  });

  it("asks a binary fast check in recall once its only distractor is disputed", async () => {
    const { cardId } = await item("binary", "senkrecht", {
      fast_check: JSON.stringify({
        type: "binary_choice",
        options: ["senkrecht", "parallel"],
        correct_index: 0,
      }),
    });
    await answer(cardId, "wrong", { disputed: true });
    const next = await getCardById(db, cardId);
    expect(await present(cardId, "choice", new Date(next!.due_at))).toEqual({
      format: "recall",
      reason: "curated_disputed",
    });
  });

  it("probes in Auto one review before a choice would reach the ceiling", async () => {
    const { cardId } = await item("auto", "senkrecht", {
      fast_check: JSON.stringify({
        type: "multiple_choice",
        options: ["senkrecht", "parallel", "schräg"],
        correct_index: 0,
      }),
    });
    let now = t0;
    for (let presentation = 1; presentation <= 3; presentation++) {
      expect((await present(cardId, "auto", now)).format).toBe("choice");
      await answer(cardId, "correct", { now, mode: "auto" });
      now = new Date((await getCardById(db, cardId))!.due_at);
    }
    // The fourth presentation, ten days after the first.
    expect(Math.round((now.getTime() - t0.getTime()) / 86_400_000)).toBe(10);
    expect(await present(cardId, "auto", now)).toEqual({
      format: "recall",
      reason: "probe",
    });
    // Plain Choice keeps asking it as a choice.
    expect((await present(cardId, "choice", now)).format).toBe("choice");

    // After any free-recall answer — even a miss — Auto stays in recall.
    await executeReviewAction(db, {
      action: "rate",
      cardId,
      userId: USER,
      rating: 1,
      now,
    });
    const relearn = new Date((await getCardById(db, cardId))!.due_at);
    expect(await present(cardId, "auto", relearn)).toEqual({
      format: "recall",
      reason: "recall_stage",
    });
  });

  it("probes an overdue young card at once", async () => {
    const { cardId } = await item("overdue", "senkrecht", {
      fast_check: JSON.stringify({
        type: "multiple_choice",
        options: ["senkrecht", "parallel", "schräg"],
        correct_index: 0,
      }),
    });
    await answer(cardId, "correct", { mode: "auto" });
    await answer(cardId, "correct", {
      mode: "auto",
      now: new Date(t0.getTime() + 10 * 60 * 1000),
    });
    const later = new Date(t0.getTime() + 30 * 86_400_000);
    expect(await present(cardId, "auto", later)).toEqual({
      format: "recall",
      reason: "probe",
    });
  });

  it("syncs curated options with what the tile ships", async () => {
    const { token, cardId } = await item("curated", "Brechung");
    await syncCuratedDistractors(db, token, [
      { text: "Reflexion", reason: "Zurückwerfen" },
      { text: "Streuung" },
      { text: "Beugung" },
    ]);
    const shown = await present(cardId);
    if (shown.format !== "choice") throw new Error("expected a choice");
    expect(
      shown.choice.entries.filter((entry) => entry.source === "curated"),
    ).toHaveLength(2);
    await syncCuratedDistractors(db, token, [{ text: "Reflexion" }]);
    const left = await listActiveDistractors(
      db,
      token.id,
      choiceSourceHash(token),
    );
    expect(left.map((row) => row.text)).toEqual(["Reflexion"]);
  });
});
