import { afterEach, describe, expect, it } from "vitest";
import {
  atlasRead,
  atlasSettle,
  mayWriteKnowledge,
  NOT_CURATOR,
} from "../../src/cli/atlas.js";
import {
  addTeamMember,
  type PrincipalDirectory,
  provisionTeamLibrary,
} from "../../src/cli/deploy/team-provision.js";
import { resolveLearnerId } from "../../src/cli/users/identity.js";
import {
  deriveWeltwissen,
  ensureWorldLenses,
  findLensId,
  loadBindings,
  loadLensRows,
  loadUnits,
  SCHULE_LENS,
  WELTWISSEN_LENS,
  weltwissenSeedRows,
} from "../../src/kernel/atlas/lenses.js";
import { settleLens, snapshotLens } from "../../src/kernel/atlas/settle.js";
import { openDatabase } from "../../src/kernel/db/connection.js";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import type { Database } from "../../src/kernel/db/types.js";
import { createToken, installKvtTile } from "../../src/kernel/index.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";

/**
 * The atlas lenses on PostgreSQL (ADR 2026-10-13, M040). The SQLite suite
 * covers the rules; this one covers M040's tables on PostgreSQL, the seed
 * written in one transaction, and integers that come back typed.
 */

const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

async function admin(sql: string): Promise<void> {
  const db = openPostgresDatabase({ connectionString: POSTGRES_URL as string });
  await db.exec(sql);
  await db.close();
}

describeWithPostgres("atlas lenses on PostgreSQL (needs POSTGRES_URL)", () => {
  const schema = "zam_atlas";
  const connections: Database[] = [];

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

  it("seeds the world lenses once and places installed and own units", async () => {
    const db = await setup();
    const tile = listBundledTiles().find((t) =>
      t.atoms.some((a) => a.domain.startsWith("physik/optik")),
    );
    if (!tile) throw new Error("no bundled optics tile");
    await installKvtTile(db, tile);
    await createToken(db, {
      slug: "eigene-notiz",
      concept: "Stoffe an Farbe erkennen",
      domain: "chemie/stoffe",
    });

    await ensureWorldLenses(db);
    await ensureWorldLenses(db);
    const lensId = await findLensId(db, "welt", "weltwissen");
    const rows = await loadLensRows(db, lensId);
    expect(rows.regions).toHaveLength(weltwissenSeedRows().regions.length);
    expect(rows.regions.every((r) => typeof r.level === "number")).toBe(true);

    const units = await loadUnits(db);
    const placements = deriveWeltwissen(units, rows, await loadBindings(db));
    expect(placements).toHaveLength(units.length);
    for (const placement of placements) {
      expect(placement.path[0].key).toBe("natur");
    }
    expect(units.filter((u) => u.own)).toHaveLength(1);
  });

  it("settles land once; a second settle writes nothing", async () => {
    const db = await setup();
    for (const tile of listBundledTiles().slice(0, 4)) {
      await installKvtTile(db, tile);
    }
    for (const lens of [WELTWISSEN_LENS, SCHULE_LENS]) {
      const first = await settleLens(db, lens);
      expect(first.landWritten).toBeGreaterThan(0);
      expect(await settleLens(db, lens)).toEqual({
        regionsCreated: 0,
        islandsWritten: 0,
        landWritten: 0,
      });
      const snapshot = await snapshotLens(db, lens);
      if (!snapshot) throw new Error("lens missing");
      const placed = snapshot.state.land.filter((h) => h.unit);
      expect(placed).toHaveLength(snapshot.placements.length);
      expect(
        snapshot.state.islands.every((i) => typeof i.dq === "number"),
      ).toBe(true);
    }
  });
});

/**
 * On a team library only curators may store land (ADR 2026-09-04,
 * Decision 7). The grants say so, and the bridge asks the server rather than
 * keeping its own list of curators.
 */
describeWithPostgres("atlas on a team library (needs POSTGRES_URL)", () => {
  const url = POSTGRES_URL as string;
  const server = POSTGRES_URL ? new URL(url) : ({} as URL);
  const schema = "zam_atlas_team";
  const database = server.pathname ? server.pathname.replace(/^\//, "") : "";
  const created = new Set<string>();

  const directory: PrincipalDirectory = {
    async ensurePrincipal(upn) {
      const db = openPostgresDatabase({ connectionString: url });
      try {
        const known = (await db
          .prepare("SELECT rolname FROM pg_roles WHERE rolname = ?")
          .get(upn)) as { rolname: string } | undefined;
        if (!known) {
          await db.exec(`
            CREATE ROLE "${upn}" LOGIN PASSWORD 'pw' NOSUPERUSER NOBYPASSRLS;
            ALTER ROLE "${upn}" SET search_path = ${schema};
          `);
        }
        created.add(upn);
        return { roleName: upn, objectId: `oid-${upn}` };
      } finally {
        await db.close();
      }
    },
  };

  function connectAs(upn: string): Promise<Database> {
    return openDatabase({
      postgres: {
        host: server.hostname,
        port: Number(server.port || 5432),
        database,
        username: upn,
        auth: "password",
        password: "pw",
        ssl: false,
      },
    });
  }

  async function reset(): Promise<void> {
    const db = openPostgresDatabase({ connectionString: url });
    try {
      await db.exec(
        `DROP SCHEMA IF EXISTS ${schema} CASCADE; CREATE SCHEMA ${schema};`,
      );
      for (const upn of created) {
        await db.exec(`DROP OWNED BY "${upn}"; DROP ROLE IF EXISTS "${upn}";`);
      }
      created.clear();
    } finally {
      await db.close();
    }
  }

  it("lets a curator settle and refuses a member with not-curator", async () => {
    await reset();
    try {
      const control = openPostgresDatabase({
        connectionString: `${url}?options=-c%20search_path%3D${schema}`,
      });
      try {
        await provisionTeamLibrary(control, { schema });
        await addTeamMember(control, directory, {
          upn: "atlas-curator@example.org",
          database,
        });
        await addTeamMember(control, directory, {
          upn: "atlas-member@example.org",
          database,
          curator: false,
        });
        const tile = listBundledTiles().find((t) =>
          t.atoms.some((a) => a.domain.startsWith("physik/optik")),
        );
        if (!tile) throw new Error("no bundled optics tile");
        await installKvtTile(control, tile);
      } finally {
        await control.close();
      }

      const asMember = await connectAs("atlas-member@example.org");
      try {
        expect(await mayWriteKnowledge(asMember)).toBe(false);
        await expect(
          atlasSettle(asMember, { lens: "weltwissen" }),
        ).rejects.toThrow(NOT_CURATOR);
        // Reading still works and shows the whole, provisional map.
        const userId = (await resolveLearnerId(asMember)) as string;
        const view = await atlasRead(asMember, { userId, lens: "weltwissen" });
        expect(view.settle.mayWrite).toBe(false);
        expect(view.settle.pending).toBeGreaterThan(0);
        expect(view.land.length).toBeGreaterThan(0);
      } finally {
        await asMember.close();
      }

      const asCurator = await connectAs("atlas-curator@example.org");
      try {
        expect(await mayWriteKnowledge(asCurator)).toBe(true);
        const settled = await atlasSettle(asCurator, { lens: "weltwissen" });
        expect(settled.landWritten).toBeGreaterThan(0);
      } finally {
        await asCurator.close();
      }
    } finally {
      await reset();
    }
  });
});
