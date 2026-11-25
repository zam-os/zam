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
import { providerFeedbackFor } from "../../src/cli/academy/feedback.js";
import { academyListHandler } from "../../src/cli/academy/handlers.js";
import {
  academyProviderAddHandler,
  academyProviderCheckHandler,
  academyProviderListHandler,
  academyProviderRemoveHandler,
  enrolInstalledHandler,
  installedProviderTilesHandler,
  providerEnrolHandler,
  providerInstallForLibraryHandler,
  providerListHandler,
  providerUpdateHandler,
} from "../../src/cli/academy/provider-handlers.js";
import {
  enrolBundledCellHandler,
  getReview,
  listBundledCellsHandler,
} from "../../src/cli/bridge-handlers.js";
import { executeBridgeCommandJson } from "../../src/cli/commands/bridge.js";
import { EntraNotAssignedError } from "../../src/cli/db/entra-cli.js";
import type { SafeTransport } from "../../src/cli/net/safe-fetch.js";
import {
  type Database,
  installKvtTile,
  type KvtTile,
  listConfirmedProviders,
  openDatabase,
  reviewSuppressedOrigins,
} from "../../src/kernel/index.js";

/**
 * The SQLite library dressed as a team library: PostgreSQL dialect, and the
 * curator check answered by `curator`. The SQL itself still runs on SQLite;
 * the real roles and grants are covered by tests/kernel/postgres-team.test.ts.
 */
