import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type AtlasView,
  addConnection,
  bonusCandidates,
  chooseVariant,
  commitMaterialImport,
  createToken,
  type Database,
  detachCardForUser,
  ensureCard,
  installKvtTile,
  LEBEN_LENS,
  type MaterialProposalSet,
  matchMaterialProposals,
  openDatabase,
  parseMaterialProposalSet,
  readAtlas,
  regionTokenIds,
  resolvePlace,
  SCHULE_LENS,
  setLibraryVariant,
  settleLens,
  takeUnits,
  type UnitKey,
  undoVariant,
  WELTWISSEN_LENS,
} from "../../src/kernel/index.js";
import {
  type BundledTile,
  listBundledTiles,
} from "../../src/kernel/library/bundled-cells.js";
import { materialiseKvtCards } from "../../src/kernel/library/kvt-attach.js";

/**
 * Import at a place, variants and taking content in (ADR 2026-10-13,
 * Decisions 1, 2, 9 and 12; plan Phase 7).
 */

const USER = "learner";
const OTHER = "colleague";
const OPTIK_GEBIET = "natur.physik.optik";

function optikTile(): BundledTile {
  const tile = listBundledTiles().find((t) =>
    t.atoms.some((a) => a.domain.startsWith("physik/optik")),
  );
  if (!tile) throw new Error("no bundled optics tile");
  return tile;
}

function notesSet(
  proposals: Array<Record<string, unknown>>,
  place?: { lens: string; regionKey: string },
): MaterialProposalSet {
  return parseMaterialProposalSet({
    version: 1,
    analysis: {
      kind: "own-notes",
      title: "Brechung im Unterricht",
      subjects: ["physik"],
      topic: "Lichtbrechung",
      level: "Realschule 8",
      bloom: [1, 2],
      leadsTo: null,
    },
    files: [
      {
        name: "Notizen",
        sourceLink: "notes:Brechung@2026-10-13",
        sha256: null,
      },
    ],
    proposals: proposals.map((p) => ({
      bloom: 1,
      file: 0,
      page: null,
      area: "physik/optik",
      origin: "page",
      ...p,
    })),
    ...(place ? { place } : {}),
  });
}

async function importNotes(
  db: Database,
  set: MaterialProposalSet,
  variants: "tick" | "none" = "none",
) {
  const rows = await matchMaterialProposals(db, USER, set);
  const decisions: Record<string, "yes"> = {};
  const ticked: string[] = [];
  for (const row of rows) {
    if (row.kind !== "proposal") continue;
    decisions[row.id] = "yes";
    if (variants === "tick") ticked.push(row.id);
  }
  return commitMaterialImport(db, USER, {
    set,
    rows,
    decisions,
    variants: ticked,
  });
}

function unitOf(view: AtlasView, key: string) {
  return view.units.find((u) => u.key === key);
}

function hexOf(view: AtlasView, key: string) {
  return view.land.find((h) => h.unit === key);
}

