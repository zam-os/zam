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
