import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import {
  createToken,
  type Database,
  deprecateToken,
  detachCardForUser,
  ensureCard,
  listPersonalCards,
  listTokens,
  listUnchosenGroups,
  listUnchosenMembers,
  openDatabase,
  setTokenMaintenance,
} from "../../src/kernel/index.js";

/**
 * ADR 2026-10-10 Decision 2: the three Learning Content lists do not overlap.
 * Unpublished stays on listTokens; this file checks that a draft is absent
 * from the other two.
 */

const ARTICLE =
  "https://github.com/example/hub/blob/main/docs/okf/container-images.md";

async function seed(db: Database): Promise<void> {
  const held = await createToken(db, {
    slug: "held",
    concept: "A card the learner holds",
    domain: "containers",
    source_link: `${ARTICLE}#held`,
  });
  await ensureCard(db, held.id, "learner_a");

  const aside = await createToken(db, {
    slug: "aside",
    concept: "A card the learner set aside",
    domain: "containers",
    source_link: `${ARTICLE}#aside`,
  });
  await ensureCard(db, aside.id, "learner_a");
  await detachCardForUser(db, aside.id, "learner_a");

  const shared = await createToken(db, {
    slug: "shared",
    concept: "Published, taken by someone else",
    domain: "containers",
    source_link: `${ARTICLE}#shared`,
  });
  await ensureCard(db, shared.id, "learner_b");

  const layer = await createToken(db, {
    slug: "layer",
    concept: "An image is a stack of layers",
    domain: "containers",
    source_link: `${ARTICLE}#layers`,
  });
  await createToken(db, {
    slug: "tag",
    concept: "A tag names a digest",
    domain: "supply-chain",
    source_link: `${ARTICLE}#tags`,
  });
  await setTokenMaintenance(db, layer.slug, "article split");

  await createToken(db, {
    slug: "loose",
    concept: "Published and unsourced",
    domain: "notes",
  });

  const sketch = await createToken(db, {
    slug: "sketch",
    concept: "Still a draft",
    domain: "notes",
    source_link: `${ARTICLE}#draft`,
    editorial_state: "draft",
  });
  await ensureCard(db, sketch.id, "learner_a");

  const review = await createToken(db, {
    slug: "in-review",
    concept: "Waiting for review",
    source_link: `${ARTICLE}#review`,
    editorial_state: "in_review",
  });
  await ensureCard(db, review.id, "learner_a");

  const retired = await createToken(db, {
    slug: "retired",
    concept: "Deprecated, and a card exists",
    source_link: `${ARTICLE}#old`,
  });
  await ensureCard(db, retired.id, "learner_a");
  await deprecateToken(db, retired.slug);

  await createToken(db, {
    slug: "retired-loose",
    concept: "Deprecated, and no card",
    source_link: `${ARTICLE}#older`,
  });
  await deprecateToken(db, "retired-loose");
}

async function expectLists(db: Database): Promise<void> {
  const personal = await listPersonalCards(db, "learner_a", {
    publishedOnly: true,
  });
  expect(personal.map((card) => card.slug).sort()).toEqual(["aside", "held"]);
  const aside = personal.find((card) => card.slug === "aside");
  expect(aside?.detachedAt).toBeTruthy();

  // The flag is opt-in: without it the draft the learner holds stays listed.
  const unfiltered = await listPersonalCards(db, "learner_a");
  expect(unfiltered.map((card) => card.slug).sort()).toEqual([
    "aside",
    "held",
    "in-review",
    "sketch",
  ]);

  const groups = await listUnchosenGroups(db, "learner_a");
  expect(groups).toEqual([
    { key: "", name: "", domain: "notes", itemCount: 1 },
    {
      key: ARTICLE,
      name: "Container images",
      domain: "containers",
      itemCount: 3,
    },
  ]);

  const article = await listUnchosenMembers(db, "learner_a", ARTICLE);
  expect(article.map((member) => member.slug)).toEqual([
    "layer",
    "shared",
    "tag",
  ]);
  expect(
    article.find((member) => member.slug === "layer")?.maintenanceAt,
  ).toBeTruthy();

  const unsourced = await listUnchosenMembers(db, "learner_a", "");
  expect(unsourced.map((member) => member.slug)).toEqual(["loose"]);

  expect(
    await listUnchosenMembers(db, "learner_a", "https://example.org/none.md"),
  ).toEqual([]);

  // learner_b holds `shared`, so it is personal for them and not unchosen.
  const otherPersonal = await listPersonalCards(db, "learner_b", {
    publishedOnly: true,
  });
  expect(otherPersonal.map((card) => card.slug)).toEqual(["shared"]);
  const otherUnchosen = await listUnchosenMembers(db, "learner_b", ARTICLE);
  expect(otherUnchosen.map((member) => member.slug)).toEqual([
    "aside",
    "held",
    "layer",
    "tag",
  ]);

  const drafts = await listTokens(db, { editorialState: "draft" });
  expect(drafts.map((token) => token.slug)).toEqual(["sketch"]);
  const inReview = await listTokens(db, { editorialState: "in_review" });
  expect(inReview.map((token) => token.slug)).toEqual(["in-review"]);

  const slugs = new Set([
    ...personal.map((card) => card.slug),
    ...(await listUnchosenMembers(db, "learner_a", ARTICLE)).map(
      (member) => member.slug,
    ),
    ...(await listUnchosenMembers(db, "learner_a", "")).map(
      (member) => member.slug,
    ),
  ]);
  expect(slugs.has("sketch")).toBe(false);
  expect(slugs.has("in-review")).toBe(false);
  expect(slugs.has("retired")).toBe(false);
  expect(slugs.has("retired-loose")).toBe(false);
}

describe("learning content lists (SQLite)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-learning-content-"));
    db = await openDatabase({ dbPath: join(tempDir, "lists.db") });
    await seed(db);
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("partitions published cards, untaken tokens and drafts", async () => {
    await expectLists(db);
  });
});

const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

describeWithPostgres(
  "learning content lists on PostgreSQL (needs POSTGRES_URL)",
  () => {
    const schema = "zam_learning_content_lists";
    let db: Database;

    async function admin(sql: string): Promise<void> {
      const conn = openPostgresDatabase({
        connectionString: POSTGRES_URL as string,
      });
      await conn.exec(sql);
      await conn.close();
    }

    beforeEach(async () => {
      await admin(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin(`CREATE SCHEMA ${schema}`);
      db = openPostgresDatabase({
        connectionString: `${POSTGRES_URL}?options=-c%20search_path%3D${schema}`,
      });
      await applySchemaAndMigrations(db);
      await seed(db);
    });

    afterEach(async () => {
      await db.close();
      await admin(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    });

    it("partitions the same way as SQLite", async () => {
      await expectLists(db);
    });
  },
);
