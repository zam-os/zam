import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { linkPrereq } from "../../src/cli/bridge-handlers.js";
import {
  addConnection,
  addPrerequisite,
  assertPrerequisitePlanets,
  ConnectionError,
  createToken,
  type Database,
  ensureCard,
  ensureWorldLenses,
  executeReviewAction,
  getBlockingPrerequisites,
  getCard,
  LEBEN_LENS,
  loadConnections,
  MAX_THREAD_NOTE,
  moveUnitsToPlanet,
  openDatabase,
  orientThread,
  readAtlas,
  removeConnection,
  type UnitKey,
  unitsHeldByThreads,
  WELTWISSEN_LENS,
} from "../../src/kernel/index.js";

/**
 * Red threads beyond prerequisites (ADR 2026-10-13, Decision 7; plan
 * Phase 9b): kinds, direction, the one-way planet rule, rights, the read with
 * portals, and that a learner's own thread never blocks.
 */

const USER = "learner";
const OTHER = "someone-else";

async function expectRefusal(
  promise: Promise<unknown>,
  code: ConnectionError["code"],
): Promise<void> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ConnectionError);
  expect((error as ConnectionError).code).toBe(code);
}

describe("orientThread", () => {
  const world = (key: string) => ({
    key: key as UnitKey,
    planet: "welt" as const,
  });
  const own = (key: string) => ({
    key: key as UnitKey,
    planet: "privat" as const,
  });

  it("lets threads run from the own planet to world knowledge, never back", () => {
    for (const kind of [
      "voraussetzung",
      "nutzt",
      "schnittstelle",
      "ist-ein",
    ] as const) {
      expect(orientThread(kind, own("token:a"), world("atom:b")).swapped).toBe(
        false,
      );
      expect(orientThread(kind, world("atom:a"), world("atom:b")).swapped).toBe(
        false,
      );
      expect(() => orientThread(kind, world("atom:a"), own("token:b"))).toThrow(
        ConnectionError,
      );
    }
  });

  it("turns a Verbindung around instead of refusing, and keeps one order per pair", () => {
    const across = orientThread("verbindung", world("atom:a"), own("token:b"));
    expect(across).toMatchObject({
      swapped: true,
      a: { key: "token:b" },
      b: { key: "atom:a" },
    });
    const back = orientThread("verbindung", own("token:b"), world("atom:a"));
    expect(back.swapped).toBe(false);
    // On one side of the line, the smaller key comes first.
    expect(
      orientThread("verbindung", world("atom:z"), world("atom:a")).a.key,
    ).toBe("atom:a");
    expect(
      orientThread("verbindung", world("atom:a"), world("atom:z")).swapped,
    ).toBe(false);
  });
});

