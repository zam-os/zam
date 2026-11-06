import { afterEach, beforeEach, expect, it } from "vitest";
import { ulid } from "ulid";
import {
  admitPresentation,
  buildReviewQueue,
  cardTopicTitle,
  createToken,
  type Database,
  ensureCard,
  executeReviewAction,
  getDueCards,
  getDueSummary,
  getSessionOffer,
} from "../../src/kernel/index.js";
import { getReview } from "../../src/cli/bridge-handlers.js";
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

  /**
   * Four due reviews, a fifth that shares an atom with a never-seen card, and
   * twelve other never-seen cards. The sibling sorts first among the new cards,
   * so interspersing puts it ahead of the fifth review.
   */
  async function reviewsWithANewSibling(): Promise<void> {
    for (let n = 1; n <= 4; n++) {
      await dueReview(`review-${n}`, `2026-01-0${n}T00:00:00.000Z`);
    }
    const shared = await atom("Shared");
    await dueReview("review-5", "2026-01-05T00:00:00.000Z", shared);
    await card("a-new-sibling", shared);
    for (let n = 1; n <= 12; n++) {
      await card(`new-${String(n).padStart(2, "0")}`);
    }
  }

  async function dueReview(slug: string, dueAt: string, atomId?: string): Promise<string> {
    const id = await card(slug, atomId);
    await db
      .prepare("UPDATE cards SET state = 'review', due_at = ?, last_review_at = ? WHERE id = ?")
      .run(dueAt, dueAt, id);
    return id;
  }

  /** What Desktop's study view does: one card at a time, rated before the next. */
  async function walkDesktopSession(): Promise<{ reviews: number; newCards: number }> {
    let newLeft = 10;
    let cardsLeft = 50;
    const served = { reviews: 0, newCards: 0 };
    while (cardsLeft > 0) {
      const { card: next } = await getReview(db, {
        user: USER,
        timeZone: "UTC",
        maxNew: newLeft > 0 ? 1 : 0,
        noResolve: true,
        noDynamicQuestion: true,
      });
      if (!next) break;
      await admitPresentation(db, { userId: USER, cardId: next.cardId, timeZone: "UTC" });
      if (next.state === "new") {
        newLeft -= 1;
        served.newCards += 1;
      } else {
        served.reviews += 1;
      }
      cardsLeft -= 1;
      await executeReviewAction(db, {
        action: "rate",
        cardId: next.cardId,
        userId: USER,
        rating: 4,
        answerFormat: "recall",
      });
    }
    return served;
  }

  it("does not let a card outside the new-card limit hold back a due sibling", async () => {
    await reviewsWithANewSibling();
    const queue = await buildReviewQueue(db, {
      userId: USER,
      maxNew: 0,
      onePerAtom: true,
      timeZone: "UTC",
    });
    expect(queue.items.map((item) => item.slug)).toEqual([
      "review-1",
      "review-2",
      "review-3",
      "review-4",
      "review-5",
    ]);
  });

  it("gives an atom to its due review, and still mixes new cards in", async () => {
    await reviewsWithANewSibling();
    const queue = await buildReviewQueue(db, {
      userId: USER,
      onePerAtom: true,
      timeZone: "UTC",
    });
    const slugs = queue.items.map((item) => item.slug);
    expect(slugs).toContain("review-5");
    expect(slugs).not.toContain("a-new-sibling");
    expect(slugs.slice(0, 5)).toEqual(["review-1", "review-2", "review-3", "review-4", "new-01"]);
    expect(queue.reviewCount).toBe(5);
    expect(queue.newCount).toBe(10);
  });

  it("offers what Desktop's one-at-a-time session serves", async () => {
    await reviewsWithANewSibling();
    const offer = await getSessionOffer(db, USER, "UTC");
    expect(offer).toEqual({ reviews: 5, newCards: 10 });
    expect(await walkDesktopSession()).toEqual(offer);
  });

  it("offers reviews first when they reach the card limit", async () => {
    for (let n = 1; n <= 5; n++) {
      await dueReview(`review-${n}`, `2026-01-0${n}T00:00:00.000Z`);
    }
    await card("new-1");
    const queue = await buildReviewQueue(db, {
      userId: USER,
      maxReviews: 5,
      onePerAtom: true,
      timeZone: "UTC",
    });
    expect(queue.items.map((item) => item.slug)).toEqual([
      "review-1",
      "review-2",
      "review-3",
      "review-4",
      "review-5",
    ]);
  });

  it("serves a due review before a new sibling when earlier reviews are held back", async () => {
    for (let n = 1; n <= 4; n++) {
      const held = await atom(`Held ${n}`);
      const presented = await card(`held-${n}-a`, held);
      await db
        .prepare("UPDATE cards SET due_at = '2099-01-01T00:00:00.000Z' WHERE id = ?")
        .run(presented);
      await admitPresentation(db, { userId: USER, cardId: presented, timeZone: "UTC" });
      await executeReviewAction(db, {
        action: "rate",
        cardId: presented,
        userId: USER,
        rating: 4,
        answerFormat: "recall",
      });
      await dueReview(`held-${n}-b`, `2026-01-0${n}T00:00:00.000Z`, held);
    }
    const shared = await atom("Shared");
    await dueReview("review-5", "2026-01-05T00:00:00.000Z", shared);
    await card("a-new-sibling", shared);

    const { card: next } = await getReview(db, {
      user: USER,
      timeZone: "UTC",
      maxNew: 1,
      noResolve: true,
      noDynamicQuestion: true,
    });
    expect(next?.slug).toBe("review-5");
  });

  it("keeps serving what it offers in later sessions of the same day", async () => {
    for (let n = 0; n < 40; n++) {
      const atomId = await atom(`Atom ${n}`);
      for (const part of ["a", "b", "c"]) {
        await card(`atom-${String(n).padStart(2, "0")}-${part}`, atomId);
      }
    }
    for (let session = 1; session <= 4; session++) {
      const offer = await getSessionOffer(db, USER, "UTC");
      expect(offer).toEqual({ reviews: 0, newCards: 10 });
      expect(await walkDesktopSession()).toEqual(offer);
    }
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
