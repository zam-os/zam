import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import {
  buildReviewQueue,
  createToken,
  type Database,
  deprecateToken,
  detachCardForUser,
  getCard,
  libraryTopicKey,
  libraryTopicName,
  listLibraryTopics,
  openDatabase,
  setTokenMaintenance,
  startLibraryTopic,
} from "../../src/kernel/index.js";

/**
 * ADR 2026-10-02 phase 1: a library topic is the set of published tokens
 * citing one source; starting it gives the learner their own cards and
 * nothing else.
 */

const ARTICLE =
  "https://github.com/example/hub/blob/main/docs/okf/container-images.md";
const OTHER = "https://github.com/example/hub/blob/main/docs/okf/README.md";

async function seedLibrary(db: Database): Promise<void> {
  await createToken(db, {
    slug: "image-layer",
    concept: "An image is a stack of read-only layers",
    domain: "containers",
    source_link: `${ARTICLE}#layers`,
  });
  await createToken(db, {
    slug: "image-tag",
    concept: "A tag is a movable name for an image digest",
    domain: "containers",
    source_link: `${ARTICLE}#tags`,
  });
  await createToken(db, {
    slug: "image-digest",
    concept: "A digest names image content immutably",
    domain: "supply-chain",
    source_link: ARTICLE,
  });
  await createToken(db, {
    slug: "hub-overview",
    concept: "The hub collects the team's articles",
    domain: "hub",
    source_link: OTHER,
  });
  // Never part of a topic: no source, a draft, deprecated, in maintenance.
  await createToken(db, { slug: "unsourced", concept: "No source" });
  await createToken(db, {
    slug: "draft-only",
    concept: "Not published yet",
    source_link: `${ARTICLE}#draft`,
    editorial_state: "draft",
  });
  await createToken(db, {
    slug: "retired",
    concept: "Deprecated",
    source_link: `${ARTICLE}#old`,
  });
  await deprecateToken(db, "retired");
  await createToken(db, {
    slug: "unclear",
    concept: "Binding unclear",
    source_link: `${ARTICLE}#moved`,
  });
  await setTokenMaintenance(db, "unclear", "article split");
}

describe("library topic keys and names", () => {
  it("drops the fragment and otherwise compares literally", () => {
    expect(libraryTopicKey(`${ARTICLE}#layers`)).toBe(ARTICLE);
    // The same rule as getTokensBySourceLinkBase: no trimming, no URL
    // normalisation — a trailing slash or a padded link is another key.
    expect(libraryTopicKey(`${ARTICLE} `)).toBe(`${ARTICLE} `);
    expect(libraryTopicKey("https://example.org/guide/")).toBe(
      "https://example.org/guide/",
    );
    expect(libraryTopicKey("#only-anchor")).toBeNull();
    expect(libraryTopicKey("   #x")).toBeNull();
    expect(libraryTopicKey("")).toBeNull();
    expect(libraryTopicKey(null)).toBeNull();
  });

  it("names a topic after its file, or the folder of an index", () => {
    expect(libraryTopicName(ARTICLE)).toBe("Container images");
    expect(libraryTopicName(OTHER)).toBe("Okf");
    expect(libraryTopicName("C:\\hub\\docs\\token_card%20model.md")).toBe(
      "Token card model",
    );
    expect(libraryTopicName("https://example.org/k8s/index.html?x=1")).toBe(
      "K8s",
    );
    expect(libraryTopicName("https://example.org/")).toBe("Example.org");
    expect(libraryTopicName("https://example.org/README.md")).toBe(
      "Example.org",
    );
    // A version tail is not an extension.
    expect(libraryTopicName("https://example.org/docs/dotnet-8.0")).toBe(
      "Dotnet 8.0",
    );
    expect(libraryTopicName("https://example.org/docs/node-v20.1/")).toBe(
      "Node v20.1",
    );
  });
});

