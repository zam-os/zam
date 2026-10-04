/**
 * Repo knowledge map — the model shared by the CLI validator and the Studio's
 * map views (ADR 2026-10-03).
 *
 * A map is a tree of one-sentence statements (each statement names its
 * `parent`, which reads as "in detail") plus typed cross-links between any two
 * statements. Pure by design: no Node built-ins and no DOM, so
 * `desktop/src/knowledge-map/` imports it directly, the way the Studio imports
 * kernel helpers. Checking that sources exist on disk is injected
 * (`sourceExists`); `./load.ts` supplies it for the CLI.
 */

export const KNOWLEDGE_MAP_FORMAT = "zam-knowledge-map";
export const KNOWLEDGE_MAP_VERSION = 1;
/** Roughly one statement per node: a single sentence of at most this length. */
export const MAX_STATEMENT_LENGTH = 140;
/** Above this many children a level no longer fits in working memory. */
export const SOFT_MAX_CHILDREN = 7;
/** The concept-map view shows this instead of the whole sentence. */
export const MAX_CONCEPT_LABEL_WORDS = 4;
export const MAX_CONCEPT_LABEL_LENGTH = 40;
/** Verb phrase on a concept-map edge, in the stored direction. */
export const MAX_LINK_PHRASE_WORDS = 6;
export const MAX_LINK_PHRASE_LENGTH = 48;

/** Kinds a cross-link may carry. The tree's own edge is `elaborates`. */
export const RELATION_KINDS = [
  "requires",
  "leads_to",
  "because",
  "instead_of",
  "example",
] as const;

export type RelationKind = (typeof RELATION_KINDS)[number];
export type EdgeKind = "elaborates" | RelationKind;

export interface KnowledgeStatement {
  id: string;
  /** The statement this one spells out in detail; absent only on the root. */
  parent?: string;
  /**
   * Short concept for the concept-map view. Without it that view skips the node.
   */
  label?: string;
  /**
   * Linking phrase from the parent to this concept. The concept-map view
   * draws the edge only when this, or a relation `link`, is present.
   */
  link?: string;
  text: string;
  /** Repository-relative paths, optionally with a `#anchor`. */
  sources: string[];
}

export interface KnowledgeRelation {
  from: string;
  to: string;
  kind: RelationKind;
  /** Linking phrase from `from` to `to` for the concept-map view. */
  link?: string;
}

export interface KnowledgeMap {
  format: typeof KNOWLEDGE_MAP_FORMAT;
  version: typeof KNOWLEDGE_MAP_VERSION;
  title: string;
  focus_question: string;
  language?: string;
  /** Base URL a source path is appended to, e.g. a GitHub `blob/main/` URL. */
  repository_url?: string;
  root: string;
  statements: KnowledgeStatement[];
  relations: KnowledgeRelation[];
}

export interface MapIssue {
  level: "error" | "warning";
  message: string;
  id?: string;
}

export interface ValidateOptions {
  /** Return false when a repository-relative path (without anchor) is missing. */
  sourceExists?: (path: string) => boolean;
}

export interface ValidationResult {
  /** The map when there is no error; warnings alone do not reject it. */
  map: KnowledgeMap | null;
  issues: MapIssue[];
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** A short concept-map phrase, or an error message. */
function shortPhrase(
  value: unknown,
  maxWords: number,
  maxLength: number,
): { text: string } | { error: string } {
  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    /[\r\n]/.test(value)
  ) {
    return { error: "must be a single non-empty line" };
  }
  const text = value.trim();
  if (text.length > maxLength || text.split(/\s+/).length > maxWords) {
    return {
      error: `is at most ${maxWords} words and ${maxLength} characters`,
    };
  }
  return { text };
}

/** The path part of a source, without its `#anchor`. */
export function sourcePath(source: string): string {
  const hash = source.indexOf("#");
  return hash === -1 ? source : source.slice(0, hash);
}

