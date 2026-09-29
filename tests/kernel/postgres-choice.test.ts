import { afterEach, describe, expect, it } from "vitest";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import type { Database } from "../../src/kernel/db/types.js";
import {
  type ChoiceEvidence,
  choiceSourceHash,
  createToken,
  ensureCard,
  executeReviewAction,
  listActiveDistractors,
  ratingForChoice,
  resolveAnswerPresentation,
  storeDistractors,
} from "../../src/kernel/index.js";

/**
 * A choice rating end to end on PostgreSQL (ADR 2026-09-27 Decisions 5–7).
 *
 * The SQLite suite covers the rules; this one covers what only PostgreSQL can
 * get wrong. A bound parameter takes the type of the column it meets, so a
 * fractional share bound beside an integer column is rejected — the team
 * library found every choice rating with cached options failing that way.
 */

const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

async function openOnSchema(name: string): Promise<Database> {
  return openPostgresDatabase({
    connectionString: `${POSTGRES_URL}?options=-c%20search_path%3D${name}`,
  });
}

async function createSchema(name: string): Promise<void> {
  const admin = openPostgresDatabase({
    connectionString: POSTGRES_URL as string,
  });
  await admin.exec(`DROP SCHEMA IF EXISTS ${name} CASCADE`);
  await admin.exec(`CREATE SCHEMA ${name}`);
  await admin.close();
}

async function dropSchema(name: string): Promise<void> {
  const admin = openPostgresDatabase({
    connectionString: POSTGRES_URL as string,
  });
  await admin.exec(`DROP SCHEMA IF EXISTS ${name} CASCADE`);
  await admin.close();
}

