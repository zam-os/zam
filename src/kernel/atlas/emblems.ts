/**
 * Storing and resolving Sinnbilder (ADR 2026-10-13, Decision 6).
 *
 * - **Shared first, personal override.** The first Sinnbild of a subject is
 *   shared when its writer may write knowledge (the learner on a library of
 *   their own, a curator on a team library). Otherwise it is personal. A
 *   learner may always set their own, which only they see.
 * - **Every write validates** and stores the canonical form only, with the
 *   validator version. `revalidateEmblems` re-checks older rows after the
 *   rules tighten; a row that no longer passes is dropped.
 * - **Resolution:** the learner's own, then the library's, then the seed. A
 *   leaf region without any shows its first unit's (`readAtlas` does that, as
 *   it knows the units).
 * - A library's shared Sinnbild stays in that library. There is no upload
 *   path, and none may be added.
 */

import { nowIso } from "../db/sql.js";
import type { Database } from "../db/types.js";
import {
  EMBLEM_VALIDATOR_VERSION,
  glyphEmblemSvg,
  validateEmblem,
  validateGlyph,
} from "./emblem.js";
import { CUSTOM_LENS_KIND, resolveLensKind } from "./lenses.js";
import type { LensKind } from "./types.js";
import { seedEmblem, seedSubjectEmblem } from "./weltwissen-emblems.js";

export type EmblemScope = "auto" | "personal" | "shared";
/** Who wrote a shared row: an agent through a tool, or a person in the Studio. */
export type EmblemAuthor = "agent" | "curator";
export type EmblemSource = "personal" | "shared" | "seed";

export interface ResolvedEmblem {
  /** The canonical SVG. */
  svg: string;
  glyph: string | null;
  source: EmblemSource;
}

export type EmblemErrorCode =
  | "invalid"
  | "missing"
  | "not-curator"
  | "unknown-subject";

export class EmblemError extends Error {
  constructor(
    readonly code: EmblemErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "EmblemError";
  }
}

const REGION_KEY = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;
const MAX_KEY = 300;

/** The subject key of a region's Sinnbild. */
export function regionEmblemKey(lens: LensKind, regionKey: string): string {
  return `region:${lens}:${regionKey}`;
}

/**
 * The subject key of a Fach's Sinnbild, by its subject (hue) key. A Fach is
 * the same in every lens: Mathematik of the 9th grade and Mathematik in
 * Weltwissen share one Sinnbild.
 */
export function subjectEmblemKey(subjectKey: string): string {
  return `subject:${subjectKey}`;
}

export type EmblemSubject =
  | { kind: "atom" | "token"; id: string }
  | { kind: "subject"; key: string }
  | { kind: "region"; lens: LensKind; regionKey: string };

/** What a subject key names, or null when it is not one. */
export function parseEmblemSubject(key: string): EmblemSubject | null {
  if (typeof key !== "string" || key.length > MAX_KEY) return null;
  const unit = /^(atom|token):([A-Za-z0-9_-]+)$/.exec(key);
  if (unit) return { kind: unit[1] as "atom" | "token", id: unit[2] };
  const subject = /^subject:([a-z0-9][a-z0-9-]{0,80})$/.exec(key);
  if (subject) return { kind: "subject", key: subject[1] };
  // Every lens kind, built-in or custom, has the custom kind's slug form.
  const region = /^region:([^:]+):(.+)$/.exec(key);
  if (
    region &&
    CUSTOM_LENS_KIND.test(region[1]) &&
    REGION_KEY.test(region[2])
  ) {
    return {
      kind: "region",
      lens: region[1] as LensKind,
      regionKey: region[2],
    };
  }
  return null;
}

/**
 * A unit must exist, and a region's lens: built-in or a custom lens of this
 * library. A region key needs only the right form (it may be derived).
 */
async function assertSubject(db: Database, key: string): Promise<void> {
  const subject = parseEmblemSubject(key);
  if (!subject) {
    throw new EmblemError(
      "unknown-subject",
      `"${key}" names no unit or region. Use atom:<id>, token:<id>, subject:<fach> or region:<lens>:<key>.`,
    );
  }
  if (subject.kind === "subject") return;
  if (subject.kind === "region") {
    if (!(await resolveLensKind(db, subject.lens))) {
      throw new EmblemError(
        "unknown-subject",
        `"${key}" names a region of no lens this library has.`,
      );
    }
    return;
  }
  const row = await db
    .prepare(
      subject.kind === "atom"
        ? "SELECT 1 FROM learning_atoms WHERE id = ?"
        : "SELECT 1 FROM tokens WHERE id = ?",
    )
    .get(subject.id);
  if (!row) {
    throw new EmblemError("unknown-subject", `No unit ${key} in this library.`);
  }
}

