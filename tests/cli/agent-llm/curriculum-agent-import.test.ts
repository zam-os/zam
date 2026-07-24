import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentTextAdapter } from "../../../src/cli/agent-llm/adapter.js";

// Mock only the adapter lookup so the test exercises the full resolution +
// curriculum-parse wiring without spawning a real `claude`. The concrete
// ClaudeCodeAdapter is covered by claude-code.test.ts.
vi.mock("../../../src/cli/agent-llm/adapter.js", async (importActual) => {
  const actual =
    await importActual<
      typeof import("../../../src/cli/agent-llm/adapter.js")
    >();
  return { ...actual, getAgentAdapter: vi.fn() };
});

import { getAgentAdapter } from "../../../src/cli/agent-llm/adapter.js";
import {
  generateGoalDecompositionViaLLM,
  importCurriculumViaLLM,
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

/** An `agent`-transport registry entry backed by Claude Code. */
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

/** A fake adapter driving `generate` with the given implementation. */
function fakeAdapter(generate: AgentTextAdapter["generate"]): AgentTextAdapter {
  return {
    harness: "claude-code",
    probe: async () => ({ harness: "claude-code", available: true }),
    generate,
  };
}

const CANNED_CARDS = JSON.stringify([
  {
    question: "What is 2 + 2?",
    concept: "4",
    title: "Addition of small integers",
    domain: "Mathematik",
    context: "Basic arithmetic sums.",
    bloom_level: 1,
    symbiosis_mode: "shadowing",
  },
]);

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
  machineConfigDir = mkdtempSync(join(tmpdir(), "zam-agent-import-"));
  previousZamConfigPath = process.env.ZAM_CONFIG_PATH;
  process.env.ZAM_CONFIG_PATH = join(machineConfigDir, "config.json");
  vi.mocked(getAgentAdapter).mockReset();
});

afterEach(() => {
  if (previousZamConfigPath === undefined) delete process.env.ZAM_CONFIG_PATH;
  else process.env.ZAM_CONFIG_PATH = previousZamConfigPath;
  rmSync(machineConfigDir, { recursive: true, force: true });
});

describe("curriculum import via the agent transport", () => {
  it("parses proposals from the harness response", async () => {
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async () => ({ text: CANNED_CARDS })),
    );
    const db = await seedDb();

    const proposals = await importCurriculumViaLLM(
      db,
      "Add two-digit numbers.",
      "Mathematik",
      "https://example.test/plan",
    );

    expect(proposals).toHaveLength(1);
    expect(proposals[0]).toMatchObject({
      question: "What is 2 + 2?",
      concept: "4",
      domain: "Mathematik",
      source_link: "https://example.test/plan",
    });
    expect(vi.mocked(getAgentAdapter)).toHaveBeenCalledWith("claude-code");
  });

  it("passes the curriculum system and user prompts to the adapter", async () => {
    let seen: { system: string; user: string } | undefined;
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async (req) => {
        seen = { system: req.system, user: req.user };
        return { text: CANNED_CARDS };
      }),
    );
    const db = await seedDb();

    await importCurriculumViaLLM(db, "Add two-digit numbers.", "Mathematik");

    expect(seen?.system).toContain("curriculum parser");
    expect(seen?.user).toContain("Add two-digit numbers.");
  });

  it("propagates a harness failure instead of silently falling back", async () => {
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async () => {
        throw new Error("Claude Code is offline");
      }),
    );
    const db = await seedDb();

    await expect(
      importCurriculumViaLLM(db, "Add two-digit numbers.", "Mathematik"),
    ).rejects.toThrow(/claude code is offline/i);
  });

  it("rejects the agent transport for text callers not yet wired for it", async () => {
    const db = await seedDb();

    await expect(
      generateGoalDecompositionViaLLM(db, {
        title: "Learn calculus",
        description: "",
        path: [],
      }),
    ).rejects.toThrow(/agent transport/i);
  });
});
