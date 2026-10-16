/**
 * Reading the atlas for one learner (ADR 2026-10-13, Decisions 1, 3, 4, 10).
 *
 * The read writes nothing. Land the library has not settled yet is planned
 * in memory and marked provisional, so a learner who may not write knowledge
 * still sees a whole map. The coast covers every unit of the library; the
 * units a learner does not hold stay blank (Decision 1). Counts are the
 * caller's own; no figure says anything about other people.
 */

import { parseStoredTimestampUtc } from "../db/sql.js";
import type { Database } from "../db/types.js";
import {
  cardAllowedForAtom,
  localLearningDay,
  occupyingAtomCards,
  resolvePresentationTimeZone,
} from "../scheduler/presentation.js";
import {
  type Condition,
  type ConditionCard,
  unitCondition,
} from "./condition.js";
import { type ConnectionScope, loadConnections } from "./connections.js";
import {
  type ResolvedEmblem,
  regionEmblemKey,
  resolveEmblems,
  subjectEmblemKey,
} from "./emblems.js";
import { islandDrift } from "./land.js";
import {
  type DerivedPlacement,
  type LensDefinition,
  lensRowsForRead,
  type UnitRow,
} from "./lenses.js";
import { hueKeyForDomain } from "./palette.js";
import { lensPlacements } from "./planets.js";
import { type ReadUp, readUpForUnits } from "./read-up.js";
import { type LensSnapshot, loadLandState, planForSnapshot } from "./settle.js";
import type { LensKind, PlanetKind, ThreadKind, UnitKey } from "./types.js";
import { type EffectiveVariant, effectiveVariants } from "./variants.js";

export interface AtlasRegionView {
  key: string;
  name: string;
  level: number;
  parentKey: string | null;
  rank: number;
  /** Key the hue comes from; empty above the colour level. */
  hueKey: string;
  pattern: string | null;
  /** Not stored yet: the next settle writes it. */
  provisional: boolean;
  /**
   * Key into `AtlasView.emblems`: the region's own Sinnbild, or for a leaf
   * region without one, its first unit's (Decision 6).
   */
  emblem?: string;
  /**
   * The subject key a new Sinnbild of this region is written to: a Fach's
   * `subject:<key>`, shared by every lens, else `region:<lens>:<key>`.
   */
  emblemSubject: string;
}

export interface AtlasUnitView {
  key: UnitKey;
  title: string;
  /** Leaf region key. */
  region: string;
  condition: Condition | null;
  /**
   * The caller's cards of this unit that a region review would show now: due,
   * not blocked, not buried, not waiting for a short step, and at most one
   * item per atom per learning day, as the queue admits them. A unit can be
   * in a due condition with nothing to show until later.
   */
  due: number;
  cards: number;
  /** Status (Decision 2): written in this library, not published. */
  own: boolean;
  /** No card yet; shown only with *Neue Inhalte zeigen*. */
  inReach: boolean;
  /**
   * This unit stands in for a published one, on that unit's hex (Decision
   * 12). `chosen`: the learner chose it and may undo it; otherwise the
   * library's curator set it.
   */
  standsFor?: { key: UnitKey; title: string; chosen: boolean };
  /** The library sets a variant for this unit while the learner still holds it. */
  variantOffer?: { key: UnitKey; title: string };
  /** Key into `AtlasView.emblems` when the unit has a Sinnbild. */
  emblem?: string;
  /**
   * Where to read the unit up (ADR 2026-10-14, Decision 4): world lenses
   * only. Opened on the learner's click; nothing fetches it.
   */
  readUp?: ReadUp;
}

/** One red thread (Decision 7). */
export interface AtlasThread {
  /**
   * The dependent end: it builds on, uses, consumes the interface of, or is
   * a special case of `to`. A Verbindung has no direction.
   */
  from: UnitKey;
  to: UnitKey;
  kind: ThreadKind;
  /** `shared`: the library's (a prerequisite or a connection); `personal`: the learner's own. */
  scope: ConnectionScope;
  /** A connection's id, to cut it; prerequisites have none. */
  id?: string;
  /** Why the two belong together. Untrusted text. */
  note?: string;
  /**
   * The learner's own thread, drawn once although the library has the same
   * one: `id` and `note` are the learner's, so they can still cut it.
   */
  alsoShared?: boolean;
}

