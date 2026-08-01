import { describe, expect, it } from "vitest";
import {
  BITWARDEN_EU_SIGNUP_URL,
  BITWARDEN_US_SIGNUP_URL,
  bitwardenSignupUrl,
  buildOnboardingSteps,
  deriveOnboardingChecklist,
  isAmbiguousBitwardenRegion,
  ONBOARDING_CHECKLIST_ITEMS,
  preferBitwardenEuRegion,
  resolveBitwardenCloudRegion,
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

  it("offers multi-machine secrets as a skippable late step, not a checklist nag", () => {
    const steps = buildOnboardingSteps(FLOW_CONTEXT, {
      openExternal() {},
      goToStep() {},
      openContentEntry() {},
    });
    const secrets = steps.find((step) => step.id === "secrets");
    expect(secrets).toBeDefined();
    expect(secrets?.skippable).toBe(true);
    // Immediately before done — after essentials, never blocking first use.
    const ids = steps.map((step) => step.id);
    expect(ids.indexOf("secrets")).toBe(ids.indexOf("done") - 1);
    // No dashboard checklist row: multi-machine is optional forever, not a gap.
    expect(ONBOARDING_CHECKLIST_ITEMS.map((item) => item.id)).not.toContain(
      "secrets",
    );
  });
});

describe("Bitwarden cloud region for onboarding links", () => {
  it("sends Europe-based learners to vault.bitwarden.eu", () => {
    expect(
      preferBitwardenEuRegion({ timeZone: "Europe/Berlin", language: "en" }),
    ).toBe(true);
    expect(
      bitwardenSignupUrl({ timeZone: "Europe/Paris", language: "fr" }),
    ).toBe(BITWARDEN_EU_SIGNUP_URL);
    expect(
      preferBitwardenEuRegion({ timeZone: "Atlantic/Canary", language: "es" }),
    ).toBe(true);
  });

  it("uses German UI language as an EU hint without a Europe timezone", () => {
    expect(
      preferBitwardenEuRegion({ timeZone: "UTC", language: "de" }),
    ).toBe(true);
    expect(bitwardenSignupUrl({ timeZone: "UTC", language: "de-DE" })).toBe(
      BITWARDEN_EU_SIGNUP_URL,
    );
  });

  it("keeps US (and non-EU) learners on vault.bitwarden.com", () => {
    expect(
      preferBitwardenEuRegion({
        timeZone: "America/New_York",
        language: "en",
      }),
    ).toBe(false);
    expect(
      bitwardenSignupUrl({ timeZone: "America/Sao_Paulo", language: "pt" }),
    ).toBe(BITWARDEN_US_SIGNUP_URL);
    // French UI alone is not enough (Canada); timezone must say Europe.
    expect(
      preferBitwardenEuRegion({ timeZone: "America/Toronto", language: "fr" }),
    ).toBe(false);
    expect(
      isAmbiguousBitwardenRegion({
        timeZone: "America/New_York",
        language: "en",
      }),
    ).toBe(false);
    expect(
      resolveBitwardenCloudRegion({
        timeZone: "America/New_York",
        language: "en",
      }),
    ).toBe("us");
  });

  it("asks when detection is ambiguous (e.g. UTC + English)", () => {
    expect(
      isAmbiguousBitwardenRegion({ timeZone: "UTC", language: "en" }),
    ).toBe(true);
    expect(
      resolveBitwardenCloudRegion({ timeZone: "UTC", language: "en" }),
    ).toBeNull();
    // Learner answer wins over ambiguity.
    expect(
      resolveBitwardenCloudRegion({
        timeZone: "UTC",
        language: "en",
        choice: "eu",
      }),
    ).toBe("eu");
    expect(
      bitwardenSignupUrl({
        timeZone: "UTC",
        language: "en",
        choice: "eu",
      }),
    ).toBe(BITWARDEN_EU_SIGNUP_URL);
  });

  it("does not ask when Europe or German UI is already clear", () => {
    expect(
      isAmbiguousBitwardenRegion({
        timeZone: "Europe/Berlin",
        language: "en",
      }),
    ).toBe(false);
    expect(
      isAmbiguousBitwardenRegion({ timeZone: "UTC", language: "de" }),
    ).toBe(false);
    expect(
      resolveBitwardenCloudRegion({ timeZone: "UTC", language: "de" }),
    ).toBe("eu");
  });
});
