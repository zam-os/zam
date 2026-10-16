import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  acceptLensProposal,
  addConnection,
  applyLensEdits,
  createToken,
  type Database,
  ensureCard,
  ensureWorldLenses,
  installKvtTile,
  LEBEN_LENS,
  type LensEdit,
  LensEditError,
  lensCuration,
  markLensStale,
  OWN_PLANET_SETTING,
  openDatabase,
  PlanetError,
  PRODUKTE_LENS,
  proposeLensReplacement,
  readAtlas,
  SCHULE_LENS,
  setSetting,
  settleLens,
  UNTERNEHMEN_LENS,
  type UnitKey,
  validateLensProposal,
  WELTWISSEN_LENS,
} from "../../src/kernel/index.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";

/**
 * Curated lenses (ADR 2026-10-13, Decision 3; plan Phase 9c): edits, the
 * world map's rule that nothing moves the published map, a pending replacement a curator accepts,
 * and the "no longer fits its source" flag.
 */

const USER = "learner";

describe("curated lenses", () => {
  let dir: string;
  let db: Database;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-atlas-curation-"));
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  async function own(slug: string, domain: string): Promise<UnitKey> {
    const token = await createToken(db, { slug, concept: slug, domain });
    await ensureCard(db, token.id, USER);
    return `token:${token.id}`;
  }

  function edit(lens = LEBEN_LENS, edits: LensEdit[]) {
    return db.transaction((tx) =>
      applyLensEdits(tx, lens, edits, { placedBy: "learner" }),
    );
  }

  async function regionOf(lens: typeof LEBEN_LENS, unit: UnitKey) {
    const view = await readAtlas(db, { userId: USER, lens });
    return view.units.find((u) => u.key === unit)?.region;
  }

  async function refused(promise: Promise<unknown>, code: string) {
    const error = await promise.then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(LensEditError);
    expect((error as LensEditError).code).toBe(code);
  }

  it("refuses a place a thread holds, and a unit that does not exist (review round 2)", async () => {
    await ensureWorldLenses(db);
    const hebel = await own("hebel", "physik/mechanik");
    const linse = await own("linse", "physik/optik");
    // World knowledge using world knowledge: fine, until one end leaves.
    await addConnection(db, {
      userId: USER,
      mayWriteKnowledge: false,
      a: hebel,
      b: linse,
      kind: "nutzt",
    });
    await settleLens(db, LEBEN_LENS);
    const held = await edit(LEBEN_LENS, [
      { op: "create-region", name: "Werkstatt" },
      { op: "place", unit: linse, region: "werkstatt" },
    ]).then(
      () => null,
      (e: unknown) => e,
    );
    expect(held).toBeInstanceOf(PlanetError);
    expect((held as PlanetError).code).toBe("held-by-thread");
    // Nothing of the batch was written.
    const view = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    expect(view.regions.some((r) => r.key === "werkstatt")).toBe(false);
    expect(await regionOf(LEBEN_LENS, linse)).toBeUndefined();

    await refused(
      edit(LEBEN_LENS, [
        { op: "create-region", name: "Werkstatt" },
        { op: "place", unit: "token:01JNICHTDA", region: "werkstatt" },
      ]),
      "bad-edit",
    );
  });

  it("refuses removing a region when its unit would fall back to world knowledge across a thread", async () => {
    await ensureWorldLenses(db);
    // World knowledge by its domain, sorted onto the private planet.
    const linse = await own("linse-zuhause", "physik/optik");
    const brille = await own("omas-brille", "familie/dinge");
    await settleLens(db, LEBEN_LENS);
    await edit(LEBEN_LENS, [
      { op: "create-region", name: "Werkstatt" },
      { op: "place", unit: linse, region: "werkstatt" },
    ]);
    // Private knowledge using private knowledge: fine.
    await addConnection(db, {
      userId: USER,
      mayWriteKnowledge: false,
      a: linse,
      b: brille,
      kind: "nutzt",
    });
    // Without its region the unit is world knowledge again, using a private one.
    const error = await edit(LEBEN_LENS, [
      { op: "remove-region", key: "werkstatt" },
    ]).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(PlanetError);
    expect((error as PlanetError).code).toBe("held-by-thread");
    expect(await regionOf(LEBEN_LENS, linse)).toMatch(/^werkstatt\./);

    // A new order that leaves the unit out is refused the same way, and the
    // old order and the proposal stay (Astra, review round 2).
    await db.transaction((tx) =>
      proposeLensReplacement(
        tx,
        LEBEN_LENS,
        {
          source: "Neue Ordnung",
          regions: [{ key: "zuhause", name: "Zuhause", parent: null }],
        },
        "agent",
      ),
    );
    const accept = await db
      .transaction((tx) => acceptLensProposal(tx, LEBEN_LENS))
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(accept).toBeInstanceOf(PlanetError);
    expect((accept as PlanetError).code).toBe("held-by-thread");
    expect(await regionOf(LEBEN_LENS, linse)).toMatch(/^werkstatt\./);
    expect((await lensCuration(db, LEBEN_LENS))?.proposal).not.toBeNull();
  });

  it("creates, renames, reorders and moves regions of an own lens", async () => {
    const note = await own("geburtstag-oma", "familie/geburtstage");
    await settleLens(db, LEBEN_LENS);
    const result = await edit(LEBEN_LENS, [
      { op: "create-region", name: "Menschen" },
      { op: "create-region", name: "Freunde", parent: "menschen" },
      { op: "rename-region", key: "familie", name: "Meine Familie" },
      { op: "reorder-region", key: "familie", rank: 3 },
      { op: "place", unit: note, region: "menschen.freunde" },
    ]);
    expect(result).toMatchObject({
      created: 2,
      renamed: 1,
      reordered: 1,
      placed: 1,
    });
    expect(await regionOf(LEBEN_LENS, note)).toBe("menschen.freunde");
    // Familie holds no unit now: it is off the map until one reaches it.
    const view = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    expect(view.regions.some((r) => r.key === "familie")).toBe(false);

    // A Thema moves below another Bereich; its land is laid out again.
    await settleLens(db, LEBEN_LENS);
    await edit(LEBEN_LENS, [
      { op: "move-region", key: "menschen.freunde", parent: "familie" },
    ]);
    const moved = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    expect(
      moved.regions.find((r) => r.key === "menschen.freunde")?.parentKey,
    ).toBe("familie");
    expect(moved.regions.find((r) => r.key === "familie")?.name).toBe(
      "Meine Familie",
    );
    expect(moved.settle.pending).toBeGreaterThan(0);
    await settleLens(db, LEBEN_LENS);
    const settled = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    const hex = settled.land.find((h) => h.unit === note);
    expect(hex?.island).toBe("familie");
    expect(hex?.region).toBe("menschen.freunde");
  });

  it("refuses edits that break the tree", async () => {
    await own("rosen", "garten/blumen");
    await settleLens(db, LEBEN_LENS);
    await refused(
      edit(LEBEN_LENS, [
        { op: "create-region", name: "Zu tief", parent: "garten.blumen" },
      ]),
      "too-deep",
    );
    await refused(
      edit(LEBEN_LENS, [
        { op: "rename-region", key: "gibt-es-nicht", name: "x" },
      ]),
      "unknown-region",
    );
    await refused(
      edit(LEBEN_LENS, [
        { op: "move-region", key: "garten", parent: "garten" },
      ]),
      "bad-edit",
    );
    await refused(
      edit(LEBEN_LENS, [
        { op: "create-region", name: "x", key: "Nicht Gültig" },
      ]),
      "bad-edit",
    );
    // Nothing of a refused batch stays: the transaction rolls back.
    await refused(
      edit(LEBEN_LENS, [
        { op: "create-region", name: "Neu" },
        { op: "rename-region", key: "fehlt", name: "x" },
      ]),
      "unknown-region",
    );
    const view = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    expect(view.regions.some((r) => r.key === "neu")).toBe(false);
  });

  it("lets a removed region's units fall back to the lens's rules", async () => {
    const unit = await own("kompost", "garten/boden");
    await edit(LEBEN_LENS, [
      { op: "create-region", name: "Draußen" },
      { op: "place", unit, region: "draussen", below: ["Erde"] },
    ]);
    expect(await regionOf(LEBEN_LENS, unit)).toBe("draussen.erde");
    await edit(LEBEN_LENS, [{ op: "remove-region", key: "draussen" }]);
    expect(await regionOf(LEBEN_LENS, unit)).toBe("garten.boden");
  });

  it("sorts a domain by an alias", async () => {
    const unit = await own("tomaten", "garten/gemuese");
    await edit(LEBEN_LENS, [
      { op: "create-region", name: "Haus und Hof" },
      { op: "create-region", name: "Beete", parent: "haus-und-hof" },
      { op: "set-alias", domain: " Garten/ ", region: "haus-und-hof" },
    ]);
    expect(await regionOf(LEBEN_LENS, unit)).toBe("haus-und-hof.gemuese");
    await edit(LEBEN_LENS, [
      {
        op: "set-alias",
        domain: "garten/gemuese",
        region: "haus-und-hof.beete",
      },
    ]);
    expect(await regionOf(LEBEN_LENS, unit)).toBe("haus-und-hof.beete");
    await edit(LEBEN_LENS, [
      { op: "remove-alias", domain: "garten/gemuese" },
      { op: "remove-alias", domain: "garten" },
    ]);
    expect(await regionOf(LEBEN_LENS, unit)).toBe("garten.gemuese");
  });

  it("keeps the published map on a world lens, and takes own knowledge only", async () => {
    const tile = listBundledTiles().find((t) =>
      t.atoms.some((a) => a.domain.startsWith("physik/optik")),
    );
    if (!tile) throw new Error("no bundled optics tile");
    await installKvtTile(db, tile);
    const ownUnit = await own("fotografie-blende", "fotografie/blende");
    await ensureWorldLenses(db);
    await refused(
      edit(WELTWISSEN_LENS, [
        { op: "rename-region", key: "natur", name: "Natur" },
      ]),
      "world-structure",
    );
    await refused(
      edit(WELTWISSEN_LENS, [{ op: "remove-region", key: "natur" }]),
      "world-structure",
    );
    await refused(
      edit(WELTWISSEN_LENS, [
        { op: "set-alias", domain: "physik/optik", region: "natur" },
      ]),
      "published-alias",
    );
    await refused(
      edit(WELTWISSEN_LENS, [
        { op: "set-alias", domain: "physik", region: "natur" },
      ]),
      "published-alias",
    );
    await refused(
      edit(WELTWISSEN_LENS, [
        {
          op: "place",
          unit: `atom:${tile.atoms[0].id}`,
          region: "natur.physik",
        },
      ]),
      "published-unit",
    );
    // An own unit and its own domain: allowed, and world knowledge then.
    await edit(WELTWISSEN_LENS, [
      { op: "create-region", name: "Fotografie", parent: "natur.physik.optik" },
      {
        op: "set-alias",
        domain: "fotografie",
        region: "natur.physik.optik.fotografie",
      },
    ]);
    expect(await regionOf(WELTWISSEN_LENS, ownUnit)).toBe(
      "natur.physik.optik.fotografie",
    );
    // A region the library made can go again; its alias goes with it.
    await edit(WELTWISSEN_LENS, [
      { op: "remove-region", key: "natur.physik.optik.fotografie" },
    ]);
    const view = await readAtlas(db, { userId: USER, lens: WELTWISSEN_LENS });
    expect(view.regions.some((r) => r.key.endsWith(".fotografie"))).toBe(false);
    expect(await regionOf(WELTWISSEN_LENS, ownUnit)).toBeUndefined();
  });

  it("removes no world region a published unit sits in", async () => {
    const tile = listBundledTiles().find((t) => t.atoms.length > 0);
    if (!tile) throw new Error("no bundled tile");
    await installKvtTile(db, tile);
    await ensureWorldLenses(db);
    await settleLens(db, SCHULE_LENS);
    const view = await readAtlas(db, { userId: USER, lens: SCHULE_LENS });
    const island = view.regions.find((r) => r.level === 0 && !r.provisional);
    if (!island) throw new Error("no Schule island");
    await refused(
      edit(SCHULE_LENS, [{ op: "remove-region", key: island.key }]),
      "published-unit",
    );
  });

  it("proposes a whole order, which changes nothing until a curator accepts", async () => {
    await setSetting(db, OWN_PLANET_SETTING, "firma");
    const unit = await own("boreas-scrum", "scrum/team-boreas");
    await settleLens(db, PRODUKTE_LENS);
    const before = await readAtlas(db, { userId: USER, lens: PRODUKTE_LENS });

    await db.transaction((tx) =>
      proposeLensReplacement(
        tx,
        UNTERNEHMEN_LENS,
        {
          source: "Teamliste Oktober",
          regions: [
            { key: "nordwind", name: "Nordwind", parent: null },
            {
              key: "nordwind.entwicklung",
              name: "Entwicklung",
              parent: "nordwind",
            },
            {
              key: "nordwind.entwicklung.boreas",
              name: "Team Boreas",
              parent: "nordwind.entwicklung",
            },
          ],
          aliases: [{ domain: "scrum", region: "nordwind.entwicklung.boreas" }],
        },
        "curator",
      ),
    );
    const waiting = await lensCuration(db, UNTERNEHMEN_LENS);
    expect(waiting?.proposal).toMatchObject({
      source: "Teamliste Oktober",
      regions: 3,
      by: "curator",
    });
    // The Unternehmen lens exists now, still empty: nothing applied yet.
    const empty = await readAtlas(db, { userId: USER, lens: UNTERNEHMEN_LENS });
    expect(empty.regions.filter((r) => !r.provisional)).toHaveLength(0);
    expect(
      (await readAtlas(db, { userId: USER, lens: PRODUKTE_LENS })).units,
    ).toEqual(before.units);

    const accepted = await db.transaction((tx) =>
      acceptLensProposal(tx, UNTERNEHMEN_LENS),
    );
    expect(accepted).toMatchObject({ accepted: true, regions: 3 });
    const curation = await lensCuration(db, UNTERNEHMEN_LENS);
    expect(curation).toEqual({
      source: "Teamliste Oktober",
      stale: null,
      proposal: null,
    });
    const team = await readAtlas(db, { userId: USER, lens: UNTERNEHMEN_LENS });
    expect(team.units.find((u) => u.key === unit)?.region).toBe(
      "nordwind.entwicklung.boreas.team-boreas",
    );

    // The agent compares the lens with its source again.
    await markLensStale(db, UNTERNEHMEN_LENS, {
      stale: true,
      note: "Team Boreas heißt jetzt Team Zephyr.",
    });
    expect((await lensCuration(db, UNTERNEHMEN_LENS))?.stale?.note).toBe(
      "Team Boreas heißt jetzt Team Zephyr.",
    );
    // A world lens has no source to fall behind (review round 2).
    await ensureWorldLenses(db);
    await refused(
      markLensStale(db, WELTWISSEN_LENS, { stale: true, note: "veraltet" }),
      "not-own-planet",
    );

    // A rejected proposal leaves the lens as it is.
    await db.transaction((tx) =>
      proposeLensReplacement(
        tx,
        UNTERNEHMEN_LENS,
        {
          source: "Teamliste November",
          regions: [{ key: "zephyr", name: "Zephyr", parent: null }],
        },
        "curator",
      ),
    );
    await db.transaction((tx) =>
      acceptLensProposal(tx, UNTERNEHMEN_LENS, { reject: true }),
    );
    const kept = await lensCuration(db, UNTERNEHMEN_LENS);
    expect(kept?.proposal).toBeNull();
    expect(kept?.source).toBe("Teamliste Oktober");
    expect(kept?.stale).not.toBeNull();
    await refused(
      db.transaction((tx) => acceptLensProposal(tx, UNTERNEHMEN_LENS)),
      "no-proposal",
    );
  });

  it("validates a proposal before it waits", async () => {
    const bad =
      (regions: unknown, extra: Record<string, unknown> = {}) =>
      () =>
        validateLensProposal(LEBEN_LENS, {
          source: "Liste",
          regions,
          ...extra,
        });
    expect(bad([{ key: "a.b", name: "B", parent: "a" }])).toThrow(
      /before it is listed/,
    );
    expect(
      bad([
        { key: "a", name: "A", parent: null },
        { key: "a.b", name: "B", parent: "a" },
        { key: "a.b.c", name: "C", parent: "a.b" },
      ]),
    ).toThrow(/last level/);
    expect(
      bad([
        { key: "a", name: "A", parent: null },
        { key: "a", name: "A2", parent: null },
      ]),
    ).toThrow(/twice/);
    expect(
      bad([{ key: "a", name: "A", parent: null }], {
        members: [{ unit: "atom:x1", region: "a" }],
      }),
    ).toThrow(/own unit/);
    expect(() =>
      validateLensProposal(LEBEN_LENS, {
        regions: [{ key: "a", name: "A", parent: null }],
      }),
    ).toThrow(/source/);
    await ensureWorldLenses(db);
    await refused(
      db.transaction((tx) =>
        proposeLensReplacement(
          tx,
          WELTWISSEN_LENS,
          { source: "x", regions: [{ key: "a", name: "A", parent: null }] },
          "curator",
        ),
      ),
      "not-own-planet",
    );
  });
});
