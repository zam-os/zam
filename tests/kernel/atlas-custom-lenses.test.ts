import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  acceptLensProposal,
  applyLensEdits,
  createCustomLens,
  createToken,
  type Database,
  ensureCard,
  LEBEN_LENS,
  type LensDefinition,
  LensEditError,
  libraryLens,
  libraryLenses,
  openDatabase,
  parseEmblemSubject,
  proposeLensReplacement,
  readAtlas,
  removeCustomLens,
  resolveLensKind,
  settleLens,
  type UnitKey,
} from "../../src/kernel/index.js";

/**
 * Custom lenses (ADR 2026-10-13, Decision 3, amended 2026-10-16): a library
 * makes its own orders over the same units on its own planet, fills them like
 * any curated lens, and removes them again without touching another lens.
 */

const USER = "learner";

describe("custom lenses", () => {
  let dir: string;
  let db: Database;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-atlas-custom-lens-"));
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

  function edit(lens: LensDefinition, edits: Parameters<typeof applyLensEdits>[2]) {
    return db.transaction((tx) =>
      applyLensEdits(tx, lens, edits, { placedBy: "learner" }),
    );
  }

  async function refused(promise: Promise<unknown>, code: string) {
    const error = await promise.then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(LensEditError);
    expect((error as LensEditError).code).toBe(code);
  }

  it("makes a lens on the own planet that the library then shows and resolves", async () => {
    const lens = await createCustomLens(db, {
      kind: "projekte",
      name: "Projekte",
      levels: ["Projekt", "Thema"],
    });
    expect(lens).toEqual({
      planet: "privat",
      kind: "projekte",
      name: "Projekte",
      levels: ["Projekt", "Thema"],
      colourLevel: 1,
    });
    const kinds = (await libraryLenses(db)).map((l) => l.kind);
    expect(kinds).toEqual(["weltwissen", "schule", "leben", "projekte"]);
    expect(await libraryLens(db, "projekte")).toEqual(lens);
    expect(await resolveLensKind(db, "projekte")).toEqual(lens);
    expect(await resolveLensKind(db, "unbekannt")).toBeNull();
    await expect(libraryLens(db, "unbekannt")).rejects.toThrow(
      /Unknown atlas lens "unbekannt"\. Choose weltwissen, schule, leben, projekte\./,
    );
  });

  it("is filled like any curated lens and leaves every other lens alone", async () => {
    const tomato = await own("tomaten", "garten/gemuese");
    const lens = await createCustomLens(db, {
      kind: "projekte",
      name: "Projekte",
      levels: ["Projekt", "Thema"],
    });
    const before = (await readAtlas(db, { userId: USER, lens: LEBEN_LENS }))
      .units;
    await edit(lens, [
      { op: "create-region", name: "Balkon" },
      { op: "create-region", name: "Beete", parent: "balkon" },
      { op: "set-alias", domain: "garten", region: "balkon.beete" },
    ]);
    const view = await readAtlas(db, { userId: USER, lens });
    expect(view.lens.name).toBe("Projekte");
    expect(view.units.find((u) => u.key === tomato)?.region).toBe(
      "balkon.beete",
    );
    expect((await settleLens(db, lens)).landWritten).toBeGreaterThan(0);
    // Leben still sorts the unit by its domain, as before.
    expect(
      (await readAtlas(db, { userId: USER, lens: LEBEN_LENS })).units,
    ).toEqual(before);
  });

  it("takes a proposal like the built-in own-planet lenses", async () => {
    const tomato = await own("tomaten", "garten/gemuese");
    const lens = await createCustomLens(db, {
      kind: "jahreszeiten",
      name: "Jahreszeiten",
      levels: ["Jahreszeit"],
    });
    expect(lens.colourLevel).toBe(0);
    await db.transaction((tx) =>
      proposeLensReplacement(
        tx,
        lens,
        {
          source: "Gartenkalender",
          regions: [{ key: "sommer", name: "Sommer", parent: null }],
          members: [{ unit: tomato, region: "sommer" }],
        },
        USER,
      ),
    );
    await db.transaction((tx) => acceptLensProposal(tx, lens));
    const view = await readAtlas(db, { userId: USER, lens });
    expect(view.units.find((u) => u.key === tomato)?.region).toBe("sommer");
  });

  it("refuses a built-in kind, a bad kind, bad levels and a second lens of one kind", async () => {
    const make = (input: Partial<Parameters<typeof createCustomLens>[1]>) =>
      createCustomLens(db, {
        kind: "projekte",
        name: "Projekte",
        levels: ["Projekt"],
        ...input,
      });
    await refused(make({ kind: "produkte" }), "lens-exists");
    await refused(make({ kind: "Meine Projekte" }), "bad-lens");
    await refused(make({ kind: "p" }), "bad-lens");
    await refused(make({ name: "  " }), "bad-lens");
    await refused(make({ levels: [] }), "bad-lens");
    await refused(make({ levels: ["a", "b", "c", "d", "e", "f"] }), "bad-lens");
    await refused(make({ levels: ["Projekt", ""] }), "bad-lens");
    await refused(make({ colourLevel: 1 }), "bad-lens");
    await make({});
    await refused(make({}), "lens-exists");
  });

  it("removes a custom lens with its regions and land, and no built-in lens", async () => {
    const tomato = await own("tomaten", "garten/gemuese");
    const lens = await createCustomLens(db, {
      kind: "projekte",
      name: "Projekte",
      levels: ["Projekt", "Thema"],
    });
    await edit(lens, [
      { op: "create-region", name: "Balkon" },
      { op: "place", unit: tomato, region: "balkon", below: ["Beete"] },
    ]);
    await settleLens(db, lens);
    const count = async (table: string) =>
      Number(
        (
          (await db
            .prepare(
              `SELECT COUNT(*) AS n FROM ${table} t
                 JOIN atlas_lenses l ON l.id = t.lens_id WHERE l.kind = 'projekte'`,
            )
            .get()) as { n: number }
        ).n,
      );
    expect(await count("atlas_regions")).toBeGreaterThan(0);
    expect(await count("atlas_land")).toBeGreaterThan(0);

    const removed = await db.transaction((tx) =>
      removeCustomLens(tx, "projekte"),
    );
    expect(removed.kind).toBe("projekte");
    expect((await libraryLenses(db)).map((l) => l.kind)).not.toContain(
      "projekte",
    );
    const rows = (await db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM atlas_lenses WHERE kind = 'projekte') AS lenses,
           (SELECT COUNT(*) FROM atlas_members WHERE unit_key = ?) AS members`,
      )
      .get(tomato)) as { lenses: number; members: number };
    expect(Number(rows.lenses)).toBe(0);
    expect(Number(rows.members)).toBe(0);
    // The unit still sits where Leben puts it.
    const leben = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    expect(leben.units.find((u) => u.key === tomato)?.region).toBe(
      "garten.gemuese",
    );

    await refused(removeCustomLens(db, "leben"), "not-custom");
    await refused(removeCustomLens(db, "projekte"), "unknown-lens");
  });

  it("gives a custom lens's regions their own Sinnbild subject", () => {
    expect(parseEmblemSubject("region:meine-projekte:balkon.beete")).toEqual({
      kind: "region",
      lens: "meine-projekte",
      regionKey: "balkon.beete",
    });
    expect(parseEmblemSubject("region:Meine Projekte:balkon")).toBeNull();
  });
});
