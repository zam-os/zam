/**
 * Pure C4 model for the knowledge map (ADR 2026-10-03, Decision 8): which
 * elements a diagram shows at which level, and which arrows connect them.
 * No DOM, so it is unit-tested.
 *
 * Elements are statements with a `c4` facet; the box shows `c4.name`, else the
 * statement's `label`. A statement without a facet belongs to the nearest
 * ancestor element. Arrows come from `uses` links only: a link
 * between parts rolls up to the boxes visible at the current level, the way
 * C4 tools show implied relationships.
 */

import {
  type C4Kind,
  c4HostOf,
  type KnowledgeStatement,
  type MapIndex,
} from "../../../src/cli/knowledge-map/model.js";

export type C4Level = "context" | "container" | "component";

export interface C4Element {
  id: string;
  kind: C4Kind;
  name: string;
  technology?: string;
  external: boolean;
  /** The statement text: the element's description. */
  description: string;
  /** The element this one sits in, if any. */
  host?: string;
  /** Elements sitting in this one, in tree order. */
  inner: string[];
}

export interface C4Scope {
  level: C4Level;
  /** The system (container level) or container (component level) shown. */
  scopeId: string | null;
}

export interface C4Box {
  element: C4Element;
  role: "person" | "inside" | "outside";
}

export interface C4Arrow {
  from: string;
  to: string;
  /** The first phrase; drawn on the arrow. */
  label?: string;
  /** Every distinct phrase of the links this arrow stands for. */
  labels: string[];
  technology?: string;
  /** How many `uses` links this arrow stands for. */
  count: number;
}

export interface C4Diagram {
  scope: C4Scope;
  /** The element whose inside is drawn, with a dashed boundary. */
  boundary: C4Element | null;
  boxes: C4Box[];
  arrows: C4Arrow[];
}

export interface C4Model {
  elements: Map<string, C4Element>;
  /** The element a statement stands for or belongs to. */
  elementOf(statementId: string): string | null;
}

/** People, systems and anything external sit on the context level. */
export function isTopLevel(element: C4Element): boolean {
  return (
    element.kind === "person" || element.kind === "system" || element.external
  );
}

export function buildC4Model(index: MapIndex): C4Model {
  const statements = new Map<string, KnowledgeStatement>(
    index.map.statements.map((statement) => [statement.id, statement]),
  );
  const elements = new Map<string, C4Element>();
  for (const id of index.order()) {
    const statement = statements.get(id);
    if (!statement?.c4) continue;
    const facet = statement.c4;
    elements.set(id, {
      id,
      kind: facet.kind,
      name: facet.name ?? statement.label ?? statement.id,
      ...(facet.technology ? { technology: facet.technology } : {}),
      external: facet.external === true,
      description: statement.text,
      inner: [],
    });
  }
  for (const element of elements.values()) {
    const host = c4HostOf(statements, element.id);
    if (host !== undefined && elements.has(host)) {
      element.host = host;
      elements.get(host)?.inner.push(element.id);
    }
  }
  const elementOf = (statementId: string): string | null => {
    for (const id of [...index.pathTo(statementId)].reverse()) {
      if (elements.has(id)) return id;
    }
    return null;
  };
  return { elements, elementOf };
}

/** The diagram in which an element is one of the boxes inside. */
export function homeScope(model: C4Model, elementId: string | null): C4Scope {
  const element = elementId ? model.elements.get(elementId) : undefined;
  if (!element || isTopLevel(element) || !element.host) {
    return { level: "context", scopeId: null };
  }
  return {
    level: element.kind === "component" ? "component" : "container",
    scopeId: element.host,
  };
}

/** The diagram one level inside an element, or null when it holds nothing. */
export function zoomScope(model: C4Model, elementId: string): C4Scope | null {
  const element = model.elements.get(elementId);
  if (!element || element.external || element.inner.length === 0) return null;
  if (element.kind === "system")
    return { level: "container", scopeId: element.id };
  if (element.kind === "container" || element.kind === "database") {
    return { level: "component", scopeId: element.id };
  }
  return null;
}

export function parentScope(model: C4Model, scope: C4Scope): C4Scope | null {
  if (scope.level === "context" || !scope.scopeId) return null;
  if (scope.level === "container") return { level: "context", scopeId: null };
  const host = model.elements.get(scope.scopeId)?.host;
  return host
    ? { level: "container", scopeId: host }
    : { level: "context", scopeId: null };
}