export interface SetEmblemInput {
  subjectKey: string;
  /** The SVG; without it, a glyph alone becomes a Sinnbild of its own. */
  svg?: string | null;
  glyph?: string | null;
  userId: string;
  /** Whether this connection may write knowledge (`mayWriteKnowledge`). */
  mayWriteKnowledge: boolean;
  scope?: EmblemScope;
  author?: EmblemAuthor;
  now?: Date;
}

export interface SetEmblemResult {
  scope: "personal" | "shared";
  subjectKey: string;
  svg: string;
  glyph: string | null;
}

/**
 * Store a Sinnbild. `auto` (the default) writes the shared one when none
 * exists yet and the writer may write knowledge, and the writer's own
 * otherwise. `shared` without that right refuses.
 */
export async function setEmblem(
  db: Database,
  input: SetEmblemInput,
): Promise<SetEmblemResult> {
  const scope = input.scope ?? "auto";
  const svgInput = input.svg?.trim() ? input.svg : null;
  let svg: string;
  if (svgInput) {
    svg = svgInput;
  } else {
    const glyph = validateGlyph(input.glyph);
    if (!glyph.ok) throw new EmblemError("invalid", glyph.error);
    if (!glyph.glyph) {
      throw new EmblemError("missing", "A Sinnbild needs an SVG or a glyph.");
    }
    svg = glyphEmblemSvg(glyph.glyph);
  }
  const checked = validateEmblem(svg, input.glyph);
  if (!checked.ok) throw new EmblemError("invalid", checked.error);
  await assertSubject(db, input.subjectKey);
  if (scope === "shared" && !input.mayWriteKnowledge) {
    throw new EmblemError(
      "not-curator",
      "Only someone who may write this library's knowledge sets a shared Sinnbild.",
    );
  }
  const shared =
    scope === "shared" ||
    (scope === "auto" &&
      input.mayWriteKnowledge &&
      !(await db
        .prepare("SELECT 1 FROM emblems WHERE subject_key = ?")
        .get(input.subjectKey)));
  const now = nowIso(input.now);
  if (shared) {
    await db
      .prepare(
        `INSERT INTO emblems (subject_key, svg, validator_version, glyph, author, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (subject_key) DO UPDATE SET
           svg = excluded.svg,
           validator_version = excluded.validator_version,
           glyph = excluded.glyph,
           author = excluded.author,
           updated_at = excluded.updated_at`,
      )
      .run(
        input.subjectKey,
        checked.canonical,
        EMBLEM_VALIDATOR_VERSION,
        checked.glyph,
        input.author ?? "agent",
        now,
      );
  } else {
    await db
      .prepare(
        `INSERT INTO learner_emblems (user_id, subject_key, svg, validator_version, glyph, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (user_id, subject_key) DO UPDATE SET
           svg = excluded.svg,
           validator_version = excluded.validator_version,
           glyph = excluded.glyph,
           updated_at = excluded.updated_at`,
      )
      .run(
        input.userId,
        input.subjectKey,
        checked.canonical,
        EMBLEM_VALIDATOR_VERSION,
        checked.glyph,
        now,
      );
  }
  return {
    scope: shared ? "shared" : "personal",
    subjectKey: input.subjectKey,
    svg: checked.canonical,
    glyph: checked.glyph,
  };
}

/** Remove the learner's own Sinnbild; the shared one shows again. */
export async function clearPersonalEmblem(
  db: Database,
  userId: string,
  subjectKey: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      "DELETE FROM learner_emblems WHERE user_id = ? AND subject_key = ?",
    )
    .run(userId, subjectKey);
  return result.changes > 0;
}

/** Remove the library's Sinnbild; only someone who may write knowledge. */
export async function clearSharedEmblem(
  db: Database,
  subjectKey: string,
  mayWriteKnowledge: boolean,
): Promise<boolean> {
  if (!mayWriteKnowledge) {
    throw new EmblemError(
      "not-curator",
      "Only someone who may write this library's knowledge removes a shared Sinnbild.",
    );
  }
  const result = await db
    .prepare("DELETE FROM emblems WHERE subject_key = ?")
    .run(subjectKey);
  return result.changes > 0;
}

interface EmblemRow {
  subject_key: string;
  svg: string;
  validator_version: number;
  glyph: string | null;
}

/** A stored row as shown: re-checked in memory when an older validator wrote it. */
function shown(row: EmblemRow): { svg: string; glyph: string | null } | null {
  if (Number(row.validator_version) >= EMBLEM_VALIDATOR_VERSION) {
    return { svg: row.svg, glyph: row.glyph };
  }
  const checked = validateEmblem(row.svg, row.glyph);
  return checked.ok ? { svg: checked.canonical, glyph: checked.glyph } : null;
}

const CHUNK = 400;

async function rowsFor(
  db: Database,
  sql: (marks: string) => string,
  keys: string[],
  leading: unknown[] = [],
): Promise<EmblemRow[]> {
  const rows: EmblemRow[] = [];
  for (let i = 0; i < keys.length; i += CHUNK) {
    const chunk = keys.slice(i, i + CHUNK);
    rows.push(
      ...((await db
        .prepare(sql(chunk.map(() => "?").join(", ")))
        .all(...leading, ...chunk)) as EmblemRow[]),
    );
  }
  return rows;
}

