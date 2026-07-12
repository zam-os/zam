import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  ensureCard,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";
import {
  clearRecallEndpointCache,
  discussReviewViaLLM,
} from "../../src/cli/llm/client.js";

// ── discussReviewViaLLM prompt assembly (in-process, mocked fetch) ──────────

describe("discussReviewViaLLM prompt assembly", () => {
  let configDir: string;
  let previousConfigPath: string | undefined;

  beforeEach(() => {
    // Isolate from the developer's machine config so host provider roles
    // cannot leak into the test (same pattern as llm.test.ts).
    configDir = mkdtempSync(join(tmpdir(), "zam-discuss-config-"));
    const configPath = join(configDir, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify({ ai: { providers: {}, roles: {} } }),
    );
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = configPath;
    clearRecallEndpointCache();
  });

  afterEach(() => {
    if (previousConfigPath === undefined) {
      delete process.env.ZAM_CONFIG_PATH;
    } else {
      process.env.ZAM_CONFIG_PATH = previousConfigPath;
    }
    rmSync(configDir, { recursive: true, force: true });
    clearRecallEndpointCache();
  });

  async function openConfiguredDb() {
    const db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "http://localhost:9876/v1");
    await setSetting(db, "llm.model", "test-model");
    return db;
  }

  it("sends system + card frame + feedback + thread + new turn in order", async () => {
    const db = await openConfiguredDb();
    const originalFetch = global.fetch;
    let chatBody: Record<string, unknown> | undefined;

    global.fetch = (async (url: unknown, init?: RequestInit) => {
      const target = String(url);
      if (target.endsWith("/chat/completions")) {
        chatBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: "Because retrieval strengthens the trace." },
                finish_reason: "stop",
              },
            ],
          }),
        );
      }
      // Health checks (isLlmOnline / getAvailableModels) hit `${url}/models`.
      return new Response(
        JSON.stringify({ object: "list", data: [{ id: "test-model" }] }),
      );
    }) as typeof fetch;

    try {
      const result = await discussReviewViaLLM(db, {
        slug: "fsrs-stability",
        concept: "Stability is the FSRS memory half-life parameter.",
        domain: "learning-science",
        bloomLevel: 2,
        context: "Scheduling internals",
        question: "What does the stability parameter express?",
        userAnswer: "How long a memory lasts",
        sourceLinkContent: "export function nextInterval() {}",
        feedback: "Close! Stability is the interval at 90% recall.",
        thread: [
          { role: "user", content: "Why 90%?" },
          { role: "assistant", content: "It is the FSRS request retention." },
        ],
        message: "And why does it grow after each review?",
      });

      expect(result.text).toBe("Because retrieval strengthens the trace.");
      expect(result.model).toBe("test-model");

      expect(chatBody?.model).toBe("test-model");
      expect(chatBody?.max_tokens).toBe(1200);
      const messages = chatBody?.messages as Array<{
        role: string;
        content: string;
      }>;
      expect(messages.map((m) => m.role)).toEqual([
        "system",
        "user",
        "assistant",
        "user",
        "assistant",
        "user",
      ]);
      expect(messages[0].content).toContain("follow-up discussion");
      expect(messages[1].content).toContain("The card under discussion");
      expect(messages[1].content).toContain(
        "Stability is the FSRS memory half-life parameter.",
      );
      expect(messages[1].content).toContain("How long a memory lasts");
      expect(messages[1].content).toContain("export function nextInterval()");
      expect(messages[2].content).toBe(
        "Close! Stability is the interval at 90% recall.",
      );
      expect(messages[3].content).toBe("Why 90%?");
      expect(messages[5].content).toBe(
        "And why does it grow after each review?",
      );
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });

  it("skips the feedback turn when none was shown", async () => {
    const db = await openConfiguredDb();
    const originalFetch = global.fetch;
    let chatBody: Record<string, unknown> | undefined;

    global.fetch = (async (url: unknown, init?: RequestInit) => {
      const target = String(url);
      if (target.endsWith("/chat/completions")) {
        chatBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "Reply." }, finish_reason: "stop" }],
          }),
        );
      }
      return new Response(
        JSON.stringify({ object: "list", data: [{ id: "test-model" }] }),
      );
    }) as typeof fetch;

    try {
      await discussReviewViaLLM(db, {
        slug: "s",
        concept: "c",
        domain: "d",
        bloomLevel: 1,
        question: "q",
        userAnswer: "a",
        feedback: null,
        thread: [],
        message: "first follow-up",
      });

      const messages = chatBody?.messages as Array<{ role: string }>;
      expect(messages.map((m) => m.role)).toEqual(["system", "user", "user"]);
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });
});

