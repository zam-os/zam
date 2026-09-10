import { createServer, type Server } from "node:http";
import { describe, expect, it } from "vitest";
import {
  type CapabilityProbeResult,
  classifyCapabilities,
  probeModelCapabilities,
  reconcileCapabilities,
  validateModelSave,
} from "../../src/cli/llm/capability-probe.js";
import {
  type CapabilityFlags,
  emptyCapabilityFlags,
  type ModelEntry,
} from "../../src/kernel/index.js";

function caps(over: Partial<CapabilityFlags> = {}): CapabilityFlags {
  return { ...emptyCapabilityFlags(), ...over };
}

/**
 * How many times the second catalogue was asked for. The reachability check
 * hits `/models` on its own, so counting this path is the only honest way to
 * assert the extra request stayed conditional.
 */
function embeddingCatalogueHits(paths: string[]): number {
  return paths.filter((path) => path.endsWith("/embeddings/models")).length;
}

/**
 * Serves a chat catalogue at `/models` and a separate embedding catalogue at
 * `/embeddings/models`, the way a provider that keeps embedding ids out of its
 * chat listing does.
 */
async function startSplitCatalogueStub(options: {
  chatModels: string[];
  embeddingModels?: string[];
  transcriptionModels?: string[];
  speechModels?: string[];
}): Promise<{ url: string; paths: string[]; close(): Promise<void> }> {
  const paths: string[] = [];
  const server: Server = createServer((req, res) => {
    const url = req.url ?? "";
    paths.push(url);
    const models = url.includes("/embeddings/models")
      ? (options.embeddingModels ?? [])
      : url.includes("output_modalities=transcription")
        ? (options.transcriptionModels ?? [])
        : url.includes("output_modalities=speech")
          ? (options.speechModels ?? [])
          : options.chatModels;
    res
      .writeHead(200, { "content-type": "application/json" })
      .end(JSON.stringify({ data: models.map((id) => ({ id })) }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Failed to bind split-catalogue stub");
  }
  return {
    url: `http://127.0.0.1:${address.port}/v1`,
    paths,
    async close() {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    },
  };
}

describe("classifyCapabilities", () => {
  it("treats a chat model listed in the catalog as text", () => {
    const d = classifyCapabilities(
      { model: "gemma4-it:e4b", apiFlavor: "chat-completions" },
      ["gemma4-it:e4b", "other"],
      true,
    );
    expect(d).toEqual(caps({ text: true }));
  });

  it("trusts chat-completions text when the catalog is silent", () => {
    const d = classifyCapabilities(
      { model: "mystery-local", apiFlavor: "chat-completions" },
      [],
      false,
    );
    expect(d.text).toBe(true);
    expect(d.embedding).toBe(false);
  });

  it("marks embedding models as embedding-only (not text)", () => {
    const d = classifyCapabilities(
      { model: "embeddinggemma", apiFlavor: "chat-completions" },
      [],
      false,
    );
    expect(d).toEqual(caps({ embedding: true }));
  });

  it("marks multimodal chat models as text + image", () => {
    const d = classifyCapabilities(
      { model: "gpt-4o", apiFlavor: "chat-completions" },
      ["gpt-4o"],
      true,
    );
    expect(d.text).toBe(true);
    expect(d.image).toBe(true);
  });

  it("recognizes Xiaomi MiMo as multimodal even without a -vl tag", () => {
    const d = classifyCapabilities(
      { model: "mimo-v2.5", apiFlavor: "chat-completions" },
      ["mimo-v2.5"],
      true,
    );
    expect(d.text).toBe(true);
    expect(d.image).toBe(true);
  });

  it("fixes anthropic endpoints to text + image regardless of model", () => {
    const d = classifyCapabilities(
      { model: "claude-haiku-4-5", apiFlavor: "anthropic-messages" },
      [],
      false,
    );
    expect(d).toEqual(caps({ text: true, image: true }));
  });

  it("does not claim text for a model absent from a known catalog", () => {
    const d = classifyCapabilities(
      { model: "ghost", apiFlavor: "chat-completions" },
      ["served-a", "served-b"],
      true,
    );
    expect(d).toEqual(emptyCapabilityFlags());
  });

  it("honors a positive embedding dimension probe when the catalog is silent", () => {
    const d = classifyCapabilities(
      { model: "custom-vectors", apiFlavor: "chat-completions" },
      [],
      false,
      true,
    );
    expect(d.embedding).toBe(true);
    expect(d.text).toBe(false);
  });
});

describe("reconcileCapabilities", () => {
  it("keeps only user-selected flags the probe detected", () => {
    const result = reconcileCapabilities(
      caps({ text: true, image: true, embedding: true }),
      caps({ text: true, image: false, embedding: true }),
    );
    expect(result).toEqual(caps({ text: true, embedding: true }));
  });
});

describe("validateModelSave", () => {
  const entry: ModelEntry = {
    id: "e1",
    label: "Local",
    url: "http://localhost:8000/v1",
    model: "gemma",
    local: true,
    apiFlavor: "chat-completions",
    order: 0,
    capabilities: caps({ text: true, image: true }),
    detectedCapabilities: emptyCapabilityFlags(),
  };

  it("blocks the save when the endpoint is unreachable", () => {
    const probe: CapabilityProbeResult = {
      reachable: false,
      catalog: [],
      detected: emptyCapabilityFlags(),
    };
    const result = validateModelSave(entry, probe);
    expect(result.ok).toBe(false);
    expect(result.entry).toBeUndefined();
    expect(result.error).toMatch(/unreachable/i);
  });

  it("stamps detected capabilities and shrinks user flags to the intersection", () => {
    const probe: CapabilityProbeResult = {
      reachable: true,
      catalog: ["gemma"],
      detected: caps({ text: true }), // image not detected
    };
    const result = validateModelSave(
      entry,
      probe,
      () => "2026-07-12T00:00:00Z",
    );
    expect(result.ok).toBe(true);
    expect(result.entry?.capabilities).toEqual(caps({ text: true }));
    expect(result.entry?.detectedCapabilities).toEqual(caps({ text: true }));
    expect(result.entry?.probedAt).toBe("2026-07-12T00:00:00Z");
  });
});

// Reported 2026-08-01: `mimo-v2.5-tts` was configured against Xiaomi's
// endpoint, which serves no such model and no /audio/speech route at all. The
// name matched a TTS hint, the capability was stored, and the misconfiguration
// only surfaced mid-review as a 404 from the gateway.
describe("speech capabilities are checked against the provider's catalog", () => {
  const catalog = ["mimo-v2.5", "mimo-v2.5-vl"];

  it("does not claim speech for a model the endpoint does not list", () => {
    const detected = classifyCapabilities(
      { model: "mimo-v2.5-tts", apiFlavor: "chat-completions" },
      catalog,
      true,
    );

    expect(detected.tts).toBe(false);
  });

  it("still claims speech for a listed speech model", () => {
    const detected = classifyCapabilities(
      { model: "tts-1-hd", apiFlavor: "chat-completions" },
      ["tts-1-hd", "whisper-1"],
      true,
    );

    expect(detected.tts).toBe(true);
    expect(
      classifyCapabilities(
        { model: "whisper-1", apiFlavor: "chat-completions" },
        ["tts-1-hd", "whisper-1"],
        true,
      ).stt,
    ).toBe(true);
  });

  it("trusts an endpoint that publishes no catalog", () => {
    // Most single-model local runners serve no /v1/models; refusing them would
    // break the self-hosted path the ADR keeps for `device-only`.
    const detected = classifyCapabilities(
      { model: "kokoro", apiFlavor: "chat-completions" },
      [],
      false,
    );

    expect(detected.tts).toBe(true);
  });

  it("refuses to save a model the endpoint does not offer, and says what it has", () => {
    const result = validateModelSave(
      {
        id: "x",
        label: "Mimo TTS",
        url: "https://token-plan.example/v1",
        model: "mimo-v2.5-tts",
        local: false,
        apiFlavor: "chat-completions",
        order: 0,
        capabilities: { ...emptyCapabilityFlags(), tts: true },
        detectedCapabilities: emptyCapabilityFlags(),
      },
      { reachable: true, catalog, detected: emptyCapabilityFlags() },
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain("mimo-v2.5-tts");
    expect(result.error).toContain("mimo-v2.5");
  });

  it("leaves a local runner alone, whose catalog lags what it just pulled", () => {
    // enableLocalEmbedding pulls a model and saves it in one step; the catalog
    // it read beforehand cannot list what it has just fetched.
    const result = validateModelSave(
      {
        id: "x",
        label: "Ollama - Embedding",
        url: "http://localhost:11434/v1",
        model: "embeddinggemma:300m",
        local: true,
        apiFlavor: "chat-completions",
        order: 0,
        capabilities: { ...emptyCapabilityFlags(), embedding: true },
        detectedCapabilities: emptyCapabilityFlags(),
      },
      {
        reachable: true,
        catalog: ["qwen3.5:4b"],
        detected: { ...emptyCapabilityFlags(), embedding: true },
      },
    );

    expect(result.ok).toBe(true);
  });

  it("saves a listed model unchanged", () => {
    const result = validateModelSave(
      {
        id: "x",
        label: "Mimo",
        url: "https://token-plan.example/v1",
        model: "mimo-v2.5",
        local: false,
        apiFlavor: "chat-completions",
        order: 0,
        capabilities: { ...emptyCapabilityFlags(), text: true },
        detectedCapabilities: emptyCapabilityFlags(),
      },
      {
        reachable: true,
        catalog,
        detected: { ...emptyCapabilityFlags(), text: true },
      },
    );

    expect(result.ok).toBe(true);
    expect(result.entry?.capabilities.text).toBe(true);
  });
});

describe("probeModelCapabilities and a split model catalogue", () => {
  const embeddingEntry = {
    url: "",
    model: "qwen/qwen3-embedding-8b",
    apiFlavor: "chat-completions" as const,
  };

  it("finds an embedding model published only at /embeddings/models", async () => {
    // Without this the row cannot be saved at all: validateModelSave refuses a
    // model the catalogue does not list, so it cannot even be renamed.
    const stub = await startSplitCatalogueStub({
      chatModels: ["openai/gpt-5.6-luna"],
      embeddingModels: ["qwen/qwen3-embedding-8b"],
    });
    try {
      const probe = await probeModelCapabilities({
        ...embeddingEntry,
        url: stub.url,
      });

      expect(probe.reachable).toBe(true);
      expect(probe.catalog).toContain("qwen/qwen3-embedding-8b");
      expect(probe.detected.embedding).toBe(true);
      expect(embeddingCatalogueHits(stub.paths)).toBe(1);
    } finally {
      await stub.close();
    }
  });

  it("asks only the chat catalogue when it already lists the model", async () => {
    // Every probe pays for this request, so the second one stays conditional.
    const stub = await startSplitCatalogueStub({
      chatModels: ["text-embedding-3-small"],
      embeddingModels: [],
    });
    try {
      const probe = await probeModelCapabilities({
        ...embeddingEntry,
        model: "text-embedding-3-small",
        url: stub.url,
      });

      expect(probe.detected.embedding).toBe(true);
      expect(embeddingCatalogueHits(stub.paths)).toBe(0);
    } finally {
      await stub.close();
    }
  });

  it("does not ask the second catalogue for a chat model", async () => {
    const stub = await startSplitCatalogueStub({
      chatModels: ["openai/gpt-5.6-luna"],
      embeddingModels: ["qwen/qwen3-embedding-8b"],
    });
    try {
      const probe = await probeModelCapabilities({
        ...embeddingEntry,
        model: "openai/gpt-5.6-luna",
        url: stub.url,
      });

      expect(probe.detected.text).toBe(true);
      expect(embeddingCatalogueHits(stub.paths)).toBe(0);
    } finally {
      await stub.close();
    }
  });

  it("lets a split-catalogue embedding row save", async () => {
    const stub = await startSplitCatalogueStub({
      chatModels: ["openai/gpt-5.6-luna"],
      embeddingModels: ["qwen/qwen3-embedding-8b"],
    });
    try {
      const entry: ModelEntry = {
        id: "emb",
        label: "renamed by the learner",
        url: stub.url,
        model: "qwen/qwen3-embedding-8b",
        local: false,
        apiFlavor: "chat-completions",
        order: 0,
        capabilities: caps({ embedding: true }),
        detectedCapabilities: emptyCapabilityFlags(),
      };

      const result = validateModelSave(
        entry,
        await probeModelCapabilities(entry),
      );

      expect(result.ok).toBe(true);
      expect(result.entry?.label).toBe("renamed by the learner");
    } finally {
      await stub.close();
    }
  });
});

// OpenRouter answers `/models` with its text models only. Embedding ids sit at
// `{base}/embeddings/models`, and speech ids appear only behind a modality
// filter — so a working transcription model read as one the endpoint does not
// offer, and `validateModelSave` refused to store the row at all (2026-09-10).
describe("probeModelCapabilities and a modality-filtered catalogue", () => {
  it("finds a transcription model published only behind the filter", async () => {
    const stub = await startSplitCatalogueStub({
      chatModels: ["openai/gpt-5.6-luna"],
      transcriptionModels: ["openai/gpt-transcribe"],
    });
    try {
      const probe = await probeModelCapabilities({
        url: stub.url,
        model: "openai/gpt-transcribe",
        apiFlavor: "chat-completions",
      });

      expect(probe.catalog).toContain("openai/gpt-transcribe");
      expect(probe.detected.stt).toBe(true);
      expect(
        stub.paths.filter((p) => p.includes("output_modalities=transcription")),
      ).toHaveLength(1);
    } finally {
      await stub.close();
    }
  });

  it("finds a speech model published only behind the filter", async () => {
    const stub = await startSplitCatalogueStub({
      chatModels: ["openai/gpt-5.6-luna"],
      speechModels: ["hexgrad/kokoro-82m"],
    });
    try {
      const probe = await probeModelCapabilities({
        url: stub.url,
        model: "hexgrad/kokoro-82m",
        apiFlavor: "chat-completions",
      });

      expect(probe.detected.tts).toBe(true);
      expect(
        stub.paths.filter((p) => p.includes("output_modalities=speech")),
      ).toHaveLength(1);
    } finally {
      await stub.close();
    }
  });

  it("still refuses a speech name the provider serves nowhere", async () => {
    // The 2026-08-01 guard: `mimo-v2.5-tts` looks like TTS and Xiaomi does not
    // serve it. Widening where we look must not widen what we believe.
    const stub = await startSplitCatalogueStub({
      chatModels: ["mimo-v2.5", "mimo-v2.5-vl"],
      speechModels: ["some-other-voice"],
    });
    try {
      const probe = await probeModelCapabilities({
        url: stub.url,
        model: "mimo-v2.5-tts",
        apiFlavor: "chat-completions",
      });

      expect(probe.detected.tts).toBe(false);
      expect(probe.detected.stt).toBe(false);
    } finally {
      await stub.close();
    }
  });

  it("asks for no modality catalogue when the model is a listed chat model", async () => {
    const stub = await startSplitCatalogueStub({
      chatModels: ["openai/gpt-5.6-luna"],
      transcriptionModels: ["openai/gpt-transcribe"],
      speechModels: ["hexgrad/kokoro-82m"],
    });
    try {
      await probeModelCapabilities({
        url: stub.url,
        model: "openai/gpt-5.6-luna",
        apiFlavor: "chat-completions",
      });

      expect(
        stub.paths.filter((p) => p.includes("output_modalities")),
      ).toHaveLength(0);
    } finally {
      await stub.close();
    }
  });
});
