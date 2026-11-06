import { afterEach, beforeEach, expect, it } from "vitest";
import { ulid } from "ulid";
import {
  admitPresentation,
  buildReviewQueue,
  cardTopicTitle,
  createToken,
  type Database,
  ensureCard,
  getDueCards,
  getDueSummary,
  getSessionOffer,
} from "../../src/kernel/index.js";
import {
  describeWithProviders,
  type ProvidedDatabase,
} from "../helpers/provider-matrix.js";

const PAST = "2026-01-01T00:00:00.000Z";
const NOW = new Date("2026-09-05T12:00:00.000Z");
const USER = "carol";

describeWithProviders("what a session offers", "zam_session_offer", (provider) => {
  let provided: ProvidedDatabase;
  let db: Database;

  beforeEach(async () => {
    provided = await provider.open();
    db = provided.db;
  });

  afterEach(async () => {
    await provided.cleanup();
  });

  async function atom(title: string): Promise<string> {
    const id = ulid();
    await db
      .prepare("INSERT INTO learning_atoms (id, title) VALUES (?, ?)")
      .run(id, title);
    return id;
  }

  async function card(slug: string, atomId?: string): Promise<string> {
    const token = await createToken(db, {
      slug,
      concept: slug,
      domain: "hsu/natur-und-umwelt",
      question: `${slug}?`,
      ...(atomId ? { atom_id: atomId } : {}),
    });
    return (await ensureCard(db, token.id, USER)).id;
  }

  async function bind(
    atomId: string,
    binding: { provider: string; track?: string; code: string; title: string | null },
  ): Promise<void> {
    await db
      .prepare(
        `INSERT INTO atom_curriculum_bindings
           (atom_id, provider, school_type, grade, track, subject,
            topic_code, topic_title, exam_relevant)
         VALUES (?, ?, 'realschule', 9, ?, 'mathematik', ?, ?, 0)`,
      )
      .run(atomId, binding.provider, binding.track ?? "", binding.code, binding.title);
  }

  it("names the Academy stage of a card, without its number", async () => {
    const atomId = await atom("Bindings");
    await bind(atomId, { provider: "lehrplanplus-bayern", track: "I", code: "lb3", title: "Rechtwinklige Dreiecke" });
    await bind(atomId, { provider: "zam-academy", code: "stage-1", title: "Etappe 1: Dreiecke" });
    await card("bound", atomId);

    const [item] = (await buildReviewQueue(db, { userId: USER, now: NOW })).items;
    expect(item.topicTitle).toBe("Dreiecke");
    expect(item.domain).toBe("hsu/natur-und-umwelt");
  });

  it("falls back to another curriculum, and to nothing without a binding", async () => {
    const curriculum = await atom("Curriculum only");
    await bind(curriculum, { provider: "lehrplanplus-bayern", code: "lb1", title: "Optik" });
    await card("a-curriculum", curriculum);
    const untitled = await atom("No title");
    await bind(untitled, { provider: "zam-academy", code: "x", title: null });
    await card("b-untitled", untitled);
    await card("c-own-card");

    const items = (await buildReviewQueue(db, { userId: USER, now: NOW })).items;
    const bySlug = new Map(items.map((item) => [item.slug, item.topicTitle]));
    expect(bySlug.get("a-curriculum")).toBe("Optik");
    expect(bySlug.get("b-untitled")).toBeNull();
    expect(bySlug.get("c-own-card")).toBeNull();
  });

  it("gives a due card the same topic as a queued one", async () => {
    const atomId = await atom("Bound");
    await bind(atomId, { provider: "zam-academy", code: "lb1", title: "LB 1: Natur und Umwelt" });
    await card("bound", atomId);
    const [due] = await getDueCards(db, USER, "2099-01-01T00:00:00.000Z");
    expect(cardTopicTitle(due.topic_title)).toBe("Natur und Umwelt");
  });

  it("lists siblings as a prefetch unless a surface counts its items", async () => {
    const atomId = await atom("Two items");
    await card("a-first", atomId);
    await card("b-second", atomId);
    await card("c-other");

    const prefetch = await buildReviewQueue(db, { userId: USER, now: NOW });
    expect(prefetch.items.map((item) => item.slug)).toEqual(["a-first", "b-second", "c-other"]);
    const counted = await buildReviewQueue(db, { userId: USER, now: NOW, onePerAtom: true });
    expect(counted.items.map((item) => item.slug)).toEqual(["a-first", "c-other"]);
  });

  it("offers one card per atom within the limit, not the whole deck", async () => {
    for (let n = 0; n < 15; n++) {
      const atomId = await atom(`Atom ${n}`);
      await card(`atom-${String(n).padStart(2, "0")}-a`, atomId);
      await card(`atom-${String(n).padStart(2, "0")}-b`, atomId);
    }

    const summary = await getDueSummary(db, USER);
    expect(summary.dueCount).toBe(30);
    // Balanced preset: 10 new cards a session.
    expect(await getSessionOffer(db, USER)).toEqual({ reviews: 0, newCards: 10 });
  });

  it("counts due reviews apart from new cards", async () => {
    const reviewed = await card("a-reviewed");
    await db
      .prepare("UPDATE cards SET state = 'review', due_at = ? WHERE id = ?")
      .run(PAST, reviewed);
    await card("b-new");

    expect(await getSessionOffer(db, USER)).toEqual({ reviews: 1, newCards: 1 });
  });

  it("holds an atom back once one of its items was presented today", async () => {
    const atomId = await atom("Presented");
    const first = await card("a-first", atomId);
    await card("b-second", atomId);
    await admitPresentation(db, { userId: USER, cardId: first, timeZone: "UTC" });

    const offer = await getSessionOffer(db, USER, "UTC");
    expect(offer.reviews + offer.newCards).toBe(1);
    const [item] = (
      await buildReviewQueue(db, { userId: USER, timeZone: "UTC", onePerAtom: true })
    ).items;
    expect(item.cardId).toBe(first);
  });
});

it("cuts only a running number off a topic title", () => {
  expect(cardTopicTitle("LB 1: Demokratie und Gesellschaft")).toBe("Demokratie und Gesellschaft");
  expect(cardTopicTitle("Etappe 12: Potenzen")).toBe("Potenzen");
  expect(cardTopicTitle("Wörterwerkstatt: Wortarten")).toBe("Wörterwerkstatt: Wortarten");
  expect(cardTopicTitle("Mechanik")).toBe("Mechanik");
  expect(cardTopicTitle("  ")).toBeNull();
  expect(cardTopicTitle(null)).toBeNull();
});
