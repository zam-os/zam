import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildReviewQueue,
  type Database,
  evaluateRating,
  getCard,
  getPrerequisites,
  getReviewsForCard,
  getTokenById,
  installKvtTile,
  type KvtTile,
  materialiseKvtCards,
  openDatabase,
} from "../../src/kernel/index.js";

const FIXTURES = resolve(__dirname, "../fixtures/curriculum");
const TILE_ID = "de-by:realschule-9-mathematik-pythagoras-trigonometrie";
const P = "01K4T9M0000000000000000A01";
const H = "01K4T9M0000000000000000AH0";
const U = "01K4T9M0000000000000000AV0";
const A02 = "01K4T9M0000000000000000A02";
const A03 = "01K4T9M0000000000000000A03";
const P1 = "01K4T9M0000000000000000PP1";
const P2 = "01K4T9M0000000000000000PP2";
const P3 = "01K4T9M0000000000000000PA0";
const H1 = "01K4T9M0000000000000000HH1";
const U1 = "01K4T9M0000000000000000VV1";
const J01 = "01K4T9M0000000000000000J01";
const J02 = "01K4T9M0000000000000000J02";
const J03 = "01K4T9M0000000000000000J03";

function loadTile(): KvtTile {
  return JSON.parse(
    readFileSync(
      join(
        FIXTURES,
        "de-by-realschule-9-mathematik-pythagoras-trigonometrie-kvt.json",
      ),
      "utf-8",
    ),
  ) as KvtTile;
}