function insideOf(model: C4Model, scope: C4Scope): Set<string> {
  const inside = new Set<string>();
  for (const element of model.elements.values()) {
    if (scope.level === "context") {
      if (element.kind === "system" && !element.external)
        inside.add(element.id);
    } else if (element.host === scope.scopeId) {
      inside.add(element.id);
    }
  }
  return inside;
}

/** The scope element and everything it sits in: drawn as the frame, not a box. */
function frameOf(model: C4Model, scope: C4Scope): Set<string> {
  const frame = new Set<string>();
  let current = scope.scopeId ?? undefined;
  while (current !== undefined && !frame.has(current)) {
    frame.add(current);
    current = model.elements.get(current)?.host;
  }
  return frame;
}

export function buildC4Diagram(
  index: MapIndex,
  model: C4Model,
  scope: C4Scope,
): C4Diagram {
  const inside = insideOf(model, scope);
  const frame = frameOf(model, scope);

  /** The box a statement shows up as at this level, or null. */
  const visible = (statementId: string): string | null => {
    let current = model.elementOf(statementId) ?? undefined;
    const seen = new Set<string>();
    while (current !== undefined && !seen.has(current)) {
      seen.add(current);
      if (inside.has(current)) return current;
      if (frame.has(current)) return null;
      const element = model.elements.get(current);
      if (!element) return null;
      if (isTopLevel(element)) return current;
      if (
        scope.level === "component" &&
        (element.kind === "container" || element.kind === "database")
      ) {
        return current;
      }
      current = element.host;
    }
    return null;
  };

  const arrows = new Map<string, C4Arrow>();
  for (const relation of index.map.relations) {
    if (relation.kind !== "uses") continue;
    const from = visible(relation.from);
    const to = visible(relation.to);
    if (!from || !to || from === to) continue;
    if (scope.level !== "context" && !inside.has(from) && !inside.has(to)) {
      continue;
    }
    const key = `${from}\u0000${to}`;
    const existing = arrows.get(key);
    if (existing) {
      existing.count += 1;
      if (relation.link && !existing.labels.includes(relation.link)) {
        existing.labels.push(relation.link);
      }
    } else {
      arrows.set(key, {
        from,
        to,
        ...(relation.link ? { label: relation.link } : {}),
        labels: relation.link ? [relation.link] : [],
        ...(relation.technology ? { technology: relation.technology } : {}),
        count: 1,
      });
    }
  }

  const shown = new Set<string>(inside);
  if (scope.level === "context") {
    for (const element of model.elements.values()) {
      if (isTopLevel(element)) shown.add(element.id);
    }
  }
  for (const arrow of arrows.values()) {
    shown.add(arrow.from);
    shown.add(arrow.to);
  }

  const boxes: C4Box[] = [];
  for (const id of index.order()) {
    if (!shown.has(id)) continue;
    const element = model.elements.get(id);
    if (!element) continue;
    boxes.push({
      element,
      role:
        element.kind === "person"
          ? "person"
          : inside.has(id)
            ? "inside"
            : "outside",
    });
  }

  return {
    scope,
    boundary:
      scope.scopeId !== null
        ? (model.elements.get(scope.scopeId) ?? null)
        : null,
    boxes,
    arrows: [...arrows.values()],
  };
}

/** Where an arrow between two boxes leaves and enters their borders. */
export function clipToBoxes(
  from: { x: number; y: number; width: number; height: number },
  to: { x: number; y: number; width: number; height: number },
  gap = 4,
): { x1: number; y1: number; x2: number; y2: number } {
  const ax = from.x + from.width / 2;
  const ay = from.y + from.height / 2;
  const bx = to.x + to.width / 2;
  const by = to.y + to.height / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.hypot(dx, dy) || 1;
  const exit = (w: number, h: number) =>
    Math.min(
      dx === 0 ? Number.POSITIVE_INFINITY : Math.abs(w / 2 / dx),
      dy === 0 ? Number.POSITIVE_INFINITY : Math.abs(h / 2 / dy),
    );
  const finite = (t: number) => (Number.isFinite(t) ? t : 0);
  const t1 = finite(exit(from.width, from.height)) + gap / length;
  const t2 = finite(exit(to.width, to.height)) + gap / length;
  return {
    x1: ax + dx * t1,
    y1: ay + dy * t1,
    x2: bx - dx * t2,
    y2: by - dy * t2,
  };
}
