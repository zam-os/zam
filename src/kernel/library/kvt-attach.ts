/**
 * Install a published Knowledge Vector Tile, and materialise cards separately.
 *
 * SPIKE — not a production release contract. What is missing is deliberate and
 * tracked in the Codex follow-up review: no release manifest, no digests, no
 * signature or publisher trust, no declarative removal of statements a newer
 * release dropped, and no cross-tile references (every prerequisite atom must
 * ship in the same tile). Do not build learner features on this until the
 * release/provenance contract exists.
 *
 * What this module does guarantee (ADR 2026-08-14, arbitration 2026-08-14):
 *
 * - **Installing content enrols nobody.** `installKvtTile` writes atoms,
 *   alignments, bindings, edges and practice items. It creates zero cards.
 *   `materialiseKvtCards` is the separate, explicit step.
 * - **Content updates go through the revision contract.** A changed question or
 *   answer on an existing item runs `publishTokenRevisionInTransaction`, so
 *   `content_version` moves and learners of the old wording are re-tested. FSRS
 *   state is never rewritten.
 * - **Order does not matter — for compatible releases.** The legacy
 *   `provider`/`topic_id` projection and the derived token edges are computed
 *   and *reconciled* from the full stored state, not from the position of an
 *   entry in the tile being installed, so a later release that changes which
 *   item represents an atom does not leave the previous edge behind.
 *
 *   The limit is explicit: releases that make **contradictory scalar claims**
 *   about the same object — a different atom title, reduction, alignment type
 *   or edge rationale for the same id — are still last-writer-wins, and their
 *   result therefore does depend on install order. Resolving that needs the
 *   release contract (per-row provenance and ownership), not another rule here.
 *   Only a differing *slug* for an already-installed item is rejected outright,
 *   because a published address must not change silently.
 */

import type { Database } from "../db/types.js";
import { ensureCard, getCard } from "../models/card.js";
import { addPrerequisite, removePrerequisite } from "../models/prerequisite.js";
import { type BloomLevel, getTokenById, insertToken } from "../models/token.js";
import { publishTokenRevisionInTransaction } from "./revision.js";

export const ATOM_ID_PATTERN = /^atom:zam:[a-z0-9-]+:[a-z0-9-]+$/;

const ALIGNMENT_TYPES = new Set([
  "skos:exactMatch",
  "skos:closeMatch",
  "skos:broadMatch",
  "skos:narrowMatch",
  "skos:relatedMatch",
]);

export interface KvtAlignment {
  target_uri: string;
  target_label?: string;
  alignment_type: string;
  provenance?: string;
}

export interface KvtCurriculumBinding {
  provider: string;
  school_type?: string;
  grade?: number;
  track?: string;
  subject?: string;
  topic_code: string;
  topic_title?: string;
  exam_relevant?: boolean;
}

export interface KvtAtomPrerequisite {
  atom_id: string;
  type: "hard" | "soft";
  rationale?: string;
}

export interface KvtPracticeItem {
  id: string;
  /** Published address. Immutable once installed; derived when absent. */
  slug?: string;
  /** Language the item is asked in. Substance, persisted. */
  language?: string;
  bloom_level: number;
  /** 'tier1_fast' | 'tier2_synthesis'. Substance, persisted. */
  tier?: string;
  /** Structured fast-check payload. Substance, persisted verbatim as JSON. */
  fast_check?: unknown;
  question: string;
  concept: string;
  /**
   * How a changed question/answer affects people who already learned it.
   * Absent means `material` — an unannotated content change must never pass
   * silently under a learner's existing stability.
   */
  materiality?: "cosmetic" | "material";
}

export interface KvtAtom {
  id: string;
  title: string;
  domain?: string;
  reduction?: string;
  typical_age_min?: number;
  prerequisites?: KvtAtomPrerequisite[];
  alignments?: KvtAlignment[];
  curricula?: KvtCurriculumBinding[];
  practice_items: KvtPracticeItem[];
}

export interface KvtTile {
  tile_id: string;
  version: string;
  title?: string;
  publisher?: string;
  atoms: KvtAtom[];
}

export interface InstallKvtResult {
  tileId: string;
  version: string;
  atomsUpserted: number;
  tokensCreated: number;
  /** Existing items whose substance changed and were published as a revision. */
  tokensRevised: number;
  /** Existing items that were byte-identical in substance. */
  tokensUnchanged: number;
  bindings: number;
  alignments: number;
  atomPrereqs: number;
  tokenPrereqs: number;
}

export interface MaterialiseKvtResult {
  cardsCreated: number;
  cardsReused: number;
}

function asTile(value: unknown): KvtTile {
  if (!value || typeof value !== "object") {
    throw new Error("KVT tile must be an object");
  }
  const tile = value as KvtTile;
  if (!tile.tile_id || !tile.version || !Array.isArray(tile.atoms)) {
    throw new Error("KVT tile needs tile_id, version and atoms[]");
  }
  return tile;
}