// ── `zam bridge discuss-review` command contract (built CLI) ────────────────

describe("bridge discuss-review command", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;
  let dbPath: string;

  const REQUIRED_ARGS = [
    "--slug",
    "discuss-target",
    "--concept",
    "A concept",
    "--domain",
    "test",
    "--bloom-level",
    "1",
    "--question",
    "What is it?",
    "--user-answer",
    "My attempt",
  ];

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-discuss-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-discuss-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");
    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    dbPath = join(dataDir, "zam.db");
    const db = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
    const token = await createToken(db, {
      slug: "discuss-target",
      concept: "A concept",
      domain: "test",
      bloom_level: 1,
    });
    await ensureCard(db, token.id, "test-user");
    await setSetting(db, "user.id", "test-user");
    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function runBridge(args: string[]): unknown {
    const output = execFileSync("node", [cliPath, "bridge", ...args], {
      cwd: tempCwd,
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      encoding: "utf8",
    });
    return JSON.parse(output);
  }

  async function readSchedulingState() {
    const db = await openDatabase({ dbPath, useConfiguredCloud: false });
    const cards = await db
      .prepare(
        "SELECT id, stability, difficulty, reps, lapses, state, due_at, last_review_at FROM cards ORDER BY id",
      )
      .all();
    const reviewLogs = await db
      .prepare("SELECT COUNT(*) AS count FROM review_logs")
      .all();
    await db.close();
    return { cards, reviewLogCount: (reviewLogs[0] as { count: number }).count };
  }

  it("degrades to a typed error when the LLM integration is disabled", () => {
    const result = runBridge([
      "discuss-review",
      ...REQUIRED_ARGS,
      "--message",
      "Tell me more",
    ]);
    expect(result).toEqual({
      success: false,
      error: "LLM integration is disabled",
      reply: "",
    });
  });

  it("rejects a malformed --thread payload as JSON, not a crash", () => {
    runBridge(["setting-set", "--key", "llm.enabled", "--value", "true"]);

    const notJson = runBridge([
      "discuss-review",
      ...REQUIRED_ARGS,
      "--message",
      "m",
      "--thread",
      "not-json",
    ]) as { success: boolean; error: string };
    expect(notJson.success).toBe(false);
    expect(notJson.error).toContain("Invalid --thread");

    const badTurn = runBridge([
      "discuss-review",
      ...REQUIRED_ARGS,
      "--message",
      "m",
      "--thread",
      JSON.stringify([{ role: "system", content: "x" }]),
    ]) as { success: boolean; error: string };
    expect(badTurn.success).toBe(false);
    expect(badTurn.error).toContain("turn 0");
  });

  it("never mutates FSRS state or review logs (ADR 2026-07-06b)", async () => {
    const before = await readSchedulingState();

    runBridge([
      "discuss-review",
      ...REQUIRED_ARGS,
      "--message",
      "Tell me more",
    ]);
    runBridge(["setting-set", "--key", "llm.enabled", "--value", "true"]);
    runBridge([
      "discuss-review",
      ...REQUIRED_ARGS,
      "--message",
      "m",
      "--thread",
      "not-json",
    ]);

    const after = await readSchedulingState();
    expect(after.cards).toEqual(before.cards);
    expect(after.reviewLogCount).toBe(before.reviewLogCount);
    expect(after.reviewLogCount).toBe(0);
  });
});