/** The seed's Sinnbild of a region key, validated like any other. */
function seedFor(key: string): ResolvedEmblem | null {
  const subject = parseEmblemSubject(key);
  const seed =
    subject?.kind === "region"
      ? seedEmblem(subject.lens, subject.regionKey)
      : subject?.kind === "subject"
        ? seedSubjectEmblem(subject.key)
        : undefined;
  if (!seed) return null;
  const checked = validateEmblem(seed.svg, seed.glyph);
  return checked.ok
    ? { svg: checked.canonical, glyph: checked.glyph, source: "seed" }
    : null;
}

/**
 * The Sinnbild each subject shows to this learner: their own, the library's,
 * or the seed's. Subjects without any are absent from the map.
 */
export async function resolveEmblems(
  db: Database,
  userId: string,
  subjectKeys: Iterable<string>,
): Promise<Map<string, ResolvedEmblem>> {
  const keys = [...new Set(subjectKeys)];
  const resolved = new Map<string, ResolvedEmblem>();
  if (keys.length === 0) return resolved;
  const personal = await rowsFor(
    db,
    (marks) =>
      `SELECT subject_key, svg, validator_version, glyph FROM learner_emblems
        WHERE user_id = ? AND subject_key IN (${marks})`,
    keys,
    [userId],
  );
  for (const row of personal) {
    const emblem = shown(row);
    if (emblem)
      resolved.set(row.subject_key, { ...emblem, source: "personal" });
  }
  const open = keys.filter((key) => !resolved.has(key));
  const shared = await rowsFor(
    db,
    (marks) =>
      `SELECT subject_key, svg, validator_version, glyph FROM emblems
        WHERE subject_key IN (${marks})`,
    open,
  );
  for (const row of shared) {
    const emblem = shown(row);
    if (emblem) resolved.set(row.subject_key, { ...emblem, source: "shared" });
  }
  for (const key of keys) {
    if (resolved.has(key)) continue;
    const seed = seedFor(key);
    if (seed) resolved.set(key, seed);
  }
  return resolved;
}

/** One subject's Sinnbild for this learner, or null. */
export async function resolveEmblem(
  db: Database,
  subjectKey: string,
  userId: string,
): Promise<ResolvedEmblem | null> {
  return (
    (await resolveEmblems(db, userId, [subjectKey])).get(subjectKey) ?? null
  );
}

/** Which of these subjects hold a shared Sinnbild of the library (not the seed). */
export async function sharedEmblemKeys(
  db: Database,
  subjectKeys: Iterable<string>,
): Promise<Set<string>> {
  const rows = await rowsFor(
    db,
    (marks) =>
      `SELECT subject_key, svg, validator_version, glyph FROM emblems
        WHERE subject_key IN (${marks})`,
    [...new Set(subjectKeys)],
  );
  return new Set(rows.map((row) => row.subject_key));
}

export interface RevalidateResult {
  checked: number;
  rewritten: number;
  dropped: number;
}

/**
 * Re-check the rows an older validator wrote: the learner's own always, the
 * library's only with the right to write knowledge. A row that passes is
 * stored again in today's canonical form; one that fails is dropped, and the
 * subject falls back to the next source.
 */
export async function revalidateEmblems(
  db: Database,
  options: { userId: string; shared: boolean },
): Promise<RevalidateResult> {
  const result: RevalidateResult = { checked: 0, rewritten: 0, dropped: 0 };
  const tables: Array<{ table: string; where: string; args: unknown[] }> = [
    {
      table: "learner_emblems",
      where: "user_id = ? AND",
      args: [options.userId],
    },
  ];
  if (options.shared) tables.push({ table: "emblems", where: "", args: [] });
  for (const { table, where, args } of tables) {
    const rows = (await db
      .prepare(
        `SELECT subject_key, svg, validator_version, glyph FROM ${table}
          WHERE ${where} validator_version < ?`,
      )
      .all(...args, EMBLEM_VALIDATOR_VERSION)) as EmblemRow[];
    for (const row of rows) {
      result.checked += 1;
      const checked = validateEmblem(row.svg, row.glyph);
      if (checked.ok) {
        await db
          .prepare(
            `UPDATE ${table} SET svg = ?, glyph = ?, validator_version = ?
              WHERE ${where} subject_key = ?`,
          )
          .run(
            checked.canonical,
            checked.glyph,
            EMBLEM_VALIDATOR_VERSION,
            ...args,
            row.subject_key,
          );
        result.rewritten += 1;
      } else {
        await db
          .prepare(`DELETE FROM ${table} WHERE ${where} subject_key = ?`)
          .run(...args, row.subject_key);
        result.dropped += 1;
      }
    }
  }
  return result;
}
