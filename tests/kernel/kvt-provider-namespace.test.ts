/**
 * Tile ownership (M050) and the private-provider namespace guard
 * (ADR 2026-11-25, Decisions 5 and 7).
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  ensureCard,
  getCard,
  installKvtTile,
  type KvtTile,
  openDatabase,
} from "../../src/kernel/index.js";

const FIXTURES = resolve(__dirname, "../fixtures/curriculum");
const PUBLIC_ID_STEM = "01K3X9A7R4B8C1D2E3F4G5";
const PROVIDER_ID_STEM = "01K3X9A7R4B8C1D2E3F4P5";
const NAMESPACE = "example-provider";
const PROVIDER = { id: NAMESPACE, origin: "https://provider.example" };

function loadFixture(name: string): KvtTile {
  return JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), "utf-8"));
}

/** The Optik cell re-minted as a provider tile: own tile, atom and item ids. */
function providerTile(version = "2026.11.1"): KvtTile {
  const raw = readFileSync(
    join(FIXTURES, "de-by-realschule-optik-kvt.json"),
    "utf-8",
  ).replaceAll(PUBLIC_ID_STEM, PROVIDER_ID_STEM);
  const tile = JSON.parse(raw) as KvtTile;
  tile.tile_id = `${NAMESPACE}:optik`;
  tile.version = version;
  tile.title = "Optik (Example Provider)";
  tile.description = "Brechung und Linsen";
  for (const atom of tile.atoms) {
    atom.atom_uri = `urn:zam:atom:${atom.id}`;
    atom.slug = `p-${atom.slug}`;
    atom.curricula = [];
    for (const item of atom.practice_items) {
      if (item.slug) item.slug = `p-${item.slug}`;
    }
  }
  return tile;
}

/** Gives one atom another id, prerequisites that name it included. */
function reidAtom(tile: KvtTile, index: number, newId: string): void {
  const oldId = tile.atoms[index].id;
  tile.atoms[index].id = newId;
  tile.atoms[index].atom_uri = `urn:zam:atom:${newId}-provider`;
  for (const atom of tile.atoms) {
    for (const prereq of atom.prerequisites ?? []) {
      if (prereq.atom_id === oldId) prereq.atom_id = newId;
    }
  }
}

async function count(db: Database, sql: string, ...args: unknown[]) {
  const row = (await db.prepare(sql).get(...args)) as { n: number };
  return Number(row.n);
}

