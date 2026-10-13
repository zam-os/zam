import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  drawEmblemViaLLM,
  EMBLEM_DRAW_INSTRUCTIONS,
  type EmblemDrawDeps,
  parseEmblemReply,
} from "../../src/cli/llm/emblem-draw.js";
import {
  type CapabilityFlags,
  type Database,
  type ModelCapability,
  type ModelEntry,
  openDatabase,
  saveMachineAiModels,
} from "../../src/kernel/index.js";

/**
 * The Studio's way to a Sinnbild (ADR 2026-10-13, Decision 6): the text model
 * draws, ZAM validates. No request leaves the test: `fetch` is mocked.
 */

const GOOD =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M8 40 L56 24" stroke="#1d2b4f" stroke-width="3"/></svg>';

function flags(...caps: ModelCapability[]): CapabilityFlags {
  return {
    text: caps.includes("text"),
    embedding: caps.includes("embedding"),
    image: caps.includes("image"),
    video: caps.includes("video"),
    file: caps.includes("file"),
    stt: caps.includes("stt"),
    tts: caps.includes("tts"),
  };
}

function textRow(): ModelEntry {
  return {
    id: "Text",
    label: "Text",
    url: "https://openrouter.ai/api/v1",
    model: "openai/gpt-6-luna",
    local: false,
    apiFlavor: "chat-completions",
    order: 0,
    capabilities: flags("text"),
    detectedCapabilities: flags("text"),
  };
}

function chat(content: string): Response {
  return new Response(
    JSON.stringify({
      choices: [{ finish_reason: "stop", message: { content } }],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

describe("parseEmblemReply", () => {
  it("reads JSON, fenced JSON and a bare SVG", () => {
    expect(parseEmblemReply(JSON.stringify({ svg: GOOD, glyph: "λ" }))).toEqual({
      svg: GOOD,
      glyph: "λ",
    });
    expect(
      parseEmblemReply(`\`\`\`json\n${JSON.stringify({ svg: GOOD })}\n\`\`\``),
    ).toEqual({ svg: GOOD, glyph: "" });
    expect(parseEmblemReply(`Here it is:\n${GOOD}`).svg).toBe(GOOD);
    expect(() => parseEmblemReply("I cannot draw.")).toThrow(/no SVG/);
  });
});

describe("drawEmblemViaLLM", () => {
  let dir: string;
  let db: Database;
  let previousConfig: string | undefined;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-emblem-draw-"));
    previousConfig = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(dir, "config.json");
    db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    if (previousConfig === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfig;
    rmSync(dir, { recursive: true, force: true });
  });

  it("refuses without a text model", async () => {
    await expect(
      drawEmblemViaLLM(db, { title: "Lichtbrechung", path: [] }),
    ).rejects.toMatchObject({ code: "no-text-model" });
  });

  it("sends only the title and path, and returns the canonical form", async () => {
    saveMachineAiModels([textRow()]);
    const bodies: Array<Record<string, unknown>> = [];
    const fetch: EmblemDrawDeps["fetch"] = async (_url, init) => {
      bodies.push(JSON.parse(String(init.body)));
      return chat(JSON.stringify({ svg: GOOD.replace("<path", "\n  <path"), glyph: "n₁" }));
    };
    const drawing = await drawEmblemViaLLM(
      db,
      { title: "Lichtbrechung", path: ["Natur", "Physik", "Optik"] },
      { fetch },
    );
    expect(drawing.svg).toBe(GOOD);
    expect(drawing.glyph).toBe("n₁");
    expect(bodies).toHaveLength(1);
    const messages = bodies[0].messages as Array<{ role: string; content: string }>;
    expect(messages[0]).toEqual({ role: "system", content: EMBLEM_DRAW_INSTRUCTIONS });
    expect(messages[1].content).toContain("Lichtbrechung");
    expect(messages[1].content).toContain("Natur › Physik › Optik");
  });

  it("sends a refused drawing back once with the reason, then gives up", async () => {
    saveMachineAiModels([textRow()]);
    const bodies: Array<Record<string, unknown>> = [];
    const replies = [
      JSON.stringify({ svg: GOOD.replace("<path", '<image href="x.png"/><path') }),
      JSON.stringify({ svg: GOOD }),
    ];
    const fetch: EmblemDrawDeps["fetch"] = async (_url, init) => {
      bodies.push(JSON.parse(String(init.body)));
      return chat(replies[bodies.length - 1]);
    };
    const drawing = await drawEmblemViaLLM(
      db,
      { title: "Lichtbrechung", path: [] },
      { fetch },
    );
    expect(drawing.svg).toBe(GOOD);
    const second = bodies[1].messages as Array<{ role: string; content: string }>;
    expect(second[second.length - 1].content).toContain("<image>");

    const stubborn: EmblemDrawDeps["fetch"] = async () =>
      chat(JSON.stringify({ svg: "<svg><script/></svg>" }));
    await expect(
      drawEmblemViaLLM(db, { title: "x", path: [] }, { fetch: stubborn }),
    ).rejects.toMatchObject({ code: "invalid-answer" });
  });
});
