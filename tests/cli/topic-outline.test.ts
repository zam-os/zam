import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseSubtopicArray } from "../../src/cli/llm/client.js";
import {
  confirmSourceImport,
  listPersonalCards,
  normalizeTopicTitle,
  openDatabase,
  recordTopicImport,
  TOPIC_SOURCE_PREFIX,
} from "../../src/kernel/index.js";

describe("parseSubtopicArray (ADR 2026-10-14)", () => {
  it("parses a plain JSON array and trims fields", () => {
    const result = parseSubtopicArray(
      JSON.stringify([
        { label: " Grundlagen ", description: " Was ein Akkord ist. " },
        { label: "Rhythmus", description: "Taktarten sicher halten." },
      ]),
    );
    expect(result).toEqual([
      { label: "Grundlagen", description: "Was ein Akkord ist." },
      { label: "Rhythmus", description: "Taktarten sicher halten." },
    ]);
  });

  it("keeps the article named for reading up as the lookup term (ADR 2026-10-14, D4)", () => {
    const result = parseSubtopicArray(
      JSON.stringify([
        {
          label: "Joins",
          description: "Tabellen verknüpfen.",
          article: "  Join (SQL) ",
        },
        {
          label: "Indizes",
          description: "Abfragen beschleunigen.",
          article: null,
        },
        { label: "Rollen", description: "Rechte vergeben.", article: "" },
      ]),
    );
    expect(result.map((s) => s.lookupTerm)).toEqual([
      "Join (SQL)",
      undefined,
      undefined,
    ]);
    expect("lookupTerm" in result[1]).toBe(false);
  });

  it("keeps why a subtopic is a company's or a person's own (ADR 2026-10-14, D5)", () => {
    const result = parseSubtopicArray(
      JSON.stringify([
        {
          label: "Scrum-Rollen",
          description: "Wer was verantwortet.",
          article: "Scrum",
          protected: null,
        },
        {
          label: "Sprint bei Team Boreas",
          description: "Wie das Team plant.",
          article: null,
          protected: "  Interne Abläufe eines Teams. ",
        },
      ]),
    );
    expect(result[0].protectedReason).toBeUndefined();
    expect(result[1].protectedReason).toBe("Interne Abläufe eines Teams.");
  });

  it("tolerates markdown fences and prose around the array", () => {
    const noisy =
      'Here are the subtopics:\n```json\n[{"label":"A","description":"a"},{"label":"B","description":"b"}]\n```\nGood luck!';
    expect(parseSubtopicArray(noisy)).toHaveLength(2);
  });

  it("rejects malformed, empty, or field-less responses", () => {
    expect(() => parseSubtopicArray("no array here")).toThrow(
      /brackets not found/,
    );
    expect(() => parseSubtopicArray("[]")).toThrow(/2-8 subtopics/);
    expect(() => parseSubtopicArray('[{"label":"A"},{"label":"B"}]')).toThrow(
      /description must be a non-empty string/,
    );
  });
});

describe("recordTopicImport (ADR 2026-10-14, Decision 1)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-topic-source-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("records the import as one source row and nothing of its context", async () => {
    const db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    try {
      const recorded = await recordTopicImport(db, {
        title: "  PostgreSQL   nach MSSQL ",
        userId: "learner",
        now: new Date("2026-10-14T09:00:00.000Z"),
      });
      expect(recorded.title).toBe("PostgreSQL nach MSSQL");
      expect(recorded.uri.startsWith(TOPIC_SOURCE_PREFIX)).toBe(true);
      const row = (await db
        .prepare(
          "SELECT type, uri, content, title, fingerprints, imported_by, created_at FROM sources WHERE id = ?",
        )
        .get(recorded.sourceId)) as Record<string, unknown>;
      expect(row).toEqual({
        type: "file",
        uri: recorded.uri,
        content: null,
        title: "PostgreSQL nach MSSQL",
        fingerprints: null,
        imported_by: "learner",
        created_at: "2026-10-14T09:00:00.000Z",
      });
      await expect(
        recordTopicImport(db, { title: "   ", userId: "learner" }),
      ).rejects.toThrow(/needs the topic's name/);
      await expect(
        recordTopicImport(db, { title: "x".repeat(201), userId: "learner" }),
      ).rejects.toThrow(/at most 200/);
    } finally {
      await db.close();
    }
  });

  it("checks the name the same way before any model call", () => {
    expect(normalizeTopicTitle("  Rhetorische\n Stilmittel ")).toBe(
      "Rhetorische Stilmittel",
    );
    expect(() => normalizeTopicTitle("x".repeat(201))).toThrow(/at most 200/);
  });

  // The record names the import, not a source to read up in: the card list
  // must not offer it as one, or saving the card writes it into the token.
  it("never lists the import's record as a card's source", async () => {
    const db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    try {
      const recorded = await recordTopicImport(db, {
        title: "PostgreSQL",
        userId: "learner",
      });
      await confirmSourceImport(db, "learner", recorded.sourceId, [
        {
          question: "Welche Klausel ersetzt OUTPUT INSERTED.*?",
          concept: "RETURNING",
          domain: "PostgreSQL",
          bloom_level: 1,
          symbiosis_mode: "shadowing",
          excerpt: "",
        },
      ]);
      const cards = await listPersonalCards(db, "learner");
      expect(cards).toHaveLength(1);
      expect(cards[0].sourceLink).toBeNull();
    } finally {
      await db.close();
    }
  });
});

// Subprocess contract: the topic import writes no file, anywhere.
describe("bridge topic import", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-topic-import-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-topic-import-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    const db = await openDatabase({
      dbPath: join(dataDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function runBridge(args: string[]): Record<string, unknown> {
    const output = execFileSync("node", [cliPath, "bridge", ...args], {
      cwd: tempCwd,
      env: {
        ...process.env,
        HOME: tempHome,
        USERPROFILE: tempHome,
        ZAM_CONFIG_PATH: join(tempHome, ".zam", "config.json"),
      },
      encoding: "utf8",
    });
    return JSON.parse(output) as Record<string, unknown>;
  }

  function bridgeFailure(args: string[]): { status?: number; stdout?: string } {
    try {
      runBridge(args);
    } catch (err) {
      return err as { status?: number; stdout?: string };
    }
    return {};
  }

  it("records the import with topic-source and writes no goal file", () => {
    const recorded = runBridge([
      "topic-source",
      "--title",
      "PostgreSQL",
      "--user",
      "learner",
    ]);
    expect(recorded.success).toBe(true);
    expect(String(recorded.uri)).toMatch(/^zam-topic:/);
    expect(existsSync(join(tempCwd, "goals"))).toBe(false);
    expect(existsSync(join(tempHome, "goals"))).toBe(false);
    // The goal file command is retired.
    expect(bridgeFailure(["goal-create", "--title", "x"]).status).not.toBe(0);
  });

  it("topic-outline refuses a name too long for the record before asking a model", () => {
    const failure = bridgeFailure([
      "topic-outline",
      "--title",
      "x".repeat(201),
    ]);
    expect(failure.status).not.toBe(0);
    expect(JSON.parse(String(failure.stdout)).error).toMatch(/at most 200/);
  });

  it("topic-cards rejects a subtopic without label and description", () => {
    const failure = bridgeFailure([
      "topic-cards",
      "--title",
      "Learn Guitar",
      "--topic",
      JSON.stringify({ label: "Open chords" }),
    ]);
    expect(failure.status).not.toBe(0);
    expect(JSON.parse(String(failure.stdout)).error).toMatch(
      /--topic must be a JSON \{label, description\} object/,
    );
  });
});
