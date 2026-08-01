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
    expect(payload.llm?.recall?.apiKey).toBeUndefined();
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

    expect(payload.llm?.recall?.model).toBe("recall-small");
    expect(payload.llm?.recall?.url).toBe("https://models.example/v1");
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

    expect(payload.llm?.recall?.label).toBe("Primary cloud");
    expect(payload.llm?.recall?.fallback?.label).toBe("Backup cloud");
  });
});

// Voice mode's cloud tier on a companion. The model registry these come from
// is machine-local config on the desktop, which the synced database never
// carries, so the pairing code is the only path a phone has to them.
describe("speech endpoints for voice mode", () => {
  const sttProvider: ProviderConfig = {
    ...recallProvider,
    label: "Whisper turbo",
    model: "whisper-large-v3-turbo",
  };
  const ttsProvider: ProviderConfig = {
    ...recallProvider,
    label: "Speech",
    model: "tts-1-hd",
  };

  const pair = (input: Partial<Parameters<typeof createMobilePairingPayload>[0]>) =>
    createMobilePairingPayload({
      databaseUrl: "libsql://example.turso.io",
      databaseToken: "database-secret",
      userId: "student-9",
      recallProvider,
      createdAt: "2026-08-01T09:00:00.000Z",
      ...input,
    });

  it("carries both speech capabilities through the wire contract", () => {
    const parsed = parseZamPairPayload(pair({ sttProvider, ttsProvider }));

    expect(parsed.llm?.stt?.model).toBe("whisper-large-v3-turbo");
    expect(parsed.llm?.tts?.model).toBe("tts-1-hd");
  });

  it("skips an anthropic-shaped speech entry rather than pairing a certain failure", () => {
    // Audio routes exist only in the OpenAI shape; such an entry is a
    // misconfiguration, and a device could only ever fail on it.
    const payload = pair({
      sttProvider: { ...sttProvider, apiFlavor: "anthropic-messages" },
      ttsProvider,
    });

    expect(payload.llm?.stt).toBeUndefined();
    expect(payload.llm?.tts).toBeDefined();
  });

  it("skips a harness-backed speech head and pairs the endpoint behind it", () => {
    const payload = pair({
      sttProvider: {
        ...sttProvider,
        transport: "agent",
        agentHarness: "grok-cli",
        fallback: { ...sttProvider, label: "Hosted whisper" },
      },
    });

    expect(payload.llm?.stt?.label).toBe("Hosted whisper");
  });

  it("projects speech endpoints without their fallback chain", () => {
    // Head-only is a deliberate budget decision: a second speech model is a
    // far smaller loss than a pairing code that will not scan.
    const payload = pair({
      sttProvider: { ...sttProvider, fallback: { ...sttProvider, label: "B" } },
    });

    expect(payload.llm?.stt?.fallback).toBeUndefined();
  });

  it("omits speech when nothing is configured, leaving the device tier alone", () => {
    const payload = pair({ sttProvider: null, ttsProvider: null });

    expect(payload.llm?.stt).toBeUndefined();
    expect(payload.llm?.tts).toBeUndefined();
    expect(payload.llm?.recall).toBeDefined();
  });

  it("drops text-to-speech first when the QR budget is exceeded", () => {
    // Every device has a serviceable built-in voice; on-device *recognition*
    // is the half that is genuinely behind, so it is the last speech member
    // to go.
    const key = "k".repeat(850);
    const payload = pair({
      sttProvider: { ...sttProvider, apiKey: key },
      ttsProvider: { ...ttsProvider, apiKey: key },
    });

    expect(payload.llm?.stt).toBeDefined();
    expect(payload.llm?.tts).toBeUndefined();
    // Still a scannable code, which is the whole point of dropping anything.
    expect(() => parseZamPairPayload(payload)).not.toThrow();
  });

  it("keeps recall when neither speech endpoint fits", () => {
    const key = "k".repeat(1600);
    const payload = pair({
      sttProvider: { ...sttProvider, apiKey: key },
      ttsProvider: { ...ttsProvider, apiKey: key },
    });

    expect(payload.llm?.stt).toBeUndefined();
    expect(payload.llm?.tts).toBeUndefined();
    expect(payload.llm?.recall?.model).toBe("recall-small");
  });
});
