import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  type Database,
  listTokens,
  openDatabase,
} from "../../src/kernel/index.js";

const BASE_A = "https://example.com/okf/output-contract";
const BASE_B = "https://example.com/okf/queue-design";

describe("listTokens sourceLinkBases filter", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-srclink-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await createToken(db, {
      slug: "exact-base",
      concept: "Exact base",
      source_link: BASE_A,
    });
    await createToken(db, {
      slug: "anchored",
      concept: "Anchored",
      source_link: `${BASE_A}#json-only`,
    });
    await createToken(db, {
      slug: "other-article",
      concept: "Other article",
      source_link: `${BASE_B}#interleave`,
    });
    await createToken(db, { slug: "unlinked", concept: "No source link" });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("matches exact base and anchored forms, OR-ed over multiple bases", async () => {
    const one = await listTokens(db, { sourceLinkBases: [BASE_A] });
    expect(one.map((t) => t.slug).sort()).toEqual(["anchored", "exact-base"]);

    const both = await listTokens(db, {
      sourceLinkBases: [BASE_A, BASE_B],
    });
    expect(both.map((t) => t.slug).sort()).toEqual([
      "anchored",
      "exact-base",
      "other-article",
    ]);
  });

  it("does not over-match prefixes without the # separator or LIKE wildcards", async () => {
    await createToken(db, {
      slug: "prefix-cousin",
      concept: "Prefix cousin",
      source_link: `${BASE_A}-v2`,
    });
    const tokens = await listTokens(db, { sourceLinkBases: [BASE_A] });
    expect(tokens.map((t) => t.slug)).not.toContain("prefix-cousin");

    // A base containing LIKE wildcards must be treated literally.
    const wildcard = await listTokens(db, {
      sourceLinkBases: ["https://example.com/okf/%"],
    });
    expect(wildcard).toEqual([]);
  });

  it("empty base list matches nothing; omitted filter matches everything", async () => {
    expect(await listTokens(db, { sourceLinkBases: [] })).toEqual([]);
    expect((await listTokens(db)).length).toBe(4);
  });

  it("composes with domain filtering", async () => {
    await createToken(db, {
      slug: "domained",
      concept: "Domained",
      domain: "zam/okf",
      source_link: `${BASE_A}#extra`,
    });
    const tokens = await listTokens(db, {
      domainPrefix: "zam",
      sourceLinkBases: [BASE_A],
    });
    expect(tokens.map((t) => t.slug)).toEqual(["domained"]);
  });
});
