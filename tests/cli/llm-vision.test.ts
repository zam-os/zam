import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { observeUiSnapshotViaLLM } from "../../src/cli/llm/vision.js";
import { openDatabase, setSetting } from "../../src/kernel/index.js";

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const tempDirs: string[] = [];

function makeSnapshot(): string {
  const dir = mkdtempSync(join(tmpdir(), "zam-vision-"));
  tempDirs.push(dir);
  const path = join(dir, "snapshot.png");
  writeFileSync(path, PNG_BYTES);
  return path;
}

async function openConfiguredDb() {
  const db = await openDatabase({
    dbPath: ":memory:",
    initialize: true,
    useConfiguredCloud: false,
  });
  await setSetting(db, "llm.enabled", "true");
  await setSetting(db, "llm.url", "http://dummy/v1");
  await setSetting(db, "llm.model", "qwen2.5vl-it:3b");
  await setSetting(db, "llm.vision.enabled", "true");
  await setSetting(db, "system.locale", "de");
  return db;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("vision UI observer adapter", () => {
  it("sends a PNG snapshot as OpenAI-compatible image_url and builds a validated report", async () => {
    const db = await openConfiguredDb();
    const imagePath = makeSnapshot();
    const originalFetch = global.fetch;
    let requestedBody: Record<string, unknown> | undefined;

    global.fetch = (async (url, init) => {
      expect(String(url)).toBe("http://dummy/v1/chat/completions");
      requestedBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  kind: "progress",
                  summary: "Das Terminal zeigt den Observer-Snapshot-Test.",
                  actions: [
                    {
                      type: "window-change",
                      target: "ZAM Terminal",
                      result: "Fenster ist sichtbar",
                    },
                    { type: "unsupported-action", target: "ignored" },
                  ],
                  candidateTokens: [
                    {
                      slug: "windows-graphics-capture",
                      confidence: 0.82,
                      rationale: "Der sichtbare Test nutzt einen UI-Snapshot.",
                    },
                    {
                      slug: "bad slug",
                      confidence: 2,
                      rationale: "ignored",
                    },
                  ],
                  confidence: 0.74,
                }),
              },
            },
          ],
        }),
      );
    }) as typeof fetch;

    try {
      const report = await observeUiSnapshotViaLLM(db, {
        sessionId: "session-1",
        sequence: 7,
        observedFrom: "2026-06-16T07:00:00.000Z",
        observedTo: "2026-06-16T07:00:01.000Z",
        imagePath,
        application: {
          processName: "WindowsTerminal.exe",
          processId: 198132,
          windowTitle: "zam",
        },
        evidenceRef: "snapshots/session-1/0007.png",
        redacted: true,
        model: "mimo-v2.5",
      });

      expect(report).toMatchObject({
        version: 1,
        sessionId: "session-1",
        sequence: 7,
        kind: "progress",
        summary: "Das Terminal zeigt den Observer-Snapshot-Test.",
        confidence: 0.74,
        application: {
          processName: "WindowsTerminal.exe",
          processId: 198132,
          windowTitle: "zam",
        },
        evidence: [
          {
            type: "keyframe",
            ref: "snapshots/session-1/0007.png",
            redacted: true,
          },
        ],
      });
      expect(report.actions).toEqual([
        {
          type: "window-change",
          target: "ZAM Terminal",
          result: "Fenster ist sichtbar",
        },
      ]);
      expect(report.candidateTokens).toEqual([
        {
          slug: "windows-graphics-capture",
          confidence: 0.82,
          rationale: "Der sichtbare Test nutzt einen UI-Snapshot.",
        },
      ]);

      expect(requestedBody?.model).toBe("mimo-v2.5");
      const messages = requestedBody?.messages as Array<{
        content:
          | string
          | Array<{
              type: string;
              text?: string;
              image_url?: { url?: string };
            }>;
      }>;
      const userContent = messages[1].content as Array<{
        type: string;
        text?: string;
        image_url?: { url?: string };
      }>;
      expect(userContent[0].text).toContain(
        "Application process: WindowsTerminal.exe",
      );
      expect(userContent[1]).toMatchObject({ type: "image_url" });
      expect(userContent[1].image_url?.url).toMatch(/^data:image\/png;base64,/);
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });

  it("refuses to send a snapshot when vision is not explicitly enabled", async () => {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    // Base text LLM is on, but vision (the cloud consent gate) is left off.
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "http://dummy/v1");
    const imagePath = makeSnapshot();
    const originalFetch = global.fetch;
    let fetchCalled = false;
    global.fetch = (async () => {
      fetchCalled = true;
      return new Response("{}");
    }) as typeof fetch;

    try {
      await expect(
        observeUiSnapshotViaLLM(db, {
          sessionId: "session-1",
          sequence: 1,
          observedFrom: "2026-06-16T07:00:00.000Z",
          observedTo: "2026-06-16T07:00:01.000Z",
          imagePath,
          application: { processName: "WindowsTerminal.exe" },
        }),
      ).rejects.toThrow("llm.vision.enabled");
      expect(fetchCalled).toBe(false);
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });

  it("returns an uncertain report when the model output is not parseable JSON", async () => {
    const db = await openConfiguredDb();
    const imagePath = makeSnapshot();
    const originalFetch = global.fetch;

    global.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "I can see a terminal." } }],
        }),
      )) as typeof fetch;

    try {
      const report = await observeUiSnapshotViaLLM(db, {
        sessionId: "session-1",
        sequence: 8,
        observedFrom: "2026-06-16T07:00:01.000Z",
        observedTo: "2026-06-16T07:00:02.000Z",
        imagePath,
        application: { processName: "WindowsTerminal.exe" },
      });

      expect(report.kind).toBe("uncertain");
      expect(report.confidence).toBe(0.1);
      expect(report.summary).toBe(
        "Vision model returned output that could not be parsed as JSON.",
      );
      expect(report.evidence[0]).toMatchObject({
        type: "keyframe",
        ref: "snapshot.png",
        redacted: false,
      });
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });

  it("surfaces model-side errors from OpenAI-compatible responses", async () => {
    const db = await openConfiguredDb();
    const imagePath = makeSnapshot();
    const originalFetch = global.fetch;

    global.fetch = (async () =>
      new Response(
        JSON.stringify({
          error: { message: "Failed to load qwen3vl-it:4b model!" },
        }),
      )) as typeof fetch;

    try {
      await expect(
        observeUiSnapshotViaLLM(db, {
          sessionId: "session-1",
          sequence: 9,
          observedFrom: "2026-06-16T07:00:02.000Z",
          observedTo: "2026-06-16T07:00:03.000Z",
          imagePath,
          application: { processName: "WindowsTerminal.exe" },
        }),
      ).rejects.toThrow(
        "Vision model failed: Failed to load qwen3vl-it:4b model!",
      );
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });
});
