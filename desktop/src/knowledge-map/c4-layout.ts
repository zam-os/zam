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

// ── Arrow routing ────────────────────────────────────────────────────────────

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * How an arrow is drawn: `d` is its SVG path, and `points` is the same path
 * as a polyline, for hit tests and for placing its label.
 */
export interface ArrowRoute {
  d: string;
  points: Point[];
}

/** True when the segment p→q passes through `rect` grown by `pad`. */
export function segmentHitsRect(
  p: Point,
  q: Point,
  rect: Rect,
  pad = 6,
): boolean {
  // Liang–Barsky: clip the segment's parameter range to the four edges.
  const left = rect.x - pad;
  const right = rect.x + rect.width + pad;
  const top = rect.y - pad;
  const bottom = rect.y + rect.height + pad;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  let t0 = 0;
  let t1 = 1;
  const edges: Array<[number, number]> = [
    [-dx, p.x - left],
    [dx, right - p.x],
    [-dy, p.y - top],
    [dy, bottom - p.y],
  ];
  for (const [step, room] of edges) {
    if (step === 0) {
      if (room < 0) return false;
      continue;
    }
    const t = room / step;
    if (step < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return false;
  }
  return true;
}

function hits(points: Point[], boxes: readonly Rect[]): number {
  let count = 0;
  for (let i = 1; i < points.length; i++) {
    for (const box of boxes) {
      if (segmentHitsRect(points[i - 1], points[i], box)) count += 1;
    }
  }
  return count;
}

function lengthOf(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y,
    );
  }
  return total;
}

/** Where the ray from a box's centre towards `toward` leaves its border. */
function leaveBox(box: Rect, toward: Point, gap: number): Point {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  const length = Math.hypot(dx, dy) || 1;
  const exit = Math.min(
    dx === 0 ? Number.POSITIVE_INFINITY : Math.abs(box.width / 2 / dx),
    dy === 0 ? Number.POSITIVE_INFINITY : Math.abs(box.height / 2 / dy),
  );
  const t = (Number.isFinite(exit) ? exit : 0) + gap / length;
  return { x: cx + dx * t, y: cy + dy * t };
}

const n = (value: number) => Math.round(value * 10) / 10;

function curve(start: Point, control: Point, end: Point): ArrowRoute {
  const points: Point[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const u = 1 - t;
    points.push({
      x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
      y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
    });
  }
  return {
    d: `M ${n(start.x)} ${n(start.y)} Q ${n(control.x)} ${n(control.y)} ${n(end.x)} ${n(end.y)}`,
    points,
  };
}

