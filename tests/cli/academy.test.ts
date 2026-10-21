import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { academyCacheDir } from "../../src/cli/academy/cache.js";
import {
  type AcademyFetchOptions,
  fetchAcademyCatalog,
  fetchAcademyCell,
} from "../../src/cli/academy/catalog-client.js";
import {
  academyEnrolHandler,
  academyListHandler,
  academyUpdateHandler,
} from "../../src/cli/academy/handlers.js";
import {
  enrolBundledCellHandler,
  listBundledCellsHandler,
} from "../../src/cli/bridge-handlers.js";
import type { SafeTransport } from "../../src/cli/net/safe-fetch.js";
import {
  type BundledTile,
  type Database,
  enrolBundledCell,
  getBundledCellTile,
  installedTileVersion,
  openDatabase,
} from "../../src/kernel/index.js";

const UML = getBundledCellTile("zam-academy:uml") as BundledTile;

/** The UML cell under an id no bundle has, and a version: a cell only the catalog has. */
function catalogOnly(version = "2026.10.1"): BundledTile {
  return {
    ...structuredClone(UML),
    tile_id: "zam-academy:nur-katalog",
    version,
  };
}

function sha(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

interface Route {
  status?: number;
  body?: Buffer;
  headers?: Record<string, string>;
}

/** A fake academy.zam-os.org; counts every request. */
function fakeAcademy(tiles: BundledTile[], extra: Record<string, Route> = {}) {
  const routes: Record<string, Route> = { ...extra };
  const cells = tiles.map((tile) => {
    const app = tile.tile_id.split(":")[1];
    const body = Buffer.from(JSON.stringify(tile));
    routes[`/${app}/cell.json`] ??= { body };
    return {
      id: tile.tile_id,
      title: tile.title,
      description: "",
      language: "de",
      version: String(tile.version),
      items: tile.atoms.reduce((n, a) => n + a.practice_items.length, 0),
      app: `/${app}/`,
      cell: `/${app}/cell.json`,
      sha256: sha(body),
    };
  });
  routes["/catalog.json"] ??= {
    body: Buffer.from(JSON.stringify({ schema: 1, cells })),
  };
  const requests: string[] = [];
  const transport: SafeTransport = async (url) => {
    requests.push(url.href);
    const route = routes[url.pathname];
    if (!route) {
      return {
        status: 404,
        statusText: "Not Found",
        headers: {},
        body: Buffer.from(""),
      };
    }
    return {
      status: route.status ?? 200,
      statusText: "OK",
      headers: route.headers ?? {},
      body: route.body ?? Buffer.from(""),
    };
  };
  const fetch: AcademyFetchOptions = {
    transport,
    resolve: async () => [{ address: "185.199.108.153", family: 4 }],
  };
  return { fetch, requests };
}

const offline: AcademyFetchOptions = {
  transport: async () => {
    throw new Error("network down");
  },
  resolve: async () => [{ address: "185.199.108.153", family: 4 }],
};

describe("ZAM Academy catalog client (ADR 2026-10-19 D4)", () => {
  beforeEach(() => rmSync(academyCacheDir(), { recursive: true, force: true }));

  it("reads the catalog and a cell whose hash matches", async () => {
    const academy = fakeAcademy([catalogOnly()]);
    const { catalog } = await fetchAcademyCatalog(academy.fetch);
    const { tile } = await fetchAcademyCell(catalog.cells[0], academy.fetch);
    expect(tile.tile_id).toBe("zam-academy:nur-katalog");
    expect(academy.requests).toEqual([
      "https://academy.zam-os.org/catalog.json",
      "https://academy.zam-os.org/nur-katalog/cell.json",
    ]);
  });

  it("fails on any redirect, even to the same host", async () => {
    const academy = fakeAcademy([], {
      "/catalog.json": {
        status: 301,
        headers: { location: "https://academy.zam-os.org/v2/catalog.json" },
      },
    });
    await expect(fetchAcademyCatalog(academy.fetch)).rejects.toThrow(
      /redirect/i,
    );
  });

  it("fails when a cell's bytes, id or version do not match the catalog", async () => {
    const tampered = fakeAcademy([catalogOnly()], {
      "/nur-katalog/cell.json": {
        body: Buffer.from(JSON.stringify(catalogOnly("2026.10.1")) + " "),
      },
    });
    const { catalog } = await fetchAcademyCatalog(tampered.fetch);
    await expect(
      fetchAcademyCell(catalog.cells[0], tampered.fetch),
    ).rejects.toThrow(/hash/);

    // Same bytes as listed, but the file names another version.
    const mislabelled = catalogOnly("2026.10.1");
    const body = Buffer.from(
      JSON.stringify({ ...mislabelled, version: "2026.10.9" }),
    );
    const wrong = fakeAcademy([], {
      "/catalog.json": {
        body: Buffer.from(
          JSON.stringify({
            schema: 1,
            cells: [
              {
                id: "zam-academy:nur-katalog",
                title: "x",
                description: "",
                language: "de",
                version: "2026.10.1",
                items: 1,
                app: "/nur-katalog/",
                cell: "/nur-katalog/cell.json",
                sha256: sha(body),
              },
            ],
          }),
        ),
      },
      "/nur-katalog/cell.json": { body },
    });
    const listed = await fetchAcademyCatalog(wrong.fetch);
    await expect(
      fetchAcademyCell(listed.catalog.cells[0], wrong.fetch),
    ).rejects.toThrow(/catalog says/);
  });
});

describe("the learner's academy actions (ADR 2026-10-19 D4, D5)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    rmSync(academyCacheDir(), { recursive: true, force: true });
    tempDir = mkdtempSync(join(tmpdir(), "zam-academy-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true, maxRetries: 10 });
  });

  async function tilesInstalled(): Promise<number> {
    const row = (await db
      .prepare("SELECT COUNT(*) AS n FROM installed_tiles")
      .get()) as { n: number };
    return row.n;
  }

  it("lists bundled and catalog cells without writing the library", async () => {
    const academy = fakeAcademy([
      catalogOnly(),
      { ...UML, version: "2099.1.1" },
    ]);
    const list = await academyListHandler(db, {
      user: "learner",
      fetch: academy.fetch,
    });
    expect(list.offline).toBe(false);
    // Every bundled academy cell plus the catalog-only one, sorted by id.
    expect(list.cells.map((cell) => cell.id)).toEqual([
      "zam-academy:algorithmen",
      "zam-academy:biologie-realschule-10",
      "zam-academy:bwr-realschule-9",
      "zam-academy:chemie-realschule-9",
      "zam-academy:datennetze",
      "zam-academy:geographie-realschule-9",
      "zam-academy:geschichte-realschule-9",
      "zam-academy:mathematik-realschule-9",
      "zam-academy:nur-katalog",
      "zam-academy:physik-realschule-10",
      "zam-academy:physik-realschule-9",
      "zam-academy:sql",
      "zam-academy:uml",
    ]);
    expect(
      list.cells.find((cell) => cell.id === "zam-academy:uml"),
    ).toMatchObject({
      bundled: true,
      held: false,
      version: "2099.1.1",
      items: 26,
      appUrl: "https://academy.zam-os.org/uml/",
    });
    expect(await tilesInstalled()).toBe(0);
    // Both cells were cached for a later „Aufnehmen“ or an agent.
    expect(
      readFileSync(join(academyCacheDir(), "catalog.json"), "utf8"),
    ).toContain("zam-academy:nur-katalog");
  });

  it("answers from the cache, or the bundled cells, when offline", async () => {
    const empty = await academyListHandler(db, {
      user: "learner",
      fetch: offline,
    });
    expect(empty).toMatchObject({ offline: true });
    expect(empty.cells.map((cell) => cell.id)).toEqual([
      "zam-academy:algorithmen",
      "zam-academy:biologie-realschule-10",
      "zam-academy:bwr-realschule-9",
      "zam-academy:chemie-realschule-9",
      "zam-academy:datennetze",
      "zam-academy:geographie-realschule-9",
      "zam-academy:geschichte-realschule-9",
      "zam-academy:mathematik-realschule-9",
      "zam-academy:physik-realschule-10",
      "zam-academy:physik-realschule-9",
      "zam-academy:sql",
      "zam-academy:uml",
    ]);

    await academyListHandler(db, {
      user: "learner",
      fetch: fakeAcademy([catalogOnly()]).fetch,
    });
    const cached = await academyListHandler(db, {
      user: "learner",
      fetch: offline,
    });
    expect(cached.cells.map((cell) => cell.id)).toContain(
      "zam-academy:nur-katalog",
    );
  });

  it("enrols in a cell only the catalog has", async () => {
    const academy = fakeAcademy([catalogOnly()]);
    const result = await academyEnrolHandler(db, {
      cellId: "zam-academy:nur-katalog",
      user: "learner",
      fetch: academy.fetch,
    });
    expect(result).toMatchObject({
      success: true,
      cardsCreated: 26,
      version: "2026.10.1",
    });
  });

  it("updates one held cell to the catalog's newer version", async () => {
    await academyEnrolHandler(db, {
      cellId: "zam-academy:uml",
      user: "learner",
      fetch: offline,
    });
    expect(await installedTileVersion(db, "zam-academy:uml")).toBe(
      String(UML.version),
    );

    const listed = await academyListHandler(db, {
      user: "learner",
      fetch: fakeAcademy([{ ...UML, version: "2099.1.1" }]).fetch,
    });
    expect(
      listed.cells.find((cell) => cell.id === "zam-academy:uml"),
    ).toMatchObject({ held: true, newer: true });

    const update = await academyUpdateHandler(db, {
      cellId: "zam-academy:uml",
      user: "learner",
      fetch: fakeAcademy([{ ...UML, version: "2099.1.1" }]).fetch,
    });
    expect(update).toMatchObject({
      updated: true,
      from: String(UML.version),
      version: "2099.1.1",
    });
  });

  it("never takes an older bundle in place of a catalog version it could not download", async () => {
    const broken = { "/uml/cell.json": { status: 500 } };
    await expect(
      academyEnrolHandler(db, {
        cellId: "zam-academy:uml",
        user: "learner",
        fetch: fakeAcademy([{ ...UML, version: "2099.1.1" }], broken).fetch,
      }),
    ).rejects.toThrow();
    expect(await tilesInstalled()).toBe(0);

    // At the catalog's own version, the bundle stands in.
    rmSync(academyCacheDir(), { recursive: true, force: true });
    const result = await academyEnrolHandler(db, {
      cellId: "zam-academy:uml",
      user: "learner",
      fetch: fakeAcademy([UML], broken).fetch,
    });
    expect(result.version).toBe(String(UML.version));
  });

  it("lists the version „Aufnehmen“ installs when the bundle is ahead", async () => {
    const academy = fakeAcademy([{ ...UML, version: "2000.1.1" }]);
    const list = await academyListHandler(db, {
      user: "learner",
      fetch: academy.fetch,
    });
    // By id: more than one academy cell is bundled.
    const uml = list.cells.find((cell) => cell.id === "zam-academy:uml");
    expect(uml?.version).toBe(String(UML.version));
    const result = await academyEnrolHandler(db, {
      cellId: "zam-academy:uml",
      user: "learner",
      fetch: academy.fetch,
    });
    expect(result.version).toBe(uml?.version);
  });

  it("installs the version the catalog lists, not a build it dropped", async () => {
    // An earlier check cached 2099; the catalog has since gone back to 2098.
    await academyListHandler(db, {
      user: "learner",
      fetch: fakeAcademy([catalogOnly("2099.1.1")]).fetch,
    });
    await academyListHandler(db, {
      user: "learner",
      fetch: fakeAcademy([catalogOnly("2098.1.1")]).fetch,
    });
    const result = await academyEnrolHandler(db, {
      cellId: "zam-academy:nur-katalog",
      user: "learner",
      fetch: offline,
    });
    expect(result.version).toBe("2098.1.1");
  });

  it("never lets the agent tools update a held cell or reach the network", async () => {
    await enrolBundledCell(db, "learner", "zam-academy:uml");
    // The learner checked the catalog: a newer version is cached.
    await academyListHandler(db, {
      user: "learner",
      fetch: fakeAcademy([{ ...UML, version: "2099.1.1" }, catalogOnly()])
        .fetch,
    });

    await enrolBundledCellHandler(db, {
      cellId: "zam-academy:uml",
      user: "learner",
    });
    expect(await installedTileVersion(db, "zam-academy:uml")).toBe(
      String(UML.version),
    );

    // A cell from the learner's check can be enrolled, from the cache alone.
    const listed = await listBundledCellsHandler(db, { user: "learner" });
    expect(listed.cells.map((cell) => cell.id)).toContain(
      "zam-academy:nur-katalog",
    );
    const enrolled = await enrolBundledCellHandler(db, {
      cellId: "zam-academy:nur-katalog",
      user: "learner",
    });
    // Its items are the UML items under another id here, so they are reused.
    expect(enrolled.success).toBe(true);
    expect(await installedTileVersion(db, "zam-academy:nur-katalog")).toBe(
      "2026.10.1",
    );
  });

  it("refuses a catalog-only cell in a team library", async () => {
    const team = Object.create(db, {
      dialect: { value: "postgres" },
    }) as Database;
    await expect(
      enrolBundledCell(team, "learner", "zam-academy:nur-katalog", {
        resolveTile: () => catalogOnly(),
      }),
    ).rejects.toThrow(/team library/);
  });
});

describe("only the learner's actions can fetch", () => {
  const source = (path: string) =>
    readFileSync(join(process.cwd(), path), "utf8");

  it("keeps the catalog client out of MCP and the shared handlers", () => {
    for (const path of [
      "src/cli/commands/mcp.ts",
      "src/cli/bridge-handlers.ts",
      "src/cli/academy/cache.ts",
    ]) {
      expect(source(path), path).not.toMatch(
        /academy\/(catalog-client|handlers)/,
      );
      expect(source(path), path).not.toMatch(/from "\.\/catalog-client/);
    }
  });

  it("keeps the academy commands off the Studio panel bridge", async () => {
    const { STUDIO_BRIDGE_COMMANDS } = await import(
      "../../src/cli/commands/mcp.js"
    );
    expect(
      Object.keys(STUDIO_BRIDGE_COMMANDS).filter((name) =>
        name.startsWith("academy"),
      ),
    ).toEqual([]);
  });
});
