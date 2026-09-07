/**
 * Managing your own cards from the device.
 *
 * The behaviours worth pinning are the ones a learner would notice going
 * wrong: a search that finds nothing when the network is down, a paused card
 * that quietly keeps appearing in the queue, and an edited question that the
 * dynamic rewriter later overwrites because nobody recorded that a person
 * wrote it.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { connectCloudModel } from "../../mobile/src/ai/connect.js";
import { confirmMobileImport } from "../../mobile/src/import.js";
import {
  listLibrary,
  listSubjects,
  pauseCard,
  publishLibraryCard,
  removeCard,
  resumeCard,
  saveCardEdit,
  searchLibrary,
} from "../../mobile/src/library.js";
import { createTauriDatabase } from "../../mobile/src/provider.js";
import {
  completeFirstRun,
  LOCAL_USER_ID,
} from "../../mobile/src/setup/first-run.js";
import { starterCards } from "../../mobile/src/setup/starter-content.js";
import type { Database } from "../../src/kernel/db/types.js";
import { getTokenBySlug } from "../../src/kernel/models/token.js";
import { buildReviewQueue } from "../../src/kernel/scheduler/queue.js";
import { createTauriInvokeStub } from "../helpers/tauri-invoke-stub.js";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) (cleanups.pop() as () => void)();
});

async function library(): Promise<Database> {
  const dir = mkdtempSync(join(tmpdir(), "zam-library-"));
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

/**
 * Slower than the default 5s allows on an emulated runner.
 *
 * Every test here provisions one or two complete databases — the schema plus
 * the whole migration chain, through the IPC stub — and the snapshot tests
 * then export and re-import a library on top. Locally the file runs in well
 * under a second; on the emulated windows-arm64 runner it is roughly a
 * hundred times slower, which put it over the limit intermittently rather
 * than reliably. A generous ceiling here keeps the 5s default meaningful for
 * everything that has no business taking that long.
 */
const PROVISIONING_TIMEOUT = 60_000;

describe("listLibrary", { timeout: PROVISIONING_TIMEOUT }, () => {
  it("lists the learner's cards with their subjects", async () => {
    const db = await library();
    const entries = await listLibrary(db, LOCAL_USER_ID);
    expect(entries).toHaveLength(3);
    expect(entries.every((entry) => entry.paused === false)).toBe(true);
    expect(await listSubjects(db, LOCAL_USER_ID)).toEqual(["Erste Schritte"]);
  });

  it("narrows by free text without any model configured", async () => {
    const db = await library();
    const hits = await listLibrary(db, LOCAL_USER_ID, { query: "Abstand" });
    expect(hits.map((hit) => hit.title)).toEqual(["Verteiltes Wiederholen"]);
  });
});

describe("searchLibrary", { timeout: PROVISIONING_TIMEOUT }, () => {
  it("falls back to full text when no embedding model is connected", async () => {
    const db = await library();
    const fetchImpl = vi.fn();
    const hits = await searchLibrary(db, LOCAL_USER_ID, "Abstand", {
      fetchImpl: fetchImpl as never,
    });
    expect(hits.map((hit) => hit.title)).toEqual(["Verteiltes Wiederholen"]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("falls back to full text when the query cannot be embedded", async () => {
    // The learner is on a train. Finding fewer cards beats finding none.
    const db = await library();
    await connectCloudModel(db, "key", {
      verify: async () => ({ valid: true }) as const,
    });
    const offline = vi.fn(async () => {
      throw new TypeError("Load failed");
    });

    const hits = await searchLibrary(db, LOCAL_USER_ID, "Abstand", {
      fetchImpl: offline as never,
    });
    expect(hits.map((hit) => hit.title)).toEqual(["Verteiltes Wiederholen"]);
  });

  it("never returns fewer hits than plain text matching would", async () => {
    // The hybrid ranking is capped globally and only then narrowed to this
    // learner. On a shared library full of unassigned tokens it can fill its
    // whole budget with cards this learner does not have — and return nothing
    // where the lexical list would have found theirs.
    const db = await library();
    await connectCloudModel(db, "key", {
      verify: async () => ({ valid: true }) as const,
    });
    for (let i = 0; i < 40; i++) {
      await db
        .prepare(
          `INSERT INTO tokens (id, slug, title, concept, domain, bloom_level, created_at, updated_at)
           VALUES (?, ?, 'Fremd', 'Abstand im fremden Fach', 'fremd', 1,
                   datetime('now'), datetime('now'))`,
        )
        .run(`other-${i}`, `fremd/abstand-${i}`);
    }

    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: [{ embedding: [1, 0, 0] }] }), {
          status: 200,
        }),
    );
    const hits = await searchLibrary(db, LOCAL_USER_ID, "Abstand", {
      fetchImpl: fetchImpl as never,
    });

    const lexical = await listLibrary(db, LOCAL_USER_ID, { query: "Abstand" });
    expect(lexical.length).toBeGreaterThan(0);
    for (const card of lexical) {
      expect(hits.map((hit) => hit.tokenId)).toContain(card.tokenId);
    }
    // Still only this learner's cards.
    expect(hits.every((hit) => hit.domain === "Erste Schritte")).toBe(true);
  });

  it("returns only cards this learner actually has", async () => {
    const db = await library();
    await connectCloudModel(db, "key", {
      verify: async () => ({ valid: true }) as const,
    });
    // A token nobody was assigned — a shared library can hold plenty of these,
    // and offering one would promise a card the queue will never show.
    await db
      .prepare(
        `INSERT INTO tokens (id, slug, title, concept, domain, bloom_level, created_at, updated_at)
         VALUES ('other', 'fremd/abstand', 'Fremd', 'Abstand im fremden Fach', 'fremd', 1,
                 datetime('now'), datetime('now'))`,
      )
      .run();

    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: [{ embedding: [1, 0, 0] }] }), {
          status: 200,
        }),
    );
    const hits = await searchLibrary(db, LOCAL_USER_ID, "Abstand", {
      fetchImpl: fetchImpl as never,
    });
    expect(hits.map((hit) => hit.slug)).not.toContain("fremd/abstand");
  });
});