function sourceProblem(source: string): string | null {
  const path = sourcePath(source);
  if (path.length === 0) return "is empty";
  if (path.includes("://")) return "must be a repository path, not a URL";
  if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) {
    return "must be relative to the repository root";
  }
  if (path.split(/[\\/]/).includes(".."))
    return "must not leave the repository";
  return null;
}

export function validateKnowledgeMap(
  input: unknown,
  options: ValidateOptions = {},
): ValidationResult {
  const issues: MapIssue[] = [];
  const error = (message: string, id?: string) =>
    issues.push({ level: "error", message, ...(id ? { id } : {}) });
  const warn = (message: string, id?: string) =>
    issues.push({ level: "warning", message, ...(id ? { id } : {}) });

  if (!isRecord(input)) {
    error("The map must be a JSON object.");
    return { map: null, issues };
  }
  if (input.format !== KNOWLEDGE_MAP_FORMAT) {
    error(`"format" must be "${KNOWLEDGE_MAP_FORMAT}".`);
  }
  if (input.version !== KNOWLEDGE_MAP_VERSION) {
    error(`"version" must be ${KNOWLEDGE_MAP_VERSION}.`);
  }
  if (!nonEmptyString(input.title))
    error('"title" must be a non-empty string.');
  if (!nonEmptyString(input.focus_question)) {
    error('"focus_question" must be a non-empty string.');
  }
  if (
    input.repository_url !== undefined &&
    !(
      typeof input.repository_url === "string" &&
      input.repository_url.startsWith("https://")
    )
  ) {
    error('"repository_url" must be an https:// URL.');
  }
  if (!Array.isArray(input.statements) || input.statements.length === 0) {
    error('"statements" must be a non-empty array.');
    return { map: null, issues };
  }
  if (!Array.isArray(input.relations)) {
    error('"relations" must be an array.');
    return { map: null, issues };
  }

  const byId = new Map<string, KnowledgeStatement>();
  for (const raw of input.statements as unknown[]) {
    if (!isRecord(raw) || !nonEmptyString(raw.id)) {
      error("Every statement needs a string id.");
      continue;
    }
    const id = raw.id;
    if (!SLUG.test(id)) error(`Id "${id}" must be a lowercase slug.`, id);
    if (byId.has(id)) error(`Id "${id}" is used twice.`, id);

    if (!nonEmptyString(raw.text)) {
      error("The statement text is empty.", id);
    } else {
      if (raw.text.length > MAX_STATEMENT_LENGTH) {
        error(
          `The statement has ${raw.text.length} characters; the limit is ${MAX_STATEMENT_LENGTH}.`,
          id,
        );
      }
      if (/[\r\n]/.test(raw.text))
        error("The statement spans several lines.", id);
    }

    if (
      !Array.isArray(raw.sources) ||
      raw.sources.length === 0 ||
      !raw.sources.every(nonEmptyString)
    ) {
      error("Every statement needs at least one source.", id);
    } else {
      for (const source of raw.sources as string[]) {
        const problem = sourceProblem(source);
        if (problem) {
          error(`Source "${source}" ${problem}.`, id);
        } else if (
          options.sourceExists &&
          !options.sourceExists(sourcePath(source))
        ) {
          error(`Source "${source}" does not exist in the repository.`, id);
        }
      }
    }
    if (raw.parent !== undefined && !nonEmptyString(raw.parent)) {
      error('"parent" must be a statement id.', id);
    }
    let label: string | undefined;
    if (raw.label !== undefined) {
      const parsed = shortPhrase(
        raw.label,
        MAX_CONCEPT_LABEL_WORDS,
        MAX_CONCEPT_LABEL_LENGTH,
      );
      if ("error" in parsed) error(`The concept label ${parsed.error}.`, id);
      else label = parsed.text;
    }
    let link: string | undefined;
    if (raw.link !== undefined) {
      const parsed = shortPhrase(
        raw.link,
        MAX_LINK_PHRASE_WORDS,
        MAX_LINK_PHRASE_LENGTH,
      );
      if ("error" in parsed) error(`The linking phrase ${parsed.error}.`, id);
      else link = parsed.text;
    }

    byId.set(id, {
      id,
      ...(nonEmptyString(raw.parent) ? { parent: raw.parent } : {}),
      ...(label ? { label } : {}),
      ...(link ? { link } : {}),
      text: nonEmptyString(raw.text) ? raw.text : "",
      sources: Array.isArray(raw.sources) ? (raw.sources as string[]) : [],
    });
  }

  const root = input.root;
  if (!nonEmptyString(root) || !byId.has(root)) {
    error('"root" must name a statement.');
  } else if (byId.get(root)?.parent !== undefined) {
    error("The root statement must not have a parent.", root);
  }

  const children = new Map<string, string[]>();
  for (const statement of byId.values()) {
    if (statement.id === root) continue;
    if (statement.parent === undefined) {
      error("Every statement except the root needs a parent.", statement.id);
      continue;
    }
    if (!byId.has(statement.parent)) {
      error(`Parent "${statement.parent}" does not exist.`, statement.id);
      continue;
    }
    const siblings = children.get(statement.parent) ?? [];
    siblings.push(statement.id);
    children.set(statement.parent, siblings);
  }

  // Everything must hang below the root; this also rules out parent cycles.
  if (nonEmptyString(root) && byId.has(root)) {
    const reached = new Set<string>([root]);
    const stack = [root];
    while (stack.length > 0) {
      const id = stack.pop() as string;
      for (const child of children.get(id) ?? []) {
        if (!reached.has(child)) {
          reached.add(child);
          stack.push(child);
        }
      }
    }
    for (const id of byId.keys()) {
      if (!reached.has(id)) {
        error("The statement cannot be reached from the root.", id);
      }
    }
  }
  for (const [parent, list] of children) {
    if (list.length > SOFT_MAX_CHILDREN) {
      warn(
        `${list.length} statements spell this one out; more than ${SOFT_MAX_CHILDREN} is hard to take in.`,
        parent,
      );
    }
  }

  const relations: KnowledgeRelation[] = [];
  const pairs = new Set<string>();
  for (const raw of input.relations as unknown[]) {
    if (!isRecord(raw)) {
      error("Every relation must be an object.");
      continue;
    }
    const { from, to, kind } = raw;
    if (!nonEmptyString(from) || !byId.has(from)) {
      error(`Relation source "${String(from)}" does not exist.`);
      continue;
    }
    if (!nonEmptyString(to) || !byId.has(to)) {
      error(`Relation target "${String(to)}" does not exist.`, from);
      continue;
    }
    if (from === to) {
      error("A relation must join two different statements.", from);
      continue;
    }
    if (!RELATION_KINDS.includes(kind as RelationKind)) {
      error(
        `Relation kind "${String(kind)}" is not one of ${RELATION_KINDS.join(", ")}.`,
        from,
      );
      continue;
    }
    const pair = [from, to].sort().join("\u0000");
    if (pairs.has(pair)) {
      error(`"${from}" and "${to}" are joined twice.`, from);
      continue;
    }
    pairs.add(pair);
    let link: string | undefined;
    if (raw.link !== undefined) {
      const parsed = shortPhrase(
        raw.link,
        MAX_LINK_PHRASE_WORDS,
        MAX_LINK_PHRASE_LENGTH,
      );
      if ("error" in parsed) {
        error(`The linking phrase ${parsed.error}.`, from);
      } else {
        link = parsed.text;
      }
    }
    relations.push({
      from,
      to,
      kind: kind as RelationKind,
      ...(link ? { link } : {}),
    });
  }

  if (issues.some((issue) => issue.level === "error")) {
    return { map: null, issues };
  }
  return {
    map: {
      format: KNOWLEDGE_MAP_FORMAT,
      version: KNOWLEDGE_MAP_VERSION,
      title: (input.title as string).trim(),
      focus_question: (input.focus_question as string).trim(),
      ...(nonEmptyString(input.language) ? { language: input.language } : {}),
      ...(typeof input.repository_url === "string"
        ? { repository_url: input.repository_url }
        : {}),
      root: root as string,
      statements: [...byId.values()],
      relations,
    },
    issues,
  };
}

