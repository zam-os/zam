import { execFile } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createServer, type IncomingMessage, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  ensureCard,
  openDatabase,
  setSetting,
  upsertTokenEmbedding,
  computeContentHash,
  embeddingContentForToken,
} from "../../src/kernel/index.js";

interface ExpectedSuggestion {
  slug: string;
  concept: string;
  domain: string;
  bloom_level: number;
  similarity: number;
  already_prerequisite: boolean;
  would_create_cycle: boolean;
  bloom_above_target: boolean;
}

interface ExpectedSuggestFoundationsResult {
  semantic: boolean;
  target: { slug: string } | null;
  suggestions: ExpectedSuggestion[];
}

interface EmbeddingsRequestBody {
  model: string;
  input: string[];
}

describe("bridge suggest-foundations subcommand", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;
  let dbPath: string;
  let server: Server | null = null;
  let serverUrl = "";

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-suggest-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-suggest-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");

    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });
    dbPath = join(dataDir, "zam.db");
    server = null;
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  async function initDb(fn: (db: any) => Promise<void>) {
    const db = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
    await fn(db);
    await db.close();
  }

  function startEmbeddingsStub(options: {
    embeddings: number[][];
  }) {
    server = createServer((req, res) => {
      const url = req.url ?? "";
      if (req.method === "POST" && url.endsWith("/embeddings")) {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          const reqBody = JSON.parse(body) as EmbeddingsRequestBody;
          const data = reqBody.input.map((_, index) => ({
            index,
            embedding: options.embeddings[index] ?? [0.5, 0.5, 0, 0],
          }));
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ data }));
        });
      } else {
        res.writeHead(200);
        res.end("OK");
      }
    });

    return new Promise<void>((resolve) => {
      server!.listen(0, "127.0.0.1", () => {
        const addr = server!.address();
        if (typeof addr === "object" && addr !== null) {
          serverUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  }

  function runBridgeWithStdin(
    args: string[],
    stdin: string,
  ): Promise<ExpectedSuggestFoundationsResult> {
    return new Promise((resolve, reject) => {
      const child = execFile(
        "node",
        [cliPath, "bridge", ...args],
        {
          cwd: tempCwd,
          env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Exit error: ${error.message}. Stderr: ${stderr}. Stdout: ${stdout}`));
            return;
          }
          try {
            resolve(JSON.parse(stdout) as ExpectedSuggestFoundationsResult);
          } catch (e) {
            reject(new Error(`Failed to parse stdout: ${stdout}. Stderr: ${stderr}`));
          }
        },
      );
      child.stdin?.write(stdin);
      child.stdin?.end();
    });
  }

  function runBridgeWithStdinExpectingError(
    args: string[],
    stdin: string,
  ): Promise<{ error: string }> {
    return new Promise((resolve) => {
      const child = execFile(
        "node",
        [cliPath, "bridge", ...args],
        {
          cwd: tempCwd,
          env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
        },
        (error, stdout, stderr) => {
          const output = stdout || stderr || "{}";
          try {
            resolve(JSON.parse(output.trim()));
          } catch {
            resolve({ error: output });
          }
        },
      );
      child.stdin?.write(stdin);
      child.stdin?.end();
    });
  }

  it("returns semantic: false for offline embedder after resolving a valid token", async () => {
    await initDb(async (db) => {
      await setSetting(db, "llm.enabled", "false");
    });

    const stdin = JSON.stringify({ slug: "some-slug" });
    const result = await runBridgeWithStdinExpectingError(
      ["suggest-foundations", "--user", "thomas"],
      stdin,
    );

    // If target token is not found, it must error even when embedder is offline
    expect(result.error).toContain("Token not found");

    // Let's create the token and check again
    await initDb(async (db) => {
      await createToken(db, {
        slug: "some-slug",
        concept: "Some Concept",
        domain: "test",
        bloom_level: 1,
      });
    });

    const result2 = await runBridgeWithStdin(
      ["suggest-foundations", "--user", "thomas"],
      stdin,
    );
    expect(result2).toEqual({
      semantic: false,
      target: { slug: "some-slug" },
      suggestions: [],
    });
  });

  it("errors on unknown slug", async () => {
    await initDb(async (db) => {
      await setSetting(db, "llm.enabled", "false");
    });
    const stdin = JSON.stringify({ slug: "unknown-slug" });
    const result = await runBridgeWithStdinExpectingError(
      ["suggest-foundations", "--user", "thomas"],
      stdin,
    );
    expect(result.error).toContain("Token not found: unknown-slug");
  });

  it("errors on invalid JSON input", async () => {
    const result = await runBridgeWithStdinExpectingError(
      ["suggest-foundations", "--user", "thomas"],
      "not-even-json",
    );
    expect(result.error).toContain("Invalid JSON input");
  });

  it("errors when concept is missing in pre-registration shape", async () => {
    const stdin = JSON.stringify({ domain: "test" });
    const result = await runBridgeWithStdinExpectingError(
      ["suggest-foundations", "--user", "thomas"],
      stdin,
    );
    expect(result.error).toContain("JSON must include a non-empty 'slug' or 'concept' field");
  });

  it("handles happy path with mock embeddings server and filters similarity bands", async () => {
    // 1. Start stub server that returns [1, 0, 0, 0] for query
    await startEmbeddingsStub({
      embeddings: [[1, 0, 0, 0]],
    });

    await initDb(async (db) => {
      // Configure embeddings settings
      await setSetting(db, "llm.enabled", "true");
      await setSetting(db, "llm.embedding.url", serverUrl);
      await setSetting(db, "llm.embedding.model", "embeddinggemma");
      await setSetting(db, "search.suggest_min_similarity", "0.45");
      await setSetting(db, "search.dedup_threshold", "0.85");

      // Seed tokens
      const target = await createToken(db, {
        slug: "target-token",
        concept: "Target Concept Description",
        domain: "math",
        bloom_level: 2,
      });

      const foundation = await createToken(db, {
        slug: "foundation-token",
        concept: "Foundation Concept Description",
        domain: "math",
        bloom_level: 1,
      });

      const dedup = await createToken(db, {
        slug: "dedup-token",
        concept: "Very Similar Concept",
        domain: "math",
        bloom_level: 2,
      });

      // Set embeddings in DB
      // Query = [1, 0, 0, 0]
      // target is excluded anyway
      // foundation is at sim = 0.6 (within 0.45 <= sim < 0.85)
      // dedup is at sim = 0.9 (above 0.85, dedup territory, should be excluded)
      await upsertTokenEmbedding(db, {
        tokenId: target.id,
        embedding: [1, 0, 0, 0],
        model: "embeddinggemma-300m",
        contentHash: computeContentHash(embeddingContentForToken(target)),
      });

      await upsertTokenEmbedding(db, {
        tokenId: foundation.id,
        embedding: [0.6, 0.8, 0, 0], // unit vector, sim = 0.6
        model: "embeddinggemma-300m",
        contentHash: computeContentHash(embeddingContentForToken(foundation)),
      });

      await upsertTokenEmbedding(db, {
        tokenId: dedup.id,
        embedding: [0.9, 0.43588989, 0, 0], // unit vector, sim = 0.9
        model: "embeddinggemma-300m",
        contentHash: computeContentHash(embeddingContentForToken(dedup)),
      });
    });

    const stdin = JSON.stringify({ slug: "target-token" });
    const result = await runBridgeWithStdin(
      ["suggest-foundations", "--user", "thomas"],
      stdin,
    );

    expect(result.semantic).toBe(true);
    expect(result.target).toEqual({ slug: "target-token" });
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].slug).toBe("foundation-token");
    expect(result.suggestions[0].similarity).toBeCloseTo(0.6, 2);
    expect(result.suggestions[0].already_prerequisite).toBe(false);
    expect(result.suggestions[0].would_create_cycle).toBe(false);
    expect(result.suggestions[0].bloom_above_target).toBe(false);
  });

  it("handles happy path for pre-registration (concept) flow", async () => {
    await startEmbeddingsStub({
      embeddings: [[1, 0, 0, 0]],
    });

    await initDb(async (db) => {
      await setSetting(db, "llm.enabled", "true");
      await setSetting(db, "llm.embedding.url", serverUrl);
      await setSetting(db, "llm.embedding.model", "embeddinggemma");
      await setSetting(db, "search.suggest_min_similarity", "0.45");
      await setSetting(db, "search.dedup_threshold", "0.85");

      const foundation = await createToken(db, {
        slug: "found-pre",
        concept: "Pre-reg Foundation Concept",
        domain: "math",
        bloom_level: 1,
      });

      await upsertTokenEmbedding(db, {
        tokenId: foundation.id,
        embedding: [0.6, 0.8, 0, 0],
        model: "embeddinggemma-300m",
        contentHash: computeContentHash(embeddingContentForToken(foundation)),
      });
    });

    const stdin = JSON.stringify({
      concept: "Some new concept description",
      domain: "math",
    });
    const result = await runBridgeWithStdin(
      ["suggest-foundations", "--user", "thomas"],
      stdin,
    );

    expect(result.semantic).toBe(true);
    expect(result.target).toBeNull();
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].slug).toBe("found-pre");
    expect(result.suggestions[0].already_prerequisite).toBe(false);
    expect(result.suggestions[0].would_create_cycle).toBe(false);
  });
});
