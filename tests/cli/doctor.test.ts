import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  doctorTasks,
  parseDoctorTimeout,
} from "../../src/cli/commands/doctor.js";
import {
  computeContentHash,
  createToken,
  type Database,
  embeddingContentForToken,
  getEmbeddingCoverage,
  getTokenBySlug,
  openDatabase,
  setSetting,
  type Token,
  upsertTokenEmbedding,
} from "../../src/kernel/index.js";

const CANONICAL_MODEL = "embeddinggemma-300m";

describe("doctor command tasks", () => {
  let db: Database;
  let logs: string[];
  let warnings: string[];
  let errors: string[];

  beforeEach(async () => {
    db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    logs = [];
    warnings = [];
    errors = [];
    vi.spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.join(" "));
    });
    vi.spyOn(console, "warn").mockImplementation((...args) => {
      warnings.push(args.join(" "));
    });
    vi.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args.join(" "));
    });
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.close();
  });

  function task(name: string) {
    const found = doctorTasks.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`Missing doctor task: ${name}`);
    return found;
  }

  async function createWeakToken(slug = "testing-safe-migrations") {
    return createToken(db, {
      slug,
      title: "",
      concept: "Ueber sichere Migrationen und ihre atomare Ausführung.",
      question: "Was gilt fuer sichere Migrationen?",
      domain: "testing",
      bloom_level: 2,
    });
  }

  async function storeEmbedding(token: Token, vector = [1, 0]) {
    await upsertTokenEmbedding(db, {
      tokenId: token.id,
      embedding: vector,
      model: CANONICAL_MODEL,
      contentHash: computeContentHash(embeddingContentForToken(token)),
    });
  }

  it("treats --dry-run as a hard write barrier even when --fix and --yes are set", async () => {
    const token = await createWeakToken();

    await task("texts").run(db, {
      fix: true,
      dryRun: true,
      yes: true,
      noLlm: true,
    });
    await task("titles").run(db, {
      fix: true,
      dryRun: true,
      yes: true,
      noLlm: true,
    });
    await task("domains").run(db, {
      fix: true,
      dryRun: true,
      yes: true,
    });

    const unchanged = await getTokenBySlug(db, token.slug);
    expect(unchanged).toMatchObject({
      title: "",
      concept: "Ueber sichere Migrationen und ihre atomare Ausführung.",
      question: "Was gilt fuer sichere Migrationen?",
      domain: "testing",
    });
    expect(errors).toEqual([]);
    expect(logs.join("\n")).toContain("Proposed changes (Dry run)");
    expect(logs.join("\n")).toContain("Use --fix to interactively");
  });

  it("finds canonical EmbeddingGemma vectors when the configured model is an alias", async () => {
    const first = await createWeakToken("testing-first-duplicate");
    const second = await createWeakToken("testing-second-duplicate");
    await storeEmbedding(first);
    await storeEmbedding(second);
    await setSetting(db, "llm.embedding.model", "embeddinggemma");

    await task("duplicates").run(db, {
      fix: true,
      dryRun: true,
      yes: true,
    });

    const output = logs.join("\n");
    expect(output).toContain(
      'Using canonical embedding model "embeddinggemma-300m"',
    );
    expect(output).toContain("Scanning 2 tokens");
    expect(output).toContain("Found 1 duplicate pairs");
    expect(output).toContain("Duplicate pairs found (Dry run)");
    expect(errors).toEqual([]);
    expect((await getTokenBySlug(db, first.slug))?.deprecated_at).toBeNull();
    expect((await getTokenBySlug(db, second.slug))?.deprecated_at).toBeNull();
  });

  it("reports an incomplete duplicate scan when embeddings cannot be backfilled", async () => {
    const embedded = await createWeakToken("testing-embedded");
    await createWeakToken("testing-missing");
    await storeEmbedding(embedded);
    await setSetting(db, "llm.embedding.model", "embeddinggemma");
    await setSetting(db, "llm.enabled", "false");

    await task("duplicates").run(db, {});

    expect(warnings.join("\n")).toContain(
      "Duplicate scan is incomplete: 1 of 2 active tokens",
    );
    expect(logs.join("\n")).toContain("Scanning 1 tokens");
    expect(await getEmbeddingCoverage(db, CANONICAL_MODEL)).toMatchObject({
      embedded: 1,
      missing: 1,
      stale: 0,
    });
  });

  it("requires --yes for deterministic fixes in non-interactive runs", async () => {
    const token = await createWeakToken();
    expect(process.stdin.isTTY).not.toBe(true);

    await task("texts").run(db, {
      fix: true,
      dryRun: false,
      noLlm: true,
    });

    expect(errors.join("\n")).toContain("Re-run with --yes");
    expect((await getTokenBySlug(db, token.slug))?.concept).toBe(
      "Ueber sichere Migrationen und ihre atomare Ausführung.",
    );
  });

  it("rejects --yes for tasks that require a human choice", async () => {
    const first = await createWeakToken("testing-first-choice");
    const second = await createWeakToken("testing-second-choice");
    await storeEmbedding(first);
    await storeEmbedding(second);
    await setSetting(db, "llm.embedding.model", "embeddinggemma");

    await task("duplicates").run(db, {
      fix: true,
      dryRun: false,
      yes: true,
    });
    await task("domains").run(db, {
      fix: true,
      dryRun: false,
      yes: true,
    });

    expect(errors.join("\n")).toContain(
      "--yes cannot choose how to resolve duplicate fixes",
    );
    expect(errors.join("\n")).toContain(
      "--yes cannot choose how to resolve domain renames",
    );
  });

  it("validates and bounds heuristic title proposals before writing", async () => {
    const token = await createToken(db, {
      slug: "testing-atomic-migration-boundaries",
      title: "",
      concept:
        "A carefully designed migration keeps every related database change inside one atomic transaction so partial state cannot escape after a failure.",
      domain: "testing",
      bloom_level: 2,
    });

    await task("titles").run(db, {
      fix: true,
      dryRun: false,
      yes: true,
      noLlm: true,
    });

    const updated = await getTokenBySlug(db, token.slug);
    expect(updated?.title.length).toBeGreaterThan(2);
    expect(updated?.title.length).toBeLessThanOrEqual(80);
    expect(updated?.title).not.toBe(updated?.slug);
  });

  it("accepts only positive integer timeouts", () => {
    expect(parseDoctorTimeout("2500")).toBe(2500);
    expect(() => parseDoctorTimeout("0")).toThrow("positive integer");
    expect(() => parseDoctorTimeout("-1")).toThrow("positive integer");
    expect(() => parseDoctorTimeout("10ms")).toThrow("positive integer");
  });
});