export interface AtlasView {
  lens: {
    kind: LensKind;
    planet: PlanetKind;
    name: string;
    levels: string[];
    colourLevel: number;
  };
  regions: AtlasRegionView[];
  islands: Array<{
    key: string;
    dq: number;
    dr: number;
    drift: number;
    provisional: boolean;
  }>;
  land: Array<{
    island: string;
    q: number;
    r: number;
    region: string;
    /** Null: reserved land, or a unit the caller does not see. */
    unit: UnitKey | null;
  }>;
  units: AtlasUnitView[];
  /**
   * Threads with at least one end on this map. The other end may lie on the
   * library's other planet: then `portals` names it.
   */
  threads: AtlasThread[];
  /** Ends of threads on the other planet, drawn as portals (Decision 2). */
  portals: Record<string, { title: string; planet: PlanetKind }>;
  own: { dueByRegion: Record<string, number> };
  settle: { pending: number; mayWrite: boolean };
  /** The resolved home region key, after the fallback; null = whole lens. */
  home: string | null;
  /**
   * Sinnbilder by subject key, each once: canonical SVG and glyph. Untrusted
   * content, shown only as an image and as text.
   */
  emblems: Record<string, ResolvedEmblem>;
}

export interface ReadAtlasOptions {
  userId: string;
  lens: LensDefinition;
  now?: Date;
  /** *Neue Inhalte zeigen*: also units without a card (Decision 1). */
  showNew?: boolean;
  /** Stored home path, root first; the deepest key that still exists wins. */
  homePath?: readonly string[];
  /** Whether this connection may write knowledge (settle). */
  mayWrite?: boolean;
  /** IANA time zone of the learner's day, for the one-item-per-atom rule. */
  timeZone?: string;
}

interface CardRow {
  id: string;
  token_id: string;
  state: ConditionCard["state"];
  stability: number;
  due_at: string;
  last_review_at: string | null;
  lapses: number;
  detached_at: string | null;
  blocked: number | boolean;
  buried_until: string | null;
  maintenance_at: string | null;
  editorial_state: string;
}

/**
 * Everything a read needs, without writing. Only units of the lens's planet
 * are placed; `units` holds every unit of the library.
 */
export async function snapshotForRead(
  db: Database,
  lens: LensDefinition,
): Promise<{
  snapshot: LensSnapshot;
  units: UnitRow[];
  stored: boolean;
  /** The planet of every unit of the library, for portals. */
  planetOf: Map<UnitKey, PlanetKind>;
}> {
  const { lensId, rows } = await lensRowsForRead(db, lens);
  const { units, placements, planetOf } = await lensPlacements(db, lens, rows);
  const state = lensId
    ? await loadLandState(db, lensId, rows)
    : { islands: [], land: [] };
  return {
    snapshot: { lensId: lensId ?? "", rows, placements, state },
    units,
    stored: lensId !== null,
    planetOf,
  };
}

/**
 * Token ids of every unit in a region's subtree, for a region review. A
 * variant counts where the map shows it: on its published unit's hex
 * (Decision 12).
 */
export async function regionTokenIds(
  db: Database,
  lens: LensDefinition,
  regionKey: string,
  userId: string,
): Promise<string[]> {
  const { snapshot, units } = await snapshotForRead(db, lens);
  const pathOf = new Map(snapshot.placements.map((p) => [p.unitKey, p.path]));
  for (const entry of (await effectiveVariants(db, userId)).values()) {
    const path = pathOf.get(entry.standsFor);
    if (path) pathOf.set(entry.variant, path);
  }
  const inRegion = new Set<UnitKey>();
  for (const [key, path] of pathOf) {
    if (path.some((step) => step.key === regionKey)) inRegion.add(key);
  }
  return units.filter((u) => inRegion.has(u.key)).flatMap((u) => u.tokenIds);
}

