import { describe, expect, it } from "vitest";
import { parseZamPairPayload } from "../../src/bridge/mobile-pairing.js";
import { createMobilePairingPayload } from "../../src/cli/mobile-pairing.js";
import type { ProviderConfig } from "../../src/cli/llm/client.js";

const recallProvider: ProviderConfig = {
  enabled: true,
  url: "https://models.example/v1",
  model: "recall-small",
  apiKey: "model-secret",
  apiFlavor: "chat-completions",
  locale: "de",
  source: "machine",
  local: false,
  label: "Recall",
};

describe("mobile pairing payload projection", () => {
  it("binds one learner and carries the configured recall endpoint", () => {
    const payload = createMobilePairingPayload({
      databaseUrl: "libsql://learner.example.turso.io",
      databaseToken: "database-secret",
      userId: "student-9",
      recallProvider,
      createdAt: "2026-07-21T20:00:00.000Z",
    });

    expect(parseZamPairPayload(payload)).toMatchObject({
      learner: { userId: "student-9" },
      llm: {
        recall: {
          model: "recall-small",
          apiKey: "model-secret",
        },
      },
      settings: { locale: "de" },
    });
  });

  it("omits disabled LLM credentials while preserving locale", () => {
    const payload = createMobilePairingPayload({
      databaseUrl: "libsql://learner.example.turso.io",
      databaseToken: "database-secret",
      userId: "student-9",
      recallProvider: { ...recallProvider, enabled: false },
    });

    expect(payload.llm).toBeUndefined();
    expect(payload.settings).toEqual({ locale: "de" });
  });

  it("pairs a keyless local recall provider without an API key", () => {
    const payload = createMobilePairingPayload({
      databaseUrl: "libsql://learner.example.turso.io",
      databaseToken: "database-secret",
      userId: "student-9",
      recallProvider: {
        ...recallProvider,
        url: "http://127.0.0.1:8000/v1",
        model: "field-test-local",
        apiKey: "",
        local: true,
      },
    });

    expect(payload.llm?.recall).toMatchObject({
      model: "field-test-local",
      local: true,
    });
    expect(payload.llm?.recall.apiKey).toBeUndefined();
  });
});

// Reported 2026-07-31: an iPad 9 could not evaluate answers although a cloud
// model was configured. The learner's #1 recall model was Grok via a local CLI
// — an agent-transport entry. materializeModelEntry defaults a `url` onto such
// entries and the desktop ignores it, but the projection carried it anyway, so
// the tablet saw a normal-looking HTTP endpoint it could never call.
describe("agent-transport endpoints are not pairable", () => {
  const agentProvider: ProviderConfig = {
    ...recallProvider,
    label: "Grok (CLI)",
    model: "grok-4",
    transport: "agent",
    agentHarness: "grok-cli",
  };

  it("skips a harness-backed head and pairs the model behind it", () => {
    const payload = createMobilePairingPayload({
      databaseUrl: "libsql://example.turso.io",
      databaseToken: "database-secret",
      userId: "student-9",
      recallProvider: { ...agentProvider, fallback: recallProvider },
    });

    expect(payload.llm?.recall.model).toBe("recall-small");
    expect(payload.llm?.recall.url).toBe("https://models.example/v1");
  });

  it("omits the model entirely when the whole chain is harness-backed", () => {
    const payload = createMobilePairingPayload({
      databaseUrl: "libsql://example.turso.io",
      databaseToken: "database-secret",
      userId: "student-9",
      recallProvider: {
        ...agentProvider,
        fallback: { ...agentProvider, label: "Claude Code" },
      },
    });

    // A model that looks present and always fails is worse than none: the
    // companion already handles "no paired model" by self-rating.
    expect(payload.llm).toBeUndefined();
  });

  it("drops a harness-backed link from the middle of a chain", () => {
    const payload = createMobilePairingPayload({
      databaseUrl: "libsql://example.turso.io",
      databaseToken: "database-secret",
      userId: "student-9",
      recallProvider: {
        ...recallProvider,
        label: "Primary cloud",
        fallback: {
          ...agentProvider,
          fallback: { ...recallProvider, label: "Backup cloud" },
        },
      },
    });

    expect(payload.llm?.recall.label).toBe("Primary cloud");
    expect(payload.llm?.recall.fallback?.label).toBe("Backup cloud");
  });
});
