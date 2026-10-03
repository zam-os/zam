/**
 * Pure layout for the knowledge-map views — no DOM, so it is unit-tested.
 *
 * The Focus map uses a fixed compass around the statement in focus: the
 * statement it belongs to above, its details below, statements it points to
 * on the right, statements pointing at it on the left. Because every edge
 * keeps its side, the statement you came from lands opposite the one you
 * clicked — the picture stays stable while the centre moves (Yee et al. 2001;
 * Archambault & Purchase 2013).
 */

import type {
  EdgeKind,
  MapIndex,
  Neighbor,
} from "../../../src/cli/knowledge-map/model.js";

/** At most this many neighbours show before "+n more" (ADR Decision 3). */
export const MAX_VISIBLE_NEIGHBORS = 7;
/** Cross-links claim at most this many of the visible slots. */
const MAX_CROSS_FIRST = 3;

const CROSS_ORDER: EdgeKind[] = [
  "because",
  "requires",
  "leads_to",
  "instead_of",
  "example",
];

export function relationLabelKey(
  neighbor: Pick<Neighbor, "kind" | "direction">,
): string {
  return `km_rel_${neighbor.kind}_${neighbor.direction}`;
}

/**
 * Neighbours in the order they claim visible slots: the parent, the statement
 * just left, a few cross-links (they carry the "why"), the details, then the
 * remaining cross-links.
 */
export function rankNeighbors(
  index: MapIndex,
  focusId: string,
  previous: string | null,
): Neighbor[] {
  const all = index.neighbors(focusId);
  const crossRank = (n: Neighbor) => CROSS_ORDER.indexOf(n.kind);
  const parent = all.filter((n) => n.tree === "parent");
  const back = all.filter((n) => n.id === previous && n.tree !== "parent");
  const rest = all.filter((n) => n.tree !== "parent" && n.id !== previous);
  const cross = rest
    .filter((n) => n.tree === null)
    .sort((a, b) => crossRank(a) - crossRank(b));
  const children = rest.filter((n) => n.tree === "child");
  return [
    ...parent,
    ...back,
    ...cross.slice(0, MAX_CROSS_FIRST),
    ...children,
    ...cross.slice(MAX_CROSS_FIRST),
  ];
}

export type CompassSide = "top" | "bottom" | "right" | "left";

export function compassSide(neighbor: Neighbor): CompassSide {
  if (neighbor.tree === "parent") return "top";
  if (neighbor.tree === "child") return "bottom";
  return neighbor.direction === "out" ? "right" : "left";
}

export interface PlacedNeighbor {
  neighbor: Neighbor;
  side: CompassSide;
  x: number;
  y: number;
}

export interface FocusLayout {
  focus: { x: number; y: number };
  nodes: PlacedNeighbor[];
  /** The "+n more" chip, when neighbours were held back. */
  overflow: { count: number; x: number; y: number } | null;
  cardWidth: number;
  focusWidth: number;
  /** Height the layout needs; more than the box on a narrow screen. */
  minHeight: number;
  /** One stacked column instead of the compass. */
  narrow?: boolean;
}

/**
 * Below this width the compass does not fit: everything stacks in one column
 * (parent, centre, then the neighbours). The y values here assume a typical
 * card height; the view re-stacks them with the measured heights.
 */
export const NARROW_WIDTH = 680;
export const NARROW_GAP = 14;
const NARROW_ROW = 140;

function layoutNarrow(
  visible: Neighbor[],
  hidden: number,
  width: number,
): FocusLayout {
  const pad = 12;
  const cardWidth = Math.max(160, width - 2 * pad);
  const nodes: PlacedNeighbor[] = [];
  const parent = visible.find((n) => n.tree === "parent");
  const x = width / 2;
  let y = pad + NARROW_ROW / 2;
  if (parent) {
    nodes.push({ neighbor: parent, side: "top", x, y });
    y += NARROW_ROW;
  }
  const focusY = y;
  for (const neighbor of visible) {
    if (neighbor === parent) continue;
    y += NARROW_ROW;
    nodes.push({ neighbor, side: compassSide(neighbor), x, y });
  }
  let overflow: FocusLayout["overflow"] = null;
  if (hidden > 0) {
    y += NARROW_ROW * 0.6;
    overflow = { count: hidden, x, y };
  }
  return {
    focus: { x, y: focusY },
    nodes,
    overflow,
    cardWidth,
    focusWidth: cardWidth,
    minHeight: y + NARROW_ROW / 2 + pad,
    narrow: true,
  };
}

function spread(count: number, from: number, to: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [(from + to) / 2];
  const step = (to - from) / (count - 1);
  return Array.from({ length: count }, (_, i) => from + i * step);
}