export async function readAtlas(
  db: Database,
  options: ReadAtlasOptions,
): Promise<AtlasView> {
  const now = options.now ?? new Date();
  const { lens } = options;
  const { snapshot, units, stored, planetOf } = await snapshotForRead(db, lens);
  const plan = planForSnapshot(snapshot);

  // ── Regions: stored, plus those the placements name ───────────────────────
  const storedKeys = new Set(snapshot.rows.regions.map((r) => r.key));
  const keyOfId = new Map(snapshot.rows.regions.map((r) => [r.id, r.key]));
  const regions = new Map<string, AtlasRegionView>();
  for (const r of snapshot.rows.regions) {
    regions.set(r.key, {
      key: r.key,
      name: r.name,
      level: r.level,
      parentKey: r.parentId ? (keyOfId.get(r.parentId) ?? null) : null,
      rank: r.rank,
      hueKey: "",
      pattern: null,
      provisional: !stored,
      emblemSubject: "",
    });
  }
  for (const placement of snapshot.placements) {
    placement.path.forEach((step, i) => {
      if (regions.has(step.key)) return;
      regions.set(step.key, {
        key: step.key,
        name: step.name,
        level: step.level,
        parentKey: i > 0 ? placement.path[i - 1].key : null,
        rank: step.rank,
        hueKey: "",
        pattern: null,
        provisional: true,
        emblemSubject: "",
      });
    });
  }
  // The hue comes from the region on the colour level, for it and below.
  const colourKey = (key: string): string => {
    let region = regions.get(key);
    while (region && region.level > lens.colourLevel) {
      region = region.parentKey ? regions.get(region.parentKey) : undefined;
    }
    if (!region || region.level !== lens.colourLevel) return "";
    const last = region.key.split(".").pop() ?? region.key;
    return hueKeyForDomain(last);
  };
  for (const region of regions.values()) region.hueKey = colourKey(region.key);
  // Regions with nothing on the map (no placement, no land) are left out.
  const used = new Set<string>();
  const markUsed = (key: string) => {
    let current: string | null = key;
    while (current && !used.has(current)) {
      used.add(current);
      current = regions.get(current)?.parentKey ?? null;
    }
  };
  for (const placement of snapshot.placements) {
    markUsed(placement.path[placement.path.length - 1].key);
  }
  for (const hex of plan.next.land) markUsed(hex.region);

  // ── The caller's cards ────────────────────────────────────────────────────
  const cardRows = (await db
    .prepare(
      `SELECT c.id, c.token_id, c.state, c.stability, c.due_at, c.last_review_at,
              c.lapses, c.detached_at, c.blocked, c.buried_until,
              t.maintenance_at, t.editorial_state
         FROM cards c
         JOIN tokens t ON t.id = c.token_id
        WHERE c.user_id = ?`,
    )
    .all(options.userId)) as CardRow[];
  const cardsByToken = new Map<string, CardRow>();
  for (const row of cardRows) cardsByToken.set(row.token_id, row);

  // What a region review would show now, by the queue's own rules.
  const timeZone = await resolvePresentationTimeZone(db, options.timeZone);
  const occupying = await occupyingAtomCards(
    db,
    options.userId,
    localLearningDay(now, timeZone),
  );
  const nowMs = now.getTime();
  const showable = (row: CardRow, atomId: string | null): boolean =>
    row.state !== "new" &&
    !Number(row.blocked) &&
    row.maintenance_at === null &&
    row.editorial_state === "published" &&
    (row.buried_until === null ||
      parseStoredTimestampUtc(row.buried_until) <= nowMs) &&
    parseStoredTimestampUtc(row.due_at) <= nowMs &&
    cardAllowedForAtom(row.id, atomId, occupying);

  const leafOf = new Map<UnitKey, string>(
    snapshot.placements.map((p: DerivedPlacement) => [
      p.unitKey,
      p.path[p.path.length - 1].key,
    ]),
  );

  // A variant stands on its published unit's hex (Decision 12).
  const variants = await effectiveVariants(db, options.userId);
  const variantFor = new Map<UnitKey, EffectiveVariant>();
  for (const entry of variants.values()) variantFor.set(entry.variant, entry);
  const titleOf = new Map(units.map((u) => [u.key, u.title]));

  /** The caller's attached cards of a unit; null when the unit stays blank. */
  const shownCards = (unit: UnitRow): CardRow[] | null => {
    const rows = unit.tokenIds
      .map((id) => cardsByToken.get(id))
      .filter((row): row is CardRow => row !== undefined);
    const attached = rows.filter((row) => row.detached_at === null);
    const declined = rows.length > 0 && attached.length === 0;
    if (declined) return null; // blank, even with Neue Inhalte zeigen
    if (attached.length === 0 && !options.showNew) return null;
    return attached;
  };

  let unitViews: AtlasUnitView[] = [];
  for (const unit of units) {
    const standing = variantFor.get(unit.key);
    const region =
      leafOf.get(unit.key) ??
      (standing ? leafOf.get(standing.standsFor) : undefined);
    if (!region) continue;
    const attached = shownCards(unit);
    if (!attached) continue;
    const conditionCards: ConditionCard[] = attached.map((row) => ({
      state: row.state,
      stability: Number(row.stability),
      dueAt: row.due_at,
      lastReviewAt: row.last_review_at,
      lapses: Number(row.lapses),
    }));
    const showing = attached.filter((row) => showable(row, unit.atomId)).length;
    // One item of an atom a day: its other items wait for another day.
    const due = unit.atomId ? Math.min(1, showing) : showing;
    unitViews.push({
      key: unit.key,
      title: unit.title,
      region,
      condition: unitCondition(conditionCards, now),
      due,
      cards: attached.length,
      own: unit.own,
      inReach: attached.length === 0,
    });
  }

  // A learner's own choice detached the published unit's cards, so it is
  // already gone. A library variant stands in unless the learner still holds
  // the published unit: then that unit keeps its hex and offers the switch.
  const standIn = new Map<UnitKey, UnitKey>();
  const viewOf = new Map(unitViews.map((u) => [u.key, u]));
  const hidden = new Set<UnitKey>();
  for (const entry of variants.values()) {
    const published = viewOf.get(entry.standsFor);
    if (!entry.chosen && published && published.cards > 0) {
      published.variantOffer = {
        key: entry.variant,
        title: titleOf.get(entry.variant) ?? entry.variant,
      };
      hidden.add(entry.variant);
      continue;
    }
    if (published) hidden.add(entry.standsFor);
    const variant = viewOf.get(entry.variant);
    const leaf = leafOf.get(entry.standsFor);
    if (!variant || !leaf) continue;
    standIn.set(entry.standsFor, entry.variant);
    variant.region = leaf;
    variant.standsFor = {
      key: entry.standsFor,
      title: titleOf.get(entry.standsFor) ?? entry.standsFor,
      chosen: entry.chosen,
    };
  }
  unitViews = unitViews.filter((u) => !hidden.has(u.key));
  const standingIn = new Set(standIn.values());
  const visible = new Set(unitViews.map((u) => u.key));
  /** Whether the learner still holds a unit: an attached card of it. */
  const holds = (unit: UnitRow | undefined): boolean =>
    unit?.tokenIds.some((id) => {
      const row = cardsByToken.get(id);
      return row !== undefined && row.detached_at === null;
    }) ?? false;
  const unitByKey = new Map(units.map((u) => [u.key, u]));
  // Off this map, a variant stands in by the same rule, whatever lens shows
  // it: the learner's choice, or the library's while they hold no card of
  // the published unit.
  const onHexOf = (key: UnitKey): UnitKey => {
    const here = standIn.get(key);
    if (here || visible.has(key)) return here ?? key;
    const entry = variants.get(key);
    if (!entry || (!entry.chosen && holds(unitByKey.get(key)))) return key;
    return entry.variant;
  };

  const dueByRegion: Record<string, number> = {};
  for (const view of unitViews) {
    if (view.due === 0) continue;
    let current: string | null = view.region;
    while (current) {
      dueByRegion[current] = (dueByRegion[current] ?? 0) + view.due;
      current = regions.get(current)?.parentKey ?? null;
    }
  }

  // ── Threads with an end on this map (Decision 7) ─────────────────────────
  const unitOfToken = new Map<string, UnitKey>();
  for (const unit of units) {
    for (const id of unit.tokenIds) unitOfToken.set(id, unit.key);
  }
  const threadAt = new Map<string, AtlasThread>();
  const threads: AtlasThread[] = [];
  const portals: AtlasView["portals"] = {};
  const addThread = (
    rawFrom: UnitKey | undefined,
    rawTo: UnitKey | undefined,
    thread: Omit<AtlasThread, "from" | "to">,
  ) => {
    // Threads of a published unit run to the variant standing in for it.
    const from = rawFrom ? onHexOf(rawFrom) : undefined;
    const to = rawTo ? onHexOf(rawTo) : undefined;
    if (!from || !to || from === to) return;
    const fromHere = visible.has(from);
    const toHere = visible.has(to);
    if (!fromHere && !toHere) return;
    if (!fromHere || !toHere) {
      // The other end lies on the library's other planet: a portal, when
      // the learner would see that unit there.
      const far = fromHere ? to : from;
      const planet = planetOf.get(far);
      const unit = unitByKey.get(far);
      if (!unit || !planet || planet === lens.planet) return;
      if (!shownCards(unit)) return;
      portals[far] ??= { title: unit.title, planet };
    }
    // Shared first: a personal thread the library already has is not drawn
    // twice, but the drawn one carries the learner's id and note, so they
    // can still cut what is theirs.
    const [x, y] =
      thread.kind === "verbindung" && to < from ? [to, from] : [from, to];
    const key = `${thread.kind}:${x}>${y}`;
    const drawn = threadAt.get(key);
    if (drawn) {
      if (drawn.scope === "shared" && thread.scope === "personal") {
        const note = thread.note ?? drawn.note;
        drawn.scope = "personal";
        drawn.id = thread.id;
        drawn.alsoShared = true;
        if (note) drawn.note = note;
      }
      return;
    }
    const added: AtlasThread = { from, to, ...thread };
    threadAt.set(key, added);
    threads.push(added);
  };
  const prerequisite = { kind: "voraussetzung", scope: "shared" } as const;
  const atomEdges = (await db
    .prepare(`SELECT atom_id, requires_id FROM atom_prerequisites`)
    .all()) as Array<{ atom_id: string; requires_id: string }>;
  for (const edge of atomEdges) {
    addThread(`atom:${edge.atom_id}`, `atom:${edge.requires_id}`, prerequisite);
  }
  const tokenEdges = (await db
    .prepare(`SELECT token_id, requires_id FROM prerequisites`)
    .all()) as Array<{ token_id: string; requires_id: string }>;
  for (const edge of tokenEdges) {
    addThread(
      unitOfToken.get(edge.token_id),
      unitOfToken.get(edge.requires_id),
      prerequisite,
    );
  }
  for (const stored of await loadConnections(db, options.userId)) {
    addThread(stored.a, stored.b, {
      kind: stored.kind,
      scope: stored.scope,
      id: stored.id,
      ...(stored.note ? { note: stored.note } : {}),
    });
  }

  // ── Land and islands, as planned ──────────────────────────────────────────
  const storedIslands = new Map(
    snapshot.state.islands.map((i) => [i.island, i]),
  );
  const islands = plan.next.islands.map((island) => {
    const before = storedIslands.get(island.island);
    return {
      key: island.island,
      dq: island.dq,
      dr: island.dr,
      drift: islandDrift(island),
      provisional:
        !before || before.dq !== island.dq || before.dr !== island.dr,
    };
  });
  const land = plan.next.land.map((hex) => {
    // The variant takes the published unit's hex and leaves its own blank.
    let unit = hex.unit;
    if (unit && standIn.has(unit)) unit = standIn.get(unit) ?? null;
    else if (unit && standingIn.has(unit)) unit = null;
    return {
      island: hex.island,
      q: hex.q,
      r: hex.r,
      region: hex.region,
      unit: unit && visible.has(unit) ? unit : null,
    };
  });

  // ── Home: the deepest stored step that still exists ───────────────────────
  let home: string | null = null;
  for (const key of options.homePath ?? []) {
    if (regions.has(key) && used.has(key)) home = key;
    else break;
  }

  // ── Sinnbilder: the learner's own, the library's, the seed's ──────────────
  const shownRegions = [...regions.values()].filter((r) => used.has(r.key));
  // A Fach is one subject in every world lens: its Sinnbild is the
  // subject's. A row under the lens's own region key still counts, after it.
  // A Produkt or a private Bereich keeps its own.
  for (const region of shownRegions) {
    region.emblemSubject =
      lens.planet === "welt" &&
      region.level === lens.colourLevel &&
      region.hueKey
        ? subjectEmblemKey(region.hueKey)
        : regionEmblemKey(lens.kind, region.key);
  }
  const candidates = (region: AtlasRegionView): string[] => {
    const own = regionEmblemKey(lens.kind, region.key);
    return region.emblemSubject === own ? [own] : [region.emblemSubject, own];
  };
  const resolved = await resolveEmblems(db, options.userId, [
    ...unitViews.map((u) => u.key),
    ...shownRegions.flatMap(candidates),
  ]);
  const emblems: Record<string, ResolvedEmblem> = {};
  for (const unit of unitViews) {
    const emblem = resolved.get(unit.key);
    if (!emblem) continue;
    emblems[unit.key] = emblem;
    unit.emblem = unit.key;
  }

  // Reading up: a world unit's own business only (ADR 2026-10-14, D4).
  if (lens.planet === "welt") {
    const shown = new Set(unitViews.map((u) => u.key));
    const readUps = await readUpForUnits(
      db,
      units.filter((unit) => shown.has(unit.key)),
    );
    for (const unit of unitViews) {
      const readUp = readUps.get(unit.key);
      if (readUp) unit.readUp = readUp;
    }
  }
  // A leaf region without its own shows its first unit's, in land order.
  const firstWithEmblem = new Map<string, UnitKey>();
  for (const hex of land) {
    if (hex.unit && emblems[hex.unit] && !firstWithEmblem.has(hex.region)) {
      firstWithEmblem.set(hex.region, hex.unit);
    }
  }
  const parents = new Set(shownRegions.map((r) => r.parentKey));
  for (const region of shownRegions) {
    const keys = candidates(region);
    // The learner's own or the library's wins over a seed, whichever key.
    const key =
      keys.find((k) => {
        const source = resolved.get(k)?.source;
        return source !== undefined && source !== "seed";
      }) ?? keys.find((k) => resolved.has(k));
    const emblem = key ? resolved.get(key) : undefined;
    if (key && emblem) {
      emblems[key] = emblem;
      region.emblem = key;
    } else if (!parents.has(region.key)) {
      region.emblem = firstWithEmblem.get(region.key);
    }
  }

  const missingRegions = [...regions.values()].filter(
    (r) => used.has(r.key) && !storedKeys.has(r.key),
  ).length;
  return {
    lens: {
      kind: lens.kind,
      planet: lens.planet,
      name: lens.name,
      levels: [...lens.levels],
      colourLevel: lens.colourLevel,
    },
    regions: shownRegions,
    islands,
    land,
    units: unitViews,
    threads,
    portals,
    own: { dueByRegion },
    settle: {
      pending:
        (stored ? 0 : 1) +
        missingRegions +
        plan.islands.length +
        plan.land.length +
        plan.removedIslands.length +
        plan.removedLand.length,
      mayWrite: options.mayWrite ?? false,
    },
    home,
    emblems,
  };
}
