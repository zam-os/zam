/**
 * Repo knowledge map — the model shared by the CLI validator and the Studio's
 * map views (ADR 2026-10-03).
 *
 * A map is a tree of one-sentence statements (each statement names its
 * `parent`, which reads as "in detail") plus typed cross-links between any two
 * statements. A statement may also be a C4 architecture element, and the file
 * is JSON-LD, so RDF tools can read it as a graph. Pure by design: no Node built-ins and no DOM, so
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
  "uses",
] as const;

export type RelationKind = (typeof RELATION_KINDS)[number];
export type EdgeKind = "elaborates" | RelationKind;

/** C4 element kinds; a database is a container drawn as a data store. */
export const C4_KINDS = [
  "person",
  "system",
  "container",
  "database",
  "component",
] as const;

export type C4Kind = (typeof C4_KINDS)[number];

export const MAX_C4_NAME_LENGTH = 40;
export const MAX_TECHNOLOGY_LENGTH = 60;

/**
 * Makes a statement a C4 element. The statement text is the element's
 * one-sentence description.
 */
export interface C4Facet {
  kind: C4Kind;
  /** Element name drawn in the box; defaults to the statement's `label`. */
  name?: string;
  technology?: string;
  /** Outside the system being described (another system, a hosted service). */
  external?: boolean;
  /**
   * The element this one sits in: a system for a container or database, a
   * container or database for a component. Defaults to the nearest such
   * ancestor in the statement tree.
   */
  within?: string;
}

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
  c4?: C4Facet;
}