export function layoutFocus(
  index: MapIndex,
  focusId: string,
  previous: string | null,
  width: number,
  height: number,
  expanded = false,
): FocusLayout {
  const ranked = rankNeighbors(index, focusId, previous);
  const visible = expanded ? ranked : ranked.slice(0, MAX_VISIBLE_NEIGHBORS);
  const hidden = ranked.length - visible.length;
  if (width < NARROW_WIDTH) return layoutNarrow(visible, hidden, width);

  const pad = Math.max(12, Math.min(28, width * 0.03));
  const cardWidth = Math.round(Math.max(128, Math.min(210, width * 0.2)));
  const focusWidth = Math.round(Math.max(180, Math.min(320, width * 0.34)));
  const cx = width / 2;

  const bySide: Record<CompassSide, Neighbor[]> = {
    top: [],
    bottom: [],
    right: [],
    left: [],
  };
  for (const neighbor of visible) bySide[compassSide(neighbor)].push(neighbor);

  const nodes: PlacedNeighbor[] = [];
  const place = (neighbor: Neighbor, side: CompassSide, x: number, y: number) =>
    nodes.push({ neighbor, side, x, y });

  // Details fill one row, or two when there are more than four (plus the
  // overflow chip, which takes the last slot of the bottom rows). Two rows
  // lift the centre and keep the side columns above the details.
  const bottomCount = bySide.bottom.length + (hidden > 0 ? 1 : 0);
  const rows = bottomCount > 4 ? 2 : 1;
  const cy = height * (rows === 2 ? 0.34 : 0.42);

  for (const neighbor of bySide.top) place(neighbor, "top", cx, pad + 44);

  const sideTop = height * (rows === 2 ? 0.14 : 0.2);
  const sideBottom = height * (rows === 2 ? 0.42 : 0.6);
  const rightX = width - pad - cardWidth / 2;
  const leftX = pad + cardWidth / 2;
  spread(bySide.right.length, sideTop, sideBottom).forEach((y, i) => {
    place(bySide.right[i], "right", rightX, y);
  });
  spread(bySide.left.length, sideTop, sideBottom).forEach((y, i) => {
    place(bySide.left[i], "left", leftX, y);
  });

  const perRow = rows === 2 ? Math.ceil(bottomCount / 2) : bottomCount;
  const rowY =
    rows === 2
      ? [height * 0.61, height * 0.86]
      : [Math.min(height - pad - 52, height * 0.8)];
  const slots: Array<{ x: number; y: number }> = [];
  for (let row = 0; row < rows; row++) {
    const inRow = Math.min(perRow, bottomCount - row * perRow);
    const xs = spread(inRow, pad + cardWidth / 2, width - pad - cardWidth / 2);
    for (const x of xs) slots.push({ x, y: rowY[row] });
  }
  bySide.bottom.forEach((neighbor, i) => {
    place(neighbor, "bottom", slots[i].x, slots[i].y);
  });
  const overflowSlot = slots[bySide.bottom.length];

  return {
    focus: { x: cx, y: cy },
    nodes,
    overflow:
      hidden > 0 && overflowSlot
        ? { count: hidden, x: overflowSlot.x, y: overflowSlot.y }
        : null,
    cardWidth,
    focusWidth,
    minHeight: 0,
  };
}

export interface MinimapLayout {
  points: Map<string, { x: number; y: number }>;
  edges: Array<[string, string]>;
}

/** The whole tree in a small box: leaves left to right, depth top to bottom. */
export function layoutMinimap(
  index: MapIndex,
  width: number,
  height: number,
  pad = 8,
): MinimapLayout {
  const order = index.order();
  const leaves = order.filter((id) => index.children(id).length === 0);
  const maxDepth = Math.max(1, ...order.map((id) => index.depth(id)));
  const leafX = new Map<string, number>();
  const xs = spread(leaves.length, pad, width - pad);
  leaves.forEach((id, i) => {
    leafX.set(id, xs[i]);
  });

  const points = new Map<string, { x: number; y: number }>();
  const xOf = (id: string): number => {
    const known = points.get(id);
    if (known) return known.x;
    const children = index.children(id);
    const x =
      children.length === 0
        ? (leafX.get(id) ?? width / 2)
        : children.reduce((sum, child) => sum + xOf(child), 0) /
          children.length;
    const y = pad + (index.depth(id) / maxDepth) * (height - 2 * pad);
    points.set(id, { x, y });
    return x;
  };
  for (const id of order) xOf(id);

  const edges: Array<[string, string]> = [];
  for (const id of order) {
    const parent = index.parent(id);
    if (parent !== undefined) edges.push([parent, id]);
  }
  return { points, edges };
}
