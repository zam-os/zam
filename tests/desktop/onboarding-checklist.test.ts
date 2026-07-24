import { describe, expect, it } from "vitest";
import {
  buildOnboardingSteps,
  deriveOnboardingChecklist,
  ONBOARDING_CHECKLIST_ITEMS,
  type OnboardingChecklistState,
  type OnboardingStepContext,
} from "../../desktop/src/onboarding.js";

// Plan Phase 9 (ADR 2026-07-24 §7): skipped pages surface on the dashboard
// as actionable checklist rows instead of an empty 0-due state; each row
// reopens the flow at the page that resolves it.

const ALL_DONE: OnboardingChecklistState = {
  aiConnected: true,
  agentConfigured: true,
  workspaceStructure: { dirExists: true, missing: [], complete: true },
  cardsInDeck: 12,
};

const FLOW_CONTEXT: OnboardingStepContext = {
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
};

describe("dashboard onboarding checklist", () => {
  it("hides entirely when every signal reports done", () => {
    expect(deriveOnboardingChecklist(ALL_DONE)).toEqual([]);
  });

  it("surfaces exactly the row a missing signal calls for", () => {
    const ids = (state: OnboardingChecklistState) =>
      deriveOnboardingChecklist(state).map((item) => item.id);

    expect(ids({ ...ALL_DONE, aiConnected: false })).toEqual(["model"]);
    expect(ids({ ...ALL_DONE, agentConfigured: false })).toEqual(["agent"]);
    expect(
      ids({
        ...ALL_DONE,
        workspaceStructure: {
          dirExists: true,
          missing: ["skills"],
          complete: false,
        },
      }),
    ).toEqual(["workspace"]);
    expect(ids({ ...ALL_DONE, cardsInDeck: 0 })).toEqual(["content"]);
  });

  it("treats unknown probes as no claim, never as a gap", () => {
    expect(
      deriveOnboardingChecklist({
        ...ALL_DONE,
        agentConfigured: null,
        workspaceStructure: null,
        cardsInDeck: null,
      }),
    ).toEqual([]);
  });

  it("lists a fully degraded install in display order", () => {
    const items = deriveOnboardingChecklist({
      aiConnected: false,
      agentConfigured: false,
      workspaceStructure: { dirExists: false, missing: [], complete: false },
      cardsInDeck: 0,
    });
    expect(items.map((item) => item.id)).toEqual([
      "model",
      "agent",
      "workspace",
      "content",
    ]);
  });

  it("links every row back to an existing flow step", () => {
    const steps = buildOnboardingSteps(FLOW_CONTEXT, {
      openExternal() {},
      goToStep() {},
      openContentEntry() {},
    });
    const stepIds = new Set(steps.map((step) => step.id));
    for (const item of ONBOARDING_CHECKLIST_ITEMS) {
      expect(stepIds.has(item.step)).toBe(true);
    }
  });
});
