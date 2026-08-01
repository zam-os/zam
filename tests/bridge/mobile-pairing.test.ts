import { describe, expect, it } from "vitest";
import {
  parseZamPairPayload,
  serializeZamPairPayload,
  ZAM_PAIR_TYPE,
  ZAM_PAIR_VERSION,
  type ZamPairPayloadV1,
} from "../../src/bridge/mobile-pairing.js";

const payload: ZamPairPayloadV1 = {
  type: ZAM_PAIR_TYPE,
  version: ZAM_PAIR_VERSION,
  createdAt: "2026-07-21T20:00:00.000Z",
  database: {
    url: "libsql://learner.example.turso.io",
    token: "database-secret",
  },
  learner: { userId: "student-9" },
  llm: {
    recall: {
      enabled: true,
      url: "https://models.example/v1",
      model: "small-recall-model",
      apiFlavor: "chat-completions",
      apiKey: "model-secret",
      local: false,
    },
  },
  settings: { locale: "de" },
};

describe("mobile pairing payload", () => {
  it("round-trips the versioned QR contract", () => {
    expect(parseZamPairPayload(serializeZamPairPayload(payload))).toEqual(
      payload,
    );
  });

  it("rejects an unsupported version before credentials are used", () => {
    expect(() =>
      parseZamPairPayload({ ...payload, version: 2 }),
    ).toThrow("unsupported pairing payload");
  });

  it("rejects missing learner binding and malformed URLs", () => {
    expect(() =>
      parseZamPairPayload({ ...payload, learner: { userId: "" } }),
    ).toThrow("learner.userId");
    expect(() =>
      parseZamPairPayload({
        ...payload,
        database: { ...payload.database, url: "not-a-url" },
      }),
    ).toThrow("database.url");
  });

  it("rejects database credentials sent over insecure protocols", () => {
    expect(() =>
      parseZamPairPayload({
        ...payload,
        database: { ...payload.database, url: "http://database.example" },
      }),
    ).toThrow("database.url must use libsql or https");
  });

  it("rejects payloads that cannot fit in one pairing QR code", () => {
    expect(() =>
      parseZamPairPayload({
        ...payload,
        database: { ...payload.database, token: "x".repeat(2_000) },
      }),
    ).toThrow("pairing payload is too large");
  });
});

describe("speech endpoints in the pairing contract", () => {
  const speech = {
    enabled: true,
    url: "https://speech.example/v1",
    model: "whisper-large-v3-turbo",
    apiFlavor: "chat-completions" as const,
    apiKey: "speech-secret",
    local: false,
  };

  it("round-trips speech endpoints alongside recall", () => {
    const parsed = parseZamPairPayload({
      ...payload,
      llm: { ...payload.llm, stt: speech, tts: { ...speech, model: "tts-1" } },
    });

    expect(parsed.llm?.stt?.model).toBe("whisper-large-v3-turbo");
    expect(parsed.llm?.tts?.model).toBe("tts-1");
    expect(parsed.llm?.recall?.model).toBe("small-recall-model");
  });

  it("accepts speech without a recall model", () => {
    // The three are independent: a learner can have a speech model and no
    // pairable recall model, and losing voice mode over that would be absurd.
    const parsed = parseZamPairPayload({ ...payload, llm: { stt: speech } });

    expect(parsed.llm?.recall).toBeUndefined();
    expect(parsed.llm?.stt?.model).toBe("whisper-large-v3-turbo");
  });

  it("drops an llm block whose every member is missing", () => {
    // Otherwise `payload.llm` is truthy while nothing is paired — the exact
    // shape callers read as "something was paired".
    expect(parseZamPairPayload({ ...payload, llm: {} }).llm).toBeUndefined();
  });

  it("names the offending capability when a speech endpoint is malformed", () => {
    expect(() =>
      parseZamPairPayload({
        ...payload,
        llm: { ...payload.llm, tts: { ...speech, url: "not-a-url" } },
      }),
    ).toThrow(/llm\.tts\.url/);
  });
});
