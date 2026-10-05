import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMcpServer } from "../../src/cli/commands/mcp.js";
import type { StudioLaunchResult } from "../../src/cli/desktop-launch.js";
import { readStagedImport } from "../../src/cli/material-staging.js";
import {
  createToken,
  type Database,
  openDatabase,
} from "../../src/kernel/index.js";

/**
 * The harness path (ADR 2026-10-05 Decision 2): the agent reads the material
 * and submits proposals; ZAM validates, stages them machine-locally and
 * opens the Studio. Nothing reaches the library before the learner confirms.
 */

const PROPOSAL = {
  question: "Welche Eigenschaften eines Stoffes erkennt man am Aussehen?",
  answer: "Farbe, Aggregatzustand bei Raumtemperatur, metallischer Glanz.",
  bloom: 1,
  file: 0,
  page: 1,
  area: "chemie/stoffe-und-eigenschaften",
  origin: "page",
};
const ANALYSIS = {
  kind: "own-notes",
  title: "Stofferkennung mit den Sinnen",
  subjects: ["chemie"],
  topic: "Stoffe und Stoffeigenschaften",
};

describe("material import MCP tools", () => {
  let tempDir: string;
  let db: Database;
  let client: Client;
  let server: ReturnType<typeof createMcpServer>;
  let launches: number;
  let launchResult: StudioLaunchResult;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-mcp-material-"));
    process.env.ZAM_PENDING_IMPORTS_DIR = join(tempDir, "pending");
    db = await openDatabase({
      dbPath: join(tempDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await db
      .prepare(
        "INSERT OR REPLACE INTO user_config (key, value) VALUES ('user.id', 'learner')",
      )
      .run();
    launches = 0;
    launchResult = { opened: true, appPath: "/Applications/ZAM.app" };
    server = createMcpServer(db, {
      launchStudio: () => {
        launches++;
        return launchResult;
      },
    });
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    client = new Client(
      { name: "opencode", version: "1.0.0" },
      { capabilities: {} },
    );
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);
  });

  afterEach(async () => {
    delete process.env.ZAM_PENDING_IMPORTS_DIR;
    await client.close();
    await server.close();
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  function body(result: unknown): any {
    const content = (result as { content: Array<{ text: string }> }).content;
    return JSON.parse(content[0].text);
  }

  it("lists both tools and tells agents when to use them", async () => {
    const names = (await client.listTools()).tools.map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "zam_material_import_context",
        "zam_material_import",
      ]),
    );
    expect(client.getInstructions()).toContain("zam_material_import");
  });

  it("hands the agent the rules, the contract and the areas in use", async () => {
    await createToken(db, { slug: "a", concept: "a", domain: "chemie/stoffe" });
    const context = body(
      await client.callTool({
        name: "zam_material_import_context",
        arguments: {},
      }),
    );
    expect(context.rules.join(" ")).toContain("never a transcript");
    expect(context.contract).toContain("origin");
    expect(context.areas).toEqual([{ path: "chemie/stoffe", tokenCount: 1 }]);
    expect(context.cellSubjects).toContain("chemie");
  });

  it("stages valid proposals, fingerprints the file and opens the Studio", async () => {
    const photo = join(tempDir, "IMG_1234.jpg");
    writeFileSync(photo, "fake photo bytes");
    const result = await client.callTool({
      name: "zam_material_import",
      arguments: {
        analysis: ANALYSIS,
        proposals: [PROPOSAL],
        files: [{ name: "IMG_1234.jpg", path: photo }],
      },
    });
    expect(result.isError).toBeFalsy();
    const staged = body(result);
    expect(staged).toMatchObject({
      staged: { title: "Stofferkennung mit den Sinnen", proposalCount: 1 },
      studio: "opened",
    });
    expect(launches).toBe(1);

    const batch = await readStagedImport(staged.staged.id);
    expect(batch).toMatchObject({ origin: "harness", harness: "opencode" });
    expect(batch?.set.files[0]).toMatchObject({
      name: "IMG_1234.jpg",
      path: photo,
      sha256: createHash("sha256").update("fake photo bytes").digest("hex"),
    });
    expect(batch?.set.files[0].sourceLink).toMatch(
      /^file:\/\/.*IMG_1234\.jpg$/,
    );

    // Nothing reaches the library before the learner confirms.
    const tokens = (await db
      .prepare("SELECT COUNT(*) AS n FROM tokens")
      .get()) as { n: number };
    expect(tokens.n).toBe(0);
  });

  it("names a file it cannot read with a dated placeholder", async () => {
    launchResult = { opened: false, reason: "not-installed" };
    const staged = body(
      await client.callTool({
        name: "zam_material_import",
        arguments: {
          analysis: ANALYSIS,
          proposals: [PROPOSAL],
          files: [{ name: "Tafelbild.HEIC" }],
        },
      }),
    );
    expect(staged.studio).toBe("not-installed");
    expect(staged.message).toContain("open the ZAM Studio");
    const batch = await readStagedImport(staged.staged.id);
    expect(batch?.set.files[0].sourceLink).toMatch(
      /^photo:Tafelbild\.HEIC@\d{4}-\d{2}-\d{2}$/,
    );
  });

  it("refuses proposals the kernel rejects, with the offending path", async () => {
    const result = await client.callTool({
      name: "zam_material_import",
      arguments: {
        analysis: ANALYSIS,
        proposals: [{ ...PROPOSAL, file: 3 }],
        files: [{ name: "a.jpg" }],
        open_studio: false,
      },
    });
    expect(result.isError).toBe(true);
    expect(body(result).error).toMatch(/proposals\[0\]\.file/);
    expect(launches).toBe(0);
    expect(() => readdirSync(join(tempDir, "pending"))).toThrow();
  });
});
