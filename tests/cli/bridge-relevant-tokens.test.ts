import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  ensureCard,
  openDatabase,
  setSetting,
} from "../../src/kernel/index.js";

interface ExpectedRelevantToken {
  slug: string;
  concept: string;
  domain: string;
  bloom_level: number;
  score: number;
  similarity: number | null;
  card: {
    state: string;
    due_at: string;
    blocked: number;
  } | null;
}

interface ExpectedRelevantTokensResult {
  semantic: boolean;
  tokens: ExpectedRelevantToken[];
}

describe("bridge relevant-tokens subcommand", () => {
  let tempHome: string;
  let tempCwd: string;
  let cliPath: string;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), "zam-bridge-relevant-home-"));
    tempCwd = mkdtempSync(join(tmpdir(), "zam-bridge-relevant-cwd-"));
    cliPath = join(process.cwd(), "dist", "cli", "index.js");

    const dataDir = join(tempHome, ".zam");
    mkdirSync(dataDir, { recursive: true });

    const db = await openDatabase({
      dbPath: join(dataDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });

    // Create a couple of tokens to search over
    const t1 = await createToken(db, {
      slug: "azure-kubernetes-service",
      concept: "Azure Kubernetes Service AKS is a managed container service",
      domain: "kubernetes",
      bloom_level: 2,
    });

    await createToken(db, {
      slug: "azure-container-registry",
      concept: "Azure Container Registry ACR is a managed private registry",
      domain: "azure",
      bloom_level: 2,
    });

    // Create card for thomas on t1, but none on t2
    await ensureCard(db, t1.id, "thomas");
    await setSetting(db, "user.id", "thomas");

    await db.close();
  });

  afterEach(() => {
    for (const dir of [tempHome, tempCwd]) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function runBridgeWithStdin(
    args: string[],
    stdin: string,
  ): ExpectedRelevantTokensResult {
    const output = execFileSync("node", [cliPath, "bridge", ...args], {
      cwd: tempCwd,
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      input: stdin,
      encoding: "utf8",
    });
    return JSON.parse(output) as ExpectedRelevantTokensResult;
  }

  it("returns lexical-only results with semantic: false when embedder is offline", () => {
    // Under test environment, llm is not online and no embedding model is available,
    // so embedQuery will return null, resulting in semantic: false.
    const stdin = JSON.stringify({ context: "kubernetes service", limit: 5 });
    const result = runBridgeWithStdin(
      ["relevant-tokens", "--user", "thomas"],
      stdin,
    );

    expect(result).toMatchObject({
      semantic: false,
    });

    expect(result.tokens).toBeDefined();
    expect(result.tokens.length).toBeGreaterThanOrEqual(1);

    // First result should be AKS due to "kubernetes service" overlap
    const first = result.tokens[0];
    expect(first.slug).toBe("azure-kubernetes-service");
    expect(first.score).toBeGreaterThan(0);
    expect(first.similarity).toBeNull();
    expect(first.card).not.toBeNull();
    expect(first.card!.state).toBe("new");
  });

  it("populates card details when a card exists and null when it does not", () => {
    const stdin = JSON.stringify({ context: "azure managed service" });
    const result = runBridgeWithStdin(
      ["relevant-tokens", "--user", "thomas"],
      stdin,
    );

    expect(result.tokens.length).toBeGreaterThanOrEqual(2);

    const aks = result.tokens.find(
      (t) => t.slug === "azure-kubernetes-service",
    );
    const acr = result.tokens.find(
      (t) => t.slug === "azure-container-registry",
    );

    expect(aks).toBeDefined();
    expect(aks!.card).not.toBeNull();
    expect(aks!.card!.state).toBe("new");

    expect(acr).toBeDefined();
    expect(acr!.card).toBeNull();
  });

  it("respects the limit option in input json", () => {
    const stdin = JSON.stringify({ context: "azure", limit: 1 });
    const result = runBridgeWithStdin(
      ["relevant-tokens", "--user", "thomas"],
      stdin,
    );

    expect(result.tokens.length).toBe(1);
  });

  it("fails with jsonError on empty context or invalid json", () => {
    // Empty context
    expect(() => {
      runBridgeWithStdin(["relevant-tokens"], JSON.stringify({ context: "" }));
    }).toThrow();

    // Invalid JSON
    expect(() => {
      runBridgeWithStdin(["relevant-tokens"], "invalid-json");
    }).toThrow();
  });
});
