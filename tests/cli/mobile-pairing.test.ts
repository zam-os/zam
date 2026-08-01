import { describe, expect, it } from "vitest";
import {
  parseZamPairPayload,
  ZAM_PAIR_MAX_BYTES,
} from "../../src/bridge/mobile-pairing.js";
import { createMobilePairingPayload } from "../../src/cli/mobile-pairing.js";

const input = {
  databaseUrl: "libsql://learner.example.turso.io",
  databaseToken: "database-secret",
  userId: "student-9",
  locale: "de",
  createdAt: "2026-08-01T09:00:00.000Z",
};

describe("mobile pairing payload projection", () => {
  it("binds one learner to one server database", () => {
    expect(parseZamPairPayload(createMobilePairingPayload(input))).toMatchObject(
      {
        database: {
          url: "libsql://learner.example.turso.io",
          token: "database-secret",
        },
        learner: { userId: "student-9" },
        settings: { locale: "de" },
      },
    );
  });

  // ADR 2026-07-23 decision 5. Cloud models live in the learner database
  // (decision 4), so a companion loads them once online. Embedding them here
  // is what forced a re-pair after every model change in 0.24–0.25, and what
  // put an API key into something a bystander can photograph.
  it("carries no model configuration at all", () => {
    const payload = createMobilePairingPayload(input);

    expect(payload.llm).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("apiKey");
  });

  it("omits the locale rather than inventing one", () => {
    // The database is the authority on the learner's language; a guess here
    // would be a snapshot that silently outlives the setting it copied.
    const payload = createMobilePairingPayload({ ...input, locale: undefined });

    expect(payload.settings).toBeUndefined();
  });

  it("stays far inside the QR budget whatever is configured", () => {
    // The payload no longer grows with the model list, so this is now a
    // property of the contract rather than something to degrade against.
    const bytes = new TextEncoder().encode(
      JSON.stringify(createMobilePairingPayload(input)),
    ).byteLength;

    expect(bytes).toBeLessThan(ZAM_PAIR_MAX_BYTES / 2);
  });
});

describe("payloads from before the split", () => {
  // 0.24–0.25 embedded the recall endpoint. Such a code must still scan, and
  // the companion still reads it, so upgrading the phone before the desktop
  // does not take evaluation away mid-field-test.
  it("still parses an embedded recall endpoint", () => {
    const legacy = {
      ...createMobilePairingPayload(input),
      llm: {
        recall: {
          enabled: true,
          url: "https://models.example/v1",
          model: "recall-small",
          apiFlavor: "chat-completions" as const,
          apiKey: "model-secret",
          local: false,
        },
      },
    };

    expect(parseZamPairPayload(legacy).llm?.recall?.model).toBe("recall-small");
  });
});
