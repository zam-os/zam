import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { importOkfTokens } from "../../src/cli/bridge-handlers.js";
import {
  type Database,
  evaluateRating,
  getCard,
  getTokenBySlug,
  openDatabase,
} from "../../src/kernel/index.js";

const USER = "importer";
const RESOURCE = "https://example.com/kb/sample-article.md";

const ARTICLE = `---
type: reference
title: Sample Article
description: Fixture article for import tests.
resource: ${RESOURCE}
timestamp: 2026-07-18
---

# Sample Article

## First concept

Body one.

## Second concept

Body two.
`;

describe("importOkfTokens (ADR 2026-07-18)", () => {
  let db: Database;
  let tempDir: string;
  let bundleDir: string;
  let previousConfigPath: string | undefined;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-okf-import-"));
    // Isolate the machine-local config: the developer's real active
    // knowledge context must not leak into the fresh test database.
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(tempDir, "machine-config.json");
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    bundleDir = join(tempDir, "docs", "okf");
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(join(bundleDir, "sample-article.md"), ARTICLE, "utf8");
  });

  afterEach(async () => {
    await db.close();
    if (previousConfigPath === undefined) {
      delete process.env.ZAM_CONFIG_PATH;
    } else {
      process.env.ZAM_CONFIG_PATH = previousConfigPath;
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  function importSample(
    tokens: Parameters<typeof importOkfTokens>[1]["tokens"],
  ) {
    return importOkfTokens(db, {
      user: USER,
      bundleDir,
      file: "sample-article.md",
      tokens,
    });
  }

  it("creates tokens, cards, prerequisites, and anchored source links", async () => {
    const result = await importSample([
      {
        slug: "first-concept",
        title: "First Concept",
        concept: "The first memorable concept.",
        bloomLevel: 2,
        domain: "fixtures/basics",
        anchor: "first-concept",
      },
      {
        slug: "second-concept",
        concept: "The dependent concept.",
        bloomLevel: 3,
        domain: "fixtures/basics",
        anchor: "second-concept",
        prerequisites: ["first-concept"],
      },
    ]);

    expect(result.created.sort()).toEqual(["first-concept", "second-concept"]);
    expect(result.cards).toBe(2);
    expect(result.article.source_link).toBe(RESOURCE);

    const first = await getTokenBySlug(db, "first-concept");
    expect(first?.source_link).toBe(`${RESOURCE}#first-concept`);
    expect(first?.bloom_level).toBe(2);

    const second = await getTokenBySlug(db, "second-concept");
    if (!first || !second) throw new Error("tokens missing");
    const prereqs = (await db
      .prepare("SELECT requires_id FROM prerequisites WHERE token_id = ?")
      .all(second.id)) as Array<{ requires_id: string }>;
    expect(prereqs.map((p) => p.requires_id)).toEqual([first.id]);

    expect(await getCard(db, first.id, USER)).toBeTruthy();
    expect(await getCard(db, second.id, USER)).toBeTruthy();
  });

  it("accepts a deliberate single-token import", async () => {
    const result = await importSample([
      { slug: "only-concept", concept: "One genuine concept." },
    ]);
    expect(result.created).toEqual(["only-concept"]);
  });

  it("rejects mode 'new' on an existing slug with an instructive error", async () => {
    await importSample([{ slug: "first-concept", concept: "V1." }]);
    await expect(
      importSample([{ slug: "first-concept", concept: "V2." }]),
    ).rejects.toThrow(/update.*replace|already exists/);
  });

  it("update refreshes content and keeps learning state", async () => {
    await importSample([{ slug: "first-concept", concept: "V1." }]);
    const token = await getTokenBySlug(db, "first-concept");
    if (!token) throw new Error("token missing");
    const card = await getCard(db, token.id, USER);
    if (!card) throw new Error("card missing");
    await evaluateRating(db, {
      cardId: card.id,
      tokenId: token.id,
      userId: USER,
      rating: 3,
    });

    await importSample([
      { slug: "first-concept", concept: "V1, refreshed.", mode: "update" },
    ]);
    const after = await getTokenBySlug(db, "first-concept");
    expect(after?.concept).toBe("V1, refreshed.");
    const cardAfter = await getCard(db, token.id, USER);
    expect(cardAfter?.reps).toBeGreaterThan(0);
    expect(cardAfter?.state).not.toBe("new");
  });

  it("replace refreshes content and resets learning state to the beginning", async () => {
    await importSample([{ slug: "first-concept", concept: "Old meaning." }]);
    const token = await getTokenBySlug(db, "first-concept");
    if (!token) throw new Error("token missing");
    const card = await getCard(db, token.id, USER);
    if (!card) throw new Error("card missing");
    await evaluateRating(db, {
      cardId: card.id,
      tokenId: token.id,
      userId: USER,
      rating: 3,
    });

    await importSample([
      { slug: "first-concept", concept: "New meaning.", mode: "replace" },
    ]);
    const cardAfter = await getCard(db, token.id, USER);
    expect(cardAfter?.state).toBe("new");
    expect(cardAfter?.reps).toBe(0);
    expect(cardAfter?.last_review_at).toBeNull();
  });

  it("moves previously imported tokens absent from a re-import into maintenance", async () => {
    await importSample([
      { slug: "first-concept", concept: "A." },
      { slug: "second-concept", concept: "B." },
    ]);
    const result = await importSample([
      { slug: "first-concept", concept: "A2.", mode: "update" },
    ]);
    expect(result.maintenance).toEqual(["second-concept"]);
    const absent = await getTokenBySlug(db, "second-concept");
    expect(absent?.maintenance_at).toBeTruthy();
    expect(absent?.maintenance_reason).toContain("sample-article.md");
  });

  it("an explicit update clears a token's maintenance state", async () => {
    await importSample([
      { slug: "first-concept", concept: "A." },
      { slug: "second-concept", concept: "B." },
    ]);
    await importSample([
      { slug: "first-concept", concept: "A2.", mode: "update" },
    ]);
    await importSample([
      { slug: "first-concept", concept: "A3.", mode: "update" },
      { slug: "second-concept", concept: "B2.", mode: "update" },
    ]);
    const repaired = await getTokenBySlug(db, "second-concept");
    expect(repaired?.maintenance_at).toBeNull();
  });

  it("links prerequisites to pre-existing tokens outside the import", async () => {
    await importSample([{ slug: "first-concept", concept: "Foundation." }]);
    await importSample([
      {
        slug: "advanced-concept",
        concept: "Builds on the foundation.",
        prerequisites: ["first-concept"],
      },
    ]);
    const advanced = await getTokenBySlug(db, "advanced-concept");
    const foundation = await getTokenBySlug(db, "first-concept");
    if (!advanced || !foundation) throw new Error("tokens missing");
    const prereqs = (await db
      .prepare("SELECT requires_id FROM prerequisites WHERE token_id = ?")
      .all(advanced.id)) as Array<{ requires_id: string }>;
    expect(prereqs.map((p) => p.requires_id)).toEqual([foundation.id]);
  });

  it("rejects a prerequisite cycle and rolls the import back", async () => {
    await importSample([
      { slug: "alpha", concept: "A." },
      { slug: "beta", concept: "B.", prerequisites: ["alpha"] },
    ]);
    await expect(
      importSample([
        {
          slug: "alpha",
          concept: "A2.",
          mode: "update",
          prerequisites: ["beta"],
        },
      ]),
    ).rejects.toThrow(/cycle/i);
    // Rolled back: alpha's concept unchanged.
    const alpha = await getTokenBySlug(db, "alpha");
    expect(alpha?.concept).toBe("A.");
  });

  it("rejects an unknown article and an empty token list", async () => {
    await expect(
      importOkfTokens(db, {
        user: USER,
        bundleDir,
        file: "missing.md",
        tokens: [{ slug: "x", concept: "y" }],
      }),
    ).rejects.toThrow(/not found/i);
    await expect(
      importOkfTokens(db, {
        user: USER,
        bundleDir,
        file: "sample-article.md",
        tokens: [],
      }),
    ).rejects.toThrow(/non-empty/);
  });
});