describe("tile ownership and provider namespaces", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-kvt-ns-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close?.();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("tile_atoms (M050)", () => {
    it("records every atom of an installed tile, once", async () => {
      const tile = loadFixture("de-by-realschule-optik-kvt");
      await installKvtTile(db, tile);
      await installKvtTile(db, tile);
      expect(
        await count(
          db,
          "SELECT COUNT(*) AS n FROM tile_atoms WHERE tile_id = ?",
          tile.tile_id,
        ),
      ).toBe(tile.atoms.length);
    });

    it("lets an overlay tile add its own rows for a shared atom", async () => {
      await installKvtTile(db, loadFixture("de-by-realschule-optik-kvt"));
      await installKvtTile(
        db,
        loadFixture("de-by-realschule-optik-erweiterung-kvt"),
      );
      const owners = (await db
        .prepare(
          "SELECT tile_id FROM tile_atoms WHERE atom_id = ? ORDER BY tile_id",
        )
        .all(`${PUBLIC_ID_STEM}A001`)) as Array<{ tile_id: string }>;
      expect(owners.map((row) => row.tile_id)).toEqual([
        "de-by:realschule-optik",
        "de-by:realschule-optik-erweiterung",
      ]);
    });

    it("keeps title, description, app URL and preview of the tile", async () => {
      await installKvtTile(db, providerTile(), {
        provider: PROVIDER,
        appUrl: "https://provider.example/optik/",
        preview: true,
      });
      const read = () =>
        db
          .prepare(
            "SELECT title, description, app_url, preview FROM installed_tiles WHERE tile_id = ?",
          )
          .get(`${NAMESPACE}:optik`);
      expect(await read()).toEqual({
        title: "Optik (Example Provider)",
        description: "Brechung und Linsen",
        app_url: "https://provider.example/optik/",
        preview: 1,
      });
      // A reinstall that passes neither keeps both.
      await installKvtTile(db, providerTile("2026.11.2"), {
        provider: PROVIDER,
      });
      expect(await read()).toMatchObject({
        app_url: "https://provider.example/optik/",
        preview: 1,
      });
    });
  });

  describe("namespace guard (ADR 2026-11-25 Decision 5)", () => {
    it("installs a provider tile inside its namespace", async () => {
      const tile = providerTile();
      const result = await installKvtTile(db, tile, { provider: PROVIDER });
      expect(result.tokensCreated).toBeGreaterThan(0);
      expect(
        await count(
          db,
          "SELECT COUNT(*) AS n FROM tile_atoms WHERE tile_id = ?",
          tile.tile_id,
        ),
      ).toBe(tile.atoms.length);
    });

    it("refuses a tile id outside the namespace", async () => {
      const tile = providerTile();
      tile.tile_id = "zam-academy:optik";
      await expect(
        installKvtTile(db, tile, { provider: PROVIDER }),
      ).rejects.toThrow(/outside the namespace example-provider:/);
      tile.tile_id = `${NAMESPACE}-x:optik`;
      await expect(
        installKvtTile(db, tile, { provider: PROVIDER }),
      ).rejects.toThrow(/outside the namespace/);
    });

    it("leaves no failure mark on a tile outside its namespace", async () => {
      const publicTile = loadFixture("de-by-realschule-optik-kvt");
      await installKvtTile(db, publicTile);
      const before = await db
        .prepare("SELECT * FROM installed_tiles WHERE tile_id = ?")
        .get(publicTile.tile_id);

      const tile = providerTile();
      tile.tile_id = publicTile.tile_id;
      await expect(
        installKvtTile(db, tile, { provider: PROVIDER }),
      ).rejects.toThrow(/outside the namespace/);
      expect(
        await db
          .prepare("SELECT * FROM installed_tiles WHERE tile_id = ?")
          .get(publicTile.tile_id),
      ).toEqual(before);
    });

    it("refuses to rewrite a public atom by reusing its id, and writes nothing", async () => {
      await installKvtTile(db, loadFixture("de-by-realschule-optik-kvt"));
      const atomsBefore = await count(
        db,
        "SELECT COUNT(*) AS n FROM learning_atoms",
      );
      const titleBefore = await db
        .prepare("SELECT title FROM learning_atoms WHERE id = ?")
        .get(`${PUBLIC_ID_STEM}A001`);

      const tile = providerTile();
      reidAtom(tile, 1, `${PUBLIC_ID_STEM}A001`);
      tile.atoms[1].title = "Hijacked";
      await expect(
        installKvtTile(db, tile, { provider: PROVIDER }),
      ).rejects.toThrow(/atom 01K3X9A7R4B8C1D2E3F4G5A001/);

      expect(await count(db, "SELECT COUNT(*) AS n FROM learning_atoms")).toBe(
        atomsBefore,
      );
      expect(
        await db
          .prepare("SELECT title FROM learning_atoms WHERE id = ?")
          .get(`${PUBLIC_ID_STEM}A001`),
      ).toEqual(titleBefore);
      expect(
        await count(
          db,
          "SELECT COUNT(*) AS n FROM installed_tiles WHERE tile_id = ? AND version <> ''",
          tile.tile_id,
        ),
      ).toBe(0);
    });

    it("treats an existing atom without a recorded owner as not the provider's", async () => {
      await installKvtTile(db, loadFixture("de-by-realschule-optik-kvt"));
      // A library from before M050: the atom exists, nobody owns it.
      await db.prepare("DELETE FROM tile_atoms").run();
      const tile = providerTile();
      reidAtom(tile, 0, `${PUBLIC_ID_STEM}A001`);
      await expect(
        installKvtTile(db, tile, { provider: PROVIDER }),
      ).rejects.toThrow(/belongs to content outside/);
    });

    it("refuses to revise a public item by reusing its id", async () => {
      await installKvtTile(db, loadFixture("de-by-realschule-optik-kvt"));
      const tile = providerTile();
      tile.atoms[0].practice_items[0].id = `${PUBLIC_ID_STEM}H001`;
      await expect(
        installKvtTile(db, tile, { provider: PROVIDER }),
      ).rejects.toThrow(/item 01K3X9A7R4B8C1D2E3F4G5H001/);
    });

    it("refuses to move history off a public item", async () => {
      await installKvtTile(db, loadFixture("de-by-realschule-optik-kvt"));
      await ensureCard(db, `${PUBLIC_ID_STEM}H001`, "learner-a");
      const tile = providerTile();
      tile.atoms[0].practice_items[0].replaces = [`${PUBLIC_ID_STEM}H001`];
      await expect(
        installKvtTile(db, tile, { provider: PROVIDER }),
      ).rejects.toThrow(/replaced or retired item/);
      expect(
        (await getCard(db, `${PUBLIC_ID_STEM}H001`, "learner-a"))?.token_id,
      ).toBe(`${PUBLIC_ID_STEM}H001`);
    });

    it("refuses to retire a public item", async () => {
      await installKvtTile(db, loadFixture("de-by-realschule-optik-kvt"));
      const tile = providerTile();
      tile.retired_items = [{ id: `${PUBLIC_ID_STEM}H001` }];
      await expect(
        installKvtTile(db, tile, { provider: PROVIDER }),
      ).rejects.toThrow(/replaced or retired item/);
      const row = (await db
        .prepare("SELECT deprecated_at FROM tokens WHERE id = ?")
        .get(`${PUBLIC_ID_STEM}H001`)) as { deprecated_at: string | null };
      expect(row.deprecated_at).toBeNull();
    });

    it("skips an unknown replaced id without recording it", async () => {
      const tile = providerTile();
      tile.atoms[0].practice_items[0].replaces = [`${PUBLIC_ID_STEM}D003`];
      const result = await installKvtTile(db, tile, { provider: PROVIDER });
      expect(result.itemsSuperseded).toBe(0);
      expect(
        await count(
          db,
          "SELECT COUNT(*) AS n FROM practice_item_replacements WHERE old_item_id = ?",
          `${PUBLIC_ID_STEM}D003`,
        ),
      ).toBe(0);
    });

    it("moves history between the provider's own items", async () => {
      await installKvtTile(db, providerTile(), { provider: PROVIDER });
      const oldId = `${PROVIDER_ID_STEM}H001`;
      const newId = `${PROVIDER_ID_STEM}D001`;
      const card = await ensureCard(db, oldId, "learner-a");

      const next = providerTile("2026.11.2");
      for (const atom of next.atoms) {
        const item = atom.practice_items.find((i) => i.id === oldId);
        if (!item) continue;
        item.id = newId;
        item.slug = `${atom.slug}-successor`;
        item.replaces = [oldId];
      }
      const result = await installKvtTile(db, next, { provider: PROVIDER });
      expect(result.itemsSuperseded).toBe(1);
      expect((await getCard(db, newId, "learner-a"))?.id).toBe(card?.id);
    });

    it("lets a provider reinstall its own atoms and items", async () => {
      await installKvtTile(db, providerTile(), { provider: PROVIDER });
      const next = providerTile("2026.11.2");
      next.atoms[0].title = "Optik, überarbeitet";
      await expect(
        installKvtTile(db, next, { provider: PROVIDER }),
      ).resolves.toMatchObject({ version: "2026.11.2" });
    });

    it("pins a namespace to one origin across tiles, including pilot installs", async () => {
      const appUrl = `${PROVIDER.origin}/optik/`;
      const original = providerTile();
      await installKvtTile(db, original, { provider: PROVIDER, appUrl });
      await db
        .prepare(
          "UPDATE installed_tiles SET provider_origin = NULL WHERE tile_id = ?",
        )
        .run(original.tile_id);
      const second = {
        ...providerTile("2026.11.2"),
        tile_id: `${NAMESPACE}:second`,
      };
      await expect(
        installKvtTile(db, second, {
          provider: { ...PROVIDER, origin: "https://other.example" },
        }),
      ).rejects.toThrow(/PROVIDER_ORIGIN_MISMATCH/);
      expect(
        await db
          .prepare(
            "SELECT version, failed_at FROM installed_tiles WHERE tile_id = ?",
          )
          .get(second.tile_id),
      ).toBeUndefined();
      await expect(
        installKvtTile(db, second, { provider: PROVIDER }),
      ).resolves.toMatchObject({ version: "2026.11.2" });
    });

    it("leaves public installs unguarded", async () => {
      await installKvtTile(db, loadFixture("de-by-realschule-optik-kvt"));
      await expect(
        installKvtTile(
          db,
          loadFixture("de-by-realschule-optik-erweiterung-kvt"),
        ),
      ).resolves.toBeTruthy();
    });
  });
});