describe("atlas: import at a place, variants, taking in", () => {
  let dir: string;
  let db: Database;
  let tile: BundledTile;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-atlas-place-"));
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    tile = optikTile();
    await installKvtTile(db, tile);
  });

  afterEach(async () => {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("names only the levels below a place", async () => {
    const gebiet = await resolvePlace(db, WELTWISSEN_LENS, OPTIK_GEBIET);
    expect(gebiet?.path.map((s) => s.key)).toEqual([
      "natur",
      "natur.physik",
      OPTIK_GEBIET,
    ]);
    expect(gebiet?.missingLevels).toEqual(["Thema"]);
    const fach = await resolvePlace(db, WELTWISSEN_LENS, "natur.physik");
    expect(fach?.missingLevels).toEqual(["Gebiet", "Thema"]);
    expect(await resolvePlace(db, WELTWISSEN_LENS, "gibt.es.nicht")).toBeNull();
  });

  it("puts an import's own units at its place, under the Thema the agent named", async () => {
    const result = await importNotes(
      db,
      notesSet(
        [
          {
            question: "Was passiert mit Licht an der Grenze Luft–Wasser?",
            answer: "Es wird zum Lot hin gebrochen.",
            placeBelow: ["Brechung im Wasserglas"],
          },
          {
            question: "Wie heißt der Winkel zum Lot?",
            answer: "Einfallswinkel",
          },
        ],
        { lens: "weltwissen", regionKey: OPTIK_GEBIET },
      ),
    );
    expect(result.cardsCreated).toBe(2);
    expect(result.placed).toBe(2);

    const view = await readAtlas(db, { userId: USER, lens: WELTWISSEN_LENS });
    const own = view.units.filter((u) => u.own);
    expect(own).toHaveLength(2);
    expect(own.map((u) => u.region).sort()).toEqual([
      `${OPTIK_GEBIET}.allgemein`,
      `${OPTIK_GEBIET}.brechung-im-wasserglas`,
    ]);
    const thema = view.regions.find(
      (r) => r.key === `${OPTIK_GEBIET}.brechung-im-wasserglas`,
    );
    expect(thema?.name).toBe("Brechung im Wasserglas");
    expect(thema?.level).toBe(3);

    // Settle gives them land in that region.
    await settleLens(db, WELTWISSEN_LENS);
    const settled = await readAtlas(db, {
      userId: USER,
      lens: WELTWISSEN_LENS,
    });
    for (const unit of own) {
      expect(hexOf(settled, unit.key)?.region).toBe(unit.region);
    }
  });

  it("places nothing without a place, as before the atlas", async () => {
    const result = await importNotes(
      db,
      notesSet([{ question: "Was ist ein Lot?", answer: "Eine Senkrechte." }]),
    );
    expect(result.cardsCreated).toBe(1);
    expect(result.placed).toBeUndefined();
    const members = (await db
      .prepare("SELECT COUNT(*) AS n FROM atlas_members")
      .get()) as { n: number };
    expect(Number(members.n)).toBe(0);
  });

  it("places an import in a Schule region that exists only by derivation", async () => {
    const atomIds = tile.atoms.map((a) => a.id);
    await materialiseKvtCards(db, USER, atomIds);
    const view = await readAtlas(db, { userId: USER, lens: SCHULE_LENS });
    const lernbereich = view.regions.find((r) => r.level === 2);
    if (!lernbereich) throw new Error("no Lernbereich");
    const result = await importNotes(
      db,
      notesSet([{ question: "Was ist ein Lot?", answer: "Eine Senkrechte." }], {
        lens: "schule",
        regionKey: lernbereich.key,
      }),
    );
    expect(result.placed).toBe(1);
    const after = await readAtlas(db, { userId: USER, lens: SCHULE_LENS });
    expect(after.units.find((u) => u.own)?.region).toBe(lernbereich.key);
  });

  it("lets a school's method stand in for a published unit, and undo it", async () => {
    const atom = tile.atoms[0];
    const standsFor = `atom:${atom.id}` as UnitKey;
    await materialiseKvtCards(db, USER, [atom.id]);
    const before = (await db
      .prepare(
        `SELECT c.id FROM cards c JOIN tokens t ON t.id = c.token_id
          WHERE c.user_id = ? AND t.atom_id = ? ORDER BY c.id`,
      )
      .all(USER, atom.id)) as Array<{ id: string }>;
    expect(before.length).toBeGreaterThan(0);
    await settleLens(db, WELTWISSEN_LENS);
    const original = await readAtlas(db, {
      userId: USER,
      lens: WELTWISSEN_LENS,
    });
    const publishedHex = hexOf(original, standsFor);
    expect(publishedHex).toBeDefined();

    const result = await importNotes(
      db,
      notesSet(
        [
          {
            question: "Wie bestimmt unsere Schule den Brechungswinkel?",
            answer: "Mit dem Geodreieck am Lot.",
            standsFor,
          },
        ],
        { lens: "weltwissen", regionKey: OPTIK_GEBIET },
      ),
      "tick",
    );
    expect(result.variantsChosen).toBe(1);

    // Detached, not deleted.
    const cards = (await db
      .prepare(
        `SELECT c.id, c.detached_at FROM cards c JOIN tokens t ON t.id = c.token_id
          WHERE c.user_id = ? AND t.atom_id = ? ORDER BY c.id`,
      )
      .all(USER, atom.id)) as Array<{ id: string; detached_at: string | null }>;
    expect(cards.map((c) => c.id)).toEqual(before.map((c) => c.id));
    expect(cards.every((c) => c.detached_at !== null)).toBe(true);

    await settleLens(db, WELTWISSEN_LENS);
    const view = await readAtlas(db, {
      userId: USER,
      lens: WELTWISSEN_LENS,
      showNew: true,
    });
    const variant = view.units.find((u) => u.standsFor?.key === standsFor);
    expect(variant?.own).toBe(true);
    expect(variant?.standsFor?.chosen).toBe(true);
    // On the published unit's hex; the published unit is not in reach.
    const hex = hexOf(view, variant?.key ?? "");
    expect([hex?.island, hex?.q, hex?.r]).toEqual([
      publishedHex?.island,
      publishedHex?.q,
      publishedHex?.r,
    ]);
    expect(unitOf(view, standsFor)).toBeUndefined();
    expect(view.land.filter((h) => h.unit === variant?.key)).toHaveLength(1);
    // Threads of the published unit run to the variant.
    expect(
      view.threads.some((t) => t.from === standsFor || t.to === standsFor),
    ).toBe(false);

    // A card the learner had declined before stays declined after undo.
    expect(await undoVariant(db, { userId: USER, standsFor })).toEqual({
      reattached: before.length,
    });
    const restored = (await db
      .prepare(
        `SELECT c.detached_at FROM cards c JOIN tokens t ON t.id = c.token_id
          WHERE c.user_id = ? AND t.atom_id = ?`,
      )
      .all(USER, atom.id)) as Array<{ detached_at: string | null }>;
    expect(restored.every((c) => c.detached_at === null)).toBe(true);
    const back = await readAtlas(db, { userId: USER, lens: WELTWISSEN_LENS });
    expect(unitOf(back, standsFor)).toBeDefined();
  });

  it("lets a chosen variant stand in off the map too: at a portal and in a region review", async () => {
    const atom = tile.atoms[0];
    const standsFor = `atom:${atom.id}` as UnitKey;
    await materialiseKvtCards(db, USER, [atom.id]);
    // A method of its own domain: its own placement is not the optics region.
    const own = await createToken(db, {
      slug: "unser-verfahren",
      concept: "Unser Verfahren",
      domain: "eigene-verfahren",
    });
    await ensureCard(db, own.id, USER);
    const variant = `token:${own.id}` as UnitKey;
    const wippe = await createToken(db, {
      slug: "wippe-im-garten",
      concept: "Die Wippe",
      domain: "familie/garten",
    });
    await ensureCard(db, wippe.id, USER);
    await addConnection(db, {
      a: `token:${wippe.id}`,
      b: standsFor,
      kind: "nutzt",
      userId: USER,
      mayWriteKnowledge: false,
    });
    await chooseVariant(db, { userId: USER, variant, standsFor });

    // On the own planet the thread runs to the variant's portal.
    const leben = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    expect(leben.threads).toEqual([
      expect.objectContaining({ from: `token:${wippe.id}`, to: variant }),
    ]);
    expect(leben.portals[variant]?.planet).toBe("welt");

    // A review of the region where the map shows the variant includes it.
    const ids = await regionTokenIds(db, WELTWISSEN_LENS, OPTIK_GEBIET, USER);
    expect(ids).toContain(own.id);
    expect(
      await regionTokenIds(db, WELTWISSEN_LENS, OPTIK_GEBIET, OTHER),
    ).not.toContain(own.id);
  });

  it("re-attaches only the cards a variant detached", async () => {
    const atom = tile.atoms.find((a) => a.practice_items.length > 1);
    if (!atom) throw new Error("the optics tile has no atom with two items");
    await materialiseKvtCards(db, USER, [atom.id]);
    const tokens = (await db
      .prepare(
        `SELECT t.id FROM cards c JOIN tokens t ON t.id = c.token_id
          WHERE c.user_id = ? AND t.atom_id = ? ORDER BY t.id`,
      )
      .all(USER, atom.id)) as Array<{ id: string }>;
    expect(tokens.length).toBeGreaterThanOrEqual(2);
    await detachCardForUser(db, tokens[0].id, USER);
    const own = await createToken(db, {
      slug: "schulverfahren",
      concept: "Unser Verfahren",
      domain: "physik/optik",
    });
    await ensureCard(db, own.id, USER);
    const standsFor = `atom:${atom.id}` as UnitKey;
    await chooseVariant(db, {
      userId: USER,
      variant: `token:${own.id}`,
      standsFor,
    });
    await undoVariant(db, { userId: USER, standsFor });
    const first = (await db
      .prepare(
        "SELECT detached_at FROM cards WHERE user_id = ? AND token_id = ?",
      )
      .get(USER, tokens[0].id)) as { detached_at: string | null };
    expect(first.detached_at).not.toBeNull();
  });

  it("lets a library variant change no member's cards", async () => {
    const atom = tile.atoms[0];
    const standsFor = `atom:${atom.id}` as UnitKey;
    await materialiseKvtCards(db, OTHER, [atom.id]);
    const own = await createToken(db, {
      slug: "schulverfahren-bibliothek",
      concept: "Das Verfahren der Schule",
      domain: "physik/optik",
    });
    const variant = `token:${own.id}` as UnitKey;
    await setLibraryVariant(db, { variant, standsFor, curatorId: "curator" });
    const detached = (await db
      .prepare(
        "SELECT COUNT(*) AS n FROM cards WHERE user_id = ? AND detached_at IS NOT NULL",
      )
      .get(OTHER)) as { n: number };
    expect(Number(detached.n)).toBe(0);

    await settleLens(db, WELTWISSEN_LENS);
    // Settle gave the variant no land of its own.
    const land = (await db
      .prepare("SELECT COUNT(*) AS n FROM atlas_land WHERE unit_key = ?")
      .get(variant)) as { n: number };
    expect(Number(land.n)).toBe(0);

    // The member who holds the published unit keeps it and is offered the switch.
    const member = await readAtlas(db, {
      userId: OTHER,
      lens: WELTWISSEN_LENS,
    });
    expect(unitOf(member, standsFor)?.variantOffer?.key).toBe(variant);
    expect(hexOf(member, standsFor)).toBeDefined();

    // A learner without it sees the variant in its place, the published unit not in reach.
    const fresh = await readAtlas(db, {
      userId: USER,
      lens: WELTWISSEN_LENS,
      showNew: true,
    });
    expect(unitOf(fresh, standsFor)).toBeUndefined();
    expect(unitOf(fresh, variant)?.standsFor?.chosen).toBe(false);
    expect(hexOf(fresh, variant)).toBeDefined();
    // Not offered as a bonus either.
    const bonus = await bonusCandidates(db, USER, { inScopeAtomIds: [] });
    expect(bonus.some((b) => b.atomId === atom.id)).toBe(false);
  });

  it("takes in sketched units on a click, and never a declined one", async () => {
    const [first, second] = tile.atoms;
    const view = await readAtlas(db, {
      userId: USER,
      lens: WELTWISSEN_LENS,
      showNew: true,
    });
    expect(unitOf(view, `atom:${first.id}`)?.inReach).toBe(true);
    const taken = await takeUnits(db, USER, [`atom:${first.id}`]);
    expect(taken.cardsCreated).toBeGreaterThan(0);
    const after = await readAtlas(db, {
      userId: USER,
      lens: WELTWISSEN_LENS,
      showNew: true,
    });
    expect(unitOf(after, `atom:${first.id}`)?.inReach).toBe(false);
    // Only the chosen unit.
    expect(unitOf(after, `atom:${second.id}`)?.inReach).toBe(true);

    // Declined stays declined: not in reach, and not taken again.
    const items = (await db
      .prepare(
        `SELECT c.token_id FROM cards c JOIN tokens t ON t.id = c.token_id
          WHERE c.user_id = ? AND t.atom_id = ?`,
      )
      .all(USER, first.id)) as Array<{ token_id: string }>;
    for (const item of items) await detachCardForUser(db, item.token_id, USER);
    const declined = await readAtlas(db, {
      userId: USER,
      lens: WELTWISSEN_LENS,
      showNew: true,
    });
    expect(unitOf(declined, `atom:${first.id}`)).toBeUndefined();
    expect(await takeUnits(db, USER, [`atom:${first.id}`])).toEqual({
      cardsCreated: 0,
      skipped: 1,
    });
  });

  it("keeps an own unit and its place when the world content is installed again", async () => {
    await importNotes(
      db,
      notesSet([{ question: "Was ist ein Lot?", answer: "Eine Senkrechte." }], {
        lens: "weltwissen",
        regionKey: OPTIK_GEBIET,
      }),
    );
    const before = await readAtlas(db, { userId: USER, lens: WELTWISSEN_LENS });
    const own = before.units.find((u) => u.own);
    expect(own).toBeDefined();
    await installKvtTile(db, tile);
    const after = await readAtlas(db, { userId: USER, lens: WELTWISSEN_LENS });
    expect(after.units.find((u) => u.key === own?.key)?.region).toBe(
      own?.region,
    );
  });

  it("applies the confirmed kind per card of a mixed import, every unit own (Decision 2)", async () => {
    const set = notesSet(
      [
        {
          question: "Was beschreibt das Brechungsgesetz?",
          answer: "Den Knick des Lichts an einer Grenzfläche.",
          kind: "welt",
        },
        {
          question: "Wer betreut im Labor den Laser?",
          answer: "Frau Weber, Durchwahl 214.",
          kind: "privat",
        },
        {
          question: "Welche Brille trägt man am Laser?",
          answer: "Die grüne Schutzbrille aus Schrank 3.",
          kind: "welt",
        },
        { question: "Was ist ein Lot?", answer: "Eine Senkrechte." },
      ],
      { lens: "weltwissen", regionKey: OPTIK_GEBIET },
    );
    const rows = await matchMaterialProposals(db, USER, set);
    const proposalRows = rows.filter((row) => row.kind === "proposal");
    const decisions: Record<string, "yes"> = {};
    for (const row of proposalRows) decisions[row.id] = "yes";
    // The learner flips the safety glasses: the lab's own cupboard is private.
    const result = await commitMaterialImport(db, USER, {
      set,
      rows,
      decisions,
      kinds: { [proposalRows[2].id]: "privat" },
    });
    expect(result.cardsCreated).toBe(4);
    expect(result.placed).toBe(2);
    expect(result.kinds).toEqual({ welt: 0, own: 2 });

    const welt = await readAtlas(db, { userId: USER, lens: WELTWISSEN_LENS });
    const leben = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    const titles = (units: Array<{ title: string; own: boolean }>) =>
      units.filter((u) => u.own).map((u) => u.title);
    expect(titles(welt.units).sort()).toEqual(
      ["Den Knick des Lichts an einer Grenzfläche.", "Eine Senkrechte."].sort(),
    );
    expect(titles(leben.units).sort()).toEqual(
      [
        "Die grüne Schutzbrille aus Schrank 3.",
        "Frau Weber, Durchwahl 214.",
      ].sort(),
    );
    // Status never changes: all four stay own units without an atom.
    const atoms = (await db
      .prepare(
        `SELECT COUNT(*) AS n FROM tokens WHERE atom_id IS NOT NULL AND source_link LIKE 'notes:%'`,
      )
      .get()) as { n: number };
    expect(Number(atoms.n)).toBe(0);
  });

  it("refuses a kind that is no planet", () => {
    expect(() =>
      notesSet([
        {
          question: "Was ist ein Lot?",
          answer: "Eine Senkrechte.",
          kind: "mond",
        },
      ]),
    ).toThrow(/kind: must be welt, firma or privat/);
  });
});
