import { ulid } from "ulid";
import { afterEach, describe, expect, it } from "vitest";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import type { Database } from "../../src/kernel/db/types.js";
import {
  AtomSiblingOccupiedError,
  admitPresentation,
  createToken,
  ensureCard,
} from "../../src/kernel/index.js";

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
  "PostgreSQL atom sibling exclusion (needs POSTGRES_URL)",
  () => {
    const schema = "zam_presentation_race";
    const connections: Database[] = [];

    afterEach(async () => {
      for (const db of connections.splice(0)) {
        await db.close();
      }
      await dropSchema(schema);
    });

    it("refuses two connections admitting different siblings of one atom", async () => {
      await createSchema(schema);
      const setup = await openOnSchema(schema);
      connections.push(setup);
      await applySchemaAndMigrations(setup);

      const atomId = ulid();
      await setup
        .prepare("INSERT INTO learning_atoms (id, title) VALUES (?, ?)")
        .run(atomId, "P");
      const first = await createToken(setup, {
        slug: "p1",
        concept: "P1 criterion",
        domain: "math",
        question: "P1?",
        atom_id: atomId,
      });
      const second = await createToken(setup, {
        slug: "p2",
        concept: "P2 criterion",
        domain: "math",
        question: "P2?",
        atom_id: atomId,
      });
      const userId = "learner";
      const card1 = await ensureCard(setup, first.id, userId);
      const card2 = await ensureCard(setup, second.id, userId);
      const now = new Date("2026-09-07T12:00:00.000Z");

      const connA = await openOnSchema(schema);
      const connB = await openOnSchema(schema);
      connections.push(connA, connB);

      const results = await Promise.allSettled([
        admitPresentation(connA, {
          userId,
          cardId: card1.id,
          timeZone: "UTC",
          now,
          confirm: true,
        }),
        admitPresentation(connB, {
          userId,
          cardId: card2.id,
          timeZone: "UTC",
          now,
          confirm: true,
        }),
      ]);

      const fulfilled = results.filter(
        (result) => result.status === "fulfilled",
      );
      const rejected = results.filter((result) => result.status === "rejected");
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
        AtomSiblingOccupiedError,
      );

      const occupying = (await setup
        .prepare(
          `SELECT card_id FROM card_presentations
            WHERE user_id = ? AND abandoned_at IS NULL`,
        )
        .all(userId)) as Array<{ card_id: string }>;
      expect(occupying).toHaveLength(1);
    });
  },
);
