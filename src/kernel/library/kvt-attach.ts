/**
 * Attach a published Knowledge Vector Tile to a learner.
 *
 * Writes atoms, alignments, overlay bindings and atom-level prerequisites
 * (shared knowledge). Each practice item becomes a token; each learner
 * gets a card. Existing FSRS state is never rewritten.
 *
 * ADR 2026-08-14. Token-level hard edges: every practice item of A
 * requires the first practice item of each hard-prerequisite atom
 * (tiles list Tier 1 first). Soft atom edges stay on the atom graph.
 */

import type { Database } from "../db/types.js";
import { ensureCard, getCard } from "../models/card.js";
import { addPrerequisite } from "../models/prerequisite.js";
import { type BloomLevel, getTokenById, insertToken } from "../models/token.js";

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
  language?: string;
  bloom_level: number;
  tier?: string;
  question: string;
  concept: string;
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
  atoms: KvtAtom[];
}

export interface AttachKvtResult {
  tileId: string;
  version: string;
  atomsUpserted: number;
  tokensCreated: number;
  tokensReused: number;
  cardsCreated: number;
  cardsReused: number;
  bindings: number;
  alignments: number;
  atomPrereqs: number;
  tokenPrereqs: number;
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

function slugForItem(atomId: string, item: KvtPracticeItem): string {
  const slug = atomId.slice("atom:zam:".length).replace(/:/g, "-");
  const tier = (item.tier ?? "item").replace(/_/g, "-");
  return `${slug}-${tier}`;
}

function firstBinding(atom: KvtAtom): KvtCurriculumBinding | undefined {
  return atom.curricula?.[0];
}

function bloomOf(item: KvtPracticeItem): BloomLevel {
  const level = item.bloom_level;
  if (level !== 1 && level !== 2 && level !== 3 && level !== 4 && level !== 5) {
    throw new Error(`bloom_level must be 1–5, got ${String(level)}`);
  }
  return level;
}

/**
 * Attach every atom and practice item in `tile` for `userId`.
 * Idempotent: a second call reuses tokens and cards and leaves FSRS alone.
 */
export async function attachKvtTile(
  db: Database,
  tileInput: unknown,
  userId: string,
): Promise<AttachKvtResult> {
  if (!userId.trim()) {
    throw new Error("userId is required");
  }
  const tile = asTile(tileInput);
  const atomIds = new Set(tile.atoms.map((atom) => atom.id));
  for (const atom of tile.atoms) {
    assertAtomId(atom.id);
    if (!atom.title?.trim()) {
      throw new Error(`Atom ${atom.id} needs a title`);
    }
    if (!atom.practice_items?.length) {
      throw new Error(`Atom ${atom.id} needs at least one practice item`);
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
    let tokensReused = 0;
    let cardsCreated = 0;
    let cardsReused = 0;
    let bindings = 0;
    let alignments = 0;
    let atomPrereqs = 0;
    let tokenPrereqs = 0;

    const tokensByAtom = new Map<string, string[]>();

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
        await tx
          .prepare(
            `INSERT INTO atom_curriculum_bindings
               (atom_id, provider, school_type, grade, track, subject,
                topic_code, topic_title, exam_relevant)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(atom_id, provider, topic_code, grade, track) DO UPDATE SET
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

      const itemIds: string[] = [];
      const binding = firstBinding(atom);
      for (const item of atom.practice_items) {
        const existing = await getTokenById(tx, item.id);
        if (existing) {
          await tx
            .prepare(
              `UPDATE tokens
                  SET title = ?, concept = ?, question = ?, bloom_level = ?,
                      domain = ?, atom_id = ?, provider = ?, topic_id = ?,
                      updated_at = ?
                WHERE id = ?`,
            )
            .run(
              atom.title,
              item.concept,
              item.question,
              bloomOf(item),
              atom.domain ?? existing.domain,
              atom.id,
              binding?.provider ?? existing.provider,
              binding?.topic_code ?? existing.topic_id,
              now,
              item.id,
            );
          tokensReused += 1;
        } else {
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
            provider: binding?.provider ?? null,
            topic_id: binding?.topic_code ?? null,
          });
          tokensCreated += 1;
        }
        itemIds.push(item.id);

        const before = await getCard(tx, item.id, userId);
        await ensureCard(tx, item.id, userId);
        if (before) cardsReused += 1;
        else cardsCreated += 1;
      }
      tokensByAtom.set(atom.id, itemIds);
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

    for (const atom of tile.atoms) {
      const childIds = tokensByAtom.get(atom.id) ?? [];
      for (const prereq of atom.prerequisites ?? []) {
        if (prereq.type === "soft") continue;
        const parentRep = tokensByAtom.get(prereq.atom_id)?.[0];
        if (!parentRep) continue;
        for (const childId of childIds) {
          await addPrerequisite(tx, childId, parentRep);
          tokenPrereqs += 1;
        }
      }
    }

    return {
      tileId: tile.tile_id,
      version: tile.version,
      atomsUpserted: tile.atoms.length,
      tokensCreated,
      tokensReused,
      cardsCreated,
      cardsReused,
      bindings,
      alignments,
      atomPrereqs,
      tokenPrereqs,
    };
  });
}
