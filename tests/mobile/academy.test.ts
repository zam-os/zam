import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type AcademyFetch,
  fetchMobileAcademyCatalog,
  fetchMobileAcademyCell,
} from "../../mobile/src/academy.js";
import {
  type BundledTile,
  enrolBundledCell,
  type EnrolBundledCellProgress,
  getBundledCellTile,
  installedTileVersion,
  openDatabase,
} from "../../src/kernel/index.js";

/** ADR 2026-10-19 D4, D5: the ZAM Academy on Mobile. */

const UML = getBundledCellTile("zam-academy:uml") as BundledTile;
/** The UML cell under an id no bundle has: a cell only the catalog has. */
const CATALOG_ONLY: BundledTile = {
  ...structuredClone(UML),
  tile_id: "zam-academy:nur-katalog",
};
const catalogOnlyBytes = Buffer.from(JSON.stringify(CATALOG_ONLY));

function catalogFor(body: Buffer, version = String(CATALOG_ONLY.version)) {
  return JSON.stringify({
    schema: 1,
    cells: [
      {
        id: "zam-academy:nur-katalog",
        title: "Nur im Katalog",
        description: "",
        language: "de",
        version,
        items: 26,
        app: "/nur-katalog/",
        cell: "/nur-katalog/cell.json",
        sha256: createHash("sha256").update(body).digest("hex"),
      },
    ],
  });
}

function fakeFetch(routes: Record<string, string | Buffer>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl: AcademyFetch = async (url, init) => {
    calls.push({ url, init });
    const body = routes[new URL(url).pathname];
    return body === undefined
      ? new Response("missing", { status: 404 })
      : new Response(body, { status: 200 });
  };
  return { fetchImpl, calls };
}

describe("Mobile academy client", () => {
  it("reads catalog and cell with no redirects and no cookies", async () => {
    const { fetchImpl, calls } = fakeFetch({
      "/catalog.json": catalogFor(catalogOnlyBytes),
      "/nur-katalog/cell.json": catalogOnlyBytes,
    });
    const catalog = await fetchMobileAcademyCatalog(fetchImpl);
    const tile = await fetchMobileAcademyCell(catalog.cells[0], fetchImpl);
    expect(tile.tile_id).toBe("zam-academy:nur-katalog");
    expect(calls.map((call) => call.url)).toEqual([
      "https://academy.zam-os.org/catalog.json",
      "https://academy.zam-os.org/nur-katalog/cell.json",
    ]);
    for (const { init } of calls) {
      expect(init).toMatchObject({ redirect: "error", credentials: "omit" });
      // The timeout also ends a body that stalls halfway.
      expect(init.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it("stops reading a body as soon as it passes the cap", async () => {
    let pulls = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++;
        controller.enqueue(new Uint8Array(64 * 1024));
      },
    });
    const fetchImpl: AcademyFetch = async () =>
      new Response(endless, { status: 200 });
    await expect(fetchMobileAcademyCatalog(fetchImpl)).rejects.toThrow(
      /larger than/,
    );
    // The catalog cap is 256 KiB: five 64 KiB chunks, not the whole body.
    expect(pulls).toBeLessThan(10);
  });

  it("fails on a redirect, whether fetch refuses it or reports it", async () => {
    const refusing: AcademyFetch = async () => {
      throw new TypeError("Failed to fetch: redirect");
    };
    await expect(fetchMobileAcademyCatalog(refusing)).rejects.toThrow(
      /redirect/,
    );

    const followed: AcademyFetch = async () =>
      ({
        ok: true,
        status: 200,
        redirected: true,
        arrayBuffer: async () => new ArrayBuffer(0),
      }) as Response;
    await expect(fetchMobileAcademyCatalog(followed)).rejects.toThrow(
      /redirected/,
    );
  });

  it("fails when the cell does not match the catalog", async () => {
    const { fetchImpl } = fakeFetch({
      "/catalog.json": catalogFor(catalogOnlyBytes),
      "/nur-katalog/cell.json": Buffer.concat([
        catalogOnlyBytes,
        Buffer.from(" "),
      ]),
    });
    const catalog = await fetchMobileAcademyCatalog(fetchImpl);
    await expect(
      fetchMobileAcademyCell(catalog.cells[0], fetchImpl),
    ).rejects.toThrow(/hash/);
  });

  it("enrols the learner in a cell fetched from the catalog", async () => {
    const { fetchImpl } = fakeFetch({
      "/catalog.json": catalogFor(catalogOnlyBytes),
      "/nur-katalog/cell.json": catalogOnlyBytes,
    });
    const catalog = await fetchMobileAcademyCatalog(fetchImpl);
    const tile = await fetchMobileAcademyCell(catalog.cells[0], fetchImpl);

    const dir = mkdtempSync(join(tmpdir(), "zam-mobile-academy-"));
    const db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    try {
      const progress: EnrolBundledCellProgress[] = [];
      const result = await enrolBundledCell(
        db,
        "learner",
        "zam-academy:nur-katalog",
        {
          resolveTile: (id) => (id === tile.tile_id ? tile : undefined),
          onProgress: (event) => progress.push(event),
        },
      );
      expect(progress[0]).toEqual({ phase: "installing", done: 0, total: 26 });
      expect(progress.at(-1)).toEqual({
        phase: "enrolling",
        done: 26,
        total: 26,
      });
      expect(result.cardsCreated).toBe(26);
      expect(await installedTileVersion(db, "zam-academy:nur-katalog")).toBe(
        String(CATALOG_ONLY.version),
      );
    } finally {
      await db.close();
      rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
    }
  });
});

describe("Mobile academy wiring", () => {
  const file = (path: string) =>
    readFileSync(join(process.cwd(), path), "utf-8");

  it("offers „Aus der ZAM Academy“ beside the curriculum", () => {
    expect(file("mobile/index.html")).toMatch(
      /id="open-academy"[\s\S]*?data-i18n="academy_menu"/,
    );
    const main = file("mobile/src/main.ts");
    expect(main).toContain('element<HTMLButtonElement>("open-academy")');
    expect(main).toContain("void openMobileAcademy();");
  });

  it("installs only on the learner's tap, with the fetched tile", () => {
    const main = file("mobile/src/main.ts");
    expect(main).toContain("resolveTile: (id) => academyTiles.get(id)");
    expect(main).toContain("onProgress: progress.update");
    expect(main).toContain("createCellImportProgress");
  });

  it("keeps a cell whose download failed, and fetches it again on the tap", () => {
    const main = file("mobile/src/main.ts");
    expect(main).toContain("failed.set(entry.id, errorMessage(error))");
    expect(main).toContain('tf("academy_cell_failed", { version, error })');
    expect(main).toMatch(
      /academyTiles\.set\(id, await fetchMobileAcademyCell\(entry\)\);\s*\} catch \(error\) \{\s*if \(!bundleStandsIn\(entry, BUNDLED_TILES\[id\]\?\.version\)\) throw error;/,
    );
  });

  it("fetches the cells in parallel, so one stalled cell cannot hold the screen", () => {
    const main = file("mobile/src/main.ts");
    expect(main).toMatch(
      /await Promise\.all\(\s*entries\.map\(async \(entry\) =>/,
    );
  });
});
