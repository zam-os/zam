import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PRE_APPROVED_TOOLS } from "../../src/cli/agent-approval.js";
import { atlasRevision } from "../../src/cli/atlas.js";
import { createMcpServer } from "../../src/cli/commands/mcp.js";
import {
  addConnection,
  addPrerequisite,
  clearSharedEmblem,
  createToken,
  type Database,
  ensureCard,
  installKvtTile,
  openDatabase,
  setEmblem,
  type UnitKey,
} from "../../src/kernel/index.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";

/**
 * The knowledge atlas for agents (ADR 2026-10-13, Decision 10; plan Phase
 * 9c): read, sort, connect and edit a lens through MCP, each acting on the
 * connected library only.
 */

const USER = "thomas";

describe("atlas agent tools", () => {
  let dir: string;
  let db: Database;
  let client: Client;
  let server: ReturnType<typeof createMcpServer>;
  let previousConfig: string | undefined;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-atlas-tools-"));
    previousConfig = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(dir, "config.json");
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await db
      .prepare(
        "INSERT OR REPLACE INTO user_config (key, value) VALUES ('user.id', ?)",
      )
      .run(USER);
    server = createMcpServer(db);
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client({ name: "test", version: "1.0.0" });
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
    await db.close();
    if (previousConfig === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfig;
    rmSync(dir, { recursive: true, force: true, maxRetries: 8 });
  });

  async function call(name: string, args: Record<string, unknown>) {
    const result = await client.callTool({ name, arguments: args });
    const text = (result.content as Array<{ text: string }>)[0].text;
    return { isError: result.isError === true, data: JSON.parse(text) };
  }

  async function own(slug: string, domain: string): Promise<string> {
    const token = await createToken(db, { slug, concept: slug, domain });
    await ensureCard(db, token.id, USER);
    return `token:${token.id}`;
  }

  it("reads a lens and changes nothing", async () => {
    await own("geburtstage", "familie/geburtstage");
    const before = await atlasRevision(db, { userId: USER });
    const { isError, data } = await call("zam_atlas_read", { lens: "leben" });
    expect(isError).toBe(false);
    expect(data.untrusted).toBe(true);
    expect(data.lens).toMatchObject({ kind: "leben", planet: "privat" });
    expect(data.ownPlanet).toBe("privat");
    expect(data.units).toHaveLength(1);
    expect(data.regions.map((r: { key: string }) => r.key)).toContain(
      "familie",
    );
    expect(await atlasRevision(db, { userId: USER })).toEqual(before);

    const scoped = await call("zam_atlas_read", {
      lens: "leben",
      region: "gibt-es-nicht",
    });
    expect(scoped.isError).toBe(true);
  });

  it("sorts own units, skipping published ones and a person's placements", async () => {
    const tile = listBundledTiles().find((t) =>
      t.atoms.some((a) => a.domain.startsWith("physik/optik")),
    );
    if (!tile) throw new Error("no bundled optics tile");
    await installKvtTile(db, tile);
    const a = await own("zam-cli", "zam/cli");
    const b = await own("zam-mcp", "zam/mcp");
    const atom = `atom:${tile.atoms[0].id}`;

    const created = await call("zam_atlas_lens_edit", {
      lens: "leben",
      edits: [{ op: "create-region", name: "Werkzeuge" }],
    });
    expect(created.data.created).toBe(1);

    // A person placed b first; the agent leaves it.
    const byPerson = await call("zam_atlas_lens_edit", {
      lens: "leben",
      edits: [{ op: "place", unit: b, region: "werkzeuge", below: ["MCP"] }],
    });
    expect(byPerson.isError).toBe(false);
    await db
      .prepare(
        `UPDATE atlas_members SET placed_by = 'learner' WHERE unit_key = ?`,
      )
      .run(b);

    const sorted = await call("zam_atlas_place", {
      lens: "leben",
      region: "werkzeuge",
      units: [a, b, atom],
      below: ["Kommandozeile"],
    });
    expect(sorted.isError).toBe(false);
    expect(sorted.data.placed).toEqual([a]);
    expect(sorted.data.skipped).toEqual([
      { unit: b, reason: "placed-by-person" },
      { unit: atom, reason: "published" },
    ]);
    // Settled at once: everyone sees the same map.
    expect(sorted.data.settled.landWritten).toBeGreaterThan(0);
    const view = (await call("zam_atlas_read", { lens: "leben" })).data;
    expect(view.units.find((u: { key: string }) => u.key === a).region).toBe(
      "werkzeuge.kommandozeile",
    );
  });

  it("spins a personal thread, and refuses one from world knowledge to private", async () => {
    const welt = await own("hebel", "physik/mechanik");
    const privat = await own("werkbank", "keller/werkbank");
    const spun = await call("zam_atlas_connect", {
      from: privat,
      to: welt,
      kind: "nutzt",
      note: "Die Werkbank hat einen Hebel.",
    });
    expect(spun.isError).toBe(false);
    expect(spun.data).toMatchObject({
      untrusted: true,
      scope: "personal",
      kind: "nutzt",
    });
    const refused = await call("zam_atlas_connect", {
      from: welt,
      to: privat,
      kind: "nutzt",
    });
    expect(refused.isError).toBe(true);
  });

  it("proposes and flags a lens, but never accepts", async () => {
    await own("rosen", "garten/blumen");
    const proposed = await call("zam_atlas_lens_edit", {
      lens: "leben",
      propose: {
        source: "Mein Notizbuch",
        regions: [{ key: "haus", name: "Haus", parent: null }],
      },
    });
    expect(proposed.isError).toBe(false);
    expect(proposed.data.curation.proposal).toMatchObject({
      source: "Mein Notizbuch",
      regions: 1,
    });
    const stale = await call("zam_atlas_lens_edit", {
      lens: "leben",
      stale: { stale: true, note: "Der Garten ist verkauft." },
    });
    expect(stale.data.curation.stale.note).toBe("Der Garten ist verkauft.");
    const both = await call("zam_atlas_lens_edit", {
      lens: "leben",
      edits: [{ op: "create-region", name: "x" }],
      stale: { stale: false },
    });
    expect(both.isError).toBe(true);
    const world = await call("zam_atlas_lens_edit", {
      lens: "weltwissen",
      edits: [{ op: "remove-region", key: "natur" }],
    });
    expect(world.isError).toBe(true);
    const tools = (await client.listTools()).tools.map((t) => t.name);
    expect(tools).not.toContain("zam_atlas_lens_accept");
  });

  it("pre-approves none of the atlas tools without the owner's word", () => {
    for (const name of [
      "zam_atlas_read",
      "zam_atlas_place",
      "zam_atlas_connect",
      "zam_atlas_lens_edit",
    ]) {
      expect(PRE_APPROVED_TOOLS).not.toContain(name);
    }
  });

  it("changes its revision when an agent edits the atlas", async () => {
    await own("rosen", "garten/blumen");
    const before = await atlasRevision(db, { userId: USER });
    await call("zam_atlas_lens_edit", {
      lens: "leben",
      edits: [{ op: "create-region", name: "Haus" }],
    });
    const after = await atlasRevision(db, { userId: USER });
    expect(after.revision).not.toBe(before.revision);
  });

  it("changes its revision on a note, a prerequisite and an older Sinnbild gone (review round 2)", async () => {
    const rosen = await own("rosen-schneiden", "garten/blumen");
    const tulpen = await own("tulpen-setzen", "garten/blumen");
    const changes = async (write: () => Promise<unknown>) => {
      const before = (await atlasRevision(db, { userId: USER })).revision;
      await write();
      return (await atlasRevision(db, { userId: USER })).revision !== before;
    };
    const thread = (note: string) =>
      addConnection(db, {
        userId: USER,
        mayWriteKnowledge: false,
        a: rosen as UnitKey,
        b: tulpen as UnitKey,
        kind: "nutzt",
        note,
      });
    await thread("im Herbst");
    expect(await changes(() => thread("im Frühjahr, nach dem Frost"))).toBe(
      true,
    );
    expect(
      await changes(() =>
        addPrerequisite(db, rosen.slice(6), tulpen.slice(6)),
      ),
    ).toBe(true);
    for (const subjectKey of [rosen, tulpen]) {
      await setEmblem(db, {
        subjectKey,
        glyph: "R",
        userId: USER,
        mayWriteKnowledge: true,
      });
    }
    expect(await changes(() => clearSharedEmblem(db, rosen, true))).toBe(true);
  });
});
