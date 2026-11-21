/**
 * Concurrent release on PostgreSQL (ADR 2026-11-21 Decision 7).
 *
 * Two connections rate different foundations of the same blocked card. Each
 * rating runs inside its caller's own outer transaction, and both callers
 * wait for each other before they commit, so without serialization both
 * release scans run while the other success is still uncommitted. The
 * dependent must come back anyway.
 *
 * SQLite serializes writers with BEGIN IMMEDIATE, so this runs only when
 * `POSTGRES_URL` is set (always in CI, locally via `npm run pg:up`).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import {
  addPrerequisite,
  applyDirectRating,
  applySessionSynthesis,
  createToken,
  type Database,
  ensureCard,
  executeReviewAction,
  getCard,
  startSession,
  type Token,
} from "../../src/kernel/index.js";

const POSTGRES_URL = process.env.POSTGRES_URL;
const SCHEMA = "blocker_concurrency";

/**
 * Resolves once both callers arrived, or after `ms` when the other caller is
 * held back (by a lock, as the fix intends), so a serialized run cannot wait
 * forever on a partner that is waiting on it.
 */
function meetingPoint(ms: number): () => Promise<void> {
  let arrived = 0;
  let release: () => void = () => {};
  const both = new Promise<void>((resolve) => {
    release = resolve;
  });
  return async () => {
    arrived++;
    if (arrived === 2) release();
    await Promise.race([both, new Promise((r) => setTimeout(r, ms))]);
  };
}

describe.skipIf(!POSTGRES_URL)(
  "concurrent release of a blocked card [PostgreSQL]",
  () => {
    let left: Database;
    let right: Database;

    beforeEach(async () => {
      const control = openPostgresDatabase({
        connectionString: POSTGRES_URL as string,
      });
      await control.exec(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
      await control.exec(`CREATE SCHEMA ${SCHEMA}`);
      await control.close();
      const url = `${POSTGRES_URL}?options=-c%20search_path%3D${SCHEMA}`;
      left = openPostgresDatabase({ connectionString: url });
      right = openPostgresDatabase({ connectionString: url });
      await applySchemaAndMigrations(left);
    });

    afterEach(async () => {
      await left.close();
      await right.close();
      const control = openPostgresDatabase({
        connectionString: POSTGRES_URL as string,
      });
      await control.exec(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
      await control.close();
    });

    async function item(slug: string): Promise<Token> {
      return createToken(left, {
        slug,
        concept: `Concept for ${slug}`,
        domain: "testing",
        question: `What is ${slug}?`,
      });
    }

    async function blockedBehindTwo() {
      const first = await item("first");
      const second = await item("second");
      const dependent = await item("dependent");
      await addPrerequisite(left, dependent.id, first.id);
      await addPrerequisite(left, dependent.id, second.id);
      await applyDirectRating(left, {
        userId: "thomas",
        tokenId: dependent.id,
        rating: 1,
      });
      expect((await getCard(left, dependent.id, "thomas"))?.blocked).toBe(1);
      return { first, second, dependent };
    }

    /** Both ratings inside their callers' outer transactions, at once. */
    async function rateTogether(
      rate: (db: Database, token: Token) => Promise<unknown>,
      first: Token,
      second: Token,
    ): Promise<void> {
      const meet = meetingPoint(1500);
      await Promise.all([
        left.transaction(async (tx) => {
          await rate(tx, first);
          await meet();
        }),
        right.transaction(async (tx) => {
          await rate(tx, second);
          await meet();
        }),
      ]);
    }

    it("releases through executeReviewAction", async () => {
      const { first, second, dependent } = await blockedBehindTwo();
      const firstCard = await ensureCard(left, first.id, "thomas");
      const secondCard = await ensureCard(left, second.id, "thomas");
      const cards = new Map([
        [first.id, firstCard.id],
        [second.id, secondCard.id],
      ]);

      await rateTogether(
        (db, token) =>
          executeReviewAction(db, {
            action: "rate",
            cardId: cards.get(token.id) as string,
            userId: "thomas",
            rating: 3,
          }),
        first,
        second,
      );

      expect((await getCard(left, first.id, "thomas"))?.reps).toBe(1);
      expect((await getCard(left, second.id, "thomas"))?.reps).toBe(1);
      expect((await getCard(left, dependent.id, "thomas"))?.blocked).toBe(0);
    });

    it("releases through applySessionSynthesis", async () => {
      const { first, second, dependent } = await blockedBehindTwo();
      const session = await startSession(left, {
        user_id: "thomas",
        task: "Observed work",
      });

      await rateTogether(
        (db, token) =>
          applySessionSynthesis(db, {
            sessionId: session.id,
            tokenSlug: token.slug,
            inferredRating: 3,
            confirmedRating: 3,
            confidence: "medium",
            evidence: {
              matchedCommands: 1,
              helpSeeking: false,
              errorCount: 0,
              selfCorrections: 0,
              medianGapMs: 1500,
              thinkingGapMs: null,
            },
            matchedCommandTexts: [`work on ${token.slug}`],
          }),
        first,
        second,
      );

      expect((await getCard(left, dependent.id, "thomas"))?.blocked).toBe(0);
    });

    it("releases through applyDirectRating", async () => {
      const { first, second, dependent } = await blockedBehindTwo();

      await rateTogether(
        (db, token) =>
          applyDirectRating(db, {
            userId: "thomas",
            tokenId: token.id,
            rating: 3,
          }),
        first,
        second,
      );

      expect((await getCard(left, dependent.id, "thomas"))?.blocked).toBe(0);
    });
  },
);