describe("atlas connections", () => {
  let dir: string;
  let db: Database;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-atlas-threads-"));
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  /** An own unit the learner holds. `physik/…` is world knowledge, `familie/…` private. */
  async function unit(slug: string, domain: string, userId = USER) {
    const token = await createToken(db, {
      slug,
      concept: slug,
      domain,
      question: `What is ${slug}?`,
    });
    await ensureCard(db, token.id, userId);
    return { token, key: `token:${token.id}` as UnitKey };
  }

  const personal = { userId: USER, mayWriteKnowledge: false };

  it("validates kind, ends and note", async () => {
    const hebel = await unit("hebel", "physik/mechanik");
    const kraft = await unit("kraft", "physik/mechanik");
    await expectRefusal(
      addConnection(db, {
        ...personal,
        a: hebel.key,
        b: kraft.key,
        kind: "kennt",
      }),
      "invalid-kind",
    );
    await expectRefusal(
      addConnection(db, {
        ...personal,
        a: hebel.key,
        b: hebel.key,
        kind: "nutzt",
      }),
      "same-unit",
    );
    await expectRefusal(
      addConnection(db, {
        ...personal,
        a: hebel.key,
        b: "token:nope",
        kind: "nutzt",
      }),
      "unknown-unit",
    );
    await expectRefusal(
      addConnection(db, {
        ...personal,
        a: hebel.key,
        b: kraft.key,
        kind: "verbindung",
        note: "x".repeat(MAX_THREAD_NOTE + 1),
      }),
      "note-too-long",
    );
    const stored = await addConnection(db, {
      ...personal,
      a: hebel.key,
      b: kraft.key,
      kind: "nutzt",
      note: "  Ein Hebel  überträgt Kraft. ",
    });
    expect(stored).toMatchObject({
      scope: "personal",
      a: hebel.key,
      b: kraft.key,
      kind: "nutzt",
      note: "Ein Hebel überträgt Kraft.",
      created: true,
    });
  });

  it("keeps world knowledge free of private ends", async () => {
    const hebel = await unit("hebel", "physik/mechanik");
    const geburtstag = await unit("geburtstage", "familie/geburtstage");
    await expectRefusal(
      addConnection(db, {
        ...personal,
        a: hebel.key,
        b: geburtstag.key,
        kind: "nutzt",
      }),
      "world-to-own",
    );
    const fine = await addConnection(db, {
      ...personal,
      a: geburtstag.key,
      b: hebel.key,
      kind: "nutzt",
    });
    expect(fine.a).toBe(geburtstag.key);
    const turned = await addConnection(db, {
      ...personal,
      a: hebel.key,
      b: geburtstag.key,
      kind: "verbindung",
    });
    expect(turned).toMatchObject({
      a: geburtstag.key,
      b: hebel.key,
      swapped: true,
    });
  });

  it("leaves shared threads to whoever may write knowledge, and shared prerequisites to the prerequisite tables", async () => {
    const hebel = await unit("hebel", "physik/mechanik");
    const kraft = await unit("kraft", "physik/mechanik");
    const ends = { a: hebel.key, b: kraft.key };
    await expectRefusal(
      addConnection(db, {
        ...personal,
        ...ends,
        kind: "ist-ein",
        scope: "shared",
      }),
      "not-curator",
    );
    await expectRefusal(
      addConnection(db, {
        ...ends,
        userId: USER,
        mayWriteKnowledge: true,
        kind: "voraussetzung",
        scope: "shared",
      }),
      "shared-prerequisite",
    );
    const shared = await addConnection(db, {
      ...ends,
      userId: USER,
      mayWriteKnowledge: true,
      kind: "ist-ein",
      scope: "shared",
    });
    expect(shared.scope).toBe("shared");
    // A learner without the right cannot cut it; a curator can.
    await expectRefusal(
      removeConnection(db, {
        id: shared.id,
        userId: OTHER,
        mayWriteKnowledge: false,
      }),
      "not-curator",
    );
    expect(
      await removeConnection(db, {
        id: shared.id,
        userId: OTHER,
        mayWriteKnowledge: true,
      }),
    ).toEqual({ scope: "shared" });
  });

  it("stores one thread per pair and kind, and a learner cuts only their own", async () => {
    const hebel = await unit("hebel", "physik/mechanik");
    const kraft = await unit("kraft", "physik/mechanik");
    const first = await addConnection(db, {
      ...personal,
      a: hebel.key,
      b: kraft.key,
      kind: "verbindung",
    });
    // The same Verbindung the other way round is the same thread; a note joins it.
    const again = await addConnection(db, {
      ...personal,
      a: kraft.key,
      b: hebel.key,
      kind: "verbindung",
      note: "Beides Mechanik.",
    });
    expect(again).toMatchObject({
      id: first.id,
      created: false,
      note: "Beides Mechanik.",
    });
    expect(await loadConnections(db, USER)).toHaveLength(1);
    expect(await loadConnections(db, OTHER)).toHaveLength(0);
    await expectRefusal(
      removeConnection(db, {
        id: first.id,
        userId: OTHER,
        mayWriteKnowledge: false,
      }),
      "unknown-connection",
    );
    expect(
      await removeConnection(db, {
        id: first.id,
        userId: USER,
        mayWriteKnowledge: false,
      }),
    ).toEqual({ scope: "personal" });
    expect(await loadConnections(db, USER)).toHaveLength(0);
  });

  it("reads every kind with scope, id and note, a personal copy of a prerequisite once", async () => {
    const hebel = await unit("hebel", "physik/mechanik");
    const kraft = await unit("kraft", "physik/mechanik");
    const arbeit = await unit("arbeit", "physik/mechanik");
    await addPrerequisite(db, hebel.token.id, kraft.token.id);
    const copy = await addConnection(db, {
      ...personal,
      a: hebel.key,
      b: kraft.key,
      kind: "voraussetzung",
      note: "Ohne Kraft kein Hebel.",
    });
    const uses = await addConnection(db, {
      ...personal,
      a: arbeit.key,
      b: hebel.key,
      kind: "nutzt",
      note: "Arbeit am Hebel.",
    });
    await addConnection(db, {
      a: arbeit.key,
      b: kraft.key,
      kind: "ist-ein",
      scope: "shared",
      userId: USER,
      mayWriteKnowledge: true,
    });

    const view = await readAtlas(db, { userId: USER, lens: WELTWISSEN_LENS });
    expect(view.threads).toEqual(
      expect.arrayContaining([
        // Drawn once, but as the learner's: their note, and their id to cut.
        {
          from: hebel.key,
          to: kraft.key,
          kind: "voraussetzung",
          scope: "personal",
          id: copy.id,
          note: "Ohne Kraft kein Hebel.",
          alsoShared: true,
        },
        {
          from: arbeit.key,
          to: hebel.key,
          kind: "nutzt",
          scope: "personal",
          id: uses.id,
          note: "Arbeit am Hebel.",
        },
        expect.objectContaining({
          from: arbeit.key,
          to: kraft.key,
          kind: "ist-ein",
          scope: "shared",
        }),
      ]),
    );
    expect(view.threads).toHaveLength(3);
    expect(view.portals).toEqual({});
    // Another learner sees the library's threads, not mine.
    for (const key of [hebel.token.id, kraft.token.id, arbeit.token.id]) {
      await ensureCard(db, key, OTHER);
    }
    const theirs = await readAtlas(db, {
      userId: OTHER,
      lens: WELTWISSEN_LENS,
    });
    expect(theirs.threads.map((t) => t.kind).sort()).toEqual([
      "ist-ein",
      "voraussetzung",
    ]);
    expect(
      theirs.threads.find((t) => t.kind === "voraussetzung"),
    ).toMatchObject({ scope: "shared" });

    // Cutting their own copy leaves the library's thread.
    await removeConnection(db, { id: copy.id, ...personal });
    const after = await readAtlas(db, { userId: USER, lens: WELTWISSEN_LENS });
    expect(after.threads.find((t) => t.kind === "voraussetzung")).toEqual({
      from: hebel.key,
      to: kraft.key,
      kind: "voraussetzung",
      scope: "shared",
    });
  });

  it("keeps the planet rule for prerequisites linked by a tool", async () => {
    const hebel = await unit("hebel", "physik/mechanik");
    const geburtstag = await unit("geburtstage", "familie/geburtstage");
    await expectRefusal(
      assertPrerequisitePlanets(db, hebel.token.id, geburtstag.token.id),
      "world-to-own",
    );
    await expect(
      linkPrereq(db, { token: hebel.token.slug, requires: geburtstag.token.slug }),
    ).rejects.toThrow(ConnectionError);
    const stored = (await db
      .prepare("SELECT COUNT(*) AS n FROM prerequisites WHERE token_id = ?")
      .get(hebel.token.id)) as { n: number };
    expect(Number(stored.n)).toBe(0);
    // From the own planet to world knowledge is fine.
    await expect(
      linkPrereq(db, { token: geburtstag.token.slug, requires: hebel.token.slug }),
    ).resolves.toMatchObject({ success: true });
  });

  it("holds a unit on its planet when a thread would run from world knowledge to it", async () => {
    await ensureWorldLenses(db);
    const rezept = await unit("rezept", "familie/kochen");
    const einkauf = await unit("einkauf", "familie/einkauf");
    await addConnection(db, {
      ...personal,
      a: rezept.key,
      b: einkauf.key,
      kind: "nutzt",
    });
    const move = (units: UnitKey[], planet: "welt" | "privat") =>
      moveUnitsToPlanet(db, { units, planet, placedBy: "learner" });

    // Alone, the dependent end stays: it would use a private unit.
    expect(await move([rezept.key], "welt")).toMatchObject({
      moved: [],
      held: [{ unit: rezept.key, by: einkauf.key }],
    });
    // Together, both go.
    expect((await move([rezept.key, einkauf.key], "welt")).moved.sort()).toEqual(
      [rezept.key, einkauf.key].sort(),
    );
    // Back, the end depended upon stays while world knowledge uses it.
    expect(await move([einkauf.key], "privat")).toMatchObject({
      moved: [],
      held: [{ unit: einkauf.key, by: rezept.key }],
    });
    // A Verbindung has no direction and holds nothing.
    const notiz = await unit("notiz", "familie/notizen");
    await addConnection(db, {
      ...personal,
      a: rezept.key,
      b: notiz.key,
      kind: "verbindung",
    });
    expect((await move([notiz.key], "welt")).moved).toEqual([notiz.key]);
  });

  it("holds each unit a chain needs, until nothing changes", () => {
    const [a, b, c] = ["token:a", "token:b", "token:c"] as UnitKey[];
    const planetOf = new Map<UnitKey, "welt" | "privat">([
      [a, "privat"],
      [b, "privat"],
      [c, "privat"],
    ]);
    // a uses b, b uses c; a and b move, c stays private.
    const held = unitsHeldByThreads(
      [
        { a, b },
        { a: b, b: c },
      ],
      new Set([a, b]),
      "welt",
      planetOf,
    );
    expect([...held]).toEqual(
      expect.arrayContaining([
        [b, c],
        [a, b],
      ]),
    );
    expect(held.size).toBe(2);
  });

  it("ends a thread to the other planet at a portal, prerequisites too", async () => {
    const hebel = await unit("hebel", "physik/mechanik");
    const wippe = await unit("wippe-im-garten", "familie/garten");
    const geburtstag = await unit("geburtstage", "familie/geburtstage");
    await addConnection(db, {
      ...personal,
      a: wippe.key,
      b: hebel.key,
      kind: "nutzt",
    });
    await addPrerequisite(db, geburtstag.token.id, hebel.token.id);

    const leben = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    expect(leben.threads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: wippe.key,
          to: hebel.key,
          kind: "nutzt",
        }),
        {
          from: geburtstag.key,
          to: hebel.key,
          kind: "voraussetzung",
          scope: "shared",
        },
      ]),
    );
    expect(leben.portals).toEqual({
      [hebel.key]: { title: "hebel", planet: "welt" },
    });
    expect(leben.units.map((u) => u.key)).not.toContain(hebel.key);

    // From the world's side, the private ends are the portals.
    const welt = await readAtlas(db, { userId: USER, lens: WELTWISSEN_LENS });
    expect(Object.keys(welt.portals).sort()).toEqual(
      [geburtstag.key, wippe.key].sort(),
    );
    expect(welt.portals[wippe.key].planet).toBe("privat");

    // A portal needs a unit the learner would see there.
    await db
      .prepare("DELETE FROM cards WHERE token_id = ?")
      .run(hebel.token.id);
    const without = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    expect(without.threads).toHaveLength(0);
    expect(without.portals).toEqual({});
  });

  it("never blocks on a learner's own Voraussetzung", async () => {
    const foundation = await unit("kraft", "physik/mechanik");
    const dependent = await unit("hebel", "physik/mechanik");
    await addConnection(db, {
      ...personal,
      a: dependent.key,
      b: foundation.key,
      kind: "voraussetzung",
    });
    expect(await getBlockingPrerequisites(db, dependent.token.id)).toEqual([]);
    for (const token of [foundation.token, dependent.token]) {
      const card = await getCard(db, token.id, USER);
      const result = await executeReviewAction(db, {
        action: "rate",
        cardId: card?.id as string,
        userId: USER,
        rating: 1,
        answerFormat: "recall",
      });
      expect(result.blocked).toBeUndefined();
    }
    expect((await getCard(db, dependent.token.id, USER))?.blocked).toBe(0);
    expect((await getCard(db, foundation.token.id, USER))?.blocked).toBe(0);
  });
});