/** A polyline with its corners rounded off. */
function polyline(points: Point[], radius = 14): ArrowRoute {
  let d = `M ${n(points[0].x)} ${n(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const corner = points[i];
    const next = points[i + 1];
    const into = Math.hypot(corner.x - prev.x, corner.y - prev.y) || 1;
    const out = Math.hypot(next.x - corner.x, next.y - corner.y) || 1;
    const r = Math.min(radius, into / 2, out / 2);
    const a = {
      x: corner.x - ((corner.x - prev.x) / into) * r,
      y: corner.y - ((corner.y - prev.y) / into) * r,
    };
    const b = {
      x: corner.x + ((next.x - corner.x) / out) * r,
      y: corner.y + ((next.y - corner.y) / out) * r,
    };
    d += ` L ${n(a.x)} ${n(a.y)} Q ${n(corner.x)} ${n(corner.y)} ${n(b.x)} ${n(b.y)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${n(last.x)} ${n(last.y)}`;
  return { d, points };
}

/** How far a bend's control point moves aside, tried in this order. */
const BENDS = [80, -80, 140, -140, 200, -200];

/** How far a detour keeps from the boxes it passes. */
const CLEARANCE = 18;

/**
 * The lanes a detour may use: just outside each box's edges, and midway
 * through each gap between two boxes.
 */
function lanes(boxes: readonly Rect[], axis: "x" | "y"): number[] {
  const starts = boxes.map((box) => (axis === "x" ? box.x : box.y));
  const ends = boxes.map((box) =>
    axis === "x" ? box.x + box.width : box.y + box.height,
  );
  const values = [
    ...starts.map((v) => v - CLEARANCE),
    ...ends.map((v) => v + CLEARANCE),
  ];
  for (const end of ends) {
    const next = starts
      .filter((start) => start - end > 2 * CLEARANCE)
      .sort((a, b) => a - b)[0];
    if (next !== undefined) values.push((end + next) / 2);
  }
  const unique: number[] = [];
  for (const value of values.sort((a, b) => a - b)) {
    if (unique.every((u) => Math.abs(u - value) > 6)) unique.push(value);
  }
  return unique;
}

/**
 * The arrow from one box to another, never hidden behind a box it does not
 * connect: straight where that is clear, else a gentle bend, else a detour
 * through the gaps between the boxes with one or two corners (the shortest
 * that is clear). Only where nothing is clear does it fall back to the bend
 * that crosses the fewest boxes.
 */
export function routeArrow(
  from: Rect,
  to: Rect,
  obstacles: readonly Rect[],
  gap = 4,
): ArrowRoute {
  const straight = clipToBoxes(from, to, gap);
  const direct = [
    { x: straight.x1, y: straight.y1 },
    { x: straight.x2, y: straight.y2 },
  ];
  if (hits(direct, obstacles) === 0) return polyline(direct);

  const ax = from.x + from.width / 2;
  const ay = from.y + from.height / 2;
  const bx = to.x + to.width / 2;
  const by = to.y + to.height / 2;
  const length = Math.hypot(bx - ax, by - ay) || 1;
  const nx = -(by - ay) / length;
  const ny = (bx - ax) / length;
  let fallback = polyline(direct);
  let fewest = hits(direct, obstacles);
  for (const bend of BENDS) {
    const control = {
      x: (ax + bx) / 2 + nx * bend,
      y: (ay + by) / 2 + ny * bend,
    };
    const route = curve(
      leaveBox(from, control, gap),
      control,
      leaveBox(to, control, gap),
    );
    const count = hits(route.points, obstacles);
    if (count === 0) return route;
    if (count < fewest) {
      fallback = route;
      fewest = count;
    }
  }

  // Detours through the gaps. The first and last legs leave and enter their
  // own boxes by construction; the legs between must also avoid those two.
  const all = [from, to, ...obstacles];
  const free: Point[] = [];
  for (const x of lanes(all, "x")) {
    for (const y of lanes(all, "y")) {
      const point = { x, y };
      if (!all.some((box) => segmentHitsRect(point, point, box, 4))) {
        free.push(point);
      }
    }
  }
  const everything = [...obstacles, from, to];
  const clear = (corners: Point[]): Point[] | null => {
    const start = leaveBox(from, corners[0], gap);
    const end = leaveBox(to, corners[corners.length - 1], gap);
    if (hits([start, corners[0]], obstacles) > 0) return null;
    if (hits([corners[corners.length - 1], end], obstacles) > 0) return null;
    if (hits(corners, everything) > 0) return null;
    return [start, ...corners, end];
  };
  let best: Point[] | null = null;
  const consider = (points: Point[] | null) => {
    if (points && (!best || lengthOf(points) < lengthOf(best))) best = points;
  };
  for (const corner of free) consider(clear([corner]));
  if (!best) {
    for (const first of free) {
      for (const second of free) {
        if (first === second) continue;
        // The middle leg runs along a lane, so the detour stays orderly.
        if (first.x !== second.x && first.y !== second.y) continue;
        consider(clear([first, second]));
      }
    }
  }
  return best ? polyline(best) : fallback;
}

/**
 * Candidate centres for an arrow's label, best first: on the arrow, nearer
 * the box at `near` (1 = the end, -1 = the start), then beside it on either
 * side. The caller takes the first one that covers no box and no label.
 */
export function labelSpots(route: ArrowRoute, near: 1 | -1): Point[] {
  const { points } = route;
  const total = lengthOf(points);
  const at = (t: number): { point: Point; normal: Point } => {
    let remaining = t * total;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const piece = Math.hypot(b.x - a.x, b.y - a.y);
      if (remaining <= piece || i === points.length - 1) {
        const f = piece === 0 ? 0 : Math.min(1, remaining / piece);
        const length = piece || 1;
        return {
          point: { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f },
          normal: { x: -(b.y - a.y) / length, y: (b.x - a.x) / length },
        };
      }
      remaining -= piece;
    }
    return { point: points[0], normal: { x: 0, y: -1 } };
  };
  const along = [
    0.5,
    0.5 + 0.12 * near,
    0.5 - 0.12 * near,
    0.5 + 0.24 * near,
    0.5 - 0.24 * near,
    0.3,
    0.7,
    0.2,
    0.8,
    0.12,
    0.88,
  ];
  const spots: Point[] = [];
  for (const offset of [0, 18, -18, 34, -34]) {
    for (const t of along) {
      const { point, normal } = at(t);
      spots.push({
        x: point.x + normal.x * offset,
        y: point.y + normal.y * offset,
      });
    }
  }
  return spots;
}