describeWithPostgres(
  "choice ratings on PostgreSQL (needs POSTGRES_URL)",
  () => {
    const schema = "zam_choice_rating";
    const connections: Database[] = [];
    const userId = "learner";
    const now = new Date("2026-09-29T12:00:00.000Z");

    afterEach(async () => {
      for (const db of connections.splice(0)) {
        await db.close();
      }
      await dropSchema(schema);
    });

    async function setup(): Promise<Database> {
      await createSchema(schema);
      const db = await openOnSchema(schema);
      connections.push(db);
      await applySchemaAndMigrations(db);
      return db;
    }

    async function itemWithOptions(
      db: Database,
      source: "generated" | "curated",
    ) {
      const token = await createToken(db, {
        slug: "brechung",
        concept: "Brechung",
        question: "Was geschieht mit Licht am Übergang zwischen zwei Medien?",
        domain: "Physik",
        bloom_level: 1,
      });
      const card = await ensureCard(db, token.id, userId);
      const sourceHash = choiceSourceHash(token);
      await storeDistractors(db, {
        tokenId: token.id,
        sourceHash,
        source,
        entries: [
          { text: "Reflexion", reason: "Reflexion wirft das Licht zurück." },
          { text: "Streuung", reason: "Streuung verteilt das Licht." },
        ],
        model: source === "generated" ? "test-model" : null,
      });
      return { token, cardId: card.id, sourceHash };
    }

    async function present(db: Database, cardId: string) {
      const shown = await resolveAnswerPresentation(db, {
        userId,
        cardId,
        mode: "choice",
        now,
      });
      if (shown.format !== "choice") {
        throw new Error(`expected a choice, got ${shown.reason}`);
      }
      return shown.choice;
    }

    async function book(
      db: Database,
      cardId: string,
      evidence: ChoiceEvidence,
    ) {
      return executeReviewAction(db, {
        action: "rate",
        cardId,
        userId,
        rating: ratingForChoice(evidence),
        answerFormat: "choice",
        choiceEvidence: evidence,
        now,
      });
    }

    it("books a correct pick, counts the showing and retires unpicked options", async () => {
      const db = await setup();
      const { token, cardId, sourceHash } = await itemWithOptions(
        db,
        "generated",
      );
      // Twenty-nine showings without a pick: the thirtieth crosses the 5 % line.
      await db
        .prepare(
          "UPDATE choice_distractors SET shown_count = 29, chosen_count = 0 WHERE token_id = ?",
        )
        .run(token.id);

      const choice = await present(db, cardId);
      expect(
        choice.entries.filter((entry) => entry.source === "generated"),
      ).toHaveLength(2);
      const result = await book(db, cardId, {
        ...choice,
        chosen: choice.correctIndex,
      });
      expect(result.evaluation?.state).toBe("learning");

      const log = (await db
        .prepare(
          "SELECT answer_format, rating FROM review_logs WHERE card_id = ?",
        )
        .get(cardId)) as { answer_format: string; rating: number };
      expect(log).toMatchObject({ answer_format: "choice", rating: 3 });

      expect(
        await listActiveDistractors(db, token.id, sourceHash),
      ).toHaveLength(0);
      const rows = (await db
        .prepare(
          "SELECT shown_count, chosen_count, retired_reason FROM choice_distractors WHERE token_id = ? ORDER BY id",
        )
        .all(token.id)) as Array<{
        shown_count: number | string;
        chosen_count: number | string;
        retired_reason: string | null;
      }>;
      expect(
        rows.map((row) => [
          Number(row.shown_count),
          Number(row.chosen_count),
          row.retired_reason,
        ]),
      ).toEqual([
        [30, 0, "unchosen"],
        [30, 0, "unchosen"],
      ]);
    });

    it("retires a disputed generated option and excludes a disputed curated one", async () => {
      const db = await setup();
      const generated = await itemWithOptions(db, "generated");
      let choice = await present(db, generated.cardId);
      let wrong = choice.entries.findIndex(
        (entry) => entry.source !== "correct",
      );
      let result = await book(db, generated.cardId, {
        ...choice,
        chosen: wrong,
        disputed: true,
      });
      expect(result.evaluation?.state).toBe("learning");
      const disputedRow = (await db
        .prepare(
          "SELECT retired_reason, chosen_count FROM choice_distractors WHERE id = ?",
        )
        .get(choice.entries[wrong]?.distractorId)) as {
        retired_reason: string | null;
        chosen_count: number | string;
      };
      expect(disputedRow.retired_reason).toBe("disputed");
      expect(Number(disputedRow.chosen_count)).toBe(1);

      // A curated row is a curator's: the learner stops seeing it, nobody else.
      const curatedToken = await createToken(db, {
        slug: "totalreflexion",
        concept: "Totalreflexion",
        question: "Wie heißt die vollständige Reflexion an der Grenzfläche?",
        domain: "Physik",
        bloom_level: 1,
      });
      const curatedCard = await ensureCard(db, curatedToken.id, userId);
      await storeDistractors(db, {
        tokenId: curatedToken.id,
        sourceHash: choiceSourceHash(curatedToken),
        source: "curated",
        entries: [{ text: "Teilreflexion" }, { text: "Doppelbrechung" }],
      });
      choice = await present(db, curatedCard.id);
      wrong = choice.entries.findIndex((entry) => entry.source === "curated");
      result = await book(db, curatedCard.id, {
        ...choice,
        chosen: wrong,
        disputed: true,
      });
      expect(result.evaluation?.state).toBe("learning");
      const exclusions = (await db
        .prepare(
          "SELECT excluded_key FROM choice_exclusions WHERE user_id = ? AND token_id = ?",
        )
        .all(userId, curatedToken.id)) as Array<{ excluded_key: string }>;
      expect(exclusions).toEqual([
        { excluded_key: `curated-row:${choice.entries[wrong]?.distractorId}` },
      ]);
      // The row itself is untouched: the curator decides.
      const curatedRows = await listActiveDistractors(
        db,
        curatedToken.id,
        choiceSourceHash(curatedToken),
      );
      expect(curatedRows).toHaveLength(2);
      // One usable curated option is left for this learner, so no choice.
      const again = await resolveAnswerPresentation(db, {
        userId,
        cardId: curatedCard.id,
        mode: "choice",
        now,
      });
      expect(again).toMatchObject({ format: "recall", reason: "no_options" });
    });
  },
);
