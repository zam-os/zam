/**
 * The atlas as a zoomable 2D map on a canvas — one planet, one lens at a time.
 *
 * Colour says *where* (each region on the lens's colour level has its own
 * hue; the level below gets a shade and a pattern); texture says *how well
 * you know it* (bright, dusty, dark, cracked, fog, or sketched-in for never
 * practised). Zooming is semantic: far out you read islands and their first
 * level with Sinnbilder, closer in the deeper levels, closest the learning
 * units. Red threads are bundled to the level you are looking at, like
 * relationships in C4, and drawn with UML-style ends. A thread to another
 * planet ends at a portal on the coast.
 */
import { cardLevel, isDue, statsFor } from "../../knowledge-world/src/model.ts";
import type { Condition } from "../../knowledge-world/src/model.ts";
import { displayEmblem, effectiveEmblem, findUnit, planetOfUnit, simNow, threadsOf, unitIdsIn } from "./atlas.ts";
import type { Atlas, Emblem, Lens, Planet, Thread, ThreadKind } from "./atlas.ts";
import { CORNERS, SQRT3, outline } from "./layout.ts";
import type { Cell, Layout, Segment } from "./layout.ts";
import type { PatternKind } from "./taxonomy.ts";

export type CellState = Condition | "frei";
export type Selection = { kind: "unit"; id: string } | { kind: "region"; id: string };
export type ThreadMode = "alle" | "auswahl" | "aus";
export type PickMode = { allow?: (id: string) => boolean } | null;

interface Theme {
  dark: boolean;
  sea: Record<string, string>;
  shallow: string;
  shore: string;
  parchment: [number, number, number];
  fog: [number, number, number];
  ink: string;
  inkRgb: string;
  halo: string;
  surface: string;
  thread: string;
  threadReq: string;
  accent: string;
}

const LIGHT: Theme = {
  dark: false,
  sea: { welt: "#c9dde8", firma: "#cdd8d4", privat: "#e2d8e6" },
  shallow: "rgba(255,255,255,0.32)",
  shore: "#efe5cf",
  parchment: [244, 238, 222],
  fog: [238, 242, 246],
  ink: "#1d2b4f",
  inkRgb: "29,43,79",
  halo: "rgba(255,255,255,0.92)",
  surface: "#ffffff",
  thread: "#d62828",
  threadReq: "#9c2a3c",
  accent: "#2340b5",
};

const DARK: Theme = {
  dark: true,
  sea: { welt: "#0d1922", firma: "#0f1c1a", privat: "#1a1420" },
  shallow: "rgba(255,255,255,0.05)",
  shore: "#2a2a22",
  parchment: [52, 50, 44],
  fog: [128, 140, 154],
  ink: "#e6ecf3",
  inkRgb: "230,236,243",
  halo: "rgba(10,16,22,0.88)",
  surface: "#1a2430",
  thread: "#ff5c5c",
  threadReq: "#d2647a",
  accent: "#8aa4ff",
};

const SHADE_SHIFT = [0, 16, -16, 30, -30, 8, -8, 22];
const SHADE_LIGHT = [55, 66, 47, 72, 42, 61, 51, 68];

/** How strongly a unit's Sinnbild shows in each state. */
const EMBLEM_ALPHA: Record<CellState, number> = { leer: 0.5, rohbau: 0.55, hell: 1, staubig: 0.85, dunkel: 0.6, verfallen: 0.45, nebel: 0.25, frei: 0 };

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Sinnbilder are drawn in this ink on a light disc, whatever the theme. */
const EMBLEM_INK = "#1d2b4f";

/** Hex radius in px from which single learning units are the focus. */
const UNIT_PX = 40;

/** Room the breadcrumb box takes at the top of the view. */
const TOP_INSET = 170;

/** Which kind a bundle of threads shows: the most specific one present. */
const KIND_PRIORITY: ThreadKind[] = ["schnittstelle", "nutzt", "ist-ein", "verbindung", "voraussetzung"];

