import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import type { Database } from "../../src/kernel/db/types.js";
import {
  commitMaterialImport,
  createToken,
  findImportsByFingerprints,
  getCard,
  listMaterialAreaContext,
  listMaterialBonusItems,
  matchMaterialProposals,
  parseMaterialProposalSet,
  takeMaterialBonusItem,
} from "../../src/kernel/index.js";

/**
 * A material import end to end on PostgreSQL (ADR 2026-10-05, Decisions 5,
 * 6, 9). The SQLite suite covers the rules; this one covers what only
 * PostgreSQL can get wrong: M037's columns on an existing `sources` table,
 * bound parameters meeting typed columns, and counts that come back as
 * strings.
 */

const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

const FIXTURE = JSON.parse(
  readFileSync(
    join(__dirname, "../fixtures/material-import/chemie-sinne.json"),
    "utf8",
  ),
) as unknown;

async function admin(sql: string): Promise<void> {
  const db = openPostgresDatabase({ connectionString: POSTGRES_URL as string });
  await db.exec(sql);
  await db.close();
}

describeWithPostgres(
  "material import on PostgreSQL (needs POSTGRES_URL)",
  () => {
    const schema = "zam_material_import";
    const connections: Database[] = [];
    const userId = "learner";

    afterEach(async () => {
      for (const db of connections.splice(0)) {
        await db.close();
      }
      await admin(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    });

    async function setup(): Promise<Database> {
      await admin(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin(`CREATE SCHEMA ${schema}`);
      const db = openPostgresDatabase({
        connectionString: `${POSTGRES_URL}?options=-c%20search_path%3D${schema}`,
      });
      connections.push(db);
      await applySchemaAndMigrations(db);
      return db;
    }

    it("commits, finds the file again, and hands out a bonus card", async () => {
      const db = await setup();
      await createToken(db, {
        slug: "chemie-a",
        concept: "a",
        domain: "chemie/stoffe",
      });
      const set = parseMaterialProposalSet(FIXTURE);
      const rows = await matchMaterialProposals(db, userId, set);
      const result = await commitMaterialImport(db, userId, {
        set,
        rows,
        decisions: { "p:0": "yes", "p:2": "bonus" },
      });
      expect(result).toMatchObject({ cardsCreated: 1, bonusKept: 1 });

      const [record] = await findImportsByFingerprints(db, [
        set.files[0].sha256 as string,
      ]);
      expect(record.sourceId).toBe(result.sourceId);

      const items = await listMaterialBonusItems(db, userId);
      expect(items).toHaveLength(1);
      await takeMaterialBonusItem(db, userId, items[0].tokenId);
      expect(await getCard(db, items[0].tokenId, userId)).toBeDefined();

      const context = await listMaterialAreaContext(db);
      expect(context.areas).toContainEqual({
        path: "chemie/stoffe",
        tokenCount: 1,
      });
    });
  },
);
