import { afterEach, describe, expect, it } from "vitest";
import {
  atlasEmblemClear,
  atlasEmblemSet,
  atlasRead,
  atlasSettle,
  atlasVariant,
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
import {
  createToken,
  installKvtTile,
  resolveEmblem,
} from "../../src/kernel/index.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";
import { materialiseKvtCards } from "../../src/kernel/library/kvt-attach.js";

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

  it("lets a library variant change no member's cards (Decision 12)", async () => {
    await reset();
    try {
      const control = openPostgresDatabase({
        connectionString: `${url}?options=-c%20search_path%3D${schema}`,
      });
      let standsFor = "";
      let variant = "";
      try {
        await provisionTeamLibrary(control, { schema });
        await addTeamMember(control, directory, {
          upn: "variant-curator@example.org",
          database,
        });
        await addTeamMember(control, directory, {
          upn: "variant-member@example.org",
          database,
          curator: false,
        });
        const tile = listBundledTiles().find((t) =>
          t.atoms.some((a) => a.domain.startsWith("physik/optik")),
        );
        if (!tile) throw new Error("no bundled optics tile");
        await installKvtTile(control, tile);
        standsFor = `atom:${tile.atoms[0].id}`;
        const method = await createToken(control, {
          slug: "verfahren-der-schule",
          concept: "Das Verfahren der Schule",
          domain: "physik/optik",
        });
        variant = `token:${method.id}`;
      } finally {
        await control.close();
      }

      const asMember = await connectAs("variant-member@example.org");
      let memberId = "";
      try {
        memberId = (await resolveLearnerId(asMember)) as string;
        await materialiseKvtCards(asMember, memberId, [
          standsFor.slice("atom:".length),
        ]);
        // A member may not set the library's variant.
        await expect(
          atlasVariant(asMember, {
            userId: memberId,
            standsFor,
            variant,
            library: true,
          }),
        ).rejects.toThrow(NOT_CURATOR);
      } finally {
        await asMember.close();
      }

      const asCurator = await connectAs("variant-curator@example.org");
      try {
        const curatorId = (await resolveLearnerId(asCurator)) as string;
        await atlasVariant(asCurator, {
          userId: curatorId,
          standsFor,
          variant,
          library: true,
        });
      } finally {
        await asCurator.close();
      }

      const again = await connectAs("variant-member@example.org");
      try {
        const detached = (await again
          .prepare(
            "SELECT COUNT(*) AS n FROM cards WHERE user_id = ? AND detached_at IS NOT NULL",
          )
          .get(memberId)) as { n: number | string };
        expect(Number(detached.n)).toBe(0);
        // The member keeps the published unit and is offered the switch …
        const view = await atlasRead(again, {
          userId: memberId,
          lens: "weltwissen",
        });
        expect(
          view.units.find((u) => u.key === standsFor)?.variantOffer?.key,
        ).toBe(variant);
        // … and their own choice is their learning state, under RLS.
        const chosen = await atlasVariant(again, {
          userId: memberId,
          standsFor,
          variant,
        });
        expect(chosen.detached).toBeGreaterThan(0);
        const undone = await atlasVariant(again, {
          userId: memberId,
          standsFor,
          undo: true,
        });
        expect(undone.reattached).toBe(chosen.detached);
      } finally {
        await again.close();
      }
    } finally {
      await reset();
    }
  });

  it("writes a member's first Sinnbild as personal and a curator's as shared (Decision 6)", async () => {
    await reset();
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="#2f6fdf"/></svg>';
    try {
      const control = openPostgresDatabase({
        connectionString: `${url}?options=-c%20search_path%3D${schema}`,
      });
      let subject = "";
      try {
        await provisionTeamLibrary(control, { schema });
        await addTeamMember(control, directory, {
          upn: "emblem-curator@example.org",
          database,
        });
        await addTeamMember(control, directory, {
          upn: "emblem-member@example.org",
          database,
          curator: false,
        });
        const token = await createToken(control, {
          slug: "lichtbrechung",
          concept: "Lichtbrechung",
          domain: "physik/optik",
        });
        subject = `token:${token.id}`;
      } finally {
        await control.close();
      }

      const asMember = await connectAs("emblem-member@example.org");
      let memberId = "";
      try {
        memberId = (await resolveLearnerId(asMember)) as string;
        // No shared one yet, but a member may not write knowledge: personal.
        const own = await atlasEmblemSet(asMember, {
          userId: memberId,
          subject,
          svg,
        });
        expect(own.scope).toBe("personal");
        await expect(
          atlasEmblemSet(asMember, {
            userId: memberId,
            subject,
            svg,
            scope: "shared",
          }),
        ).rejects.toThrow(NOT_CURATOR);
        await expect(
          atlasEmblemClear(asMember, { userId: memberId, subject, shared: true }),
        ).rejects.toThrow(NOT_CURATOR);
      } finally {
        await asMember.close();
      }

      const asCurator = await connectAs("emblem-curator@example.org");
      try {
        const curatorId = (await resolveLearnerId(asCurator)) as string;
        const shared = await atlasEmblemSet(asCurator, {
          userId: curatorId,
          subject,
          glyph: "n₁",
        });
        expect(shared.scope).toBe("shared");
        // The member's own row is not the curator's to see.
        const rows = (await asCurator
          .prepare("SELECT COUNT(*) AS n FROM learner_emblems")
          .get()) as { n: number | string };
        expect(Number(rows.n)).toBe(0);
      } finally {
        await asCurator.close();
      }

      const again = await connectAs("emblem-member@example.org");
      try {
        // The personal one wins; removing it shows the library's.
        expect((await resolveEmblem(again, subject, memberId))?.source).toBe(
          "personal",
        );
        await atlasEmblemClear(again, { userId: memberId, subject });
        expect((await resolveEmblem(again, subject, memberId))?.glyph).toBe("n₁");
      } finally {
        await again.close();
      }
    } finally {
      await reset();
    }
  });
});