describe("Pythagoras fixture revision (Phase 5)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-pythagoras-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("declares H, P, U with hard edges and no P-internal edges", () => {
    const tile = loadTile();
    expect(tile.tile_id).toBe(TILE_ID);
    const byId = new Map(tile.atoms.map((atom) => [atom.id, atom]));
    expect(byId.get(H)?.slug).toBe("hypotenuse-lage");
    expect(byId.get(P)?.prerequisites?.map((p) => p.atom_id)).toEqual([H]);
    expect(byId.get(U)?.prerequisites?.map((p) => p.atom_id)).toEqual([P]);
    expect(byId.get(A02)?.prerequisites?.map((p) => p.atom_id)).toEqual([P]);
    expect(byId.get(A03)?.prerequisites?.map((p) => p.atom_id)).toEqual([H]);
    const pItems = byId.get(P)!.practice_items;
    expect(pItems.map((item) => item.id).sort()).toEqual([P3, P1, P2].sort());
    expect(pItems.some((item) => item.edge_representative)).toBe(true);
    expect(P3 < P1).toBe(true);
  });

  it("installs P1 as the edge representative despite a lower-id P3", async () => {
    await installKvtTile(db, loadTile());
    const fromA02 = await getPrerequisites(db, J03);
    expect(fromA02.map((row) => row.requires_id)).toEqual([P1]);
    const fromU = await getPrerequisites(db, U1);
    expect(fromU.map((row) => row.requires_id)).toEqual([P1]);
    const fromP1 = await getPrerequisites(db, P1);
    expect(fromP1.map((row) => row.requires_id)).toEqual([H1]);
    const betweenP = await getPrerequisites(db, P3);
    expect(betweenP.map((row) => row.requires_id)).toEqual([H1]);
    expect(betweenP.map((row) => row.requires_id)).not.toContain(P1);
  });

  it("keeps old reviews on retired items and does not copy mastery to P1/P2", async () => {
    const oldTile: KvtTile = {
      tile_id: TILE_ID,
      version: "2026.08.1",
      title: "Satz des Pythagoras",
      publisher: "ZAM Curriculum Working Group",
      atoms: [
        {
          id: P,
          title: "Satz des Pythagoras",
          domain: "schule/mathematik/geometrie",
          practice_items: [
            {
              id: J01,
              language: "de",
              tier: "tier1_fast",
              bloom_level: 1,
              question:
                "Welche Dreiecksseite liegt dem rechten Winkel gegenüber?",
              concept: "Hypotenuse",
            },
            {
              id: J02,
              language: "de",
              tier: "tier2_synthesis",
              bloom_level: 2,
              question:
                "Formuliere den Satz des Pythagoras und die Flächenbedeutung.",
              concept: "a² + b² = c²",
            },
          ],
        },
      ],
    };
    await installKvtTile(db, oldTile);
    await materialiseKvtCards(db, "learner", [P]);
    const j02Card = await getCard(db, J02, "learner");
    await evaluateRating(db, {
      cardId: j02Card!.id,
      tokenId: J02,
      userId: "learner",
      rating: 4,
    });
    expect((await getCard(db, J02, "learner"))?.reps).toBeGreaterThan(0);
    expect(await getReviewsForCard(db, j02Card!.id)).toHaveLength(1);

    await installKvtTile(db, loadTile());
    const retired = await getTokenById(db, J01);
    expect(retired?.deprecated_at).toBeTruthy();
    expect((await getTokenById(db, J02))?.deprecated_at).toBeTruthy();
    expect(await getReviewsForCard(db, j02Card!.id)).toHaveLength(1);
    expect((await getCard(db, J02, "learner"))?.reps).toBeGreaterThan(0);

    const feeder = await materialiseKvtCards(db, "learner", [P, H, U]);
    expect(feeder.cardsCreated).toBeLessThanOrEqual(3);
    expect((await getCard(db, P1, "learner"))?.reps ?? 0).toBe(0);
    expect(await getCard(db, P2, "learner")).toBeUndefined();
  });

  it("removes derived edges that pointed at a retired representative", async () => {
    // Before the revision J01 represented P, so A02's item inherited an edge
    // to it. Retiring J01 must take that edge with it, or a learner without
    // a J01 review could never unblock J03 again.
    const oldTile: KvtTile = {
      tile_id: TILE_ID,
      version: "2026.08.1",
      title: "Satz des Pythagoras",
      publisher: "ZAM Curriculum Working Group",
      atoms: [
        {
          id: P,
          title: "Satz des Pythagoras",
          domain: "schule/mathematik/geometrie",
          practice_items: [
            {
              id: J01,
              language: "de",
              tier: "tier1_fast",
              bloom_level: 1,
              question:
                "Welche Dreiecksseite liegt dem rechten Winkel gegenüber?",
              concept: "Hypotenuse",
            },
          ],
        },
        {
          id: A02,
          title: "Höhensatz",
          domain: "schule/mathematik/geometrie",
          prerequisites: [{ atom_id: P, type: "hard" }],
          practice_items: [
            {
              id: J03,
              language: "de",
              tier: "tier1_fast",
              bloom_level: 1,
              question: "Wie lautet der Höhensatz für die Höhe h?",
              concept: "h² = p · q",
            },
          ],
        },
      ],
    };
    await installKvtTile(db, oldTile);
    expect(
      (await getPrerequisites(db, J03)).map((row) => row.requires_id),
    ).toEqual([J01]);

    await installKvtTile(db, loadTile());
    const edges = (await getPrerequisites(db, J03)).map(
      (row) => row.requires_id,
    );
    expect(edges).toEqual([P1]);
    expect(edges).not.toContain(J01);
  });

  it("honours a declared edge representative over a lower-id Tier-1 item", async () => {
    const tile = loadTile();
    const pAtom = tile.atoms.find((atom) => atom.id === P);
    pAtom?.practice_items.push({
      id: "01K4T9M0000000000000000P00",
      language: "de",
      tier: "tier1_fast",
      bloom_level: 1,
      question: "Wie heißt die längste Seite im rechtwinkligen Dreieck?",
      concept: "Die Hypotenuse.",
    });
    await installKvtTile(db, tile);
    expect(
      (await getPrerequisites(db, J03)).map((row) => row.requires_id),
    ).toEqual([P1]);
    expect(
      (await getPrerequisites(db, U1)).map((row) => row.requires_id),
    ).toEqual([P1]);
  });

  it("does not add cards or review logs on a repeated install", async () => {
    await installKvtTile(db, loadTile());
    const first = await materialiseKvtCards(db, "fresh", [H, P, U, A02, A03]);
    await installKvtTile(db, loadTile());
    const second = await materialiseKvtCards(db, "fresh", [H, P, U, A02, A03]);
    expect(second.cardsCreated).toBe(0);
    expect(second.cardsReused).toBe(first.cardsCreated);
    const logs = (await db
      .prepare("SELECT COUNT(*) AS n FROM review_logs")
      .get()) as { n: number };
    expect(logs.n).toBe(0);
  });

  it("keeps new P siblings out of one learning day after P1 is shown", async () => {
    await installKvtTile(db, loadTile());
    await materialiseKvtCards(db, "learner", [P]);
    const { admitPresentation } = await import("../../src/kernel/index.js");
    await admitPresentation(db, {
      userId: "learner",
      cardId: (await getCard(db, P1, "learner"))!.id,
      timeZone: "UTC",
      now: new Date("2026-09-06T12:00:00.000Z"),
    });
    const queue = await buildReviewQueue(db, {
      userId: "learner",
      timeZone: "UTC",
      now: new Date("2026-09-06T12:00:00.000Z"),
    });
    const ids = queue.items.map((item) => item.tokenId);
    expect(ids).toContain(P1);
    expect(ids).not.toContain(P2);
    expect(ids).not.toContain(P3);
  });
});
