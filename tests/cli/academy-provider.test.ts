/**
 * Private Academy providers from the CLI side (ADR 2026-11-25, D2–D5): the
 * provider file, the learner's confirmation, fetching with a token that goes
 * nowhere else, the per-provider cache, and enrolment inside the namespace.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { academyCacheDir } from "../../src/cli/academy/cache.js";
import type { AcademyFetchOptions } from "../../src/cli/academy/catalog-client.js";
import { academyListHandler } from "../../src/cli/academy/handlers.js";
import {
  academyProviderAddHandler,
  academyProviderCheckHandler,
  academyProviderListHandler,
  academyProviderRemoveHandler,
  providerEnrolHandler,
  providerListHandler,
  providerUpdateHandler,
} from "../../src/cli/academy/provider-handlers.js";
import { executeBridgeCommandJson } from "../../src/cli/commands/bridge.js";
import type { SafeTransport } from "../../src/cli/net/safe-fetch.js";
import {
  type Database,
  type KvtTile,
  listConfirmedProviders,
  openDatabase,
} from "../../src/kernel/index.js";

const ORIGIN = "https://provider.example";
const TENANT = "00000000-0000-0000-0000-000000000000";
const API = "11111111-1111-1111-1111-111111111111";
const FIXTURES = resolve(__dirname, "../fixtures/curriculum");

function providerTile(version = "2026.11.1"): KvtTile {
  const tile = JSON.parse(
    readFileSync(
      join(FIXTURES, "de-by-realschule-optik-kvt.json"),
      "utf-8",
    ).replaceAll("01K3X9A7R4B8C1D2E3F4G5", "01K3X9A7R4B8C1D2E3F4P5"),
  ) as KvtTile;
  tile.tile_id = "example-provider:optik";
  tile.version = version;
  tile.title = "Optik";
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

function sha(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

interface Route {
  status?: number;
  body?: Buffer;
  headers?: Record<string, string>;
}

interface Seen {
  url: string;
  authorization: string | undefined;
}

/** A fake private provider; records every request with its Authorization. */
function fakeProvider(
  options: {
    tiles?: KvtTile[];
    file?: Record<string, unknown>;
    routes?: Record<string, Route>;
    cells?: Array<Record<string, unknown>>;
  } = {},
) {
  const tiles = options.tiles ?? [providerTile()];
  const routes: Record<string, Route> = { ...options.routes };
  routes["/zam-provider.json"] ??= {
    body: Buffer.from(
      JSON.stringify(
        options.file ?? {
          schema: 1,
          id: "example-provider",
          title: "Example Academy",
          publisher: "Example training department",
          auth: { kind: "entra-cli", tenant: TENANT, api: API },
          feedback: "https://feedback.example/new?tile={tile}&item={item}",
        },
      ),
    ),
  };
  const cells =
    options.cells ??
    tiles.map((tile) => {
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
        preview: true,
      };
    });
  routes["/catalog.json"] ??= {
    body: Buffer.from(JSON.stringify({ schema: 1, cells })),
  };
  routes["/academy.json"] ??= {
    body: Buffer.from(
      JSON.stringify({
        schema: 1,
        goal: "",
        schulen: [
          { id: "berufsschule-it", name: "Berufsschule", from: 10, to: 12 },
        ],
        bereiche: [{ id: "it", name: "IT", glyph: "</>" }],
        faecher: [
          {
            id: "it-systeme",
            name: "IT-Systeme",
            bereich: "it",
            glyph: "LAN",
            hue: 200,
            from: 10,
          },
        ],
        fachverbunde: [],
        pakete: [
          {
            id: "optik",
            app: "optik",
            title: "Optik",
            fach: "it-systeme",
            grade: 10,
            school: "berufsschule-it",
            lessons: 4,
            gebiete: [],
            desc: "",
          },
        ],
      }),
    ),
  };
  const seen: Seen[] = [];
  const transport: SafeTransport = async (url, _addresses, opts) => {
    seen.push({ url: url.href, authorization: opts.headers.Authorization });
    const route = url.origin === ORIGIN ? routes[url.pathname] : undefined;
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
      statusText: route.status && route.status !== 200 ? "Error" : "OK",
      headers: route.headers ?? {},
      body: route.body ?? Buffer.from(""),
    };
  };
  const fetch: AcademyFetchOptions = {
    transport,
    resolve: async () => [{ address: "20.50.2.1", family: 4 }],
  };
  const tokenCalls: Array<[string, string]> = [];
  const getToken = async (tenant: string, api: string) => {
    tokenCalls.push([tenant, api]);
    return "secret-token";
  };
  return { fetch, seen, getToken, tokenCalls };
}