describe("library topics (SQLite)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-library-topics-"));
    db = await openDatabase({ dbPath: join(tempDir, "topics.db") });
    await seedLibrary(db);
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("groups published, sourced tokens by article", async () => {
    const topics = await listLibraryTopics(db, "learner_a");
    expect(topics).toEqual([
      {
        key: ARTICLE,
        name: "Container images",
        domain: "containers",
        itemCount: 3,
        heldCount: 0,
        setAsideCount: 0,
      },
      {
        key: OTHER,
        name: "Okf",
        domain: "hub",
        itemCount: 1,
        heldCount: 0,
        setAsideCount: 0,
      },
    ]);
  });

  it("starts a topic with the learner's own cards, which enter the queue", async () => {
    const result = await startLibraryTopic(db, "learner_a", `${ARTICLE}#tags`);
    expect(result).toEqual({
      key: ARTICLE,
      name: "Container images",
      itemCount: 3,
      created: 3,
      alreadyHeld: 0,
      setAside: 0,
    });

    const queue = await buildReviewQueue(db, {
      userId: "learner_a",
      maxNew: 10,
    });
    expect(queue.items.map((item) => item.slug).sort()).toEqual([
      "image-digest",
      "image-layer",
      "image-tag",
    ]);

    // Another learner's library view is untouched.
    const other = await listLibraryTopics(db, "learner_b");
    expect(other.every((topic) => topic.heldCount === 0)).toBe(true);
  });

  it("is idempotent and picks up tokens added to the article later", async () => {
    await startLibraryTopic(db, "learner_a", ARTICLE);
    const again = await startLibraryTopic(db, "learner_a", ARTICLE);
    expect(again.created).toBe(0);
    expect(again.alreadyHeld).toBe(3);

    await createToken(db, {
      slug: "image-registry",
      concept: "A registry stores and serves images",
      domain: "containers",
      source_link: `${ARTICLE}#registry`,
    });
    const later = await startLibraryTopic(db, "learner_a", ARTICLE);
    expect(later.created).toBe(1);
    expect(later.alreadyHeld).toBe(3);
  });

  it("leaves a card the learner set aside detached", async () => {
    await startLibraryTopic(db, "learner_a", ARTICLE);
    const tag = await getCard(
      db,
      (await listTokenId(db, "image-tag")) as string,
      "learner_a",
    );
    expect(tag).toBeDefined();
    await detachCardForUser(db, tag?.token_id as string, "learner_a");

    const result = await startLibraryTopic(db, "learner_a", ARTICLE);
    expect(result).toMatchObject({ created: 0, alreadyHeld: 2, setAside: 1 });
    const after = await getCard(db, tag?.token_id as string, "learner_a");
    expect(after?.detached_at).not.toBeNull();

    const [first] = await listLibraryTopics(db, "learner_a");
    // A started topic sorts after the ones not started yet.
    expect(first.key).toBe(OTHER);
    const article = (await listLibraryTopics(db, "learner_a")).find(
      (topic) => topic.key === ARTICLE,
    );
    expect(article).toMatchObject({ heldCount: 2, setAsideCount: 1 });
  });

  it("matches a key literally: no wildcard, no trailing-slash merge", async () => {
    const base = "https://example.org/a_b";
    await createToken(db, {
      slug: "literal-a",
      concept: "Under a_b",
      source_link: `${base}#one`,
    });
    // `_` is a LIKE wildcard; an unescaped match would pull this one in.
    await createToken(db, {
      slug: "literal-x",
      concept: "Under axb",
      source_link: "https://example.org/axb#one",
    });
    await createToken(db, {
      slug: "literal-slash",
      concept: "Under a_b/",
      source_link: `${base}/#two`,
    });

    const result = await startLibraryTopic(db, "learner_a", base);
    expect(result).toMatchObject({ itemCount: 1, created: 1 });
    const keys = (await listLibraryTopics(db, "learner_a")).map(
      (topic) => topic.key,
    );
    expect(keys).toEqual(
      expect.arrayContaining([base, `${base}/`, "https://example.org/axb"]),
    );
  });

  it("refuses a key that names no topic", async () => {
    await expect(
      startLibraryTopic(db, "learner_a", "https://example.org/none.md"),
    ).rejects.toThrow("Library topic not found");
    await expect(startLibraryTopic(db, "learner_a", " ")).rejects.toThrow(
      "key is required",
    );
  });
});

async function listTokenId(
  db: Database,
  slug: string,
): Promise<string | undefined> {
  const row = (await db
    .prepare("SELECT id FROM tokens WHERE slug = ?")
    .get(slug)) as { id: string } | undefined;
  return row?.id;
}

const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

describeWithPostgres(
  "library topics on PostgreSQL (needs POSTGRES_URL)",
  () => {
    const schema = "zam_library_topics";
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
      await seedLibrary(db);
    });

    afterEach(async () => {
      await db.close();
      await admin(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    });

    it("lets two clients of one learner start the same topic at once", async () => {
      // Two connections, so the two transactions really overlap: both read
      // "no card" before either commits. The loser's insert must not abort.
      const second = openPostgresDatabase({
        connectionString: `${POSTGRES_URL}?options=-c%20search_path%3D${schema}`,
      });
      try {
        const [a, b] = await Promise.all([
          startLibraryTopic(db, "learner_a", ARTICLE),
          startLibraryTopic(second, "learner_a", ARTICLE),
        ]);
        expect(a.created + b.created).toBe(3);
        expect(a.created + a.alreadyHeld).toBe(3);
        expect(b.created + b.alreadyHeld).toBe(3);
        const cards = (await db
          .prepare("SELECT COUNT(*) AS n FROM cards WHERE user_id = ?")
          .get("learner_a")) as { n: number | string };
        expect(Number(cards.n)).toBe(3);
      } finally {
        await second.close();
      }
    });

    it("lists and starts a topic", async () => {
      const topics = await listLibraryTopics(db, "learner_a");
      expect(topics.map((topic) => [topic.key, topic.itemCount])).toEqual([
        [ARTICLE, 3],
        [OTHER, 1],
      ]);
      const result = await startLibraryTopic(db, "learner_a", ARTICLE);
      expect(result.created).toBe(3);
      const again = await startLibraryTopic(db, "learner_a", ARTICLE);
      expect(again).toMatchObject({ created: 0, alreadyHeld: 3 });
    });
  },
);
