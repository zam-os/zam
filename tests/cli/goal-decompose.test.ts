import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseGoalDecompositionArray } from "../../src/cli/llm/client.js";
import { openDatabase } from "../../src/kernel/index.js";

describe("parseGoalDecompositionArray (ADR 2026-07-24 §3)", () => {
  it("parses a plain JSON array and trims fields", () => {
    const result = parseGoalDecompositionArray(
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

  it("tolerates markdown fences and prose around the array", () => {
    const noisy =
      'Here is the breakdown:\n```json\n[{"label":"A","description":"a"},{"label":"B","description":"b"}]\n```\nGood luck!';
    expect(parseGoalDecompositionArray(noisy)).toHaveLength(2);
  });

  it("rejects malformed, empty, or field-less responses", () => {
    expect(() => parseGoalDecompositionArray("no array here")).toThrow(
      /brackets not found/,
    );
    expect(() => parseGoalDecompositionArray("[]")).toThrow(/2-8 sub-topics/);
    expect(() =>
      parseGoalDecompositionArray('[{"label":"A"},{"label":"B"}]'),
    ).toThrow(/description must be a non-empty string/);
  });
});

// Subprocess contract for goal-create: file placement in the active
// workspace's goals/ dir, slug suffixing, and the recorded breakdown.
describe("bridge goal-create", () => {
  let tempHome: string;
  let cliPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-goal-create-"));
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
    rmSync(tempHome, { recursive: true, force: true });
  });

  function runBridge(args: string[]): Record<string, unknown> {
    const output = execFileSync("node", [cliPath, "bridge", ...args], {
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

  it("writes the goal file with the confirmed breakdown and suffixes duplicates", () => {
    const first = runBridge([
      "goal-create",
      "--title",
      "Learn Guitar",
      "--description",
      "Play around the campfire.",
      "--path",
      JSON.stringify(["Chords"]),
      "--outline",
      JSON.stringify([
        { label: "Open chords", description: "The eight basic shapes." },
        { label: "Barre chords", description: "F and B without buzzing." },
      ]),
    ]);
    expect(first.success).toBe(true);
    expect(first.slug).toBe("learn-guitar");
    const filePath = String(first.filePath);
    expect(existsSync(filePath)).toBe(true);
    const body = readFileSync(filePath, "utf8");
    expect(body).toContain("Play around the campfire.");
    expect(body).toContain("### Breakdown");
    expect(body).toContain("Path: Chords");
    expect(body).toContain("- **Open chords** — The eight basic shapes.");

    const second = runBridge([
      "goal-create",
      "--title",
      "Learn Guitar",
      "--outline",
      "[]",
    ]);
    expect(second.slug).toBe("learn-guitar-2");
  });
});