// ── Colour helpers ──────────────────────────────────────────────────────────

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hh = (((h % 360) + 360) % 360) / 360;
  const ss = Math.max(0, Math.min(1, s / 100));
  const ll = Math.max(0, Math.min(1, l / 100));
  if (ss === 0) return [ll * 255, ll * 255, ll * 255];
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const f = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [f(hh + 1 / 3) * 255, f(hh) * 255, f(hh - 1 / 3) * 255];
}

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function css([r, g, b]: [number, number, number], alpha = 1): string {
  return alpha >= 1 ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${alpha})`;
}

const smooth = (x: number, a: number, b: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function emblemDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ── Patterns (drawn in screen space, so they read the same at every zoom) ──

function tile(size: number, draw: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  draw(g);
  return c;
}

function patternTile(kind: PatternKind, ink: string): HTMLCanvasElement {
  return tile(16, (g) => {
    g.strokeStyle = ink;
    g.fillStyle = ink;
    g.lineWidth = 1.3;
    g.lineCap = "round";
    const line = (x1: number, y1: number, x2: number, y2: number) => {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    };
    const diag = () => {
      line(-4, 4, 4, -4);
      line(0, 16, 16, 0);
      line(12, 20, 20, 12);
    };
    const anti = () => {
      line(-4, 12, 4, 20);
      line(0, 0, 16, 16);
      line(12, -4, 20, 4);
    };
    switch (kind) {
      case "diag":
        diag();
        break;
      case "antidiag":
        anti();
        break;
      case "cross":
        diag();
        anti();
        break;
      case "dots":
        for (const [x, y] of [[4, 4], [12, 12]]) {
          g.beginPath();
          g.arc(x, y, 1.6, 0, Math.PI * 2);
          g.fill();
        }
        break;
      case "waves":
        g.beginPath();
        g.moveTo(0, 8);
        g.quadraticCurveTo(4, 3, 8, 8);
        g.quadraticCurveTo(12, 13, 16, 8);
        g.stroke();
        break;
      case "grid":
        line(0.5, 0, 0.5, 16);
        line(0, 0.5, 16, 0.5);
        break;
      case "hlines":
        line(0, 4, 16, 4);
        line(0, 12, 16, 12);
        break;
      case "vlines":
        line(4, 0, 4, 16);
        line(12, 0, 12, 16);
        break;
      case "rings":
        g.beginPath();
        g.arc(8, 8, 4, 0, Math.PI * 2);
        g.stroke();
        break;
      case "zigzag":
        g.beginPath();
        g.moveTo(0, 11);
        g.lineTo(4, 5);
        g.lineTo(8, 11);
        g.lineTo(12, 5);
        g.lineTo(16, 11);
        g.stroke();
        break;
    }
  });
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dustTile(dark: boolean): HTMLCanvasElement {
  const r = rng(3);
  return tile(28, (g) => {
    for (let i = 0; i < 26; i += 1) {
      g.fillStyle = dark ? `rgba(200,190,170,${0.25 + r() * 0.4})` : `rgba(120,100,70,${0.25 + r() * 0.45})`;
      g.beginPath();
      g.arc(r() * 28, r() * 28, 0.5 + r() * 1.1, 0, Math.PI * 2);
      g.fill();
    }
  });
}

function crackTile(dark: boolean): HTMLCanvasElement {
  const r = rng(11);
  return tile(56, (g) => {
    g.strokeStyle = dark ? "rgba(0,0,0,0.75)" : "rgba(40,28,20,0.7)";
    g.lineWidth = 1.1;
    for (let k = 0; k < 4; k += 1) {
      let x = r() * 56;
      let y = r() * 56;
      g.beginPath();
      g.moveTo(x, y);
      for (let i = 0; i < 6; i += 1) {
        x += (r() - 0.5) * 16;
        y += (r() - 0.3) * 12;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });
}

function hatchTile(ink: string): HTMLCanvasElement {
  return tile(7, (g) => {
    g.strokeStyle = ink;
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(-1, 8);
    g.lineTo(8, -1);
    g.stroke();
  });
}

function seaTile(dark: boolean): HTMLCanvasElement {
  return tile(64, (g) => {
    g.strokeStyle = dark ? "rgba(140,180,210,0.07)" : "rgba(40,90,130,0.08)";
    g.lineWidth = 1.2;
    for (const [x, y] of [[6, 14], [38, 36], [14, 52]]) {
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 5, y - 4, x + 10, y);
      g.quadraticCurveTo(x + 15, y + 4, x + 20, y);
      g.stroke();
    }
  });
}

// ── The view ────────────────────────────────────────────────────────────────

interface CellInfo {
  state: CellState;
  fill: string;
  base: [number, number, number];
  due: boolean;
}

interface Camera {
  x: number;
  y: number;
  scale: number;
}

interface LabelBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface End {
  id: string;
  x: number;
  y: number;
  /** A unit on another planet: drawn as a portal on the coast. */
  external?: { planet: Planet; unit: string };
}

interface Bundle {
  a: End;
  b: End;
  threads: Thread[];
  lit: boolean;
}

export interface ViewEvents {
  onClick(target: Selection | null, cell: Cell | null): void;
  onPortal(planetId: string, unitId: string): void;
  onDoubleClick(target: Selection | null, cell: Cell | null): void;
  onHover(target: Selection | null, cell: Cell | null, x: number, y: number): void;
  onCamera(): void;
}

/** Planet Sinnbilder for portals, filled in by the app from the sample set. */
export const PLANET_EMBLEMS: Record<string, Emblem | undefined> = {};

export class MapView {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private dpr = 1;
  width = 0;
  height = 0;
  cam: Camera = { x: 0, y: 0, scale: 12 };
  /** Space on the right covered by the panel (px), so "fit" leaves it free. */
  rightInset = 0;

  atlas!: Atlas;
  planet!: Planet;
  lens!: Lens;
  layout!: Layout;
  selection: Selection | null = null;
  hover: Selection | null = null;
  threadMode: ThreadMode = "alle";
  pickMode: PickMode = null;
  /** Units to flash after an import. */
  flash: { ids: Set<string>; until: number } | null = null;

  private theme: Theme = LIGHT;
  private info = new Map<Cell, CellInfo>();
  private threads: Thread[] = [];
  private medianRadius: Record<number, number> = {};
  private patterns = new Map<string, CanvasPattern>();
  private images = new Map<string, HTMLImageElement>();
  private outlines = new Map<string, Segment[]>();
  private portals: Array<{ x: number; y: number; r: number; planet: string; unit: string }> = [];
  private frame = 0;
  private anim: { from: Camera; to: Camera; start: number; ms: number } | null = null;

  constructor(canvas: HTMLCanvasElement, private readonly events: ViewEvents) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const forced = document.documentElement.dataset.theme;
      this.theme = forced === "dark" || (forced !== "light" && media.matches) ? DARK : LIGHT;
      this.patterns.clear();
      if (this.atlas) this.recolor();
      this.requestDraw();
    };
    media.addEventListener("change", applyTheme);
    applyTheme();
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
    this.bindInput();
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  get depth(): number {
    return this.lens.levels.length;
  }

  setData(atlas: Atlas, planet: Planet, lens: Lens, layout: Layout): void {
    this.atlas = atlas;
    this.planet = planet;
    this.lens = lens;
    this.layout = layout;
    this.outlines.clear();
    for (let level = 1; level <= this.depth; level += 1) {
      const radii = [...layout.regions.values()].filter((g) => g.level === level).map((g) => g.radius).sort((a, b) => a - b);
      this.medianRadius[level] = radii[Math.floor(radii.length / 2)] ?? 1;
    }
    if (this.selection?.kind === "region" && !lens.regions[this.selection.id]) this.selection = null;
    if (this.selection?.kind === "unit" && !planet.units[this.selection.id]) this.selection = null;
    this.recolor();
    this.requestDraw();
  }

  /** Recompute colours and states (after reviews or a time jump). */
  recolor(): void {
    const now = simNow(this.atlas);
    this.threads = threadsOf(this.atlas, this.planet);
    this.info.clear();
    const t = this.theme;
    const c = this.lens.colorLevel;
    for (const cell of this.layout.cells) {
      const hueRegion = this.lens.regions[cell.path[c - 1]];
      const shadeId = cell.path[c];
      const shadeParent = shadeId ? this.lens.regions[this.lens.regions[shadeId].parent ?? ""] : undefined;
      const si = shadeId && shadeParent ? Math.max(0, shadeParent.children.indexOf(shadeId)) : 0;
      const leafId = cell.path[cell.path.length - 1];
      const leafParent = this.lens.regions[this.lens.regions[leafId].parent ?? ""];
      const li = cell.path.length - 1 > c && leafParent ? Math.max(0, leafParent.children.indexOf(leafId)) : 0;
      const hue = (hueRegion?.hue ?? 210) + SHADE_SHIFT[si % SHADE_SHIFT.length] + ((li % 3) - 1) * 4;
      let light = SHADE_LIGHT[si % SHADE_LIGHT.length] + (li % 2 ? 4 : -2);
      let sat = 62;
      if (t.dark) {
        light *= 0.72;
        sat = 48;
      }
      const base = hslToRgb(hue, sat, light);
      let state: CellState = "frei";
      let due = false;
      if (cell.unit) {
        const unit = this.planet.units[cell.unit];
        state = statsFor(unit.cards, now).label;
        due = unit.cards.some((k) => k.state !== "new" && isDue(k, now) && cardLevel(k, now) >= 1);
      }
      const fill = (() => {
        switch (state) {
          case "hell":
            return base;
          case "staubig":
            return hslToRgb(hue, sat * 0.5, light + (t.dark ? 2 : 7));
          case "dunkel":
            return hslToRgb(hue, sat * 0.6, light * 0.7);
          case "verfallen":
            return hslToRgb(hue - 10, sat * 0.4, light * 0.56);
          case "nebel":
            return mix(base, t.fog, 0.72);
          case "rohbau":
          case "leer":
            return mix(t.parchment, base, 0.26);
          case "frei":
            return mix(t.parchment, base, 0.1);
        }
      })();
      this.info.set(cell, { state, fill: css(fill), base, due });
    }
    this.requestDraw();
  }

  cellInfo(cell: Cell): CellInfo | undefined {
    return this.info.get(cell);
  }

  regionColor(regionId: string): string {
    const region = this.lens.regions[regionId];
    if (!region) return this.theme.ink;
    if (region.level < this.lens.colorLevel) return "#6b7280";
    return css(hslToRgb(region.hue, 62, this.theme.dark ? 50 : 46));
  }

  // ── Camera ────────────────────────────────────────────────────────────────

  get hexPx(): number {
    return this.cam.scale;
  }

  private resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.requestDraw();
  }

  toScreen(x: number, y: number): [number, number] {
    return [(x - this.cam.x) * this.cam.scale + this.viewCenterX(), (y - this.cam.y) * this.cam.scale + this.height / 2];
  }

  toWorld(sx: number, sy: number): [number, number] {
    return [(sx - this.viewCenterX()) / this.cam.scale + this.cam.x, (sy - this.height / 2) / this.cam.scale + this.cam.y];
  }

  private viewCenterX(): number {
    return (this.width - this.rightInset) / 2;
  }

  fitScale(minX: number, minY: number, maxX: number, maxY: number, pad = 60): number {
    const w = Math.max(100, this.width - this.rightInset - pad * 2);
    const h = Math.max(100, this.height - pad * 2 - TOP_INSET);
    return Math.min(w / Math.max(1, maxX - minX), h / Math.max(1, maxY - minY));
  }

  fitBox(minX: number, minY: number, maxX: number, maxY: number, animate = true, pad = 60, maxScale = 110): void {
    const scale = Math.min(maxScale, this.fitScale(minX, minY, maxX, maxY, pad));
    const to = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 - TOP_INSET / 2 / scale, scale };
    this.moveCamera(to, animate);
  }

  fitAll(animate = true): void {
    const l = this.layout;
    this.fitBox(l.minX - 1, l.minY - 3, l.maxX + 1, l.maxY + 1, animate, 40);
  }

  fitRegion(id: string, animate = true): void {
    const g = this.layout.regions.get(id);
    if (!g) return;
    const pad = g.level === 1 ? 70 : 110;
    this.fitBox(g.minX, g.minY, g.maxX, g.maxY, animate, pad);
  }

  /** The learner's home: their own area in the middle, read at its own level, the neighbours around it. */
  fitHome(id: string, animate = true): void {
    const g = this.layout.regions.get(id);
    if (!g) return;
    const w = g.maxX - g.minX;
    const h = g.maxY - g.minY;
    const grow = Math.max(w, h) * 0.5 + 3;
    this.fitBox(g.minX - grow, g.minY - grow, g.maxX + grow, g.maxY + grow, animate, 40, UNIT_PX - 6);
  }

  focusUnit(id: string, animate = true): void {
    const cell = this.layout.unitCell.get(id);
    if (cell) this.moveCamera({ x: cell.x, y: cell.y, scale: Math.max(this.cam.scale, 52) }, animate);
  }

  moveCamera(to: Camera, animate = true): void {
    const clamped = { ...to, scale: this.clampScale(to.scale) };
    if (!animate) {
      this.cam = clamped;
      this.anim = null;
      this.events.onCamera();
      this.requestDraw();
      return;
    }
    this.anim = { from: { ...this.cam }, to: clamped, start: performance.now(), ms: 520 };
    this.requestDraw();
  }

  zoomBy(factor: number, sx = this.viewCenterX(), sy = this.height / 2): void {
    const [wx, wy] = this.toWorld(sx, sy);
    const scale = this.clampScale(this.cam.scale * factor);
    this.cam.scale = scale;
    this.cam.x = wx - (sx - this.viewCenterX()) / scale;
    this.cam.y = wy - (sy - this.height / 2) / scale;
    this.anim = null;
    this.events.onCamera();
    this.requestDraw();
  }

  private clampScale(scale: number): number {
    const l = this.layout;
    const min = l ? Math.min(6, this.fitScale(l.minX, l.minY, l.maxX, l.maxY) * 0.6) : 2;
    return Math.max(min, Math.min(160, scale));
  }

  // ── Levels ────────────────────────────────────────────────────────────────

  /** The level the eye is on: what clicks select and threads bundle to. `depth + 1` means single units. */
  focusLevel(): number {
    if (this.hexPx >= UNIT_PX) return this.depth + 1;
    const px = (level: number) => (this.medianRadius[level] ?? 1) * this.cam.scale;
    for (let level = this.depth; level >= 2; level -= 1) {
      const need = level === this.depth ? 46 : level === 2 ? 24 : 52;
      if (px(level) >= need) return level;
    }
    return 1;
  }

  focusName(): string {
    const level = this.focusLevel();
    return level > this.depth ? "Lerneinheiten" : this.lens.levels[level - 1];
  }

  regionAt(cell: Cell, level: number): string {
    return cell.path[Math.min(level, cell.path.length) - 1];
  }

  targetAt(cell: Cell | null): Selection | null {
    if (!cell) return null;
    if (this.pickMode) return cell.unit ? { kind: "unit", id: cell.unit } : null;
    const level = this.focusLevel();
    if (level > this.depth) return cell.unit ? { kind: "unit", id: cell.unit } : { kind: "region", id: cell.path[cell.path.length - 1] };
    return { kind: "region", id: this.regionAt(cell, level) };
  }

  cellAt(sx: number, sy: number): Cell | null {
    const [x, y] = this.toWorld(sx, sy);
    const qf = (SQRT3 / 3) * x - y / 3;
    const rf = (2 / 3) * y;
    const sf = -qf - rf;
    let q = Math.round(qf);
    let r = Math.round(rf);
    const s = Math.round(sf);
    const dq = Math.abs(q - qf);
    const dr = Math.abs(r - rf);
    const ds = Math.abs(s - sf);
    if (dq > dr && dq > ds) q = -r - s;
    else if (dr > ds) r = -q - s;
    return this.layout.byKey.get(`${q},${r}`) ?? null;
  }

  private portalAt(sx: number, sy: number): { planet: string; unit: string } | null {
    return this.portals.find((p) => Math.hypot(p.x - sx, p.y - sy) <= p.r + 3) ?? null;
  }

  /** The cell nearest the middle of the view (for the breadcrumb). */
  centerCell(): Cell | null {
    const [x, y] = this.toWorld(this.viewCenterX(), this.height / 2);
    let best: Cell | null = null;
    let bestD = Infinity;
    for (const c of this.layout.cells) {
      const d = (c.x - x) ** 2 + (c.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best && Math.sqrt(bestD) * this.cam.scale < Math.min(this.width, this.height) * 0.35 ? best : null;
  }

  /** The deepest region that fills most of the view. */
  viewRegion(): string | null {
    const cell = this.centerCell();
    if (!cell) return null;
    const view = Math.min(this.width - this.rightInset, this.height);
    let id: string | null = null;
    for (let level = 1; level <= this.depth; level += 1) {
      const rid = this.regionAt(cell, level);
      const g = this.layout.regions.get(rid);
      if (g && g.radius * this.cam.scale * 2 >= view * 0.55) id = rid;
    }
    return id;
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private bindInput(): void {
    let down: { x: number; y: number; cx: number; cy: number; moved: boolean } | null = null;
    const c = this.canvas;
    c.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      c.setPointerCapture(e.pointerId);
      down = { x: e.clientX, y: e.clientY, cx: this.cam.x, cy: this.cam.y, moved: false };
      this.anim = null;
    });
    c.addEventListener("pointermove", (e) => {
      const rect = c.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (down) {
        const dx = e.clientX - down.x;
        const dy = e.clientY - down.y;
        if (!down.moved && Math.hypot(dx, dy) > 4) down.moved = true;
        if (down.moved) {
          this.cam.x = down.cx - dx / this.cam.scale;
          this.cam.y = down.cy - dy / this.cam.scale;
          c.style.cursor = "grabbing";
          this.events.onCamera();
          this.requestDraw();
          return;
        }
      }
      if (this.portalAt(sx, sy)) {
        c.style.cursor = "pointer";
        return;
      }
      const cell = this.cellAt(sx, sy);
      const target = this.targetAt(cell);
      const changed = JSON.stringify(target) !== JSON.stringify(this.hover);
      this.hover = target;
      c.style.cursor = target ? "pointer" : "grab";
      this.events.onHover(target, cell, e.clientX, e.clientY);
      if (changed) this.requestDraw();
    });
    c.addEventListener("pointerup", (e) => {
      if (!down) return;
      const wasClick = !down.moved;
      down = null;
      c.style.cursor = "grab";
      if (!wasClick) return;
      const rect = c.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const portal = this.portalAt(sx, sy);
      if (portal) {
        this.events.onPortal(portal.planet, portal.unit);
        return;
      }
      const cell = this.cellAt(sx, sy);
      this.events.onClick(this.targetAt(cell), cell);
    });
    c.addEventListener("pointerleave", () => {
      this.hover = null;
      this.events.onHover(null, null, 0, 0);
      this.requestDraw();
    });
    c.addEventListener("dblclick", (e) => {
      const rect = c.getBoundingClientRect();
      const cell = this.cellAt(e.clientX - rect.left, e.clientY - rect.top);
      this.events.onDoubleClick(this.targetAt(cell), cell);
    });
    c.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const rect = c.getBoundingClientRect();
        const pinch = e.ctrlKey;
        if (!pinch && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5 && e.deltaMode === 0 && Math.abs(e.deltaX) > 2) {
          this.cam.x += e.deltaX / this.cam.scale;
          this.cam.y += e.deltaY / this.cam.scale;
          this.events.onCamera();
          this.requestDraw();
          return;
        }
        const factor = Math.exp(-e.deltaY * (pinch ? 0.012 : 0.0018));
        this.zoomBy(factor, e.clientX - rect.left, e.clientY - rect.top);
      },
      { passive: false },
    );
  }

  // ── Drawing ───────────────────────────────────────────────────────────────

  requestDraw(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame((time) => {
      this.frame = 0;
      if (this.anim) {
        const k = Math.min(1, (time - this.anim.start) / this.anim.ms);
        const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
        const { from, to } = this.anim;
        const ls = Math.log(from.scale) + (Math.log(to.scale) - Math.log(from.scale)) * e;
        this.cam = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, scale: Math.exp(ls) };
        if (k >= 1) this.anim = null;
        this.events.onCamera();
        this.requestDraw();
      }
      if (this.flash && this.flash.until > time) this.requestDraw();
      this.draw(time);
    });
  }

  private pattern(key: string, make: () => HTMLCanvasElement): CanvasPattern {
    let p = this.patterns.get(key);
    if (!p) {
      p = this.ctx.createPattern(make(), "repeat") as CanvasPattern;
      this.patterns.set(key, p);
    }
    return p;
  }

  private image(svg: string): HTMLImageElement | null {
    let img = this.images.get(svg);
    if (!img) {
      img = new Image();
      img.onload = () => this.requestDraw();
      img.src = emblemDataUrl(svg);
      this.images.set(svg, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  private hexPath(path: Path2D, cell: Cell, grow = 1): void {
    const [sx, sy] = this.toScreen(cell.x, cell.y);
    const r = this.cam.scale * grow + 0.6;
    path.moveTo(sx + CORNERS[0][0] * r, sy + CORNERS[0][1] * r);
    for (let i = 1; i < 6; i += 1) path.lineTo(sx + CORNERS[i][0] * r, sy + CORNERS[i][1] * r);
    path.closePath();
  }

  private visible(cell: Cell, margin = 2): boolean {
    const [sx, sy] = this.toScreen(cell.x, cell.y);
    const m = this.cam.scale * margin;
    return sx > -m && sy > -m && sx < this.width + m && sy < this.height + m;
  }

  private strokeSegments(segments: Segment[], width: number, color: string): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of segments) {
      const [a, b] = this.toScreen(x1, y1);
      const [c, d] = this.toScreen(x2, y2);
      ctx.moveTo(a, b);
      ctx.lineTo(c, d);
    }
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  private draw(time: number): void {
    const ctx = this.ctx;
    const t = this.theme;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = (this.planet && t.sea[this.planet.kind]) || t.sea.welt;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = this.pattern("sea", () => seaTile(t.dark));
    ctx.fillRect(0, 0, this.width, this.height);
    this.portals = [];
    if (!this.layout || this.layout.cells.length === 0) return;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const cells = this.layout.cells.filter((c) => this.visible(c));
    const px = this.hexPx;

    // Shallow water and beach around every island.
    const shallow = new Path2D();
    const shore = new Path2D();
    for (const c of cells) {
      this.hexPath(shallow, c, 1.9);
      this.hexPath(shore, c, 1.28);
    }
    ctx.fillStyle = t.shallow;
    ctx.fill(shallow);
    ctx.fillStyle = t.shore;
    ctx.fill(shore);

    // Land, bucketed by colour.
    const buckets = new Map<string, Path2D>();
    for (const c of cells) {
      const fill = this.info.get(c)?.fill ?? "#ccc";
      let p = buckets.get(fill);
      if (!p) {
        p = new Path2D();
        buckets.set(fill, p);
      }
      this.hexPath(p, c);
    }
    for (const [fill, p] of buckets) {
      ctx.fillStyle = fill;
      ctx.fill(p);
    }

    // Patterns of the level below the colour level: identity that survives where colour fades.
    const patternAlpha = (t.dark ? 0.22 : 0.17) * (1 - 0.65 * smooth(px, 20, 60));
    const byShade = new Map<string, Path2D>();
    for (const c of cells) {
      if (this.info.get(c)?.state === "nebel") continue;
      const id = c.path[this.lens.colorLevel];
      if (!id) continue;
      let p = byShade.get(id);
      if (!p) {
        p = new Path2D();
        byShade.set(id, p);
      }
      this.hexPath(p, c);
    }
    ctx.globalAlpha = patternAlpha;
    for (const [id, p] of byShade) {
      const kind = this.lens.regions[id]?.pattern ?? "diag";
      ctx.fillStyle = this.pattern(`p:${kind}`, () => patternTile(kind, t.dark ? "#ffffff" : "#000000"));
      ctx.fill(p);
    }
    ctx.globalAlpha = 1;

    // Knowledge-state textures.
    const byState = (states: CellState[]) => {
      const p = new Path2D();
      let any = false;
      for (const c of cells) {
        const st = this.info.get(c)?.state;
        if (st && states.includes(st)) {
          this.hexPath(p, c);
          any = true;
        }
      }
      return any ? p : null;
    };
    const dust = byState(["staubig", "dunkel"]);
    if (dust) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = this.pattern("dust", () => dustTile(t.dark));
      ctx.fill(dust);
    }
    const cracks = byState(["verfallen"]);
    if (cracks) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = this.pattern("cracks", () => crackTile(t.dark));
      ctx.fill(cracks);
    }
    const raw = byState(["rohbau", "leer", "frei"]);
    if (raw) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = this.pattern("hatch", () => hatchTile(t.dark ? "rgba(255,255,255,0.35)" : "rgba(90,70,40,0.55)"));
      ctx.fill(raw);
    }
    ctx.globalAlpha = 1;

    // Borders: deeper levels fainter; coast strongest.
    const e = this.layout.edges;
    const ink = (a: number) => `rgba(${t.inkRgb},${a})`;
    for (let level = this.depth; level >= 2; level -= 1) {
      const segs = e[level] ?? [];
      if (segs.length === 0) continue;
      if (level === 2) {
        this.strokeSegments(segs, 4.2, t.halo);
        this.strokeSegments(segs, 2, ink(0.82));
      } else if (level === 3) {
        this.strokeSegments(segs, 1.4, ink(0.42 * smooth(px, 3, 8) + 0.12));
      } else {
        const a = 0.28 * smooth(px, 7, 16);
        if (a > 0.01) this.strokeSegments(segs, 1, ink(a));
      }
    }
    this.strokeSegments(e[0] ?? [], 2.2, ink(0.7));

    // Fog drifts over forgotten land.
    for (const c of cells) {
      if (this.info.get(c)?.state !== "nebel") continue;
      const [sx, sy] = this.toScreen(c.x, c.y);
      const r = this.cam.scale * 1.9;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, css(t.fog, 0.88));
      g.addColorStop(0.55, css(t.fog, 0.55));
      g.addColorStop(1, css(t.fog, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.pickMode && this.hover) this.drawHighlight(this.hover, t.accent, true);

    const detail = smooth(px, UNIT_PX - 8, UNIT_PX + 6);
    if (detail > 0) this.drawUnits(cells, detail);

    if (this.selection) this.drawHighlight(this.selection, t.accent, false);
    if (this.hover && !this.pickMode && JSON.stringify(this.hover) !== JSON.stringify(this.selection)) this.drawHighlight(this.hover, ink(0.55), false, 1.6);

    if (this.flash && this.flash.until > time) {
      const k = (this.flash.until - time) / 1800;
      for (const id of this.flash.ids) {
        const cell = this.layout.unitCell.get(id);
        if (!cell) continue;
        const [sx, sy] = this.toScreen(cell.x, cell.y);
        ctx.strokeStyle = `rgba(242,183,5,${k})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sx, sy, this.cam.scale * (1.2 + (1 - k) * 1.5), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (this.threadMode !== "aus") this.drawThreads();
    this.drawLabels();
  }

  private drawHighlight(sel: Selection, color: string, fill: boolean, width = 3): void {
    const ctx = this.ctx;
    let segs = this.outlines.get(`${sel.kind}:${sel.id}`);
    if (!segs) {
      if (sel.kind === "unit") {
        const cell = this.layout.unitCell.get(sel.id);
        segs = cell ? outline([cell], this.layout.byKey, () => false) : [];
      } else {
        const geom = this.layout.regions.get(sel.id);
        const level = this.lens.regions[sel.id]?.level ?? 1;
        segs = geom ? outline(geom.cells, this.layout.byKey, (a, b) => this.regionAt(a, level) === this.regionAt(b, level)) : [];
      }
      this.outlines.set(`${sel.kind}:${sel.id}`, segs);
    }
    if (fill) {
      const cells = sel.kind === "unit" ? ([this.layout.unitCell.get(sel.id)].filter(Boolean) as Cell[]) : (this.layout.regions.get(sel.id)?.cells ?? []);
      const p = new Path2D();
      for (const c of cells) this.hexPath(p, c);
      ctx.fillStyle = this.theme.dark ? "rgba(138,164,255,0.22)" : "rgba(35,64,181,0.16)";
      ctx.fill(p);
    }
    this.strokeSegments(segs, width + 3, this.theme.halo);
    this.strokeSegments(segs, width, color);
  }

  private drawUnits(cells: Cell[], alpha: number): void {
    const ctx = this.ctx;
    const t = this.theme;
    const px = this.hexPx;
    for (const c of cells) {
      if (!c.unit) continue;
      const unit = this.planet.units[c.unit];
      const info = this.info.get(c);
      if (!unit || !info) continue;
      const [sx, sy] = this.toScreen(c.x, c.y);
      const withTitle = px >= 70;
      const cy = withTitle ? sy - px * 0.2 : sy;
      const disc = px * (withTitle ? 0.5 : 0.62);
      const emblem = effectiveEmblem(this.atlas, unit.id)?.emblem;
      if (emblem) {
        ctx.globalAlpha = EMBLEM_ALPHA[info.state] * alpha;
        ctx.fillStyle = "rgba(255,253,248,0.92)";
        ctx.beginPath();
        ctx.arc(sx, cy, disc, 0, Math.PI * 2);
        ctx.fill();
        this.drawEmblemInside(emblem, sx, cy, disc, unit.title);
      }
      ctx.globalAlpha = alpha;
      if (info.due) {
        ctx.fillStyle = "#e8590c";
        ctx.strokeStyle = t.halo;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx + px * 0.55, sy - px * 0.55, Math.max(3, px * 0.09), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      if (withTitle || !emblem) {
        const size = Math.min(13, Math.max(10, px * 0.13));
        ctx.font = `600 ${size}px ${FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = withTitle ? "top" : "middle";
        const lines = wrap(ctx, shortTitle(unit.title), px * 1.55, withTitle ? 2 : 3);
        const y0 = withTitle ? sy + px * 0.38 : sy - ((lines.length - 1) * (size + 2)) / 2;
        lines.forEach((line, i) => {
          const y = y0 + i * (size + 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = t.halo;
          ctx.strokeText(line, sx, y);
          ctx.fillStyle = t.ink;
          ctx.fillText(line, sx, y);
        });
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawEmblemInside(emblem: Emblem | undefined, x: number, y: number, radius: number, fallback: string): void {
    const ctx = this.ctx;
    const img = emblem?.svg ? this.image(emblem.svg) : null;
    if (img) {
      const s = radius * 1.5;
      ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
      return;
    }
    const text = emblem?.glyph ?? initials(fallback);
    const size = Math.max(9, radius * (text.length > 3 ? 0.55 : 0.85));
    ctx.font = `700 ${size}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = EMBLEM_INK;
    ctx.fillText(text.length > 8 ? `${text.slice(0, 7)}…` : text, x, y + 1);
  }

  // ── Red threads ───────────────────────────────────────────────────────────

  private localEnd(unitId: string, level: number): End | null {
    const cell = this.layout.unitCell.get(unitId);
    if (!cell) return null;
    if (level > this.depth) return { id: unitId, x: cell.x, y: cell.y };
    const id = this.regionAt(cell, level);
    const g = this.layout.regions.get(id);
    if (!g) return null;
    if (level === 1) {
      const island = this.layout.islands.get(id);
      return { id, x: island?.x ?? g.labelX, y: island?.y ?? g.labelY };
    }
    return { id, x: g.labelX, y: g.labelY };
  }

  /** A portal on the coast of the local end's island, towards the other planet. */
  private portalEnd(local: End, localUnit: string, otherUnit: string, level: number): End | null {
    const other = planetOfUnit(this.atlas, otherUnit);
    const cell = this.layout.unitCell.get(localUnit);
    if (!other || !cell) return null;
    const island = this.layout.islands.get(cell.path[0]);
    if (!island) return null;
    let dx = local.x - island.x;
    let dy = local.y - island.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.5) {
      dx = 0.6;
      dy = -0.8;
    } else {
      dx /= d;
      dy /= d;
    }
    if (level > this.depth) {
      // Up close: right beside the unit, towards the coast.
      return { id: `ext:${localUnit}:${otherUnit}`, x: local.x + dx * 1.7, y: local.y + dy * 1.7 - 0.6, external: { planet: other, unit: otherUnit } };
    }
    const reach = island.radius + 1.6;
    return { id: `ext:${other.id}:${cell.path[0]}`, x: island.x + dx * reach, y: island.y + dy * reach, external: { planet: other, unit: otherUnit } };
  }

  private touches(thread: Thread, sel: Selection | null): boolean {
    if (!sel) return false;
    if (sel.kind === "unit") return thread.a === sel.id || thread.b === sel.id;
    const inside = new Set(unitIdsIn(this.lens, sel.id));
    return inside.has(thread.a) || inside.has(thread.b);
  }

  /** Threads bundled to the current level: one string per pair of places. */
  bundledThreads(): Bundle[] {
    const level = this.focusLevel();
    const pairs = new Map<string, Bundle>();
    for (const thread of this.threads) {
      const lit = this.touches(thread, this.selection) || (this.hover?.kind === "unit" && !this.pickMode && this.touches(thread, this.hover));
      if (this.threadMode === "auswahl" && !lit) continue;
      // Up close, a prerequisite string per unit would be spaghetti: show them around the focus only.
      if (level >= this.depth && thread.kind === "voraussetzung" && !lit && this.planet.units[thread.a] && this.planet.units[thread.b]) continue;
      const aLocal = Boolean(this.planet.units[thread.a]);
      const bLocal = Boolean(this.planet.units[thread.b]);
      let a = aLocal ? this.localEnd(thread.a, level) : null;
      let b = bLocal ? this.localEnd(thread.b, level) : null;
      if (a && !bLocal) b = this.portalEnd(a, thread.a, thread.b, level);
      if (b && !aLocal) a = this.portalEnd(b, thread.b, thread.a, level);
      if (!a || !b || a.id === b.id) continue;
      const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
      const entry = pairs.get(key);
      if (entry) {
        entry.threads.push(thread);
        entry.lit ||= lit;
      } else pairs.set(key, { a, b, threads: [thread], lit });
    }
    return [...pairs.values()];
  }

  private drawThreads(): void {
    const ctx = this.ctx;
    const t = this.theme;
    const bundles = this.bundledThreads();
    const anyLit = this.selection !== null && bundles.some((b) => b.lit);
    const pins = new Map<string, { x: number; y: number; lit: boolean; external?: End["external"] }>();
    const notes: Array<{ x: number; y: number; text: string }> = [];
    for (const bundle of bundles) {
      const [ax, ay] = this.toScreen(bundle.a.x, bundle.a.y);
      const [bx, by] = this.toScreen(bundle.b.x, bundle.b.y);
      const off = (x: number, y: number) => x < -200 || x > this.width + 200 || y < -200 || y > this.height + 200;
      if (off(ax, ay) && off(bx, by)) continue;
      const len = Math.hypot(bx - ax, by - ay);
      const sag = Math.min(70, len * 0.18);
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2 + sag;
      const kind = KIND_PRIORITY.find((k) => bundle.threads.some((x) => x.kind === k)) ?? "voraussetzung";
      const lead = bundle.threads.find((x) => x.kind === kind) ?? bundle.threads[0];
      // Orient the markers along the leading thread: its `a` end may be this bundle's b end.
      const flipped = this.sameEnd(bundle.b, lead.a);
      const width = (kind === "voraussetzung" ? 1.5 : 2.4) + Math.log2(bundle.threads.length) * 0.9;
      const color = kind === "voraussetzung" ? t.threadReq : t.thread;
      const dim = anyLit && !bundle.lit ? 0.18 : 1;
      ctx.globalAlpha = dim;
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(0,0,0,0.22)";
      ctx.lineWidth = width + 1;
      ctx.beginPath();
      ctx.moveTo(ax + 2, ay + 3);
      ctx.quadraticCurveTo(mx + 2, my + 4, bx + 2, by + 3);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      if (kind === "nutzt") ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(mx, my, bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      // UML-style ends, set back from the pins so both stay visible.
      const endA = this.endPoint(ax, ay, mx, my, bundle.a.external ? 17 : 9);
      const endB = this.endPoint(bx, by, mx, my, bundle.b.external ? 17 : 9);
      const [first, second] = flipped ? [endB, endA] : [endA, endB];
      this.drawMarkers(kind, first, second, color);
      const cx = 0.25 * ax + 0.5 * mx + 0.25 * bx;
      const cy = 0.25 * ay + 0.5 * my + 0.25 * by;
      if (bundle.threads.length > 1 && dim === 1) {
        const label = String(bundle.threads.length);
        ctx.font = `700 11px ${FONT}`;
        const w = ctx.measureText(label).width + 10;
        ctx.fillStyle = t.surface;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        roundRect(ctx, cx - w / 2, cy - 8, w, 16, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = t.ink;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, cx, cy + 0.5);
      }
      // Notes on prerequisites only around one selected unit; a selected region would bury the map in paper.
      const unitFocus = this.selection?.kind === "unit";
      const noteThread = bundle.threads.find((x) => x.note && x.kind !== "voraussetzung") ?? (bundle.lit && unitFocus ? bundle.threads.find((x) => x.note) : undefined);
      if (noteThread?.note && bundle.threads.length === 1 && bundle.lit) notes.push({ x: cx, y: cy, text: noteThread.note });
      for (const [end, sx, sy] of [[bundle.a, ax, ay], [bundle.b, bx, by]] as const) {
        const prev = pins.get(end.id);
        pins.set(end.id, { x: sx, y: sy, lit: (prev?.lit ?? false) || bundle.lit || !anyLit, external: end.external });
      }
    }
    ctx.globalAlpha = 1;
    for (const pin of pins.values()) {
      ctx.globalAlpha = pin.lit ? 1 : 0.3;
      if (pin.external) this.drawPortal(pin.x, pin.y, pin.external);
      else this.drawPin(pin.x, pin.y);
    }
    ctx.globalAlpha = 1;
    for (const note of notes.slice(0, 12)) this.drawNote(note.x, note.y, note.text);
  }

  /** Does a bundle end stand for this unit (at the current level)? */
  private sameEnd(end: End, unitId: string): boolean {
    if (end.external) return !this.planet.units[unitId];
    const cell = this.layout.unitCell.get(unitId);
    if (!cell) return false;
    const level = this.focusLevel();
    return end.id === (level > this.depth ? unitId : this.regionAt(cell, level));
  }

  /** A point `back` px from an end along the curve, plus the direction into the end. */
  private endPoint(x: number, y: number, cx: number, cy: number, back: number): { x: number; y: number; ux: number; uy: number } {
    let ux = x - cx;
    let uy = y - cy;
    const d = Math.hypot(ux, uy) || 1;
    ux /= d;
    uy /= d;
    return { x: x - ux * back, y: y - uy * back, ux, uy };
  }

  /** Ends by kind: `first` is the thread's a end, `second` its b end. */
  private drawMarkers(kind: ThreadKind, first: { x: number; y: number; ux: number; uy: number }, second: { x: number; y: number; ux: number; uy: number }, color: string): void {
    const ctx = this.ctx;
    const head = (p: typeof first, size: number, fill: string | null) => {
      const nx = -p.uy;
      const ny = p.ux;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.ux * size + nx * size * 0.55, p.y - p.uy * size + ny * size * 0.55);
      if (fill === null) {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.ux * size - nx * size * 0.55, p.y - p.uy * size - ny * size * 0.55);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        return;
      }
      ctx.lineTo(p.x - p.ux * size - nx * size * 0.55, p.y - p.uy * size - ny * size * 0.55);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    switch (kind) {
      case "voraussetzung":
        head(first, 10, color);
        break;
      case "nutzt":
        head(second, 11, null);
        break;
      case "ist-ein":
        head(second, 13, this.theme.surface);
        break;
      case "schnittstelle": {
        // Ball at the provider, socket at the user.
        ctx.fillStyle = this.theme.surface;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(first.x, first.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const angle = Math.atan2(second.uy, second.ux);
        ctx.beginPath();
        ctx.arc(second.x + second.ux * 2, second.y + second.uy * 2, 8, angle + Math.PI / 2, angle + (3 * Math.PI) / 2);
        ctx.stroke();
        break;
      }
      case "verbindung":
        break;
    }
  }

  private drawPin(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.arc(x + 1.5, y + 2.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, 5);
    g.addColorStop(0, "#ff8a8a");
    g.addColorStop(1, "#b3121b");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  /** A thread leaving the planet: a small disc with the other planet's Sinnbild; click to go there. */
  private drawPortal(x: number, y: number, ext: NonNullable<End["external"]>): void {
    const ctx = this.ctx;
    const r = 13;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.arc(x + 2, y + 3, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fffdf8";
    ctx.strokeStyle = this.theme.thread;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    this.drawEmblemInside(PLANET_EMBLEMS[ext.planet.kind], x, y, r * 0.95, ext.planet.name);
    this.portals.push({ x, y, r, planet: ext.planet.id, unit: ext.unit });
    if (this.hexPx >= 26 || this.selection) {
      const unit = findUnit(this.atlas, ext.unit);
      const label = `${ext.planet.name}: ${unit ? shortTitle(unit.title) : ""}`;
      ctx.font = `600 11px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.lineWidth = 3;
      ctx.strokeStyle = this.theme.halo;
      ctx.strokeText(label, x, y + r + 3);
      ctx.fillStyle = this.theme.ink;
      ctx.fillText(label, x, y + r + 3);
    }
  }

  private drawNote(x: number, y: number, text: string): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y + 14);
    ctx.rotate(-0.035);
    ctx.font = `italic 500 12px ${FONT}`;
    const lines = wrap(ctx, text, 190, 3);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 16;
    const h = lines.length * 15 + 10;
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(-w / 2 + 2, 3, w, h);
    ctx.fillStyle = "#fff8d6";
    ctx.fillRect(-w / 2, 0, w, h);
    ctx.fillStyle = "#3d3420";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    lines.forEach((l, i) => ctx.fillText(l, -w / 2 + 8, 6 + i * 15));
    ctx.restore();
  }

  // ── Labels ────────────────────────────────────────────────────────────────

  private drawLabels(): void {
    const ctx = this.ctx;
    const t = this.theme;
    const placed: LabelBox[] = [];
    const free = (box: LabelBox) => !placed.some((p) => box.x < p.x + p.w && box.x + box.w > p.x && box.y < p.y + p.h && box.y + box.h > p.y);
    const scale = this.cam.scale;
    const px = this.hexPx;
    const depth = this.depth;

    // Islands: titles in the sea above each one.
    for (const id of this.lens.roots) {
      const g = this.layout.regions.get(id);
      if (!g) continue;
      const alpha = 1 - smooth(g.radius * scale, 500, 800);
      if (alpha <= 0.02) continue;
      const [sx, sy] = this.toScreen((g.minX + g.maxX) / 2, g.minY - 0.9);
      const name = this.lens.regions[id].name.toUpperCase();
      ctx.globalAlpha = alpha;
      ctx.font = `800 15px ${FONT}`;
      const spaced = name.split("").join(" ");
      const tw = ctx.measureText(spaced).width;
      const e = 30;
      const x0 = sx - (tw + e + 8) / 2;
      this.drawEmblemDisc(id, x0 + e / 2, sy - 6, e / 2, this.lens.colorLevel === 1 ? this.regionColor(id) : "#6b7280");
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 5;
      ctx.strokeStyle = t.halo;
      ctx.strokeText(spaced, x0 + e + 8, sy - 6);
      ctx.fillStyle = t.ink;
      ctx.fillText(spaced, x0 + e + 8, sy - 6);
      placed.push({ x: x0, y: sy - 22, w: tw + e + 8, h: 32 });
      ctx.globalAlpha = 1;
    }

    // Big, faint names over the land once a region fills the view.
    for (const g of this.layout.regions.values()) {
      if (g.level < 2 || g.level >= depth) continue;
      const R = g.radius * scale;
      const start = g.level === 2 ? 150 : 170;
      const alpha = smooth(R, start, start * 1.4) * (1 - smooth(R, 700, 1100)) * 0.32;
      if (alpha <= 0.02) continue;
      const [sx, sy] = this.toScreen(g.labelX, g.labelY);
      const size = Math.max(16, Math.min(46, R * 0.13));
      ctx.globalAlpha = alpha;
      ctx.font = `800 ${size}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = t.ink;
      ctx.fillText(this.lens.regions[g.id].name.toUpperCase().split("").join(" "), sx, sy + (g.level === 2 ? -size * 0.6 : size * 0.6));
      ctx.globalAlpha = 1;
    }

    // Emblem labels: shallow levels first, larger places first.
    const geoms = [...this.layout.regions.values()].filter((g) => g.level >= 2).sort((a, b) => a.level - b.level || b.radius - a.radius);
    for (const g of geoms) {
      const R = g.radius * scale;
      let alpha: number;
      if (g.level === depth) alpha = smooth(R, 30, 46) * (1 - smooth(px, UNIT_PX - 4, UNIT_PX + 10));
      else if (g.level === 2) alpha = smooth(R, 18, 30) * (1 - smooth(R, 120, 165));
      else alpha = smooth(R, 30, 44) * (1 - smooth(R, 135, 185));
      if (alpha <= 0.05) continue;
      const [sx, sy] = this.toScreen(g.labelX, g.labelY);
      if (sx < -100 || sy < -100 || sx > this.width + 100 || sy > this.height + 100) continue;
      const e = Math.max(18, Math.min(g.level === 2 ? 30 : g.level === depth ? 22 : 26, R * 0.36));
      const region = this.lens.regions[g.id];
      const size = g.level === 2 ? 14 : g.level === depth ? 11.5 : 12.5;
      ctx.font = `${g.level === depth ? 600 : 700} ${size}px ${FONT}`;
      const lines = wrap(ctx, region.name, Math.max(90, Math.min(170, R * 1.5)), 2);
      const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const box = { x: sx - Math.max(tw, e * 2) / 2 - 2, y: sy - e - 2, w: Math.max(tw, e * 2) + 4, h: e * 2 + lines.length * (size + 2) + 6 };
      if (!free(box)) continue;
      placed.push(box);
      ctx.globalAlpha = alpha;
      this.drawEmblemDisc(g.id, sx, sy - e * 0.35, e * 0.62 + 4, this.regionColor(g.id));
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      lines.forEach((line, i) => {
        const y = sy + e * 0.45 + i * (size + 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = t.halo;
        ctx.strokeText(line, sx, y);
        ctx.fillStyle = t.ink;
        ctx.fillText(line, sx, y);
      });
      ctx.globalAlpha = 1;
    }
  }

  private drawEmblemDisc(id: string, x: number, y: number, radius: number, ring: string): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#fffdf8";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = ring;
    ctx.stroke();
    const emblem = displayEmblem(this.atlas, id) ?? undefined;
    this.drawEmblemInside(emblem, x, y, radius * 0.95, this.lens.regions[id]?.name ?? "");
  }
}

// ── Text helpers ────────────────────────────────────────────────────────────

function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 || /\p{Lu}/u.test(w));
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join("") || name.slice(0, 2);
}

/** "Satz des Pythagoras: a² + b² = c²" → "Satz des Pythagoras"; a short prefix ("Archiv-API: Rate Limits") keeps the whole title. */
export function shortTitle(title: string): string {
  const head = title.split(/[:(]/)[0].trim();
  return head.length >= 14 ? head : title;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else line = next;
  }
  if (lines.length < maxLines && line) lines.push(line);
  else if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > width && last.length > 1) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