async function confirm(provider: ReturnType<typeof fakeProvider>) {
  const check = await academyProviderCheckHandler({
    url: `${ORIGIN}/somewhere?x=1`,
    fetch: provider.fetch,
  });
  await academyProviderAddHandler({
    url: ORIGIN,
    sha256: check.sha256,
    fetch: provider.fetch,
  });
  return check;
}

describe("private Academy providers (ADR 2026-11-25)", () => {
  let db: Database;
  let dir: string;

  beforeEach(async () => {
    rmSync(academyCacheDir(), { recursive: true, force: true });
    for (const entry of listConfirmedProviders()) {
      academyProviderRemoveHandler({ id: entry.provider.id });
    }
    dir = mkdtempSync(join(tmpdir(), "zam-provider-cli-"));
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close?.();
    rmSync(dir, { recursive: true, force: true });
  });

  it("checks a provider file without a token and writes nothing", async () => {
    const provider = fakeProvider();
    const check = await academyProviderCheckHandler({
      url: `${ORIGIN}/any/path#x`,
      fetch: provider.fetch,
    });
    expect(check.provider).toEqual({
      id: "example-provider",
      title: "Example Academy",
      publisher: "Example training department",
      origin: ORIGIN,
      host: "provider.example",
      auth: "entra-cli",
      feedbackHost: "feedback.example",
    });
    expect(check.alreadyConfirmed).toBe(false);
    expect(provider.seen).toEqual([
      { url: `${ORIGIN}/zam-provider.json`, authorization: undefined },
    ]);
    expect(listConfirmedProviders()).toEqual([]);
  });

  it("refuses an http address and a reserved provider id", async () => {
    const provider = fakeProvider();
    await expect(
      academyProviderCheckHandler({
        url: "http://provider.example",
        fetch: provider.fetch,
      }),
    ).rejects.toThrow(/Provider origin/);
    const reserved = fakeProvider({
      file: {
        schema: 1,
        id: "zam-academy",
        title: "Fake",
        publisher: "Someone",
        auth: { kind: "none" },
      },
    });
    await expect(
      academyProviderCheckHandler({ url: ORIGIN, fetch: reserved.fetch }),
    ).rejects.toThrow(/reserved/);
  });

  it("adds a provider only with the hash the learner saw", async () => {
    const provider = fakeProvider();
    await expect(
      academyProviderAddHandler({
        url: ORIGIN,
        sha256: "0".repeat(64),
        fetch: provider.fetch,
      }),
    ).rejects.toThrow(/PROVIDER_CHANGED/);
    expect(listConfirmedProviders()).toEqual([]);

    await confirm(provider);
    expect(academyProviderListHandler().providers.map((p) => p.id)).toEqual([
      "example-provider",
    ]);
  });

  it("sends the token only to the provider's catalog, asking az once", async () => {
    const provider = fakeProvider();
    await confirm(provider);
    provider.seen.length = 0;

    const listing = await providerListHandler(db, {
      provider: "example-provider",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    expect(listing.offline).toBe(false);
    expect(listing.cells.map((c) => c.id)).toEqual(["example-provider:optik"]);
    expect(listing.cells[0]).toMatchObject({
      provider: "example-provider",
      appUrl: `${ORIGIN}/optik/`,
      preview: true,
      held: false,
    });
    expect(listing.cells[0].facet.app).toBe("optik");
    expect(provider.tokenCalls).toEqual([[TENANT, API]]);

    for (const request of provider.seen) {
      expect(new URL(request.url).origin).toBe(ORIGIN);
      if (request.url.endsWith("/zam-provider.json")) {
        expect(request.authorization).toBeUndefined();
      } else {
        expect(request.authorization).toBe("Bearer secret-token");
      }
    }
  });

  it("enrols inside the namespace and caches the cell per provider", async () => {
    const provider = fakeProvider();
    await confirm(provider);
    const result = await providerEnrolHandler(db, {
      provider: "example-provider",
      cellId: "example-provider:optik",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    expect(result.cardsCreated).toBeGreaterThan(0);
    expect(result.version).toBe("2026.11.1");
    const row = await db
      .prepare("SELECT app_url, preview FROM installed_tiles WHERE tile_id = ?")
      .get("example-provider:optik");
    expect(row).toEqual({ app_url: `${ORIGIN}/optik/`, preview: 1 });
    expect(
      existsSync(
        join(
          academyCacheDir({ providerId: "example-provider", origin: ORIGIN }),
          "cells",
          "example-provider_optik@2026.11.1.json",
        ),
      ),
    ).toBe(true);

    const listing = await providerListHandler(db, {
      provider: "example-provider",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    expect(listing.cells[0]).toMatchObject({
      held: true,
      heldVersion: "2026.11.1",
    });
  });

  it("updates a held package when the catalog has a newer version", async () => {
    const first = fakeProvider();
    await confirm(first);
    await providerEnrolHandler(db, {
      provider: "example-provider",
      cellId: "example-provider:optik",
      user: "learner",
      fetch: first.fetch,
      getToken: first.getToken,
    });
    const next = fakeProvider({ tiles: [providerTile("2026.11.2")] });
    const updated = await providerUpdateHandler(db, {
      provider: "example-provider",
      cellId: "example-provider:optik",
      user: "learner",
      fetch: next.fetch,
      getToken: next.getToken,
    });
    expect(updated).toMatchObject({
      updated: true,
      from: "2026.11.1",
      version: "2026.11.2",
    });
  });

  it("does not list a catalog entry outside the namespace", async () => {
    const tile = providerTile();
    const body = Buffer.from(JSON.stringify(tile));
    const provider = fakeProvider({
      routes: { "/optik/cell.json": { body } },
      cells: [
        {
          id: "zam-academy:uml",
          title: "UML",
          version: "2026.11.1",
          items: 1,
          app: "/optik/",
          cell: "/optik/cell.json",
          sha256: sha(body),
        },
      ],
    });
    await confirm(provider);
    const listing = await providerListHandler(db, {
      provider: "example-provider",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    expect(listing.offline).toBe(true);
    expect(listing.error).toMatch(/outside the namespace/);
    expect(listing.cells).toEqual([]);
  });

  it("follows no redirect, so the token cannot leave the origin", async () => {
    const provider = fakeProvider({
      routes: {
        "/catalog.json": {
          status: 302,
          headers: { location: "https://evil.example/catalog.json" },
        },
      },
    });
    await confirm(provider);
    const listing = await providerListHandler(db, {
      provider: "example-provider",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    expect(listing.offline).toBe(true);
    expect(provider.seen.some((r) => r.url.includes("evil.example"))).toBe(
      false,
    );
  });

  it("reports a refused login as PROVIDER_ACCESS_DENIED", async () => {
    const provider = fakeProvider({
      routes: { "/catalog.json": { status: 403 } },
    });
    await confirm(provider);
    await expect(
      providerListHandler(db, {
        provider: "example-provider",
        user: "learner",
        fetch: provider.fetch,
        getToken: provider.getToken,
      }),
    ).rejects.toThrow(/PROVIDER_ACCESS_DENIED: Example Academy/);
  });

  it("asks no token from a provider without login", async () => {
    const provider = fakeProvider({
      file: {
        schema: 1,
        id: "example-provider",
        title: "Open Example",
        publisher: "Example",
        auth: { kind: "none" },
      },
    });
    await confirm(provider);
    await providerListHandler(db, {
      provider: "example-provider",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    expect(provider.tokenCalls).toEqual([]);
    expect(provider.seen.every((r) => r.authorization === undefined)).toBe(
      true,
    );
  });

  it("reports a changed provider file and keeps using the confirmed one", async () => {
    await confirm(fakeProvider());
    const changed = fakeProvider({
      file: {
        schema: 1,
        id: "example-provider",
        title: "Example Academy",
        publisher: "Example training department",
        auth: { kind: "entra-cli", tenant: TENANT, api: TENANT },
        feedback: "https://other.example/{tile}",
      },
    });
    const listing = await providerListHandler(db, {
      provider: "example-provider",
      user: "learner",
      fetch: changed.fetch,
      getToken: changed.getToken,
    });
    expect(listing.providerChanged?.fields).toEqual(["auth", "feedback"]);
    // The token was still asked for the confirmed API.
    expect(changed.tokenCalls).toEqual([[TENANT, API]]);
  });

  it("refuses an unknown provider, a foreign cell and a team library", async () => {
    const provider = fakeProvider();
    await expect(
      providerListHandler(db, { provider: "nobody", fetch: provider.fetch }),
    ).rejects.toThrow(/PROVIDER_NOT_CONFIRMED/);
    await confirm(provider);
    await expect(
      providerEnrolHandler(db, {
        provider: "example-provider",
        cellId: "zam-academy:uml",
        fetch: provider.fetch,
      }),
    ).rejects.toThrow(/not a package of example-provider/);
    await expect(
      providerEnrolHandler({ dialect: "postgres" } as unknown as Database, {
        provider: "example-provider",
        cellId: "example-provider:optik",
        fetch: provider.fetch,
      }),
    ).rejects.toThrow(/zam team install-cell/);
  });

  it("answers the provider bridge commands in JSON, errors included", async () => {
    await expect(
      executeBridgeCommandJson("academy-provider-list", []),
    ).resolves.toEqual({ success: true, providers: [] });
    await expect(
      executeBridgeCommandJson("academy-provider-remove", ["nobody"]),
    ).resolves.toEqual({ success: true, id: "nobody", removed: false });
    await expect(
      executeBridgeCommandJson("academy-list", ["--provider", "nobody"]),
    ).rejects.toThrow(/PROVIDER_NOT_CONFIRMED/);
    await expect(
      executeBridgeCommandJson("academy-provider-check", [
        "http://provider.example",
      ]),
    ).rejects.toThrow(/Provider origin/);
  });

  it("removes a provider with its cache and leaves the public Academy alone", async () => {
    const provider = fakeProvider();
    await confirm(provider);
    await providerListHandler(db, {
      provider: "example-provider",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    const cacheDir = academyCacheDir({
      providerId: "example-provider",
      origin: ORIGIN,
    });
    expect(existsSync(join(cacheDir, "catalog.json"))).toBe(true);

    const offline: AcademyFetchOptions = {
      transport: async () => {
        throw new Error("network down");
      },
      resolve: async () => [{ address: "185.199.108.153", family: 4 }],
    };
    const publicList = await academyListHandler(db, {
      user: "learner",
      fetch: offline,
    });
    expect(
      publicList.cells.some((cell) => cell.id.startsWith("example-provider:")),
    ).toBe(false);

    expect(academyProviderRemoveHandler({ id: "example-provider" })).toEqual({
      success: true,
      id: "example-provider",
      removed: true,
    });
    expect(existsSync(cacheDir)).toBe(false);
    expect(listConfirmedProviders()).toEqual([]);
  });
});