// ── Navigation index ─────────────────────────────────────────────────────

/**
 * One edge seen from a statement: `direction` "out" reads focus → neighbour
 * ("A because B"), "in" reads the other way round. `tree` marks the parent
 * and the children; a cross-link between a statement and its parent or child
 * gives that tree edge its more specific kind.
 */
export interface Neighbor {
  id: string;
  kind: EdgeKind;
  direction: "out" | "in";
  tree: "parent" | "child" | null;
}

export interface MapIndex {
  map: KnowledgeMap;
  get(id: string): KnowledgeStatement | undefined;
  has(id: string): boolean;
  children(id: string): string[];
  parent(id: string): string | undefined;
  depth(id: string): number;
  /** Root first, the statement itself last. */
  pathTo(id: string): string[];
  neighbors(id: string): Neighbor[];
  /** Every statement in depth-first order, root first. */
  order(): string[];
  /** Absolute URL for a source, when the map names a repository URL. */
  sourceUrl(source: string): string | null;
}

export function buildMapIndex(map: KnowledgeMap): MapIndex {
  const byId = new Map(map.statements.map((s) => [s.id, s]));
  const children = new Map<string, string[]>();
  for (const statement of map.statements) {
    if (statement.parent === undefined) continue;
    const list = children.get(statement.parent) ?? [];
    list.push(statement.id);
    children.set(statement.parent, list);
  }
  const depth = new Map<string, number>();
  const order: string[] = [];
  const walk = (id: string, level: number) => {
    depth.set(id, level);
    order.push(id);
    for (const child of children.get(id) ?? []) walk(child, level + 1);
  };
  walk(map.root, 0);

  const crossOf = new Map<string, KnowledgeRelation[]>();
  for (const relation of map.relations) {
    for (const end of [relation.from, relation.to]) {
      const list = crossOf.get(end) ?? [];
      list.push(relation);
      crossOf.set(end, list);
    }
  }

  const relationBetween = (a: string, b: string) =>
    (crossOf.get(a) ?? []).find(
      (r) => (r.from === a && r.to === b) || (r.from === b && r.to === a),
    );

  const neighbors = (id: string): Neighbor[] => {
    const result: Neighbor[] = [];
    const seen = new Set<string>();
    const parent = byId.get(id)?.parent;
    const fromTree = (other: string, tree: "parent" | "child"): Neighbor => {
      const relation = relationBetween(id, other);
      if (relation) {
        return {
          id: other,
          kind: relation.kind,
          direction: relation.from === id ? "out" : "in",
          tree,
        };
      }
      return {
        id: other,
        kind: "elaborates",
        direction: tree === "child" ? "out" : "in",
        tree,
      };
    };
    if (parent !== undefined && byId.has(parent)) {
      result.push(fromTree(parent, "parent"));
      seen.add(parent);
    }
    for (const child of children.get(id) ?? []) {
      result.push(fromTree(child, "child"));
      seen.add(child);
    }
    for (const relation of crossOf.get(id) ?? []) {
      const other = relation.from === id ? relation.to : relation.from;
      if (seen.has(other)) continue;
      seen.add(other);
      result.push({
        id: other,
        kind: relation.kind,
        direction: relation.from === id ? "out" : "in",
        tree: null,
      });
    }
    return result;
  };

  const base = map.repository_url;
  return {
    map,
    get: (id) => byId.get(id),
    has: (id) => byId.has(id),
    children: (id) => children.get(id) ?? [],
    parent: (id) => byId.get(id)?.parent,
    depth: (id) => depth.get(id) ?? 0,
    pathTo: (id) => {
      const path: string[] = [];
      let current: string | undefined = id;
      const guard = new Set<string>();
      while (
        current !== undefined &&
        byId.has(current) &&
        !guard.has(current)
      ) {
        guard.add(current);
        path.unshift(current);
        current = byId.get(current)?.parent;
      }
      return path;
    },
    neighbors,
    order: () => [...order],
    sourceUrl: (source) => {
      if (!base) return null;
      return `${base.endsWith("/") ? base : `${base}/`}${source}`;
    },
  };
}
