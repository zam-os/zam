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
  AGENT_CURRICULUM_IMPORT_TIMEOUT_MS,
  generateTopicCardsViaLLM,
  proposeSubtopicsViaLLM,
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

  // 2026-09-23: a goal import through Claude Code hit the adapter's 120 s
  // default before a single card came back.
  it("gives the harness the curriculum-import budget, not the adapter default", async () => {
    let timeoutMs: number | undefined;
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async (req) => {
        timeoutMs = req.timeoutMs;
        return { text: CANNED_CARDS };
      }),
    );
    const db = await seedDb();

    await importCurriculumViaLLM(db, "Add two-digit numbers.", "Mathematik");

    expect(timeoutMs).toBe(AGENT_CURRICULUM_IMPORT_TIMEOUT_MS);
    expect(timeoutMs).toBeGreaterThan(120_000);
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
});

// Issue #224: onboarding's model page can connect an agent, so the topic step
// after it has to accept one. Before this was wired, picking Claude Code
// during first run made the goal decomposition (now the subtopic proposals)
// fail with "does not support yet".
describe("subtopic proposals via the agent transport", () => {
  const CANNED_TOPICS = JSON.stringify([
    { label: "Limits", description: "Understand what a limit expresses." },
    { label: "Derivatives", description: "Rate of change of a function." },
    { label: "Integrals", description: "Accumulated area under a curve." },
  ]);

  it("parses decomposition options from the harness response", async () => {
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async () => ({ text: CANNED_TOPICS })),
    );
    const db = await seedDb();

    const options = await proposeSubtopicsViaLLM(db, {
      title: "Learn calculus",
      context: "To follow a physics course",
      path: [],
    });

    expect(options).toHaveLength(3);
    expect(options[0]).toMatchObject({ label: "Limits" });
    expect(vi.mocked(getAgentAdapter)).toHaveBeenCalledWith("claude-code");
  });

  it("sends the topic, its context and the focused path to the adapter", async () => {
    let seen: { system: string; user: string } | undefined;
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async (req) => {
        seen = { system: req.system, user: req.user };
        return { text: CANNED_TOPICS };
      }),
    );
    const db = await seedDb();

    await proposeSubtopicsViaLLM(db, {
      title: "Learn calculus",
      context: "To follow a physics course",
      path: ["Derivatives"],
      place: ["Natur", "Mathematik"],
    });

    expect(seen?.system).toContain("learning-path planner");
    // The model keeps to what the topic names; the context narrows it and
    // says where to start, but never becomes content (ADR 2026-10-14,
    // Decision 1). A label never names the field the learner knows.
    expect(seen?.system).toContain("indispensable for understanding");
    expect(seen?.system).toContain("never content");
    expect(seen?.system).toContain("a bridge, not proof");
    expect(seen?.system).toContain("never the related field the learner knows");
    expect(seen?.system).toContain("says nothing about what the learner knows");
    expect(seen?.user).toContain("Learn calculus");
    expect(seen?.user).toContain("To follow a physics course");
    // The place is a line of its own, not part of the learner's context.
    expect(seen?.user).toContain(
      "Where the cards will land in the learner's knowledge atlas: Natur › Mathematik",
    );
    expect(seen?.user).toContain(
      "The learner drilled into this path, from the topic down: Derivatives",
    );
  });

  it("drafts cards for one subtopic, bridging to a known field only on single cards", async () => {
    const systems: string[] = [];
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async (req) => {
        systems.push(req.system);
        return { text: CANNED_CARDS };
      }),
    );
    const db = await seedDb();
    const topic = { label: "Derivatives", description: "Rate of change." };

    const cards = await generateTopicCardsViaLLM(db, {
      title: "Learn calculus",
      context: "I studied physics.",
      path: [],
      topic,
    });

    expect(cards).toHaveLength(1);
    expect(cards[0].source_link).toBeNull();
    expect(systems[0]).toContain("for that subtopic only");
    expect(systems[0]).toContain("an overview card lists names only");
    expect(systems[0]).toContain("an overview card's answer never does");
    expect(systems[0]).toContain(
      "never merely restate the subtopic's description as a question",
    );
    expect(systems[0]).toContain(
      '"context": The label of the subtopic the card belongs to.',
    );

    await generateTopicCardsViaLLM(db, {
      title: "Learn calculus",
      context: "",
      path: [],
      topic,
    });
    expect(systems[1]).not.toContain("as a bridge");
    expect(systems[1]).toContain("assume no prior knowledge");
  });

  it("starts from the foundations when the learner gave no context", async () => {
    let seen: { system: string; user: string } | undefined;
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async (req) => {
        seen = { system: req.system, user: req.user };
        return { text: CANNED_TOPICS };
      }),
    );
    const db = await seedDb();

    await proposeSubtopicsViaLLM(db, {
      title: "Learn calculus",
      context: "  ",
      path: [],
    });

    expect(seen?.system).toContain("assume no prior knowledge");
    expect(seen?.system).not.toContain("a bridge, not proof");
    expect(seen?.system).not.toContain("atlas place");
    expect(seen?.user).not.toContain("Context, prior knowledge");
  });

  it("propagates a harness failure instead of silently falling back", async () => {
    vi.mocked(getAgentAdapter).mockReturnValue(
      fakeAdapter(async () => {
        throw new Error("Claude Code is offline");
      }),
    );
    const db = await seedDb();

    await expect(
      proposeSubtopicsViaLLM(db, {
        title: "Learn calculus",
        context: "",
        path: [],
      }),
    ).rejects.toThrow(/claude code is offline/i);
  });
});