function assertAtomId(id: string): void {
  if (!ATOM_ID_PATTERN.test(id)) {
    throw new Error(`Invalid published atom id: ${id}`);
  }
}

/**
 * Address of a practice item.
 *
 * A tile should name it. The fallback carries the item id so two Tier 1 items
 * of the same atom cannot collide on `UNIQUE(slug)` — deriving from atom and
 * tier alone made a second item of either tier unpublishable.
 */
function slugForItem(atomId: string, item: KvtPracticeItem): string {
  if (item.slug?.trim()) return item.slug.trim();
  const base = atomId.slice("atom:zam:".length).replace(/:/g, "-");
  const tier = (item.tier ?? "item").replace(/_/g, "-");
  return `${base}-${tier}-${item.id.slice(-6).toLowerCase()}`;
}

/**
 * The fast check as stored: canonical JSON, or null.
 *
 * Kept verbatim rather than normalised into columns, so a tile can be installed
 * and read back without loss while the interaction model is still open
 * (ADR 2026-08-14b, question 5).
 */
function fastCheckOf(item: KvtPracticeItem): string | null {
  if (item.fast_check === undefined || item.fast_check === null) return null;
  if (typeof item.fast_check !== "object") {
    throw new Error(`fast_check on ${item.id} must be an object`);
  }
  return JSON.stringify(item.fast_check);
}

function bloomOf(item: KvtPracticeItem): BloomLevel {
  const level = item.bloom_level;
  if (level !== 1 && level !== 2 && level !== 3 && level !== 4 && level !== 5) {
    throw new Error(`bloom_level must be 1–5, got ${String(level)}`);
  }
  return level;
}

/**
 * The binding a legacy 1:1 consumer sees for this atom.
 *
 * Read back from the full stored set and ordered, never taken from the position
 * of an entry in the tile being installed: `countUserCardsForCurriculumTopic`
 * and friends still filter on `tokens.provider`, so picking `curricula[0]`
 * made those counts depend on which tile was installed first.
 */
async function projectedBinding(
  tx: Database,
  atomId: string,
): Promise<{ provider: string; topic_code: string } | undefined> {
  return (await tx
    .prepare(
      `SELECT provider, topic_code FROM atom_curriculum_bindings
        WHERE atom_id = ?
        ORDER BY provider, school_type, COALESCE(grade, -1), track, topic_code
        LIMIT 1`,
    )
    .get(atomId)) as { provider: string; topic_code: string } | undefined;
}

/** Every practice item of an atom, lowest id first. */
async function itemsOfAtom(tx: Database, atomId: string): Promise<string[]> {
  const rows = (await tx
    .prepare("SELECT id FROM tokens WHERE atom_id = ? ORDER BY id")
    .all(atomId)) as Array<{ id: string }>;
  return rows.map((row) => row.id);
}

/**
 * Bring the token edges derived from one hard atom edge to their target state.
 *
 * The representative is the lowest stored item id of the prerequisite atom. It
 * can therefore *change* when a later release adds an item with a lower id, and
 * merely adding the new edge would leave the old one behind — which is how the
 * result came to depend on install order.
 *
 * Scope of the delete: only edges from an item of `atomId` to a non-representative
 * item of `requiresId`. That is exactly this projection's own output. A curator
 * who hand-linked two items of these same atoms would be caught by it; naming
 * the owner of an edge needs the release contract's per-row provenance, which
 * does not exist yet.
 */
async function reconcileDerivedEdges(
  tx: Database,
  atomId: string,
  requiresId: string,
): Promise<number> {
  const children = await itemsOfAtom(tx, atomId);
  const parents = await itemsOfAtom(tx, requiresId);
  const [representative] = parents;
  if (!representative) return 0;

  let written = 0;
  for (const child of children) {
    if (child === representative) continue;
    for (const parent of parents) {
      if (parent !== representative) {
        await removePrerequisite(tx, child, parent);
      }
    }
    await addPrerequisite(tx, child, representative);
    written += 1;
  }
  return written;
}

/**
 * Install every atom and practice item in `tile`. Creates no cards.
 *
 * Idempotent: installing the same tile twice changes no row, no version and no
 * due date.
 */
