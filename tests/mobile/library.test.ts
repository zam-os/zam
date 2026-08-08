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
import {
  listLibrary,
  listSubjects,
  pauseCard,
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

describe("listLibrary", () => {
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

describe("searchLibrary", () => {
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

describe("saveCardEdit", () => {
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
    await saveCardEdit(db, token?.id as string, { title: "Ehrlich einschätzen" });

    const updated = await getTokenBySlug(db, "zam/ehrlich-bewerten");
    expect(updated?.title).toBe("Ehrlich einschätzen");
    expect(updated?.concept).toBe(token?.concept);
    expect(updated?.question).toBe(token?.question);
  });
});

describe("pause / resume / remove", () => {
  it("takes a paused card out of the queue but keeps it in the library", async () => {
    const db = await library();
    const token = await getTokenBySlug(db, "zam/aktives-erinnern");
    await pauseCard(db, token?.id as string, LOCAL_USER_ID);

    const queue = await buildReviewQueue(db, { userId: LOCAL_USER_ID });
    expect(queue.items.map((item) => item.title)).not.toContain(
      "Aktives Erinnern",
    );

    const entries = await listLibrary(db, LOCAL_USER_ID);
    const paused = entries.find((entry) => entry.slug === "zam/aktives-erinnern");
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