export interface KnowledgeRelation {
  from: string;
  to: string;
  kind: RelationKind;
  /**
   * Linking phrase from `from` to `to`, e.g. "stores cards in". The concept
   * map reads it between the two labels; C4 draws it on the arrow.
   */
  link?: string;
  /** How the link is made, e.g. "MCP over stdio". */
  technology?: string;
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

/** Where the published JSON Schema for map files lives. */
export const KNOWLEDGE_MAP_SCHEMA_URL =
  "https://raw.githubusercontent.com/zam-os/zam/main/docs/knowledge-map/map.schema.json";

/**
 * JSON-LD context written into every map (ADR 2026-10-03, Decision 7). It
 * reads the map as RDF without changing its JSON: the tree as SKOS
 * `broader`, short labels as SKOS `prefLabel`, sources as Dublin Core
 * `source`, everything else in ZAM's own vocabulary. Ids are relative IRIs, resolved against the file's location.
 */
export const KNOWLEDGE_MAP_CONTEXT = {
  "@vocab": "https://zam-os.org/ns/knowledge-map#",
  skos: "http://www.w3.org/2004/02/skos/core#",
  dcterms: "http://purl.org/dc/terms/",
  $schema: null,
  id: "@id",
  title: "dcterms:title",
  language: "dcterms:language",
  repository_url: { "@id": "repositoryUrl", "@type": "@id" },
  focus_question: "focusQuestion",
  root: { "@id": "skos:hasTopConcept", "@type": "@id" },
  statements: { "@id": "statement", "@container": "@set" },
  parent: { "@id": "skos:broader", "@type": "@id" },
  label: "skos:prefLabel",
  sources: { "@id": "dcterms:source", "@container": "@set" },
  c4: "c4",
  kind: { "@id": "kind", "@type": "@vocab" },
  within: { "@id": "within", "@type": "@id" },
  relations: { "@id": "relation", "@container": "@set" },
  from: { "@id": "from", "@type": "@id" },
  to: { "@id": "to", "@type": "@id" },
} as const;

/** The map as written to disk: schema link and JSON-LD context first. */
export function toKnowledgeMapDocument(
  map: KnowledgeMap,
): Record<string, unknown> {
  return {
    $schema: KNOWLEDGE_MAP_SCHEMA_URL,
    "@context": KNOWLEDGE_MAP_CONTEXT,
    ...map,
  };
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

/** A trimmed single line within `max` characters, else null. */
function shortLine(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max || /[\r\n]/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function parseC4(
  raw: unknown,
  id: string,
  error: (message: string, id?: string) => void,
): C4Facet | undefined {
  if (!isRecord(raw)) {
    error('"c4" must be an object.', id);
    return undefined;
  }
  if (!C4_KINDS.includes(raw.kind as C4Kind)) {
    error(`"c4.kind" must be one of ${C4_KINDS.join(", ")}.`, id);
    return undefined;
  }
  const kind = raw.kind as C4Kind;
  const facet: C4Facet = { kind };
  if (raw.name !== undefined) {
    const name = shortLine(raw.name, MAX_C4_NAME_LENGTH);
    if (name === null) {
      error(
        `"c4.name" is one line of at most ${MAX_C4_NAME_LENGTH} characters.`,
        id,
      );
      return undefined;
    }
    facet.name = name;
  }
  if (raw.technology !== undefined) {
    const technology = shortLine(raw.technology, MAX_TECHNOLOGY_LENGTH);
    if (technology === null) {
      error(
        `"c4.technology" is one line of at most ${MAX_TECHNOLOGY_LENGTH} characters.`,
        id,
      );
    } else {
      facet.technology = technology;
    }
  }
  if (raw.external !== undefined) {
    if (typeof raw.external !== "boolean") {
      error('"c4.external" must be true or false.', id);
    } else if (raw.external) {
      facet.external = true;
    }
  }
  if (raw.within !== undefined) {
    if (!nonEmptyString(raw.within)) {
      error('"c4.within" must be a statement id.', id);
    } else if (!needsHost(facet)) {
      error(
        '"c4.within" is only for containers, databases and components that are not external.',
        id,
      );
    } else {
      facet.within = raw.within;
    }
  }
  return facet;
}

/** Containers, databases and components belong somewhere unless external. */
function needsHost(facet: C4Facet): boolean {
  return (
    !facet.external &&
    (facet.kind === "container" ||
      facet.kind === "database" ||
      facet.kind === "component")
  );
}

function canContain(host: C4Facet, kind: C4Kind): boolean {
  if (host.external) return false;
  if (kind === "component") {
    return host.kind === "container" || host.kind === "database";
  }
  return host.kind === "system";
}

/**
 * The C4 element a container, database or component sits in: its explicit
 * `within`, else the nearest suitable ancestor in the statement tree.
 */
export function c4HostOf(
  statements: ReadonlyMap<string, KnowledgeStatement>,
  id: string,
): string | undefined {
  const facet = statements.get(id)?.c4;
  if (!facet || !needsHost(facet)) return undefined;
  if (facet.within !== undefined) return facet.within;
  const seen = new Set<string>([id]);
  let current = statements.get(id)?.parent;
  while (current !== undefined && !seen.has(current)) {
    seen.add(current);
    const ancestor = statements.get(current);
    if (ancestor?.c4 && canContain(ancestor.c4, facet.kind)) return current;
    current = ancestor?.parent;
  }
  return undefined;
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
    const c4 = raw.c4 === undefined ? undefined : parseC4(raw.c4, id, error);
    // Every view needs these: the concept map draws labels joined by phrases,
    // a C4 box falls back to the label. A map without them would validate
    // and still leave those views mute.
    let label: string | undefined;
    if (raw.label === undefined) {
      error(
        `Every statement needs a "label": its concept in at most ${MAX_CONCEPT_LABEL_WORDS} words.`,
        id,
      );
    } else {
      const parsed = shortPhrase(
        raw.label,
        MAX_CONCEPT_LABEL_WORDS,
        MAX_CONCEPT_LABEL_LENGTH,
      );
      if ("error" in parsed) error(`The concept label ${parsed.error}.`, id);
      else label = parsed.text;
    }
    let link: string | undefined;
    if (raw.link === undefined) {
      if (id !== input.root) {
        error(
          `Every statement except the root needs a "link": the phrase from its parent's concept to its own, at most ${MAX_LINK_PHRASE_WORDS} words.`,
          id,
        );
      }
    } else {
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
      ...(c4 ? { c4 } : {}),
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

  // Every internal container sits in a system, every component in a container.
  for (const statement of byId.values()) {
    const facet = statement.c4;
    if (!facet) continue;
    if (facet.within !== undefined) {
      const host = byId.get(facet.within);
      if (!host) {
        error(
          `"c4.within" names "${facet.within}", which does not exist.`,
          statement.id,
        );
        continue;
      }
      if (!host.c4 || !canContain(host.c4, facet.kind)) {
        error(
          `"c4.within" must name ${facet.kind === "component" ? "a container or database" : "a system"} that is not external.`,
          statement.id,
        );
        continue;
      }
    }
    if (needsHost(facet) && c4HostOf(byId, statement.id) === undefined) {
      error(
        `This ${facet.kind} has no ${facet.kind === "component" ? "container" : "system"} to sit in: set "c4.within" or place it below one.`,
        statement.id,
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
    const relation: KnowledgeRelation = {
      from,
      to,
      kind: kind as RelationKind,
    };
    if (raw.link === undefined) {
      if (kind === "uses") {
        error(
          `"${from}" uses "${to}" without a "link" phrase; the C4 view writes it on the arrow.`,
          from,
        );
      } else {
        warn(
          `The link to "${to}" has no "link" phrase, so the concept map leaves it out.`,
          from,
        );
      }
    } else {
      const parsed = shortPhrase(
        raw.link,
        MAX_LINK_PHRASE_WORDS,
        MAX_LINK_PHRASE_LENGTH,
      );
      if ("error" in parsed) {
        error(`The linking phrase ${parsed.error}.`, from);
      } else {
        relation.link = parsed.text;
      }
    }
    if (raw.technology !== undefined) {
      const technology = shortLine(raw.technology, MAX_TECHNOLOGY_LENGTH);
      if (technology === null) {
        error(
          `A relation technology is one line of at most ${MAX_TECHNOLOGY_LENGTH} characters.`,
          from,
        );
      } else {
        relation.technology = technology;
      }
    }
    relations.push(relation);
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
