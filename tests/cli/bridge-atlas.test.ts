import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STUDIO_BRIDGE_ALLOWED_COMMANDS } from "../../src/cli/commands/mcp.js";
import {
  createToken,
  ensureCard,
  installKvtTile,
  openDatabase,
  readAtlas,
  setSetting,
  updateCard,
  WELTWISSEN_LENS,
} from "../../src/kernel/index.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";
import { materialiseKvtCards } from "../../src/kernel/library/kvt-attach.js";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("zam bridge atlas commands", () => {
  let tempHome: string;
  let tempCwd: string;
  let dbPath: string;
  let cliPath: string;
  let physikTokenIds: string[];

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-atlas-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-atlas-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(
      join(dataDir, "config.json"),
      JSON.stringify({
        activeWorkspaceId: "test-workspace",
        workspaces: [
          {
            id: "test-workspace",
            kind: "personal",
            path: tempCwd,
            label: "Test Workspace",
          },
        ],
      }),
      "utf8",
    );
    dbPath = join(dataDir, "zam.db");

    const db = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "user.id", "thomas");
    const tile = listBundledTiles().find((t) =>
      t.atoms.some((a) => a.domain.startsWith("physik/optik")),
    );
    if (!tile) throw new Error("no bundled optics tile");
    await installKvtTile(db, tile);
    await materialiseKvtCards(
      db,
      "thomas",
      tile.atoms.map((a) => a.id),
    );
    // Every physics card is due; one chemistry card is due elsewhere.
    const rows = (await db
      .prepare(
        `SELECT c.id, c.token_id FROM cards c JOIN tokens t ON t.id = c.token_id
          WHERE c.user_id = ? AND t.atom_id IS NOT NULL`,
      )
      .all("thomas")) as Array<{ id: string; token_id: string }>;
    physikTokenIds = rows.map((r) => r.token_id);
    const now = Date.now();
    for (const row of rows) {
      await updateCard(db, row.id, {
        state: "review",
        stability: 10,
        due_at: new Date(now - DAY_MS).toISOString(),
        last_review_at: new Date(now - 12 * DAY_MS).toISOString(),
      });
    }
    const chemie = await createToken(db, {
      slug: "eigene-chemie-notiz",
      concept: "Stoffe an Farbe erkennen",
      domain: "chemie/stoffe",
    });
    const chemieCard = await ensureCard(db, chemie.id, "thomas");
    await updateCard(db, chemieCard.id, {
      state: "review",
      stability: 10,
      due_at: new Date(now - DAY_MS).toISOString(),
      last_review_at: new Date(now - 12 * DAY_MS).toISOString(),
    });
    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function env() {
    return { ...process.env, HOME: tempHome, USERPROFILE: tempHome };
  }

  function runCliJson(args: string[]): any {
    return JSON.parse(
      execFileSync("node", [cliPath, ...args], {
        cwd: tempCwd,
        env: env(),
        input: "",
        encoding: "utf8",
      }),
    );
  }

  function runCliError(args: string[]): any {
    try {
      execFileSync("node", [cliPath, ...args], {
        cwd: tempCwd,
        env: env(),
        input: "",
        encoding: "utf8",
      });
      return null;
    } catch (err) {
      return JSON.parse(String((err as { stdout?: string }).stdout ?? ""));
    }
  }

  async function atlasRowCount(): Promise<number> {
    const db = await openDatabase({
      dbPath,
      initialize: false,
      useConfiguredCloud: false,
    });
    try {
      let total = 0;
      for (const table of [
        "atlas_lenses",
        "atlas_regions",
        "atlas_domain_aliases",
        "atlas_members",
        "atlas_islands",
        "atlas_land",
      ]) {
        const row = (await db
          .prepare(`SELECT COUNT(*) AS n FROM ${table}`)
          .get()) as { n: number };
        total += Number(row.n);
      }
      return total;
    } finally {
      await db.close();
    }
  }

  it("switches the alpha on and off on this machine only", () => {
    expect(runCliJson(["bridge", "atlas-feature"]).enabled).toBe(false);
    expect(runCliJson(["bridge", "atlas-feature", "--enable"]).enabled).toBe(
      true,
    );
    const config = JSON.parse(
      readFileSync(join(tempHome, ".zam", "config.json"), "utf8"),
    );
    expect(config.atlas).toEqual({ enabled: true });
    expect(runCliJson(["bridge", "atlas-feature", "--disable"]).enabled).toBe(
      false,
    );
    expect(
      runCliError(["bridge", "atlas-feature", "--enable", "--disable"]).error,
    ).toContain("either");
  });

  it("keeps every atlas command away from the Studio panel bridge", () => {
    for (const command of [
      "atlas-feature",
      "atlas-read",
      "atlas-settle",
      "atlas-prefs",
    ]) {
      expect(STUDIO_BRIDGE_ALLOWED_COMMANDS.has(command), command).toBe(false);
    }
  });

  it("reads without writing, then settles once", async () => {
    expect(await atlasRowCount()).toBe(0);
    const view = runCliJson(["bridge", "atlas-read", "--lens", "weltwissen"]);
    expect(await atlasRowCount()).toBe(0);

    expect(view.success).toBe(true);
    expect(view.lens.kind).toBe("weltwissen");
    expect(view.settle.mayWrite).toBe(true);
    expect(view.settle.pending).toBeGreaterThan(0);
    expect(
      view.regions.every((r: { provisional: boolean }) => r.provisional),
    ).toBe(true);
    expect(view.units.length).toBeGreaterThan(1);
    const own = view.units.filter((u: { own: boolean }) => u.own);
    expect(own).toHaveLength(1);
    for (const unit of view.units) {
      expect(unit.condition).not.toBeNull();
      expect(unit.due).toBeGreaterThan(0);
    }
    expect(view.own.dueByRegion["natur.physik"]).toBeGreaterThan(0);
    expect(view.own.dueByRegion.natur).toBeGreaterThan(
      view.own.dueByRegion["natur.physik"],
    );
    const physik = view.regions.find(
      (r: { key: string }) => r.key === "natur.physik",
    );
    expect(physik.hueKey).toBe("physik");
    const optik = view.regions.find(
      (r: { key: string }) => r.key === "natur.physik.optik",
    );
    expect(optik.hueKey).toBe("physik");
    const placed = view.land.filter((h: { unit: string | null }) => h.unit);
    expect(placed).toHaveLength(view.units.length);

    const settled = runCliJson([
      "bridge",
      "atlas-settle",
      "--lens",
      "weltwissen",
    ]);
    expect(settled.success).toBe(true);
    expect(settled.landWritten).toBeGreaterThan(0);
    expect(await atlasRowCount()).toBeGreaterThan(0);

    const again = runCliJson(["bridge", "atlas-read", "--lens", "weltwissen"]);
    expect(again.settle.pending).toBe(0);
    expect(
      again.islands.every((i: { provisional: boolean }) => !i.provisional),
    ).toBe(true);
    // The provisional land was exactly what settle wrote.
    expect(again.land).toEqual(view.land);
  });

  it("stores lens, home and Neue Inhalte zeigen per learner", () => {
    const prefs = runCliJson([
      "bridge",
      "atlas-prefs",
      "--lens",
      "weltwissen",
      "--home",
      "natur.physik.optik",
      "--show-new",
      "on",
    ]);
    expect(prefs.lens).toBe("weltwissen");
    expect(prefs.showNew).toBe(true);
    expect(prefs.home.weltwissen).toEqual([
      "natur",
      "natur.physik",
      "natur.physik.optik",
    ]);
    expect(runCliJson(["bridge", "atlas-read"]).home).toBe(
      "natur.physik.optik",
    );

    expect(
      runCliError(["bridge", "atlas-prefs", "--home", "gibt.es.nicht"]).error,
    ).toContain("No region");
    expect(
      runCliError(["bridge", "atlas-prefs", "--show-new", "maybe"]).error,
    ).toContain("on or off");
    expect(
      runCliError(["bridge", "atlas-read", "--lens", "zoo"]).error,
    ).toContain("Unknown atlas lens");
    expect(
      runCliJson(["bridge", "atlas-prefs", "--home", ""]).home.weltwissen,
    ).toBeUndefined();
  });

  it("reviews one region: its due cards only, no new cards", () => {
    const all = runCliJson(["bridge", "get-reviews"]);
    const region = runCliJson([
      "bridge",
      "get-reviews",
      "--atlas-region",
      "natur.physik",
    ]);
    expect(all.cards.length).toBeGreaterThan(region.cards.length);
    expect(region.cards.length).toBe(physikTokenIds.length);
    for (const card of region.cards) {
      expect(physikTokenIds).toContain(card.tokenId);
      expect(card.state).not.toBe("new");
    }
    const none = runCliJson([
      "bridge",
      "get-reviews",
      "--atlas-region",
      "sprache",
    ]);
    expect(none.cards).toEqual([]);
  });

  it("falls back to the nearest surviving ancestor of a stored home", async () => {
    const db = await openDatabase({
      dbPath,
      initialize: false,
      useConfiguredCloud: false,
    });
    try {
      const view = await readAtlas(db, {
        userId: "thomas",
        lens: WELTWISSEN_LENS,
        homePath: ["natur", "natur.physik", "natur.physik.verschwunden"],
      });
      expect(view.home).toBe("natur.physik");
      const gone = await readAtlas(db, {
        userId: "thomas",
        lens: WELTWISSEN_LENS,
        homePath: ["verschwunden"],
      });
      expect(gone.home).toBeNull();
    } finally {
      await db.close();
    }
  });
});
