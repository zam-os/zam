import { describe, expect, it } from "vitest";
import {
  buildOnboardingSteps,
  CONTENT_PATHS,
  FREE_CONTENT_PATHS,
  type OnboardingStepContext,
  orderContentPaths,
  orderFreeContentPaths,
} from "../../desktop/src/onboarding.js";
import { PERSONA_DESCRIPTORS } from "../../src/kernel/index.js";

const MOCK_CTX: OnboardingStepContext = {
  personas: [],
  selectedPersonaId: "private",
  cloudProviders: [],
  localAiCapable: false,
  aiConnected: false,
  embedding: {
    ollamaInstalled: false,
    serverOnline: false,
    modelPresent: false,
    registered: false,
    usable: false,
  },
  agentOffers: [],
  workspaceDir: "",
  activeWorkspaceId: "",
  workspaceStructure: { dirExists: true, missing: [], complete: true },
  hasNonAcademyCurriculumCells: true,
};

// Plan Phase 8 (ADR 2026-07-24 §2): the persona routes to a default import
// path but locks nothing — every path stays offered for every persona.
describe("persona content routing", () => {
  it("covers every persona default with a content-path row", () => {
    const pathIds = new Set(CONTENT_PATHS.map((path) => path.id));
    for (const persona of PERSONA_DESCRIPTORS) {
      expect(pathIds.has(persona.defaultImportPath)).toBe(true);
    }
  });

  it("routes each persona's default first while keeping all paths", () => {
    for (const persona of PERSONA_DESCRIPTORS) {
      const ordered = orderContentPaths(persona.defaultImportPath);
      expect(ordered[0].id).toBe(persona.defaultImportPath);
      expect(ordered.map((path) => path.id).sort()).toEqual(
        CONTENT_PATHS.map((path) => path.id).sort(),
      );
    }
  });

  it("falls back to the canonical order for an unknown default", () => {
    expect(orderContentPaths("nonsense")).toEqual(CONTENT_PATHS);
  });

  it("wires actions to existing entry points, never new import machinery", () => {
    for (const path of CONTENT_PATHS) {
      if (path.action.kind === "entry") {
        expect(["curriculum", "free-import"]).toContain(path.action.entry);
      } else {
        // Step targets must exist in the flow (agent page, topic page).
        expect(["agent", "topic"]).toContain(path.action.step);
      }
    }
  });

  it("shows Free content paths and drops curriculum once all cells live in ZAM Academy", () => {
    expect(FREE_CONTENT_PATHS.map((p) => p.id)).toEqual([
      "academy",
      "curriculum",
      "free-import",
    ]);
    expect(orderFreeContentPaths("curriculum", true).map((p) => p.id)).toEqual([
      "curriculum",
      "academy",
      "free-import",
    ]);
    expect(orderFreeContentPaths("curriculum", false).map((p) => p.id)).toEqual(
      ["academy", "free-import"],
    );
    expect(
      orderFreeContentPaths("free-import", false).map((p) => p.id),
    ).toEqual(["free-import", "academy"]);
  });

  it("separates onboarding into Free, AI Setup, and Agentic Coding Alpha flows", () => {
    const actions = {
      openExternal() {},
      goToStep() {},
      openContentEntry() {},
      isLeaving: () => false,
    };
    expect(
      buildOnboardingSteps(MOCK_CTX, actions, "free").map((s) => s.id),
    ).toEqual(["welcome", "persona", "content", "done"]);
    expect(
      buildOnboardingSteps(MOCK_CTX, actions, "ai").map((s) => s.id),
    ).toEqual(["model", "done"]);
    expect(
      buildOnboardingSteps(MOCK_CTX, actions, "agentic").map((s) => s.id),
    ).toEqual(["agentic-intro", "workspace", "agent", "done"]);
  });
});
