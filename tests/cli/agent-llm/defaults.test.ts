import { describe, expect, it } from "vitest";
import {
  DEFAULT_AGENT_MODELS,
  defaultAgentModel,
  resolveAgentModelId,
} from "../../../src/cli/agent-llm/defaults.js";

describe("defaultAgentModel", () => {
  it("returns the cheap defaults Thomas asked for", () => {
    expect(defaultAgentModel("codex")).toBe("gpt-5.4-mini");
    expect(defaultAgentModel("claude-code")).toBe("haiku");
    expect(defaultAgentModel("copilot")).toBe("gpt-5.6-luna");
    expect(defaultAgentModel("antigravity")).toBe("gemini-3.5-flash");
    expect(defaultAgentModel("grok")).toBe("grok-4.5");
  });

  it("returns undefined for unknown harnesses", () => {
    expect(defaultAgentModel("opencode")).toBeUndefined();
  });
});

describe("resolveAgentModelId", () => {
  it("prefers an explicit model", () => {
    expect(resolveAgentModelId("codex", "gpt-5.4", "gpt-5.4-mini")).toBe(
      "gpt-5.4",
    );
  });

  it("keeps a previous real model when no explicit value", () => {
    expect(resolveAgentModelId("codex", "", "gpt-5.4")).toBe("gpt-5.4");
  });

  it("replaces agent: placeholders with the harness default", () => {
    expect(
      resolveAgentModelId("claude-code", undefined, "agent:claude-code"),
    ).toBe("haiku");
  });

  it("falls back to agent:<harness> only when no default exists", () => {
    expect(resolveAgentModelId("opencode", null, null)).toBe("agent:opencode");
  });

  it("exposes the full default map for Settings/docs", () => {
    expect(DEFAULT_AGENT_MODELS.codex).toBe("gpt-5.4-mini");
  });
});
