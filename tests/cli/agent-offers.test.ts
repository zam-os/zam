import { describe, expect, it } from "vitest";
import {
  CONNECT_HARNESS_LABELS,
  isConnectHarnessId,
  USER_SCOPED_CONNECT_HARNESSES,
} from "../../src/cli/agent-connect.js";
import { AGENT_OFFERS } from "../../src/cli/agent-offers.js";

describe("agent offers (ADR 2026-07-24 §6)", () => {
  it("offers all four harnesses of the ADR's agent page", () => {
    expect(AGENT_OFFERS.map((offer) => offer.id)).toEqual([
      "goose",
      "opencode",
      "copilot",
      "hermes",
    ]);
  });

  it("every offer is a valid, user-scoped connect target", () => {
    for (const offer of AGENT_OFFERS) {
      expect(isConnectHarnessId(offer.id)).toBe(true);
      // User-scoped = the idempotent connect can act on it without a
      // workspace context, which is what the onboarding page runs.
      expect(USER_SCOPED_CONNECT_HARNESSES).toContain(offer.id);
      expect(offer.label).toBe(CONNECT_HARNESS_LABELS[offer.id]);
    }
  });

  it("carries copy keys and a vendor install link per row", () => {
    for (const offer of AGENT_OFFERS) {
      expect(offer.strengthKey).toMatch(/^onboarding_agent_/);
      expect(offer.consequenceKey).toMatch(/^onboarding_agent_/);
      expect(offer.installUrl).toMatch(/^https:\/\//);
    }
  });
});