function asTeamLibrary(
  db: Database,
  curator: boolean,
  learner = "learner",
): Database {
  const answer = (row: Record<string, unknown>) => ({
    get: async () => row,
    all: async () => [row],
    run: async () => ({}),
  });
  return new Proxy(db, {
    get(target, prop) {
      if (prop === "dialect") return "postgres";
      if (prop === "prepare") {
        return (sql: string) =>
          sql.includes("pg_has_role")
            ? answer({ curator })
            : sql.includes("current_learner_id()")
              ? answer({ role: learner, learner })
              : target.prepare(sql);
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as Database;
}

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

  it("reports an account Entra refuses (not assigned) as PROVIDER_ACCESS_DENIED, not a sign-in", async () => {
    const provider = fakeProvider();
    await confirm(provider);
    const error = await providerListHandler(db, {
      provider: "example-provider",
      user: "learner",
      fetch: provider.fetch,
      getToken: async () => {
        throw new EntraNotAssignedError();
      },
    }).catch((e) => e);
    expect(String(error.message)).toMatch(
      /^PROVIDER_ACCESS_DENIED: Example Academy .*Ask /,
    );
    // Without a token nothing went to the provider beyond the provider file.
    expect(provider.seen.some((r) => r.url.endsWith("/catalog.json"))).toBe(
      false,
    );
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

  it("builds the report link from tile, item and version only (D8)", async () => {
    const provider = fakeProvider();
    await confirm(provider);
    await providerEnrolHandler(db, {
      provider: "example-provider",
      cellId: "example-provider:optik",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    const itemId = "01K3X9A7R4B8C1D2E3F4P5H001";
    expect(await providerFeedbackFor(db, itemId)).toBe(
      `https://feedback.example/new?tile=example-provider%3Aoptik&item=${itemId}`,
    );
    // No report link for items outside a provider tile.
    expect(await providerFeedbackFor(db, "01K3X9A7R4B8C1D2E3F4G5H001")).toBe(
      null,
    );

    // get-review hands it to a rendering surface, and only to one.
    const withMedia = await getReview(db, {
      user: "learner",
      includeMedia: true,
      noResolve: true,
      noDynamicQuestion: true,
    });
    expect(
      (withMedia as { card?: { feedbackUrl?: string } }).card?.feedbackUrl,
    ).toContain("tile=example-provider%3Aoptik");
    const plain = await getReview(db, {
      user: "learner",
      noResolve: true,
      noDynamicQuestion: true,
    });
    expect(
      (plain as { card?: { feedbackUrl?: string } }).card?.feedbackUrl,
    ).toBeUndefined();

    // Without the provider on this machine there is nothing to offer.
    academyProviderRemoveHandler({ id: "example-provider" });
    expect(await providerFeedbackFor(db, itemId)).toBeNull();
  });

  it("lets a curator install for a team library, and nobody else (D7)", async () => {
    const provider = fakeProvider();
    await confirm(provider);
    const asCurator = asTeamLibrary(db, true);
    const asMember = asTeamLibrary(db, false);

    // In a team library the rows offer the curator's install, not „Aufnehmen“.
    const before = await providerListHandler(asCurator, {
      provider: "example-provider",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    expect(before).toMatchObject({ teamLibrary: true, curator: true });
    expect(before.cells[0]).toMatchObject({ libraryAction: "install", held: false });
    const memberView = await providerListHandler(asMember, {
      provider: "example-provider",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    expect(memberView.cells[0].libraryAction).toBe("curator-only");

    await expect(
      providerInstallForLibraryHandler(asMember, {
        cellId: "example-provider:optik",
        fetch: provider.fetch,
        getToken: provider.getToken,
      }),
    ).rejects.toThrow(/CURATOR_REQUIRED/);
    await expect(
      providerInstallForLibraryHandler(db, {
        cellId: "example-provider:optik",
        fetch: provider.fetch,
        getToken: provider.getToken,
      }),
    ).rejects.toThrow(/Only a team library/);

    const installed = await providerInstallForLibraryHandler(asCurator, {
      cellId: "example-provider:optik",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    expect(installed).toMatchObject({ installed: true, version: "2026.11.1" });
    // Installing for the library hands out no cards, to anyone.
    const cards = (await db
      .prepare("SELECT COUNT(*) AS n FROM cards")
      .get()) as { n: number };
    expect(Number(cards.n)).toBe(0);
    expect(
      (
        await providerInstallForLibraryHandler(asCurator, {
          cellId: "example-provider:optik",
          fetch: provider.fetch,
          getToken: provider.getToken,
        })
      ).installed,
    ).toBe(false);
    const after = await providerListHandler(asCurator, {
      provider: "example-provider",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    expect(after.cells[0].libraryAction).toBe("installed");
  });

  it("lets members enrol from the library alone, and offers new items after an update (D7)", async () => {
    const provider = fakeProvider();
    await confirm(provider);
    await providerInstallForLibraryHandler(asTeamLibrary(db, true), {
      cellId: "example-provider:optik",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    // The member has not confirmed the provider on their machine.
    academyProviderRemoveHandler({ id: "example-provider" });
    const member = asTeamLibrary(db, false, "member");

    const listed = await installedProviderTilesHandler(member, { user: "member" });
    expect(listed).toMatchObject({ teamLibrary: true, curator: false });
    expect(listed.tiles[0]).toMatchObject({
      tileId: "example-provider:optik",
      appUrl: `${ORIGIN}/optik/`,
      held: false,
    });
    // A review never fetches these lessons, even without the provider here.
    expect(reviewSuppressedOrigins().has(ORIGIN)).toBe(true);

    const enrolled = await enrolInstalledHandler(member, {
      cellId: "example-provider:optik",
      user: "member",
    });
    expect(enrolled.cardsCreated).toBeGreaterThan(0);

    // A curator installs a newer version with one more item.
    const next = providerTile("2026.11.2");
    next.atoms[0].practice_items.push({
      ...next.atoms[0].practice_items[0],
      id: "01K3X9A7R4B8C1D2E3F4P5N001",
      slug: "p-optik-new-item",
    });
    await installKvtTile(db, next, { namespace: "example-provider" });
    const stale = await installedProviderTilesHandler(member, { user: "member" });
    expect(stale.tiles[0]).toMatchObject({ held: true, version: "2026.11.2" });
    expect(stale.tiles[0].newItems).toBeGreaterThan(0);
    const again = await enrolInstalledHandler(member, {
      cellId: "example-provider:optik",
      user: "member",
    });
    expect(again.cardsCreated).toBeGreaterThan(0);

    await expect(
      enrolInstalledHandler(member, { cellId: "zam-academy:uml", user: "member" }),
    ).rejects.toThrow(/not a provider package/);
  });

  it("shows agents provider cells from the cache only, and enrols without a download (D9)", async () => {
    const provider = fakeProvider();
    await confirm(provider);
    // The learner opened the provider once: catalog cached, cell not yet.
    await providerListHandler(db, {
      provider: "example-provider",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    const requests = provider.seen.length;

    const listed = await listBundledCellsHandler(db, { user: "learner" });
    const row = listed.cells.find((cell) => cell.id === "example-provider:optik");
    expect(row).toMatchObject({
      provider: { id: "example-provider", title: "Example Academy" },
      requiresLearnerEnrol: true,
      installed: false,
    });
    await expect(
      enrolBundledCellHandler(db, {
        cellId: "example-provider:optik",
        user: "learner",
      }),
    ).rejects.toThrow(/not downloaded locally yet/);

    // After the learner's own „Aufnehmen“ the cell is cached and installed;
    // an agent enrols another learner from the library.
    await providerEnrolHandler(db, {
      provider: "example-provider",
      cellId: "example-provider:optik",
      user: "learner",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    const afterRequests = provider.seen.length;
    const other = await enrolBundledCellHandler(db, {
      cellId: "example-provider:optik",
      user: "other",
    });
    expect(other).toMatchObject({ success: true, installed: true });
    expect(other.cardsCreated).toBeGreaterThan(0);
    const again = await listBundledCellsHandler(db, { user: "other" });
    expect(
      again.cells.find((cell) => cell.id === "example-provider:optik"),
    ).toMatchObject({ enrolled: true, provider: { id: "example-provider" } });

    // The agent calls made no request at all.
    expect(provider.seen.length).toBe(afterRequests);
    expect(afterRequests).toBeGreaterThan(requests);
  });

  it("lets an agent enrol a team-library member in what a curator installed (D7, D9)", async () => {
    const provider = fakeProvider();
    await confirm(provider);
    await providerInstallForLibraryHandler(asTeamLibrary(db, true), {
      cellId: "example-provider:optik",
      fetch: provider.fetch,
      getToken: provider.getToken,
    });
    academyProviderRemoveHandler({ id: "example-provider" });
    const member = asTeamLibrary(db, false, "member");
    const listed = await listBundledCellsHandler(member, { user: "member" });
    const row = listed.cells.find((cell) => cell.id === "example-provider:optik");
    expect(row).toMatchObject({ installedInLibrary: true, enrolled: false });
    // Without the provider's cache the library still knows the tile's atoms.
    expect(row?.atomCount).toBeGreaterThan(0);
    expect(row?.inScopeAtomIds).toHaveLength(row?.atomCount ?? -1);
    const enrolled = await enrolBundledCellHandler(member, {
      cellId: "example-provider:optik",
      user: "member",
    });
    expect(enrolled.cardsCreated).toBeGreaterThan(0);
    await expect(
      enrolBundledCellHandler(member, {
        cellId: "example-provider:other",
        user: "member",
      }),
    ).rejects.toThrow(/A curator installs it first/);
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
