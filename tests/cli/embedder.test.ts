import { mkdtempSync, rmSync } from "node:fs";
import { createServer, type IncomingMessage, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  canonicalEmbeddingModelId,
  DEFAULT_EMBEDDING_MODEL,
  embedQuery,
  embedTexts,
  ensureTokenEmbeddings,
} from "../../src/cli/llm/embedder.js";
import {
  computeContentHash,
  createToken,
  type Database,
  embeddingTextForToken,
  getTokenEmbedding,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

// ── In-process OpenAI-compatible embeddings stub ────────────────────────────
//
// Plain node:http JSON server (not the Hrana/SQL stub in hrana-stub.ts, which
// is a different protocol) so embedTexts/ensureTokenEmbeddings exercise a real
// HTTP round-trip: request shape, headers, and response parsing.

interface EmbeddingsRequestBody {
  model: string;
  input: string[];
}

interface EmbeddingsStub {
  url: string;
  requests: EmbeddingsRequestBody[];
  close(): Promise<void>;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf-8");
  return raw ? JSON.parse(raw) : {};
}

/**
 * Starts a stub server whose `/models` and `/embeddings` routes match on
 * suffix, so it works whether the configured provider URL is the bare host
 * or includes a `/v1` prefix (matching how Ollama serves `/v1/embeddings`).
 */
async function startEmbeddingsStub(options?: {
  /** Model ids reported by GET /models; empty means endpoint doesn't expose it. */
  availableModels?: string[];
  /** Reorder/shuffle the `index` field on embeddings responses. */
  shuffleIndex?: boolean;
  /** Respond with this HTTP status for /embeddings (default 200). */
  embeddingsStatus?: number;
  /** Fixed vector length returned per input (default 4). */
  dims?: number;
  /** Return one fewer vector than requested (simulates a malformed response). */
  dropOneVector?: boolean;
}): Promise<EmbeddingsStub> {
  const requests: EmbeddingsRequestBody[] = [];
  const dims = options?.dims ?? 4;

  const server: Server = createServer((req, res) => {
    void (async () => {
      const url = req.url ?? "";
      if (url.endsWith("/models")) {
        const models = options?.availableModels ?? [];
        res
          .writeHead(200, { "content-type": "application/json" })
          .end(JSON.stringify({ data: models.map((id) => ({ id })) }));
        return;
      }

      if (url.endsWith("/embeddings")) {
        const body = (await readJsonBody(req)) as EmbeddingsRequestBody;
        requests.push(body);

        const status = options?.embeddingsStatus ?? 200;
        if (status !== 200) {
          res.writeHead(status, { "content-type": "text/plain" }).end("boom");
          return;
        }

        let indices = body.input.map((_, i) => i);
        if (options?.dropOneVector) indices = indices.slice(1);
        const order = options?.shuffleIndex ? [...indices].reverse() : indices;

        const data = order.map((originalIndex) => ({
          index: originalIndex,
          embedding: Array.from(
            { length: dims },
            (_, d) => (originalIndex + 1) * 10 + d,
          ),
        }));

        res
          .writeHead(200, { "content-type": "application/json" })
          .end(JSON.stringify({ data }));
        return;
      }

      res.writeHead(404).end("not found");
    })();
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Failed to bind embeddings stub server");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    async close() {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    },
  };
}

// ── Machine-local config isolation ──────────────────────────────────────────
//
// getProviderForRole reads ~/.zam/config.json unconditionally; isolate it so
// these tests never see the developer's real machine provider bindings.

let machineConfigDir: string;
let previousZamConfigPath: string | undefined;

beforeEach(() => {
  machineConfigDir = mkdtempSync(join(tmpdir(), "zam-embedder-machine-cfg-"));
  previousZamConfigPath = process.env.ZAM_CONFIG_PATH;
  process.env.ZAM_CONFIG_PATH = join(machineConfigDir, "config.json");
});

afterEach(() => {
  if (previousZamConfigPath === undefined) {
    delete process.env.ZAM_CONFIG_PATH;
  } else {
    process.env.ZAM_CONFIG_PATH = previousZamConfigPath;
  }
  rmSync(machineConfigDir, { recursive: true, force: true });
});

// ── DB fixture ───────────────────────────────────────────────────────────────

let tempDir: string;
let db: Database;

beforeEach(async () => {
  tempDir = mkdtempSync(join(tmpdir(), "zam-embedder-db-"));
  db = await openDatabase({
    dbPath: join(tempDir, "zam-test.db"),
    useConfiguredCloud: false,
  });
});

afterEach(async () => {
  await db.close();
  rmSync(tempDir, { recursive: true, force: true });
});

async function enableEmbeddingRole(url: string, model?: string) {
  await setSetting(db, "llm.enabled", "true");
  await setSetting(db, "llm.embedding.url", url);
  if (model) {
    await setSetting(db, "llm.embedding.model", model);
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("embedTexts", () => {
  it("sends the OpenAI-compatible request shape and reorders shuffled indices", async () => {
    const stub = await startEmbeddingsStub({ shuffleIndex: true, dims: 3 });
    try {
      const result = await embedTexts(
        { url: stub.url, model: "embeddinggemma", apiKey: "sk-test" },
        ["first text", "second text", "third text"],
      );

      expect(stub.requests.length).toBe(1);
      expect(stub.requests[0]).toEqual({
        model: "embeddinggemma",
        input: ["first text", "second text", "third text"],
      });

      // Even though the server returned index 2, 1, 0 (reversed), the result
      // array must be in original input order.
      expect(result[0]).toEqual([10, 11, 12]);
      expect(result[1]).toEqual([20, 21, 22]);
      expect(result[2]).toEqual([30, 31, 32]);
    } finally {
      await stub.close();
    }
  });

  it("throws a house-style error on a non-2xx response", async () => {
    const stub = await startEmbeddingsStub({ embeddingsStatus: 500 });
    try {
      await expect(
        embedTexts(
          { url: stub.url, model: "embeddinggemma", apiKey: "sk-test" },
          ["text"],
        ),
      ).rejects.toThrow(/Embedding request failed:.*\(500\).*boom/);
    } finally {
      await stub.close();
    }
  });

  it("rejects a response with a mismatched vector count", async () => {
    const stub = await startEmbeddingsStub({ dropOneVector: true });
    try {
      await expect(
        embedTexts({ url: stub.url, model: "m", apiKey: "k" }, ["a", "b"]),
      ).rejects.toThrow(/returned 1 vectors for 2 inputs/);
    } finally {
      await stub.close();
    }
  });
});

describe("canonicalEmbeddingModelId", () => {
  it("maps all known EmbeddingGemma aliases to the canonical id", () => {
    const aliases = [
      "embeddinggemma",
      "embeddinggemma:300m",
      "embed-gemma",
      "Embed-Gemma:300m",
      "google/embeddinggemma-300m",
    ];
    for (const alias of aliases) {
      expect(canonicalEmbeddingModelId(alias)).toBe("embeddinggemma-300m");
    }
  });

  it("passes unknown model ids through, lowercased", () => {
    expect(canonicalEmbeddingModelId("qwen3-embedding-0.6b")).toBe(
      "qwen3-embedding-0.6b",
    );
    expect(canonicalEmbeddingModelId("Qwen3-Embedding-0.6B")).toBe(
      "qwen3-embedding-0.6b",
    );
  });
});

describe("ensureTokenEmbeddings", () => {
  it("embeds pending tokens, storing the canonical model and correct content hash", async () => {
    const stub = await startEmbeddingsStub({
      availableModels: ["embeddinggemma"],
      dims: 4,
    });
    try {
      await enableEmbeddingRole(stub.url, "embeddinggemma");

      const token = await createToken(db, {
        slug: "dedicated-runtime",
        concept: "dedicated runtime for each customer",
        domain: "infra",
        question: "What isolation model is used per customer?",
      });

      const result = await ensureTokenEmbeddings(db, { limit: 10 });
      expect(result.status).toBe("ok");
      expect(result.embedded).toBe(1);
      expect(result.remaining).toBe(0);

      // The wire request carries the configured raw model name...
      expect(stub.requests[0].model).toBe("embeddinggemma");

      // ...but the stored row uses the canonical model id.
      const stored = await getTokenEmbedding(db, token.id);
      expect(stored).toBeDefined();
      expect(stored!.model).toBe("embeddinggemma-300m");

      const expectedText = embeddingTextForToken(token);
      expect(stored!.content_hash).toBe(computeContentHash(expectedText));
      expect(stored!.dims).toBe(4);
    } finally {
      await stub.close();
    }
  });

  it("does not re-embed a token that is already fresh under the canonical model", async () => {
    const stub = await startEmbeddingsStub({
      availableModels: ["embeddinggemma"],
    });
    try {
      await enableEmbeddingRole(stub.url, "embeddinggemma");
      await createToken(db, {
        slug: "one-time-token",
        concept: "a concept",
        domain: "d",
      });

      const first = await ensureTokenEmbeddings(db, { limit: 10 });
      expect(first.embedded).toBe(1);

      const second = await ensureTokenEmbeddings(db, { limit: 10 });
      expect(second.status).toBe("ok");
      expect(second.embedded).toBe(0);
      expect(second.remaining).toBe(0);
      // Only the first pass should have hit the network.
      expect(stub.requests.length).toBe(1);
    } finally {
      await stub.close();
    }
  });

  it("returns unavailable without throwing and leaves the DB untouched when the server is down", async () => {
    await enableEmbeddingRole("http://127.0.0.1:1", "embeddinggemma");
    const token = await createToken(db, {
      slug: "orphan-token",
      concept: "a concept nobody embeds",
      domain: "d",
    });

    const result = await ensureTokenEmbeddings(db, { limit: 10 });
    expect(result.status).toBe("unavailable");
    expect(result.embedded).toBe(0);
    expect(typeof result.reason).toBe("string");

    const stored = await getTokenEmbedding(db, token.id);
    expect(stored).toBeUndefined();
  });

  it("reports disabled when llm.enabled is not set", async () => {
    const stub = await startEmbeddingsStub();
    try {
      // Deliberately skip enableEmbeddingRole's llm.enabled=true.
      await setSetting(db, "llm.embedding.url", stub.url);
      const result = await ensureTokenEmbeddings(db);
      expect(result.status).toBe("unavailable");
      expect(result.reason).toMatch(/disabled/);
    } finally {
      await stub.close();
    }
  });

  it("degrades to unavailable instead of throwing when embedding fails mid-flight", async () => {
    // /models responds healthy, so the upfront endpoint check passes — the
    // failure only surfaces on the /embeddings call itself.
    const stub = await startEmbeddingsStub({
      availableModels: ["embeddinggemma"],
      embeddingsStatus: 500,
    });
    try {
      await enableEmbeddingRole(stub.url, "embeddinggemma");
      await createToken(db, {
        slug: "midflight-token",
        concept: "a concept the server refuses to embed",
        domain: "d",
      });

      const result = await ensureTokenEmbeddings(db, { limit: 10 });
      expect(result.status).toBe("unavailable");
      expect(result.embedded).toBe(0);
      expect(result.remaining).toBe(1);
      expect(result.reason).toMatch(/Embedding request failed/);
    } finally {
      await stub.close();
    }
  });

  it("force with an unbounded limit re-embeds every fresh token (--all semantics)", async () => {
    const stub = await startEmbeddingsStub({
      availableModels: ["embeddinggemma"],
    });
    try {
      await enableEmbeddingRole(stub.url, "embeddinggemma");

      // More tokens than the default per-call cap of 64, so a capped forced
      // pass would provably leave the tail untouched.
      const total = 70;
      for (let i = 0; i < total; i++) {
        await createToken(db, {
          slug: `bulk-token-${i}`,
          concept: `bulk concept number ${i}`,
          domain: "bulk",
        });
      }

      const initial = await ensureTokenEmbeddings(db, {
        limit: Number.MAX_SAFE_INTEGER,
      });
      expect(initial.embedded).toBe(total);
      expect(initial.remaining).toBe(0);

      // Everything is fresh now; a forced unbounded pass must still re-embed
      // all of it, not just the first 64.
      const forced = await ensureTokenEmbeddings(db, {
        force: true,
        limit: Number.MAX_SAFE_INTEGER,
      });
      expect(forced.status).toBe("ok");
      expect(forced.embedded).toBe(total);
      expect(forced.remaining).toBe(0);
    } finally {
      await stub.close();
    }
  });
});

describe("embedQuery", () => {
  it("embeds a single query and returns the canonical model id", async () => {
    const stub = await startEmbeddingsStub({
      availableModels: ["embeddinggemma"],
      dims: 5,
    });
    try {
      await enableEmbeddingRole(stub.url, "embeddinggemma");
      const result = await embedQuery(db, "one Ivy instance per tenant");
      expect(result).not.toBeNull();
      expect(result!.model).toBe("embeddinggemma-300m");
      expect(result!.vector.length).toBe(5);
    } finally {
      await stub.close();
    }
  });

  it("returns null when the endpoint is unavailable", async () => {
    await enableEmbeddingRole("http://127.0.0.1:1", "embeddinggemma");
    const result = await embedQuery(db, "some query");
    expect(result).toBeNull();
  });

  it("returns null on a network error even when the endpoint initially resolves", async () => {
    const stub = await startEmbeddingsStub({
      availableModels: ["embeddinggemma"],
      embeddingsStatus: 500,
    });
    try {
      await enableEmbeddingRole(stub.url, "embeddinggemma");
      const result = await embedQuery(db, "some query");
      expect(result).toBeNull();
    } finally {
      await stub.close();
    }
  });
});

describe("DEFAULT_EMBEDDING_MODEL", () => {
  it("is embeddinggemma", () => {
    expect(DEFAULT_EMBEDDING_MODEL).toBe("embeddinggemma");
  });
});
