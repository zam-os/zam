import { describe, expect, it } from "vitest";
import {
  CLOUD_MODELS_SETTING as DESKTOP_SETTING,
  type ResolvedModelEntry,
} from "../../src/cli/llm/model-registry.js";
import type { Database } from "../../src/kernel/db/types.js";
import {
  CLOUD_MODELS_SETTING,
  resolveMobileCloudChain,
} from "../../mobile/src/model-registry.js";

/** Minimal stub: the reader only ever asks for one settings row. */
function dbWith(rows: unknown): Database {
  const value = typeof rows === "string" ? rows : JSON.stringify(rows);
  return {
    prepare: () => ({
      get: async (key: string) =>
        key === CLOUD_MODELS_SETTING ? { value } : undefined,
    }),
  } as unknown as Database;
}

function row(
  overrides: Partial<ResolvedModelEntry> & { id: string },
): Record<string, unknown> {
  const on = { text: true, stt: true, tts: true };
  return {
    label: overrides.id,
    url: "https://models.example/v1",
    model: overrides.id,
    local: false,
    apiFlavor: "chat-completions",
    order: 0,
    capabilities: on,
    detectedCapabilities: on,
    ...overrides,
  };
}

describe("mobile cloud registry", () => {
  it("reads the same settings key the desktop writes", () => {
    // The reader is duplicated because the desktop one needs Node's fs, which
    // a WebView does not have. The key must not drift with it.
    expect(CLOUD_MODELS_SETTING).toBe(DESKTOP_SETTING);
  });

  it("chains the enabled models in priority order", async () => {
    const chain = await resolveMobileCloudChain(
      dbWith([
        row({ id: "third", order: 3 }),
        row({ id: "first", order: 1 }),
        row({ id: "second", order: 2 }),
      ]),
      "text",
    );

    expect(chain?.model).toBe("first");
    expect(chain?.fallback?.model).toBe("second");
    expect(chain?.fallback?.fallback?.model).toBe("third");
  });

  it("requires the capability to be both chosen and detected", async () => {
    // The same two-sided filter resolveCapability applies on the desktop. A
    // capability ticked but never detected is a wish, not an endpoint.
    const wished = row({
      id: "wished",
      capabilities: { stt: true },
      detectedCapabilities: { stt: false },
    });

    expect(await resolveMobileCloudChain(dbWith([wished]), "stt")).toBeNull();
  });

  it("resolves each capability separately", async () => {
    const rows = [
      row({
        id: "whisper",
        capabilities: { stt: true },
        detectedCapabilities: { stt: true },
      }),
      row({
        id: "voice",
        capabilities: { tts: true },
        detectedCapabilities: { tts: true },
      }),
    ];

    expect((await resolveMobileCloudChain(dbWith(rows), "stt"))?.model).toBe(
      "whisper",
    );
    expect((await resolveMobileCloudChain(dbWith(rows), "tts"))?.model).toBe(
      "voice",
    );
  });

  it("skips rows this device could never call", async () => {
    // These should not be in the database at all — the desktop keeps them
    // machine-local — but a row from an older build or a hand edit must not
    // become an endpoint that always fails.
    for (const unusable of [
      row({ id: "loopback", url: "http://127.0.0.1:8000/v1" }),
      row({ id: "flagged-local", local: true }),
      row({ id: "harness", transport: "agent" }),
      row({ id: "anthropic", apiFlavor: "anthropic-messages" }),
    ]) {
      expect(await resolveMobileCloudChain(dbWith([unusable]), "text")).toBeNull();
    }
  });

  it("carries the key so the device can actually authenticate", async () => {
    const chain = await resolveMobileCloudChain(
      dbWith([row({ id: "m", apiKey: "sk-shared" })]),
      "text",
    );

    expect(chain?.apiKey).toBe("sk-shared");
  });

  it("treats an absent or corrupt setting as no cloud models", async () => {
    expect(await resolveMobileCloudChain(dbWith([]), "text")).toBeNull();
    expect(await resolveMobileCloudChain(dbWith("{not json"), "text")).toBeNull();
  });
});
