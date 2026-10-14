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
import { fitBelow } from "../../src/cli/atlas.js";
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

  it("switches the 3D Wissensnetz alpha on and off on this machine only", () => {
    expect(runCliJson(["bridge", "graph3d-feature"]).enabled).toBe(false);
    expect(runCliJson(["bridge", "graph3d-feature", "--enable"]).enabled).toBe(
      true,
    );
    const config = JSON.parse(
      readFileSync(join(tempHome, ".zam", "config.json"), "utf8"),
    );
    expect(config.graph3d).toEqual({ enabled: true });
    expect(runCliJson(["bridge", "graph3d-feature", "--disable"]).enabled).toBe(
      false,
    );
    expect(
      runCliError(["bridge", "graph3d-feature", "--enable", "--disable"]).error,
    ).toContain("either");
  });

  it("gives the Studio panel bridge the atlas reads only (plan Phase 10a)", () => {
    for (const command of ["atlas-read", "atlas-revision", "atlas-prefs"]) {
      expect(STUDIO_BRIDGE_ALLOWED_COMMANDS.has(command), command).toBe(true);
    }
    for (const command of ["graph3d-feature", "atlas-settle"]) {
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

  it("serves the Studio one due card of a region at a time", () => {
    const one = runCliJson([
      "bridge",
      "get-review",
      "--no-dynamic-question",
      "--max-new",
      "1",
      "--atlas-region",
      "natur.physik",
    ]);
    expect(one.hasReview).toBe(true);
    expect(physikTokenIds).toContain(one.card.tokenId);
    expect(one.card.state).not.toBe("new");
    const none = runCliJson([
      "bridge",
      "get-review",
      "--no-dynamic-question",
      "--atlas-region",
      "sprache",
    ]);
    expect(none.hasReview).toBe(false);
  });

  it("names what an import at a region needs", () => {
    const place = runCliJson([
      "bridge",
      "atlas-place",
      "--region",
      "natur.physik.optik",
    ]);
    expect(place.place.path.map((s: { key: string }) => s.key)).toEqual([
      "natur",
      "natur.physik",
      "natur.physik.optik",
    ]);
    expect(place.place.missingLevels).toEqual(["Thema"]);
    // The learner's published units there, for a variant: one per atom.
    expect(place.units.length).toBeGreaterThan(0);
    expect(place.units.length).toBeLessThanOrEqual(physikTokenIds.length);
    for (const unit of place.units) expect(unit.key).toMatch(/^atom:/);
    // The cell whose atoms alias into the region comes first; no wizard.
    expect(place.cells.some((c: { installed: boolean }) => c.installed)).toBe(
      true,
    );
    expect(place.wizard).toBe(false);
    expect(
      runCliError(["bridge", "atlas-place", "--region", "gibt.es.nicht"]).error,
    ).toContain("No region");
  });

  it("installs the year's cells when Neue Inhalte zeigen goes on, and enrols nobody", async () => {
    const db = await openDatabase({
      dbPath,
      initialize: false,
      useConfiguredCloud: false,
    });
    await setSetting(
      db,
      "curriculum.lastSelection",
      JSON.stringify({
        providerId: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: "10",
        subject: "physik",
      }),
    );
    const cardsBefore = (await db
      .prepare("SELECT COUNT(*) AS n FROM cards")
      .get()) as { n: number };
    await db.close();

    const prefs = runCliJson(["bridge", "atlas-prefs", "--show-new", "on"]);
    expect(prefs.showNew).toBe(true);
    // Every subject of the year, not only the last one chosen.
    expect(prefs.cellsInstalled.length).toBeGreaterThan(2);

    const after = await openDatabase({
      dbPath,
      initialize: false,
      useConfiguredCloud: false,
    });
    const cardsAfter = (await after
      .prepare("SELECT COUNT(*) AS n FROM cards")
      .get()) as { n: number };
    await after.close();
    expect(Number(cardsAfter.n)).toBe(Number(cardsBefore.n));

    const view = runCliJson(["bridge", "atlas-read"]);
    const sketched = view.units.filter((u: { inReach: boolean }) => u.inReach);
    expect(sketched.length).toBeGreaterThan(0);

    // Aufnehmen: cards for the chosen unit only.
    const one = sketched[0].key;
    const taken = runCliJson(["bridge", "atlas-take", "--unit", one]);
    expect(taken.cardsCreated).toBeGreaterThan(0);
    const again = runCliJson(["bridge", "atlas-read"]);
    expect(
      again.units.find((u: { key: string }) => u.key === one).inReach,
    ).toBe(false);
    expect(
      again.units.filter((u: { inReach: boolean }) => u.inReach).length,
    ).toBe(sketched.length - 1);
  });

  it("lets a unit stand in for a published one, and undoes it", () => {
    const view = runCliJson(["bridge", "atlas-read"]);
    const own = view.units.find((u: { own: boolean }) => u.own).key;
    const published = view.units.find(
      (u: { own: boolean; cards: number }) => !u.own && u.cards > 0,
    ).key;
    const chosen = runCliJson([
      "bridge",
      "atlas-variant",
      "--stands-for",
      published,
      "--variant",
      own,
    ]);
    expect(chosen.detached).toBeGreaterThan(0);
    const after = runCliJson(["bridge", "atlas-read"]);
    expect(
      after.units.find((u: { key: string }) => u.key === published),
    ).toBeUndefined();
    expect(
      after.units.find((u: { key: string }) => u.key === own).standsFor.key,
    ).toBe(published);
    const undone = runCliJson([
      "bridge",
      "atlas-variant",
      "--stands-for",
      published,
      "--undo",
    ]);
    expect(undone.reattached).toBe(chosen.detached);
    expect(
      runCliError([
        "bridge",
        "atlas-variant",
        "--stands-for",
        own,
        "--variant",
        published,
      ]).error,
    ).toContain("not a published unit");
  });

  it("keeps the new atlas commands away from the Studio panel bridge", () => {
    for (const command of [
      "atlas-place",
      "atlas-take",
      "atlas-variant",
      "atlas-emblem-set",
      "atlas-emblem-clear",
      "atlas-emblem-draw",
      "atlas-connect",
      "atlas-disconnect",
    ]) {
      expect(STUDIO_BRIDGE_ALLOWED_COMMANDS.has(command), command).toBe(false);
    }
  });

  it("spins and cuts red threads, refusing by the rules (Decision 7)", () => {
    const view = runCliJson(["bridge", "atlas-read", "--lens", "weltwissen"]);
    const own = view.units.find((u: { own: boolean }) => u.own).key;
    const published = view.units.find((u: { own: boolean }) => !u.own).key;
    const spun = runCliJson([
      "bridge",
      "atlas-connect",
      "--from",
      own,
      "--to",
      published,
      "--kind",
      "nutzt",
      "--note",
      "Farben sind Licht.",
      "--from-studio",
    ]);
    expect(spun).toMatchObject({
      success: true,
      scope: "personal",
      from: own,
      to: published,
      kind: "nutzt",
      note: "Farben sind Licht.",
      created: true,
    });
    const read = runCliJson(["bridge", "atlas-read", "--lens", "weltwissen"]);
    expect(read.threads).toContainEqual({
      from: own,
      to: published,
      kind: "nutzt",
      scope: "personal",
      id: spun.id,
      note: "Farben sind Licht.",
    });
    expect(read.portals).toEqual({});

    // Each refusal names its code beside the message.
    expect(
      runCliError([
        "bridge",
        "atlas-connect",
        "--from",
        own,
        "--to",
        published,
        "--kind",
        "kennt",
      ]),
    ).toMatchObject({
      error: expect.stringContaining("Unknown thread kind"),
      code: "invalid-kind",
    });
    expect(
      runCliError([
        "bridge",
        "atlas-connect",
        "--from",
        own,
        "--to",
        published,
        "--kind",
        "voraussetzung",
        "--scope",
        "shared",
      ]),
    ).toMatchObject({
      error: expect.stringContaining("zam_link_prereq"),
      code: "shared-prerequisite",
    });

    expect(
      runCliJson(["bridge", "atlas-disconnect", "--id", spun.id]).scope,
    ).toBe("personal");
    expect(
      runCliError(["bridge", "atlas-disconnect", "--id", spun.id]),
    ).toMatchObject({
      error: expect.stringContaining("No thread"),
      code: "unknown-connection",
    });
    const after = runCliJson(["bridge", "atlas-read", "--lens", "weltwissen"]);
    expect(
      after.threads.filter((t: { kind: string }) => t.kind === "nutzt"),
    ).toEqual([]);
  });

  it("sets, shows and clears Sinnbilder, and only as their canonical form", () => {
    const optik = "region:weltwissen:natur.physik.optik";
    const before = runCliJson(["bridge", "atlas-read", "--lens", "weltwissen"]);
    const region = before.regions.find(
      (r: { key: string }) => r.key === "natur.physik.optik",
    );
    expect(region.emblem).toBe(optik);
    expect(before.emblems[optik].source).toBe("seed");

    const unit = before.units.find((u: { own: boolean }) => !u.own).key;
    const svg =
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">  <circle r="20" cy="32" cx="32" fill="#2f6fdf"/></svg>';
    const set = runCliJson([
      "bridge",
      "atlas-emblem-set",
      "--subject",
      unit,
      "--svg",
      svg,
    ]);
    expect(set.scope).toBe("shared");
    expect(set.emblem.svg).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="20" fill="#2f6fdf"/></svg>',
    );
    // The learner's own sign, typed in the Studio, comes second: personal.
    const own = runCliJson([
      "bridge",
      "atlas-emblem-set",
      "--subject",
      unit,
      "--glyph",
      "n₁",
      "--from-studio",
    ]);
    expect(own.scope).toBe("personal");
    const after = runCliJson(["bridge", "atlas-read", "--lens", "weltwissen"]);
    expect(after.emblems[unit]).toMatchObject({
      glyph: "n₁",
      source: "personal",
    });
    expect(
      runCliJson(["bridge", "atlas-emblem-clear", "--subject", unit]).cleared,
    ).toBe(true);
    const cleared = runCliJson([
      "bridge",
      "atlas-read",
      "--lens",
      "weltwissen",
    ]);
    expect(cleared.emblems[unit].source).toBe("shared");

    expect(
      runCliError([
        "bridge",
        "atlas-emblem-set",
        "--subject",
        unit,
        "--svg",
        svg.replace("<circle", '<image href="x.png"/><circle'),
      ]).error,
    ).toContain("<image>");
    expect(
      runCliError([
        "bridge",
        "atlas-emblem-set",
        "--subject",
        "token:nope",
        "--glyph",
        "x",
      ]).error,
    ).toContain("No unit");
  });

  it("puts the unit's Sinnbild on a rendering surface's review card only", () => {
    const one = runCliJson([
      "bridge",
      "get-review",
      "--no-dynamic-question",
      "--atlas-region",
      "natur.physik",
    ]);
    const atom = one.card.atomId as string;
    runCliJson([
      "bridge",
      "atlas-emblem-set",
      "--subject",
      `atom:${atom}`,
      "--glyph",
      "λ",
    ]);
    const plain = runCliJson([
      "bridge",
      "get-review",
      "--no-dynamic-question",
      "--atlas-region",
      "natur.physik",
    ]);
    expect(plain.emblem).toBeNull();
    const media = runCliJson([
      "bridge",
      "get-review",
      "--no-dynamic-question",
      "--media",
      "--atlas-region",
      "natur.physik",
    ]);
    if (media.card.atomId === atom) {
      expect(media.emblem.glyph).toBe("λ");
    }
  });

  it("fits the names below a place to its levels, deepest last", () => {
    expect(fitBelow(["Ziel", "Thema"], 1)).toEqual(["Thema"]);
    expect(fitBelow(["Ziel", "Thema"], 2)).toEqual(["Ziel", "Thema"]);
    expect(fitBelow(["Ziel", "Thema"], 3)).toEqual(["", "Ziel", "Thema"]);
    expect(fitBelow(["Ziel", " "], 2)).toEqual(["", "Ziel"]);
    expect(fitBelow(["Ziel"], 0)).toEqual([]);
  });

  it("puts the units a goal import created at its atlas place", async () => {
    const db = await openDatabase({
      dbPath,
      initialize: false,
      useConfiguredCloud: false,
    });
    try {
      await db
        .prepare(
          "INSERT INTO sources (id, type, uri, created_at) VALUES (?, 'file', ?, ?)",
        )
        .run("src-goal", "/goals/brechung.md", new Date().toISOString());
    } finally {
      await db.close();
    }
    const proposal = (question: string, concept: string) => ({
      question,
      concept,
      domain: "physik/optik",
      bloom_level: 2,
      placeBelow: ["Brechung verstehen", "Snellius in der Praxis"],
    });
    const result = runCliJson([
      "bridge",
      "personal-source-confirm-import",
      "--sourceId",
      "src-goal",
      "--proposals",
      JSON.stringify([
        proposal("Wie lautet das Brechungsgesetz?", "Brechungsgesetz anwenden"),
        proposal("Was ist der Brechungsindex?", "Brechungsindex"),
      ]),
      "--place-region",
      "natur.physik.optik",
      "--place-lens",
      "weltwissen",
    ]);
    expect(result).toMatchObject({ createdCount: 2, placed: 2 });
    const view = runCliJson(["bridge", "atlas-read", "--lens", "weltwissen"]);
    const placed = view.units.filter(
      (u: { region: string }) =>
        u.region === "natur.physik.optik.snellius-in-der-praxis",
    );
    expect(placed).toHaveLength(2);
    const thema = view.regions.find(
      (r: { key: string }) =>
        r.key === "natur.physik.optik.snellius-in-der-praxis",
    );
    expect(thema.name).toBe("Snellius in der Praxis");
  });

  it("puts a topic import's units on the world planet, where they read up (ADR 2026-10-14)", () => {
    const source = runCliJson([
      "bridge",
      "topic-source",
      "--title",
      "PostgreSQL nach MSSQL",
    ]);
    // No world rule covers this domain: without the topic import's rule the
    // unit would land on the own planet (Privat).
    const result = runCliJson([
      "bridge",
      "personal-source-confirm-import",
      "--sourceId",
      source.sourceId,
      "--proposals",
      JSON.stringify([
        {
          question: "Was ersetzt in PostgreSQL das TOP aus T-SQL?",
          concept: "LIMIT am Ende der Abfrage.",
          domain: "postgres-umstieg/abfragen",
          bloom_level: 1,
          symbiosis_mode: "shadowing",
          lookup_term: "LIMIT (SQL)",
        },
      ]),
    ]);
    expect(result).toMatchObject({ createdCount: 1, placed: 1 });

    const welt = runCliJson(["bridge", "atlas-read", "--lens", "weltwissen"]);
    const unit = welt.units.find((u: { title: string }) =>
      /TOP|LIMIT/.test(u.title),
    );
    expect(unit).toBeDefined();
    expect(unit.readUp).toEqual({
      kind: "search",
      term: "LIMIT (SQL)",
      language: null,
    });
    const leben = runCliJson(["bridge", "atlas-read", "--lens", "leben"]);
    expect(leben.units).toHaveLength(0);

    const cards = runCliJson(["bridge", "personal-card-list"]).cards;
    const card = cards.find(
      (c: { tokenId: string }) => `token:${c.tokenId}` === unit.key,
    );
    expect(card.readUp).toEqual(unit.readUp);
  });

  it("refuses to draw without a text model, by code", () => {
    const unit = runCliJson(["bridge", "atlas-read"]).units[0].key;
    const refused = runCliJson([
      "bridge",
      "atlas-emblem-draw",
      "--subject",
      unit,
    ]);
    expect(refused).toMatchObject({ success: false, code: "no-text-model" });
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
