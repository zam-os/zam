/**
 * Connecting a cloud model from the device, and the embeddings that follow.
 *
 * Two things here are worth more than the happy path:
 *
 * 1. The mobile connect flow is a *second* implementation of the desktop's
 *    `connectCloudProvider`, because that one reaches for Node. The shared
 *    descriptor is imported by both, so these tests assert the mobile row is
 *    built from it rather than from copied literals.
 * 2. The canonical embedding model id is what every stored vector is tagged
 *    with. If the device and the desktop disagree, a shared Turso library
 *    re-embeds itself — at cost — the first time anyone searches. It is
 *    pinned here so a rename has to be deliberate.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLOUD_EMBEDDING_MODEL,
  CLOUD_EMBEDDING_MODEL_ID,
  CLOUD_STT_MODEL,
  connectCloudModel,
  connectedCloudLabel,
  disconnectCloudModel,
  migrateStaleCloudDefaults,
  verifyKey,
} from "../../mobile/src/ai/connect.js";
import { embedPendingTokens } from "../../mobile/src/ai/embedder.js";
import { resolveMobileCloudChain } from "../../mobile/src/model-registry.js";
import { createTauriDatabase } from "../../mobile/src/provider.js";
import { completeFirstRun } from "../../mobile/src/setup/first-run.js";
import { starterCards } from "../../mobile/src/setup/starter-content.js";
import { OPENROUTER_PROVIDER } from "../../src/cli/llm/cloud-providers.js";
import { canonicalEmbeddingModelId } from "../../src/cli/llm/embedder.js";
import type { Database } from "../../src/kernel/db/types.js";
import { getSetting, setSetting } from "../../src/kernel/models/settings.js";
import { createTauriInvokeStub } from "../helpers/tauri-invoke-stub.js";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) (cleanups.pop() as () => void)();
});

async function library(): Promise<Database> {
  const dir = mkdtempSync(join(tmpdir(), "zam-ai-"));
  const stub = createTauriInvokeStub(join(dir, "zam-local.db"));
  cleanups.push(() => {
    stub.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const db = createTauriDatabase(stub.invoke);
  await completeFirstRun(db, {
    locale: "de",
    persona: "school",
    starterCards: starterCards("de"),
  });
  return db;
}

const accept = async () => ({ valid: true }) as const;

describe("verifyKey", () => {
  it("asks the provider's own key endpoint, with the key as a bearer token", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    await verifyKey("sk-or-secret", OPENROUTER_PROVIDER, fetchImpl as never);

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `${OPENROUTER_PROVIDER.baseUrl}${OPENROUTER_PROVIDER.keyCheckPath}`,
    );
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer sk-or-secret",
    );
  });

  it("separates a bad key from an unreachable provider", async () => {
    const reject = vi.fn(async () => new Response("", { status: 401 }));
    expect(
      await verifyKey("bad", OPENROUTER_PROVIDER, reject as never),
    ).toEqual({ valid: false, reason: "rejected" });

    const offline = vi.fn(async () => {
      throw new TypeError("Load failed");
    });
    expect(
      await verifyKey("good", OPENROUTER_PROVIDER, offline as never),
    ).toEqual({ valid: false, reason: "unreachable" });
  });
});

describe("connectCloudModel", () => {
  it("registers the descriptor's model for text, image, embeddings and STT", async () => {
    const db = await library();
    const result = await connectCloudModel(db, "sk-or-key", {
      verify: accept,
    });
    expect(result).toEqual({ ok: true, created: true });

    const rows = JSON.parse(
      (await getSetting(db, "ai.models.cloud")) as string,
    ) as Array<{
      url: string;
      model: string;
      label: string;
      capabilities: Record<string, boolean>;
      detectedCapabilities: Record<string, boolean>;
    }>;
    // Built from the shared descriptor, not from literals copied into mobile.
    expect(rows).toHaveLength(3);
    const chat = rows.find((row) => row.model === OPENROUTER_PROVIDER.defaultModel);
    expect(chat?.url).toBe(OPENROUTER_PROVIDER.baseUrl);
    expect(chat?.label).toBe(OPENROUTER_PROVIDER.label);
    expect(chat?.capabilities).toMatchObject({ text: true, image: true });
    // resolveMobileCloudChain needs both sides; a capability the learner
    // ticked but nothing confirmed is a wish, not an endpoint.
    expect(chat?.detectedCapabilities).toEqual(chat?.capabilities);
    expect(rows.some((row) => row.model === CLOUD_EMBEDDING_MODEL)).toBe(true);
    expect(rows.some((row) => row.model === CLOUD_STT_MODEL)).toBe(true);
  });

  it("refuses to store a key the provider rejected", async () => {
    const db = await library();
    const result = await connectCloudModel(db, "nope", {
      verify: async () => ({ valid: false, reason: "rejected" }) as const,
    });
    expect(result.ok).toBe(false);
    expect(await getSetting(db, "ai.models.cloud")).toBeFalsy();
  });

  it("updates the existing row instead of stacking a second one", async () => {
    const db = await library();
    await connectCloudModel(db, "first", { verify: accept });
    const second = await connectCloudModel(db, "second", { verify: accept });

    expect(second).toEqual({ ok: true, created: false });
    const rows = JSON.parse(
      (await getSetting(db, "ai.models.cloud")) as string,
    ) as Array<{ apiKey: string }>;
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.apiKey === "second")).toBe(true);
  });

  it("reports and clears the connection for the settings screen", async () => {
    const db = await library();
    expect(await connectedCloudLabel(db)).toBeNull();

    await connectCloudModel(db, "key", { verify: accept });
    expect(await connectedCloudLabel(db)).toBe(
      `${OPENROUTER_PROVIDER.label} · ${OPENROUTER_PROVIDER.defaultModel}`,
    );

    await disconnectCloudModel(db);
    expect(await connectedCloudLabel(db)).toBeNull();
  });

  it("serves embedding and STT from dedicated models, not the chat one", async () => {
    const db = await library();
    await connectCloudModel(db, "key", { verify: accept });

    const text = await resolveMobileCloudChain(db, "text");
    const embedding = await resolveMobileCloudChain(db, "embedding");
    const stt = await resolveMobileCloudChain(db, "stt");
    expect(text?.model).toBe(OPENROUTER_PROVIDER.defaultModel);
    expect(embedding?.model).toBe(CLOUD_EMBEDDING_MODEL);
    expect(stt?.model).toBe(CLOUD_STT_MODEL);
    expect(embedding?.url).toBe(text?.url);
    expect(stt?.url).toBe(text?.url);
    expect(embedding?.apiKey).toBe("key");
    expect(stt?.apiKey).toBe("key");
  });

  it("accepts an explicit chat model and replaces the former ZAM default", async () => {
    const db = await library();
    await connectCloudModel(db, "key", {
      verify: accept,
      model: "xiaomi/mimo-v2.5",
    });
    await connectCloudModel(db, "key", {
      verify: accept,
      model: "openai/gpt-5.6-luna",
    });

    const rows = JSON.parse(
      (await getSetting(db, "ai.models.cloud")) as string,
    ) as Array<{ model: string; capabilities: Record<string, boolean> }>;
    expect(rows.some((row) => row.model === "xiaomi/mimo-v2.5")).toBe(false);
    expect(
      rows.some(
        (row) => row.model === "openai/gpt-5.6-luna" && row.capabilities.text,
      ),
    ).toBe(true);
  });

  it("switches the model without re-pasting the key", async () => {
    const db = await library();
    await connectCloudModel(db, "sk-or-first", {
      verify: accept,
      model: "openai/gpt-5.6-luna",
    });
    // Empty key: reuse the stored one. Verify must not be called.
    const verify = vi.fn(async () => ({ valid: true }) as const);
    const result = await connectCloudModel(db, "", {
      verify,
      model: "qwen/qwen3.7-flash",
    });
    expect(result.ok).toBe(true);
    expect(verify).not.toHaveBeenCalled();

    const text = await resolveMobileCloudChain(db, "text");
    expect(text?.model).toBe("qwen/qwen3.7-flash");
    expect(text?.apiKey).toBe("sk-or-first");
  });

  it("migrates the retired embedding model and the slow MiMo default in place", async () => {
    const db = await library();
    // Simulate a 0.29.0 connect that wrote the models we are retiring.
    await setSetting(
      db,
      "ai.models.cloud",
      JSON.stringify([
        {
          id: "01CHAT",
          label: "OpenRouter",
          url: OPENROUTER_PROVIDER.baseUrl,
          model: "xiaomi/mimo-v2.5",
          local: false,
          apiFlavor: "chat-completions",
          apiKey: "key",
          order: 0,
          capabilities: {
            text: true,
            image: true,
            embedding: false,
            video: false,
            stt: false,
            tts: false,
          },
          detectedCapabilities: {
            text: true,
            image: true,
            embedding: false,
            video: false,
            stt: false,
            tts: false,
          },
        },
        {
          id: "01EMB",
          label: "OpenRouter",
          url: OPENROUTER_PROVIDER.baseUrl,
          model: "qwen/qwen3-embedding-0.6b",
          local: false,
          apiFlavor: "chat-completions",
          apiKey: "key",
          order: 1,
          capabilities: {
            text: false,
            image: false,
            embedding: true,
            video: false,
            stt: false,
            tts: false,
          },
          detectedCapabilities: {
            text: false,
            image: false,
            embedding: true,
            video: false,
            stt: false,
            tts: false,
          },
        },
      ]),
    );

    expect(await migrateStaleCloudDefaults(db)).toBe(true);
    const text = await resolveMobileCloudChain(db, "text");
    const embedding = await resolveMobileCloudChain(db, "embedding");
    expect(text?.model).toBe(OPENROUTER_PROVIDER.defaultModel);
    expect(embedding?.model).toBe(CLOUD_EMBEDDING_MODEL);
  });

  it("retires the 4B embedding row 0.29.1 wrote, leaving exactly one", async () => {
    // 4B was a one-provider model on OpenRouter, which is the shape of outage
    // that took 0.6B away mid-field-test. A leftover row would sit in the
    // fallback chain and answer with 2560-dimension vectors the library can
    // no longer compare.
    const db = await library();
    await setSetting(
      db,
      "ai.models.cloud",
      JSON.stringify([
        {
          id: "01EMB4B",
          label: "OpenRouter",
          url: OPENROUTER_PROVIDER.baseUrl,
          model: "qwen/qwen3-embedding-4b",
          local: false,
          apiFlavor: "chat-completions",
          apiKey: "key",
          order: 1,
          capabilities: {
            text: false,
            image: false,
            embedding: true,
            video: false,
            stt: false,
            tts: false,
          },
          detectedCapabilities: {
            text: false,
            image: false,
            embedding: true,
            video: false,
            stt: false,
            tts: false,
          },
        },
      ]),
    );

    await connectCloudModel(db, "key", { verify: accept });

    const rows = JSON.parse(
      (await getSetting(db, "ai.models.cloud")) as string,
    ) as Array<{ model: string; capabilities: Record<string, boolean> }>;
    const embedRows = rows.filter((row) => row.capabilities.embedding);
    expect(embedRows).toHaveLength(1);
    expect(embedRows[0]?.model).toBe(CLOUD_EMBEDDING_MODEL);
    // And no fallback hiding behind it.
    let chain = await resolveMobileCloudChain(db, "embedding");
    while (chain) {
      expect(chain.model).toBe(CLOUD_EMBEDDING_MODEL);
      chain = chain.fallback ?? null;
    }
  });

  it("writes three rows, so a desktop on the same database resolves the same models", async () => {
    // A registry row is an endpoint, and an endpoint carries *one* model.
    // Encoding the embedding model as an extra field on the chat row worked on
    // the device and left the desktop resolving the embedding role to a chat
    // model — 4xx on every request, and every vector the device wrote counted
    // as stale because the ids disagreed. The same applies to STT.
    const db = await library();
    await connectCloudModel(db, "key", { verify: accept });

    const rows = JSON.parse(
      (await getSetting(db, "ai.models.cloud")) as string,
    ) as Array<{
      model: string;
      capabilities: Record<string, boolean>;
      detectedCapabilities: Record<string, boolean>;
    }>;
    expect(rows).toHaveLength(3);

    const chat = rows.find(
      (row) => row.model === OPENROUTER_PROVIDER.defaultModel,
    );
    const embed = rows.find((row) => row.model === CLOUD_EMBEDDING_MODEL);
    const stt = rows.find((row) => row.model === CLOUD_STT_MODEL);
    expect(chat?.capabilities.text).toBe(true);
    expect(chat?.capabilities.embedding).toBe(false);
    expect(chat?.capabilities.stt).toBe(false);
    expect(embed?.capabilities.embedding).toBe(true);
    expect(embed?.capabilities.text).toBe(false);
    expect(stt?.capabilities.stt).toBe(true);
    expect(stt?.capabilities.text).toBe(false);

    // What the desktop reads: `row.model` and the capability flags, nothing
    // else. Resolving `embedding` the way it does must land on the embedding
    // model, whose id must survive canonicalization to the tag on the vectors.
    const desktopEmbedding = rows.find(
      (row) => row.capabilities.embedding && row.detectedCapabilities.embedding,
    );
    expect(desktopEmbedding?.model).toBe(CLOUD_EMBEDDING_MODEL);
    expect(canonicalEmbeddingModelId(desktopEmbedding?.model as string)).toBe(
      CLOUD_EMBEDDING_MODEL_ID,
    );
  });

  it("adds the STT row on migrate when an OpenRouter key already exists", async () => {
    const db = await library();
    await setSetting(
      db,
      "ai.models.cloud",
      JSON.stringify([
        {
          id: "01CHAT",
          label: "OpenRouter",
          url: OPENROUTER_PROVIDER.baseUrl,
          model: OPENROUTER_PROVIDER.defaultModel,
          local: false,
          apiFlavor: "chat-completions",
          apiKey: "key",
          order: 0,
          capabilities: {
            text: true,
            image: true,
            embedding: false,
            video: false,
            stt: false,
            tts: false,
          },
          detectedCapabilities: {
            text: true,
            image: true,
            embedding: false,
            video: false,
            stt: false,
            tts: false,
          },
        },
        {
          id: "01EMB",
          label: "OpenRouter",
          url: OPENROUTER_PROVIDER.baseUrl,
          model: CLOUD_EMBEDDING_MODEL,
          local: false,
          apiFlavor: "chat-completions",
          apiKey: "key",
          order: 1,
          capabilities: {
            text: false,
            image: false,
            embedding: true,
            video: false,
            stt: false,
            tts: false,
          },
          detectedCapabilities: {
            text: false,
            image: false,
            embedding: true,
            video: false,
            stt: false,
            tts: false,
          },
        },
      ]),
    );

    expect(await migrateStaleCloudDefaults(db)).toBe(true);
    const stt = await resolveMobileCloudChain(db, "stt");
    expect(stt?.model).toBe(CLOUD_STT_MODEL);
    expect(stt?.apiKey).toBe("key");
  });
});

describe("canonical embedding id", () => {
  it("agrees with the desktop for both the wire name and the stored id", () => {
    // The interesting one is the *wire* name. OpenRouter serves the model as
    // `qwen/qwen3-embedding-8b`; a desktop configured against the same
    // provider must tag its vectors with the same id the device uses, or a
    // shared library re-embeds itself — at cost — on the next search.
    expect(canonicalEmbeddingModelId(CLOUD_EMBEDDING_MODEL)).toBe(
      CLOUD_EMBEDDING_MODEL_ID,
    );
    expect(canonicalEmbeddingModelId(CLOUD_EMBEDDING_MODEL_ID)).toBe(
      CLOUD_EMBEDDING_MODEL_ID,
    );
    expect(canonicalEmbeddingModelId("Qwen/Qwen3-Embedding-8B")).toBe(
      CLOUD_EMBEDDING_MODEL_ID,
    );
  });
});

describe("embedPendingTokens", () => {
  it("does nothing at all when no embedding model is configured", async () => {
    const db = await library();
    const fetchImpl = vi.fn();
    const result = await embedPendingTokens(db, {
      fetchImpl: fetchImpl as never,
    });
    expect(result).toEqual({ embedded: 0, remaining: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts the canonical text and stores one vector per token", async () => {
    const db = await library();
    await connectCloudModel(db, "key", { verify: accept });

    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      return new Response(
        JSON.stringify({
          data: body.input.map(() => ({ embedding: [0.1, 0.2, 0.3] })),
        }),
        { status: 200 },
      );
    });

    const result = await embedPendingTokens(db, {
      fetchImpl: fetchImpl as never,
    });
    expect(result.embedded).toBe(3);
    expect(result.remaining).toBe(0);

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${OPENROUTER_PROVIDER.baseUrl}/embeddings`);
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe(CLOUD_EMBEDDING_MODEL);
    expect(body.input).toHaveLength(3);

    const stored = (await db
      .prepare("SELECT model, dims FROM token_embeddings")
      .all()) as Array<{ model: string; dims: number }>;
    expect(stored).toHaveLength(3);
    expect(stored[0]?.model).toBe(CLOUD_EMBEDDING_MODEL_ID);
    expect(stored[0]?.dims).toBe(3);
  });

  it("reports a failed batch without storing partial vectors", async () => {
    const db = await library();
    await connectCloudModel(db, "key", { verify: accept });

    const fetchImpl = vi.fn(async () => new Response("", { status: 402 }));
    const result = await embedPendingTokens(db, {
      fetchImpl: fetchImpl as never,
    });

    expect(result.embedded).toBe(0);
    expect(result.error).toContain("402");
    const stored = (await db
      .prepare("SELECT COUNT(*) AS n FROM token_embeddings")
      .get()) as { n: number };
    expect(Number(stored.n)).toBe(0);
  });

  it("rejects a response that does not answer every input", async () => {
    const db = await library();
    await connectCloudModel(db, "key", { verify: accept });

    // A provider returning fewer vectors than inputs would otherwise pair
    // vectors with the wrong tokens — silently poisoning search.
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: [{ embedding: [0.1] }] }), {
          status: 200,
        }),
    );
    const result = await embedPendingTokens(db, {
      fetchImpl: fetchImpl as never,
    });
    expect(result.embedded).toBe(0);
    expect(result.error).toContain("1 vectors for 3 inputs");
  });
});
