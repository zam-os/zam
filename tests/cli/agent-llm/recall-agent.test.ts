import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentTextAdapter } from "../../../src/cli/agent-llm/adapter.js";

// Mock the adapter lookup so recall exercises the full resolution + agent-branch
// wiring without spawning a real `claude`.
vi.mock("../../../src/cli/agent-llm/adapter.js", async (importActual) => {
  const actual =
    await importActual<
      typeof import("../../../src/cli/agent-llm/adapter.js")
    >();
  return { ...actual, getAgentAdapter: vi.fn() };
});

import { getAgentAdapter } from "../../../src/cli/agent-llm/adapter.js";
import {
  discussReviewViaLLM,
  evaluateAnswerViaLLM,
  generateQuestionViaLLM,
  sampleViaLocalLLM,
} from "../../../src/cli/llm/client.js";
import {
  type CapabilityFlags,
  type ModelEntry,
  openDatabase,
  saveMachineAiModels,
  setSetting,
} from "../../../src/kernel/index.js";

function textCaps(): CapabilityFlags {
  return {
    text: true,
    embedding: false,
    image: false,
    video: false,
    stt: false,
    tts: false,
  };
}

function agentEntry(): ModelEntry {
  return {
    id: "agent-claude",
    label: "Claude Code",
    url: "",
    model: "",
    local: false,
    apiFlavor: "chat-completions",
    order: 0,
    capabilities: textCaps(),
    detectedCapabilities: textCaps(),
    transport: "agent",
    agentHarness: "claude-code",
  };
}

function fakeAdapter(generate: AgentTextAdapter["generate"]): AgentTextAdapter {
  return {
    harness: "claude-code",
    probe: async () => ({ harness: "claude-code", available: true }),
    generate,
  };
}

async function seedDb() {
  const db = await openDatabase({
    dbPath: ":memory:",
    initialize: true,
    useConfiguredCloud: false,
  });
  await setSetting(db, "llm.enabled", "true");
  saveMachineAiModels([agentEntry()]);
  return db;
}

let machineConfigDir: string;
let previousZamConfigPath: string | undefined;

beforeEach(() => {
  machineConfigDir = mkdtempSync(join(tmpdir(), "zam-recall-agent-"));
  previousZamConfigPath = process.env.ZAM_CONFIG_PATH;
  process.env.ZAM_CONFIG_PATH = join(machineConfigDir, "config.json");
  vi.mocked(getAgentAdapter).mockReset();
});

afterEach(() => {
  if (previousZamConfigPath === undefined) delete process.env.ZAM_CONFIG_PATH;
  else process.env.ZAM_CONFIG_PATH = previousZamConfigPath;
  rmSync(machineConfigDir, { recursive: true, force: true });
});

describe("recall via the agent transport", () => {
  it("generates a dynamic question through the harness", async () => {
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async () => ({ text: "Was ist die Hauptstadt von Bayern?" })),
    );
    const db = await seedDb();

    const result = await generateQuestionViaLLM(db, {
      slug: "bayern-hauptstadt",
      concept: "München",
      domain: "Geografie",
      bloomLevel: 1,
    });

    expect(result.text).toBe("Was ist die Hauptstadt von Bayern?");
    expect(vi.mocked(getAgentAdapter)).toHaveBeenCalledWith("claude-code");
  });

  it("evaluates a learner answer through the harness", async () => {
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async () => ({ text: "Stark! Vorgeschlagene Bewertung: 3" })),
    );
    const db = await seedDb();

    const result = await evaluateAnswerViaLLM(db, {
      slug: "bayern-hauptstadt",
      concept: "München",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Bayern?",
      userAnswer: "München",
    });

    expect(result.text).toContain("Bewertung: 3");
  });

  it("flattens the discussion thread into one transcript prompt", async () => {
    let seenUser = "";
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async (req) => {
        seenUser = req.user;
        return { text: "Gute Frage — München liegt an der Isar." };
      }),
    );
    const db = await seedDb();

    const result = await discussReviewViaLLM(db, {
      slug: "bayern-hauptstadt",
      concept: "München",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Bayern?",
      userAnswer: "München",
      feedback: "Richtig, München ist die Hauptstadt.",
      thread: [{ role: "user", content: "An welchem Fluss liegt sie?" }],
      message: "Und wie viele Einwohner?",
    });

    expect(result.text).toContain("Isar");
    // The flattened transcript must carry the prior turn and the newest message.
    expect(seenUser).toContain("An welchem Fluss liegt sie?");
    expect(seenUser).toContain("Und wie viele Einwohner?");
    expect(seenUser).toContain("Richtig, München ist die Hauptstadt.");
  });

  it("rejects the agent transport for recall callers not wired for it", async () => {
    const db = await seedDb();

    await expect(
      sampleViaLocalLLM(db, [{ role: "user", content: "hi" }]),
    ).rejects.toThrow(/agent transport/i);
  });
});