export async function installKvtTile(
  db: Database,
  tileInput: unknown,
): Promise<InstallKvtResult> {
  const tile = asTile(tileInput);
  const atomIds = new Set(tile.atoms.map((atom) => atom.id));
  const seenSlugs = new Map<string, string>();

  for (const atom of tile.atoms) {
    assertAtomId(atom.id);
    if (!atom.title?.trim()) {
      throw new Error(`Atom ${atom.id} needs a title`);
    }
    if (!atom.practice_items?.length) {
      throw new Error(`Atom ${atom.id} needs at least one practice item`);
    }
    for (const item of atom.practice_items) {
      const slug = slugForItem(atom.id, item);
      const owner = seenSlugs.get(slug);
      if (owner && owner !== item.id) {
        throw new Error(
          `Tile ${tile.tile_id} gives slug ${slug} to both ${owner} and ${item.id}`,
        );
      }
      seenSlugs.set(slug, item.id);
    }
    for (const prereq of atom.prerequisites ?? []) {
      assertAtomId(prereq.atom_id);
      if (!atomIds.has(prereq.atom_id)) {
        throw new Error(
          `Atom ${atom.id} requires ${prereq.atom_id}, which is not in this tile`,
        );
      }
    }
  }

  return db.transaction(async (tx) => {
    const now = new Date().toISOString();
    let tokensCreated = 0;
    let tokensRevised = 0;
    let tokensUnchanged = 0;
    let bindings = 0;
    let alignments = 0;
    let atomPrereqs = 0;
    let tokenPrereqs = 0;

    for (const atom of tile.atoms) {
      await tx
        .prepare(
          `INSERT INTO learning_atoms
             (id, title, domain, reduction, typical_age_min, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             title = excluded.title,
             domain = excluded.domain,
             reduction = excluded.reduction,
             typical_age_min = excluded.typical_age_min,
             updated_at = excluded.updated_at`,
        )
        .run(
          atom.id,
          atom.title,
          atom.domain ?? "",
          atom.reduction ?? "",
          atom.typical_age_min ?? null,
          now,
          now,
        );

      // Merge, never replace: a second overlay tile must add bindings
      // without wiping the first cell's membership.
      for (const alignment of atom.alignments ?? []) {
        if (!ALIGNMENT_TYPES.has(alignment.alignment_type)) {
          throw new Error(
            `Unsupported alignment_type ${alignment.alignment_type} on ${atom.id}`,
          );
        }
        await tx
          .prepare(
            `INSERT INTO atom_alignments
               (atom_id, target_uri, target_label, alignment_type, provenance)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(atom_id, target_uri) DO UPDATE SET
               target_label = excluded.target_label,
               alignment_type = excluded.alignment_type,
               provenance = excluded.provenance`,
          )
          .run(
            atom.id,
            alignment.target_uri,
            alignment.target_label ?? null,
            alignment.alignment_type,
            alignment.provenance ?? null,
          );
        alignments += 1;
      }

      for (const binding of atom.curricula ?? []) {
        // Conflict target matches ux_atom_binding, whose COALESCE keeps a
        // binding without a grade idempotent: NULL never equals NULL, so the
        // bare column list re-inserted the same row on every install.
        await tx
          .prepare(
            `INSERT INTO atom_curriculum_bindings
               (atom_id, provider, school_type, grade, track, subject,
                topic_code, topic_title, exam_relevant)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(atom_id, provider, topic_code, COALESCE(grade, -1), track)
             DO UPDATE SET
               school_type = excluded.school_type,
               subject = excluded.subject,
               topic_title = excluded.topic_title,
               exam_relevant = excluded.exam_relevant`,
          )
          .run(
            atom.id,
            binding.provider,
            binding.school_type ?? "",
            binding.grade ?? null,
            binding.track ?? "",
            binding.subject ?? "",
            binding.topic_code,
            binding.topic_title ?? null,
            binding.exam_relevant ? 1 : 0,
          );
        bindings += 1;
      }

      const projected = await projectedBinding(tx, atom.id);

      for (const item of atom.practice_items) {
        const existing = await getTokenById(tx, item.id);
        if (!existing) {
          await insertToken(tx, {
            id: item.id,
            slug: slugForItem(atom.id, item),
            title: atom.title,
            concept: item.concept,
            question: item.question,
            question_source: "manual",
            domain: atom.domain ?? "",
            bloom_level: bloomOf(item),
            atom_id: atom.id,
            provider: projected?.provider ?? null,
            topic_id: projected?.topic_code ?? null,
            language: item.language ?? null,
            tier: item.tier ?? null,
            fast_check: fastCheckOf(item),
          });
          tokensCreated += 1;
          continue;
        }

        if (existing.atom_id && existing.atom_id !== atom.id) {
          throw new Error(
            `Item ${item.id} already realises ${existing.atom_id}; ` +
              `tile ${tile.tile_id} reassigns it to ${atom.id}`,
          );
        }

        // A published address must not change under a learner. Silently
        // ignoring the new value was the third way this could go: not applied,
        // not refused, just gone.
        if (item.slug?.trim() && item.slug.trim() !== existing.slug) {
          throw new Error(
            `Item ${item.id} is published as ${existing.slug}; ` +
              `tile ${tile.tile_id} renames it to ${item.slug.trim()}. ` +
              `Slugs are immutable — mint a new item or keep the address.`,
          );
        }

        const substanceChanged =
          existing.title !== atom.title ||
          existing.concept !== item.concept ||
          (existing.question ?? "") !== item.question ||
          existing.bloom_level !== bloomOf(item) ||
          existing.domain !== (atom.domain ?? existing.domain) ||
          existing.language !== (item.language ?? null) ||
          existing.tier !== (item.tier ?? null) ||
          existing.fast_check !== fastCheckOf(item);

        if (substanceChanged) {
          // Absent materiality means material: a published wording change that
          // nobody classified must re-test its learners rather than slip under
          // an existing stability.
          await publishTokenRevisionInTransaction(tx, {
            tokenId: item.id,
            materiality: item.materiality ?? "material",
            changes: {
              title: atom.title,
              question: item.question,
              concept: item.concept,
              domain: atom.domain ?? existing.domain,
              bloomLevel: bloomOf(item),
              language: item.language ?? null,
              tier: item.tier ?? null,
              fastCheck: fastCheckOf(item),
            },
            publishedBy: tile.publisher ?? tile.tile_id,
          });
          tokensRevised += 1;
        } else {
          tokensUnchanged += 1;
        }

        // Classification, not substance: never part of a content revision.
        await tx
          .prepare(
            `UPDATE tokens SET atom_id = ?, provider = ?, topic_id = ?
              WHERE id = ?`,
          )
          .run(
            atom.id,
            projected?.provider ?? existing.provider,
            projected?.topic_code ?? existing.topic_id,
            item.id,
          );
      }
    }

    // Re-project the legacy fields for every atom the tile touched: a binding
    // added above can change which one sorts first for an atom whose items
    // were written by an earlier install.
    for (const atom of tile.atoms) {
      const projected = await projectedBinding(tx, atom.id);
      if (!projected) continue;
      await tx
        .prepare(
          "UPDATE tokens SET provider = ?, topic_id = ? WHERE atom_id = ?",
        )
        .run(projected.provider, projected.topic_code, atom.id);
    }

    for (const atom of tile.atoms) {
      for (const prereq of atom.prerequisites ?? []) {
        const kind = prereq.type === "soft" ? "soft" : "hard";
        await tx
          .prepare(
            `INSERT INTO atom_prerequisites (atom_id, requires_id, kind, rationale)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(atom_id, requires_id) DO UPDATE SET
               kind = excluded.kind,
               rationale = excluded.rationale`,
          )
          .run(atom.id, prereq.atom_id, kind, prereq.rationale ?? null);
        atomPrereqs += 1;
      }
    }

    // Reconcile from the *stored* atom edges, not from the ones this tile
    // happens to declare: a tile that only adds a practice item to an atom can
    // still change which item represents it, and the edges derived from the
    // previous representative have to go with it.
    const touched = tile.atoms.map((atom) => atom.id);
    const placeholders = touched.map(() => "?").join(",");
    const affectedEdges = (await tx
      .prepare(
        `SELECT atom_id, requires_id FROM atom_prerequisites
          WHERE kind = 'hard'
            AND (atom_id IN (${placeholders}) OR requires_id IN (${placeholders}))
          ORDER BY atom_id, requires_id`,
      )
      .all(...touched, ...touched)) as Array<{
      atom_id: string;
      requires_id: string;
    }>;

    for (const edge of affectedEdges) {
      tokenPrereqs += await reconcileDerivedEdges(
        tx,
        edge.atom_id,
        edge.requires_id,
      );
    }

    return {
      tileId: tile.tile_id,
      version: tile.version,
      atomsUpserted: tile.atoms.length,
      tokensCreated,
      tokensRevised,
      tokensUnchanged,
      bindings,
      alignments,
      atomPrereqs,
      tokenPrereqs,
    };
  });
}

/**
 * Give `userId` cards for the practice items of `atomIds`.
 *
 * The deliberate second step: installing a release must not enrol anyone, so
 * a Realschule learner does not receive the Gymnasium 11 formula item that
 * ships in the same tile as their own atoms.
 */
export async function materialiseKvtCards(
  db: Database,
  userId: string,
  atomIds: string[],
): Promise<MaterialiseKvtResult> {
  if (!userId.trim()) {
    throw new Error("userId is required");
  }
  return db.transaction(async (tx) => {
    let cardsCreated = 0;
    let cardsReused = 0;
    for (const atomId of atomIds) {
      const items = (await tx
        .prepare("SELECT id FROM tokens WHERE atom_id = ? ORDER BY id")
        .all(atomId)) as Array<{ id: string }>;
      for (const item of items) {
        const before = await getCard(tx, item.id, userId);
        await ensureCard(tx, item.id, userId);
        if (before) cardsReused += 1;
        else cardsCreated += 1;
      }
    }
    return { cardsCreated, cardsReused };
  });
}