describe("saveCardEdit", { timeout: PROVISIONING_TIMEOUT }, () => {
  it("marks an edited question as human-authored", async () => {
    // Otherwise the dynamic rewriter is free to replace it later — the whole
    // point of the provenance column.
    const db = await library();
    const token = await getTokenBySlug(db, "zam/aktives-erinnern");
    await saveCardEdit(db, token?.id as string, {
      question: "Warum hilft Abfragen mehr als Nachlesen?",
    });

    const updated = await getTokenBySlug(db, "zam/aktives-erinnern");
    expect(updated?.question).toBe("Warum hilft Abfragen mehr als Nachlesen?");
    expect(updated?.question_source).toBe("manual");
  });

  it("leaves untouched fields alone", async () => {
    const db = await library();
    const token = await getTokenBySlug(db, "zam/ehrlich-bewerten");
    await saveCardEdit(db, token?.id as string, {
      title: "Ehrlich einschätzen",
    });

    const updated = await getTokenBySlug(db, "zam/ehrlich-bewerten");
    expect(updated?.title).toBe("Ehrlich einschätzen");
    expect(updated?.concept).toBe(token?.concept);
    expect(updated?.question).toBe(token?.question);
  });
});

describe("pause / resume / remove", { timeout: PROVISIONING_TIMEOUT }, () => {
  it("takes a paused card out of the queue but keeps it in the library", async () => {
    const db = await library();
    const token = await getTokenBySlug(db, "zam/aktives-erinnern");
    await pauseCard(db, token?.id as string, LOCAL_USER_ID);

    const queue = await buildReviewQueue(db, { userId: LOCAL_USER_ID });
    expect(queue.items.map((item) => item.title)).not.toContain(
      "Aktives Erinnern",
    );

    const entries = await listLibrary(db, LOCAL_USER_ID);
    const paused = entries.find(
      (entry) => entry.slug === "zam/aktives-erinnern",
    );
    expect(paused?.paused).toBe(true);
    expect(entries).toHaveLength(3);
  });

  it("brings a resumed card back", async () => {
    const db = await library();
    const token = await getTokenBySlug(db, "zam/aktives-erinnern");
    await pauseCard(db, token?.id as string, LOCAL_USER_ID);
    await resumeCard(db, token?.id as string, LOCAL_USER_ID);

    const queue = await buildReviewQueue(db, { userId: LOCAL_USER_ID });
    expect(queue.items.map((item) => item.title)).toContain("Aktives Erinnern");
  });

  it("removes a card from the learner's library", async () => {
    const db = await library();
    const token = await getTokenBySlug(db, "zam/ehrlich-bewerten");
    await removeCard(db, token?.id as string, LOCAL_USER_ID);

    const entries = await listLibrary(db, LOCAL_USER_ID);
    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.slug)).not.toContain(
      "zam/ehrlich-bewerten",
    );
  });
});

describe("publishLibraryCard", { timeout: PROVISIONING_TIMEOUT }, () => {
  it("publishes a captured draft so it can enter the queue", async () => {
    const db = await library();
    const imported = await confirmMobileImport(db, LOCAL_USER_ID, {
      origin: "quick-capture",
      slug: "mobile-draft",
      title: "Newton II",
      concept: "Force equals mass times acceleration.",
      domain: "physik",
      bloomLevel: 1,
      question: "How are force, mass and acceleration related?",
    });
    expect(imported.token.editorial_state).toBe("draft");
    await db
      .prepare(
        "UPDATE cards SET due_at = '2000-01-01T00:00:00.000Z' WHERE id = ?",
      )
      .run(imported.card.id);

    const before = await buildReviewQueue(db, { userId: LOCAL_USER_ID });
    expect(
      before.items.some((item) => item.tokenId === imported.token.id),
    ).toBe(false);

    await publishLibraryCard(db, imported.token.id, {
      question: "How are force, mass and acceleration related?",
      concept: "Force equals mass times acceleration.",
    });
    const after = await buildReviewQueue(db, { userId: LOCAL_USER_ID });
    expect(after.items.some((item) => item.tokenId === imported.token.id)).toBe(
      true,
    );
  });
});
