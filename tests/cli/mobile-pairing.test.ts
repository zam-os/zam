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
});
