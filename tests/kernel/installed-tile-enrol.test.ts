/**
 * Enrolment from a provider tile the library holds (ADR 2026-11-25 D7):
 * no tile file, no download, only the learner's own cards.
 */
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolInstalledTile,
  installKvtTile,
  isProviderTileId,
  type KvtTile,
  listInstalledProviderTiles,
  openDatabase,
} from "../../src/kernel/index.js";

const FIXTURES = resolve(__dirname, "../fixtures/curriculum");
const NAMESPACE = "example-provider";
const PROVIDER = { id: NAMESPACE, origin: "https://provider.example" };

function providerTile(): KvtTile {
  const raw = readFileSync(
    join(FIXTURES, "de-by-realschule-optik-kvt.json"),
    "utf-8",
  ).replaceAll("01K3X9A7R4B8C1D2E3F4G5", "01K3X9A7R4B8C1D2E3F4P5");
  const tile = JSON.parse(raw) as KvtTile;
  tile.tile_id = `${NAMESPACE}:optik`;
  tile.version = "2026.11.1";
  tile.title = "Optik (Example Provider)";
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

async function cardsOf(db: Database, userId: string): Promise<number> {
  const row = (await db
    .prepare("SELECT COUNT(*) AS n FROM cards WHERE user_id = ?")
    .get(userId)) as { n: number };
  return Number(row.n);
}

describe("enrolInstalledTile and listInstalledProviderTiles", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-installed-tile-"));
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

  it("tells provider tiles from bundled and Academy tiles", () => {
    expect(isProviderTileId(`${NAMESPACE}:optik`)).toBe(true);
    expect(isProviderTileId("zam-academy:uml")).toBe(false);
    expect(isProviderTileId("de-by:realschule-optik")).toBe(false);
    expect(isProviderTileId("no-colon")).toBe(false);
  });

  it("installs creating no cards, then enrols a member from the library alone", async () => {
    await installKvtTile(db, providerTile(), {
      provider: PROVIDER,
      appUrl: "https://provider.example/optik/",
      preview: true,
    });
    expect(await cardsOf(db, "member-a")).toBe(0);

    const [listed] = await listInstalledProviderTiles(db, "member-a");
    expect(listed).toMatchObject({
      tileId: `${NAMESPACE}:optik`,
      providerId: NAMESPACE,
      version: "2026.11.1",
      title: "Optik (Example Provider)",
      appUrl: "https://provider.example/optik/",
      preview: true,
      held: false,
    });
    expect(listed.items).toBeGreaterThan(0);
    expect(listed.atoms).toEqual(
      providerTile()
        .atoms.map((atom) => atom.id)
        .sort(),
    );

    const first = await enrolInstalledTile(
      db,
      "member-a",
      `${NAMESPACE}:optik`,
    );
    expect(first.cardsCreated).toBeGreaterThan(0);
    expect(first.version).toBe("2026.11.1");
    expect(await cardsOf(db, "member-a")).toBe(first.cardsCreated);
    // Nobody else got cards.
    expect(await cardsOf(db, "member-b")).toBe(0);

    const again = await enrolInstalledTile(
      db,
      "member-a",
      `${NAMESPACE}:optik`,
    );
    expect(again.cardsCreated).toBe(0);
    expect(again.alreadyEnrolled).toBe(true);

    const [after] = await listInstalledProviderTiles(db, "member-a");
    expect(after.held).toBe(true);
    const [other] = await listInstalledProviderTiles(db, "member-b");
    expect(other.held).toBe(false);
  });

  it("lists only provider tiles, narrowed by prefix when asked", async () => {
    await installKvtTile(db, providerTile(), { provider: PROVIDER });
    const publicTile = JSON.parse(
      readFileSync(join(FIXTURES, "de-by-realschule-optik-kvt.json"), "utf-8"),
    );
    await installKvtTile(db, publicTile);
    expect(
      (await listInstalledProviderTiles(db, "member-a")).map((t) => t.tileId),
    ).toEqual([`${NAMESPACE}:optik`]);
    expect(
      await listInstalledProviderTiles(db, "member-a", ["other-provider"]),
    ).toEqual([]);
  });

  it("refuses what it cannot enrol", async () => {
    await expect(
      enrolInstalledTile(db, "member-a", `${NAMESPACE}:optik`),
    ).rejects.toThrow(/not installed/);
    await expect(
      enrolInstalledTile(db, "member-a", "zam-academy:uml"),
    ).rejects.toThrow(/not a provider tile/);
    await expect(
      enrolInstalledTile(db, " ", `${NAMESPACE}:optik`),
    ).rejects.toThrow(/userId/);

    await installKvtTile(db, providerTile(), { provider: PROVIDER });
    await db.prepare("DELETE FROM tile_atoms").run();
    await expect(
      enrolInstalledTile(db, "member-a", `${NAMESPACE}:optik`),
    ).rejects.toThrow(/no recorded atoms/);
  });
});
