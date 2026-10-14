/**
 * The atlas as a zoomable 2D map on a canvas: one lens at a time (ADR
 * 2026-10-13, Decisions 3–7). Ported from the knowledge-atlas spike's
 * `render.ts` (PR #405).
 *
 * Sinnbilder are drawn only as images of the validator's canonical form
 * (`emblemDataUrl` into an `Image`, then `drawImage`), never as markup.
 *
 * Colour says where: each region on the lens's colour level has its subject
 * hue, and the level below gets a shade and a pattern. The condition says how
 * well: it washes, darkens or fogs the hue, and a texture repeats it (dust,
 * cracks, fog, hatching), so colour never carries the meaning alone. Blank
 * land, a unit the learner does not hold, gets neither texture nor name.
 *
 * Zooming is semantic: far out the islands and their first level read, closer
 * in the deeper levels, closest the learning units. Red threads are bundled
 * to the level in view, like relationships in C4. Their ends follow UML
 * (Decision 7), and every kind is also named in words. A thread to the
 * library's other planet ends at a portal; a click goes there.
 *
 * No Tauri and no `main.ts`: the MCP Apps panel can reuse it (Phase 10).
 */

import type {
  AtlasPlanetWire,
  AtlasThreadKindWire,
  AtlasThreadWire,
} from "../../../src/bridge/protocol.js";
import { emblemDataUrl } from "../../../src/kernel/atlas/emblem.js";
import {
  CONDITION_TEXTURE,
  conditionFill,
  hslToRgb,
  type PaletteTheme,
  type Rgb,
  rgbCss,
} from "../../../src/kernel/atlas/palette.js";
import {
  type AtlasLayout,
  type Cell,
  CORNERS,
  emblemOf,
  outline,
  type PatternKind,
  type Segment,
} from "./layout.js";

export type Selection =
  | { kind: "unit"; key: string }
  | { kind: "region"; key: string };
export type ThreadMode = "all" | "selection" | "off";

interface Theme {
  dark: boolean;
  /** Each planet has its own colour of sea (ADR 2026-10-13, Decision 2). */
  sea: Readonly<Record<"welt" | "firma" | "privat", string>>;
  shallow: string;
  shore: string;
  fog: Rgb;
  ink: string;
  inkRgb: string;
  halo: string;
  surface: string;
  /** Prerequisite threads. */
  thread: string;
  /** The other kinds: nutzt, Schnittstelle, ist ein, Verbindung. */
  threadLink: string;
  accent: string;
  accentFill: string;
  due: string;
  /** Pencil lines of a sketched unit. */
  pencil: string;
}

const LIGHT: Theme = {
  dark: false,
  sea: { welt: "#c9dde8", firma: "#cdd8d4", privat: "#e2d8e6" },
  shallow: "rgba(255,255,255,0.32)",
  shore: "#efe5cf",
  fog: [238, 242, 246],
  ink: "#1d2b4f",
  inkRgb: "29,43,79",
  halo: "rgba(255,255,255,0.92)",
  surface: "#ffffff",
  thread: "#9c2a3c",
  threadLink: "#d62828",
  accent: "#2340b5",
  accentFill: "rgba(35,64,181,0.16)",
  due: "#e8590c",
  pencil: "rgba(70,62,52,0.72)",
};

const DARK: Theme = {
  dark: true,
  sea: { welt: "#0d1922", firma: "#0f1c1a", privat: "#1a1420" },
  shallow: "rgba(255,255,255,0.05)",
  shore: "#2a2a22",
  fog: [128, 140, 154],
  ink: "#e6ecf3",
  inkRgb: "230,236,243",
  halo: "rgba(10,16,22,0.88)",
  surface: "#1a2430",
  thread: "#d2647a",
  threadLink: "#ff5c5c",
  accent: "#8aa4ff",
  accentFill: "rgba(138,164,255,0.22)",
  due: "#f29a4a",
  pencil: "rgba(214,208,196,0.7)",
};

/** Sinnbild discs are light in both themes (spike lesson). */
const DISC_FILL = "#fffdf8";
const DISC_INK = "#1d2b4f";

/** Hex radius in px from which single learning units are the focus. */
export const UNIT_PX = 40;
/** From here a unit with a Sinnbild shows its title below it too. */
const UNIT_TITLE_PX = 70;

/** Room kept above the land for the island titles. */
const TOP_INSET = 30;

const smooth = (x: number, a: number, b: number): number => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ── Patterns (drawn in screen space, so they read the same at every zoom) ──

function tile(
  size: number,
  draw: (g: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
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
        for (const [x, y] of [
          [4, 4],
          [12, 12],
        ]) {
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
      g.fillStyle = dark
        ? `rgba(200,190,170,${0.25 + r() * 0.4})`
        : `rgba(120,100,70,${0.25 + r() * 0.45})`;
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
    for (const [x, y] of [
      [6, 14],
      [38, 36],
      [14, 52],
    ]) {
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 5, y - 4, x + 10, y);
      g.quadraticCurveTo(x + 15, y + 4, x + 20, y);
      g.stroke();
    }
  });
}

// ── The view ────────────────────────────────────────────────────────────────

type Texture = "none" | "dust" | "cracks" | "fog" | "parchment";

interface CellInfo {
  fill: string;
  texture: Texture;
  /** In reach with *Neue Inhalte zeigen*: drawn as a pencil sketch. */
  sketch: boolean;
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
  key: string;
  x: number;
  y: number;
  /** A unit on the library's other planet: drawn as a portal. */
  portal?: { planet: AtlasPlanetWire; unit: string; title: string };
}

interface Bundle {
  a: End;
  b: End;
  threads: AtlasThreadWire[];
  lit: boolean;
}

/** A point set back from a thread's end, and the direction into that end. */
interface EndPoint {
  x: number;
  y: number;
  ux: number;
  uy: number;
}

/** Words the map writes beside threads and portals, in the view's language. */
export interface MapWords {
  kinds: Readonly<Record<AtlasThreadKindWire, string>>;
  planets: Readonly<Record<AtlasPlanetWire, string>>;
}

const DEFAULT_WORDS: MapWords = {
  kinds: {
    voraussetzung: "baut auf",
    nutzt: "nutzt",
    schnittstelle: "Schnittstelle",
    "ist-ein": "ist ein",
    verbindung: "Verbindung",
  },
  planets: { welt: "Welt", firma: "Firma", privat: "Privat" },
};

/** Where an island's portal sits on its coast: lower left, below the title. */
const PORTAL_BEARING: readonly [number, number] = [-Math.SQRT1_2, Math.SQRT1_2];

/** Which kind a bundle of threads shows: the most specific one present. */
const KIND_PRIORITY: readonly AtlasThreadKindWire[] = [
  "schnittstelle",
  "nutzt",
  "ist-ein",
  "verbindung",
  "voraussetzung",
];

export interface MapEvents {
  onClick(target: Selection | null): void;
  /** A portal was clicked: open that planet at that unit. */
  onPortal(planet: AtlasPlanetWire, unitKey: string): void;
  onDoubleClick(target: Selection | null): void;
  onHover(target: Selection | null, x: number, y: number): void;
  onCamera(): void;
}

export class AtlasMap {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private dpr = 1;
  width = 0;
  height = 0;
  cam: Camera = { x: 0, y: 0, scale: 12 };

  layout: AtlasLayout | null = null;
  selection: Selection | null = null;
  hover: Selection | null = null;
  threadMode: ThreadMode = "all";
  words: MapWords = DEFAULT_WORDS;

  private theme: Theme = LIGHT;
  private font = "system-ui, sans-serif";
  private info = new Map<Cell, CellInfo>();
  private patterns = new Map<string, CanvasPattern>();
  private outlines = new Map<string, Segment[]>();
  /** Sinnbild images by canonical SVG; drawn once loaded. */
  private images = new Map<string, HTMLImageElement>();
  /** Portals as last drawn, in screen space, for clicks. */
  private portals: Array<{
    x: number;
    y: number;
    r: number;
    planet: AtlasPlanetWire;
    unit: string;
  }> = [];
  private frame = 0;
  private anim: { from: Camera; to: Camera; start: number; ms: number } | null =
    null;
  private readonly cleanup: Array<() => void> = [];
  private readonly whenSized: Array<() => void> = [];

  constructor(
    canvas: HTMLCanvasElement,
    private readonly events: MapEvents,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const family = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-ui")
      .trim();
    if (family) this.font = family;
    const applyTheme = () => {
      this.theme =
        document.documentElement.dataset.theme === "dark" ? DARK : LIGHT;
      this.patterns.clear();
      if (this.layout) this.recolor();
      this.requestDraw();
    };
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    this.cleanup.push(() => themeObserver.disconnect());
    applyTheme();
    const resize = new ResizeObserver(() => this.resize());
    resize.observe(canvas);
    this.cleanup.push(() => resize.disconnect());
    this.resize();
    this.bindInput();
  }

  destroy(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    for (const fn of this.cleanup.splice(0)) fn();
  }

  get paletteTheme(): PaletteTheme {
    return this.theme.dark ? "dark" : "light";
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  get depth(): number {
    return this.layout?.depth ?? 1;
  }

  setLayout(layout: AtlasLayout): void {
    this.layout = layout;
    this.outlines.clear();
    // Keep only the images this read still shows.
    const shown = new Set(
      Object.values(layout.view.emblems ?? {}).map((e) => e.svg),
    );
    for (const svg of this.images.keys()) {
      if (!shown.has(svg)) this.images.delete(svg);
    }
    if (this.selection && !this.exists(this.selection)) this.selection = null;
    if (this.hover && !this.exists(this.hover)) this.hover = null;
    this.recolor();
  }

  exists(sel: Selection): boolean {
    if (!this.layout) return false;
    return sel.kind === "unit"
      ? this.layout.unitCell.has(sel.key)
      : this.layout.geoms.has(sel.key);
  }

  /** Recompute fills and textures (after a read or a theme change). */
  private recolor(): void {
    this.info.clear();
    const layout = this.layout;
    if (!layout) return;
    const theme = this.paletteTheme;
    for (const cell of layout.cells) {
      const unit = cell.unit;
      const condition = unit?.condition ?? null;
      const fill = conditionFill(cell.hue, condition, theme, cell.shade);
      let texture: Texture = "none";
      if (condition) texture = CONDITION_TEXTURE[condition];
      // A unit in reach (Neue Inhalte zeigen) is sketched in like one never practised.
      else if (unit?.inReach) texture = "parchment";
      this.info.set(cell, {
        fill: rgbCss(fill),
        texture,
        sketch: unit?.inReach === true,
      });
    }
    this.requestDraw();
  }

  /** Ink colour of a region, for rings and text accents. */
  regionColor(key: string): string {
    const region = this.layout?.regions.get(key);
    if (!region || !this.layout) return this.theme.ink;
    if (region.level < this.layout.colourLevel) return "#6b7280";
    return rgbCss(hslToRgb(region.hue, 62, this.theme.dark ? 50 : 46));
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
    if (this.width > 0 && this.height > 0) {
      for (const fn of this.whenSized.splice(0)) fn();
    }
    this.requestDraw();
  }

  /** Run `fn` once the canvas has a size: at once, or after its first layout. */
  afterSized(fn: () => void): void {
    if (this.width > 0 && this.height > 0) fn();
    else this.whenSized.push(fn);
  }

  toScreen(x: number, y: number): [number, number] {
    return [
      (x - this.cam.x) * this.cam.scale + this.width / 2,
      (y - this.cam.y) * this.cam.scale + this.height / 2,
    ];
  }

  toWorld(sx: number, sy: number): [number, number] {
    return [
      (sx - this.width / 2) / this.cam.scale + this.cam.x,
      (sy - this.height / 2) / this.cam.scale + this.cam.y,
    ];
  }

  private fitScale(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    pad = 60,
  ): number {
    const w = Math.max(100, this.width - pad * 2);
    const h = Math.max(100, this.height - pad * 2 - TOP_INSET);
    return Math.min(w / Math.max(1, maxX - minX), h / Math.max(1, maxY - minY));
  }

  private fitBox(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    animate: boolean,
    pad = 60,
    maxScale = 110,
  ): void {
    const scale = Math.min(
      maxScale,
      this.fitScale(minX, minY, maxX, maxY, pad),
    );
    const to = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2 - TOP_INSET / 2 / scale,
      scale,
    };
    this.moveCamera(to, animate);
  }

  fitAll(animate = true): void {
    const l = this.layout;
    if (!l) return;
    this.fitBox(l.minX - 1, l.minY - 3, l.maxX + 1, l.maxY + 1, animate, 40);
  }

  fitRegion(key: string, animate = true): void {
    const g = this.layout?.geoms.get(key);
    if (!g) return;
    const pad = g.level === 0 ? 70 : 110;
    // A small Thema would fill the screen; units read well at this size.
    this.fitBox(g.minX, g.minY, g.maxX, g.maxY, animate, pad, 64);
  }

  /** The learner's home: their own area in the middle, read at its own level, the neighbours around it. */
  fitHome(key: string, animate = true): void {
    const g = this.layout?.geoms.get(key);
    if (!g) return;
    const w = g.maxX - g.minX;
    const h = g.maxY - g.minY;
    const grow = Math.max(w, h) * 0.5 + 3;
    this.fitBox(
      g.minX - grow,
      g.minY - grow,
      g.maxX + grow,
      g.maxY + grow,
      animate,
      40,
      UNIT_PX - 6,
    );
  }

  focusUnit(key: string, animate = true): void {
    const cell = this.layout?.unitCell.get(key);
    if (cell) {
      this.moveCamera(
        { x: cell.x, y: cell.y, scale: Math.max(this.cam.scale, 52) },
        animate,
      );
    }
  }

  moveCamera(to: Camera, animate = true): void {
    const clamped = { ...to, scale: this.clampScale(to.scale) };
    if (
      !animate ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      this.cam = clamped;
      this.anim = null;
      this.events.onCamera();
      this.requestDraw();
      return;
    }
    this.anim = {
      from: { ...this.cam },
      to: clamped,
      start: performance.now(),
      ms: 520,
    };
    this.requestDraw();
  }

  zoomBy(factor: number, sx = this.width / 2, sy = this.height / 2): void {
    const [wx, wy] = this.toWorld(sx, sy);
    const scale = this.clampScale(this.cam.scale * factor);
    this.cam.scale = scale;
    this.cam.x = wx - (sx - this.width / 2) / scale;
    this.cam.y = wy - (sy - this.height / 2) / scale;
    this.anim = null;
    this.events.onCamera();
    this.requestDraw();
  }

  panBy(dx: number, dy: number): void {
    this.cam.x += dx / this.cam.scale;
    this.cam.y += dy / this.cam.scale;
    this.anim = null;
    this.events.onCamera();
    this.requestDraw();
  }

  private clampScale(scale: number): number {
    const l = this.layout;
    const min = l
      ? Math.min(6, this.fitScale(l.minX, l.minY, l.maxX, l.maxY) * 0.6)
      : 2;
    return Math.max(min, Math.min(160, scale));
  }

  // ── Levels ────────────────────────────────────────────────────────────────

  /**
   * The level the eye is on: what clicks select and threads bundle to.
   * `depth` means single units.
   */
  focusLevel(): number {
    const layout = this.layout;
    if (!layout) return 0;
    const depth = layout.depth;
    if (this.hexPx >= UNIT_PX) return depth;
    const px = (level: number) =>
      (layout.medianRadius[level] ?? 1) * this.cam.scale;
    for (let level = depth - 1; level >= 1; level -= 1) {
      const need = level === depth - 1 ? 46 : level === 1 ? 24 : 52;
      if (px(level) >= need) return level;
    }
    return 0;
  }

  regionAt(cell: Cell, level: number): string {
    return cell.path[Math.min(level, cell.path.length - 1)];
  }

  targetAt(cell: Cell | null): Selection | null {
    if (!cell) return null;
    const level = this.focusLevel();
    if (level >= this.depth) {
      return cell.unit
        ? { kind: "unit", key: cell.unit.key }
        : { kind: "region", key: cell.path[cell.path.length - 1] };
    }
    return { kind: "region", key: this.regionAt(cell, level) };
  }

  cellAt(sx: number, sy: number): Cell | null {
    if (!this.layout) return null;
    const [x, y] = this.toWorld(sx, sy);
    const qf = (Math.sqrt(3) / 3) * x - y / 3;
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

  /** The cell nearest the middle of the view (for the breadcrumb). */
  centerCell(): Cell | null {
    if (!this.layout) return null;
    const [x, y] = this.toWorld(this.width / 2, this.height / 2);
    let best: Cell | null = null;
    let bestD = Number.POSITIVE_INFINITY;
    for (const c of this.layout.cells) {
      const d = (c.x - x) ** 2 + (c.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best &&
      Math.sqrt(bestD) * this.cam.scale <
        Math.min(this.width, this.height) * 0.35
      ? best
      : null;
  }

  /** The deepest region that fills most of the view. */
  viewRegion(): string | null {
    const cell = this.centerCell();
    if (!cell || !this.layout) return null;
    const view = Math.min(this.width, this.height);
    let key: string | null = null;
    for (let level = 0; level < this.depth; level += 1) {
      const rk = this.regionAt(cell, level);
      const g = this.layout.geoms.get(rk);
      if (g && g.radius * this.cam.scale * 2 >= view * 0.55) key = rk;
    }
    return key;
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private bindInput(): void {
    let down: {
      x: number;
      y: number;
      cx: number;
      cy: number;
      moved: boolean;
    } | null = null;
    const c = this.canvas;
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
      options?: AddEventListenerOptions,
    ) => {
      c.addEventListener(type, fn, options);
      this.cleanup.push(() => c.removeEventListener(type, fn, options));
    };
    on("pointerdown", (e) => {
      if (e.button !== 0) return;
      c.setPointerCapture(e.pointerId);
      down = {
        x: e.clientX,
        y: e.clientY,
        cx: this.cam.x,
        cy: this.cam.y,
        moved: false,
      };
      this.anim = null;
    });
    on("pointermove", (e) => {
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
      const target = this.targetAt(this.cellAt(sx, sy));
      const changed = !sameSelection(target, this.hover);
      this.hover = target;
      c.style.cursor = target ? "pointer" : "grab";
      this.events.onHover(target, e.clientX, e.clientY);
      if (changed) this.requestDraw();
    });
    on("pointerup", (e) => {
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
      this.events.onClick(this.targetAt(this.cellAt(sx, sy)));
    });
    on("pointerleave", () => {
      this.hover = null;
      this.events.onHover(null, 0, 0);
      this.requestDraw();
    });
    on("dblclick", (e) => {
      const rect = c.getBoundingClientRect();
      const cell = this.cellAt(e.clientX - rect.left, e.clientY - rect.top);
      this.events.onDoubleClick(this.targetAt(cell));
    });
    on(
      "wheel",
      (e) => {
        e.preventDefault();
        const rect = c.getBoundingClientRect();
        const pinch = e.ctrlKey;
        if (
          !pinch &&
          Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5 &&
          e.deltaMode === 0 &&
          Math.abs(e.deltaX) > 2
        ) {
          this.panBy(e.deltaX, e.deltaY);
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
        const ls =
          Math.log(from.scale) +
          (Math.log(to.scale) - Math.log(from.scale)) * e;
        this.cam = {
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e,
          scale: Math.exp(ls),
        };
        if (k >= 1) this.anim = null;
        this.events.onCamera();
        this.requestDraw();
      }
      this.draw();
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

  private hexPath(path: Path2D, cell: Cell, grow = 1): void {
    const [sx, sy] = this.toScreen(cell.x, cell.y);
    const r = this.cam.scale * grow + 0.6;
    path.moveTo(sx + CORNERS[0][0] * r, sy + CORNERS[0][1] * r);
    for (let i = 1; i < 6; i += 1) {
      path.lineTo(sx + CORNERS[i][0] * r, sy + CORNERS[i][1] * r);
    }
    path.closePath();
  }

  private visible(cell: Cell, margin = 2): boolean {
    const [sx, sy] = this.toScreen(cell.x, cell.y);
    const m = this.cam.scale * margin;
    return sx > -m && sy > -m && sx < this.width + m && sy < this.height + m;
  }

  private strokeSegments(
    segments: readonly Segment[],
    width: number,
    color: string,
  ): void {
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

  private draw(): void {
    const ctx = this.ctx;
    const t = this.theme;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = t.sea[this.layout?.view.lens.planet ?? "welt"];
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = this.pattern("sea", () => seaTile(t.dark));
    ctx.fillRect(0, 0, this.width, this.height);
    const layout = this.layout;
    if (!layout || layout.cells.length === 0) return;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const cells = layout.cells.filter((c) => this.visible(c));
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
    const patternAlpha =
      (t.dark ? 0.22 : 0.17) * (1 - 0.65 * smooth(px, 20, 60));
    const byShade = new Map<string, Path2D>();
    for (const c of cells) {
      if (this.info.get(c)?.texture === "fog") continue;
      const key = c.path[layout.colourLevel + 1];
      if (!key) continue;
      let p = byShade.get(key);
      if (!p) {
        p = new Path2D();
        byShade.set(key, p);
      }
      this.hexPath(p, c);
    }
    ctx.globalAlpha = patternAlpha;
    for (const [key, p] of byShade) {
      const kind = layout.regions.get(key)?.pattern ?? "diag";
      ctx.fillStyle = this.pattern(`p:${kind}`, () =>
        patternTile(kind, t.dark ? "#ffffff" : "#000000"),
      );
      ctx.fill(p);
    }
    ctx.globalAlpha = 1;

    // Condition textures.
    const byTexture = (texture: Texture) => {
      const p = new Path2D();
      let any = false;
      for (const c of cells) {
        if (this.info.get(c)?.texture === texture) {
          this.hexPath(p, c);
          any = true;
        }
      }
      return any ? p : null;
    };
    const dust = byTexture("dust");
    if (dust) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = this.pattern("dust", () => dustTile(t.dark));
      ctx.fill(dust);
    }
    const cracks = byTexture("cracks");
    if (cracks) {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = this.pattern("cracks", () => crackTile(t.dark));
      ctx.fill(cracks);
    }
    const raw = byTexture("parchment");
    if (raw) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = this.pattern("hatch", () =>
        hatchTile(t.dark ? "rgba(255,255,255,0.35)" : "rgba(90,70,40,0.55)"),
      );
      ctx.fill(raw);
    }
    ctx.globalAlpha = 1;

    // Units in reach are pencil sketches: a dashed outline, from a middling
    // zoom on (Decision 1). Not started and never to be started look alike.
    const sketched = cells.filter((c) => this.info.get(c)?.sketch);
    const sketchAlpha = smooth(px, 8, 16);
    if (sketched.length > 0 && sketchAlpha > 0) {
      const pencil = new Path2D();
      for (const c of sketched) this.hexPath(pencil, c, 0.8);
      ctx.globalAlpha = sketchAlpha;
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = t.pencil;
      ctx.stroke(pencil);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Single units read as hexes once they are the focus.
    const detail = smooth(px, UNIT_PX - 8, UNIT_PX + 6);
    if (detail > 0) {
      const units = new Path2D();
      for (const c of cells) if (c.unit) this.hexPath(units, c, 0.94);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${t.inkRgb},${0.18 * detail})`;
      ctx.stroke(units);
    }

    // Borders: deeper levels fainter; the coast strongest.
    const e = layout.edges;
    const ink = (a: number) => `rgba(${t.inkRgb},${a})`;
    for (let level = layout.depth - 1; level >= 1; level -= 1) {
      const segs = e[level] ?? [];
      if (segs.length === 0) continue;
      if (level === 1) {
        this.strokeSegments(segs, 4.2, t.halo);
        this.strokeSegments(segs, 2, ink(0.82));
      } else if (level === 2) {
        this.strokeSegments(segs, 1.4, ink(0.42 * smooth(px, 3, 8) + 0.12));
      } else {
        const a = 0.28 * smooth(px, 7, 16);
        if (a > 0.01) this.strokeSegments(segs, 1, ink(a));
      }
    }
    this.strokeSegments(e[0] ?? [], 2.2, ink(0.7));

    // Fog drifts over forgotten land.
    for (const c of cells) {
      if (this.info.get(c)?.texture !== "fog") continue;
      const [sx, sy] = this.toScreen(c.x, c.y);
      const r = this.cam.scale * 1.9;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0, rgbCss(t.fog, 0.88));
      g.addColorStop(0.55, rgbCss(t.fog, 0.55));
      g.addColorStop(1, rgbCss(t.fog, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawMarks(cells);
    if (detail > 0) this.drawUnits(cells, detail);

    if (this.selection) this.drawHighlight(this.selection, t.accent, true);
    if (this.hover && !sameSelection(this.hover, this.selection)) {
      this.drawHighlight(this.hover, ink(0.55), false, 1.6);
    }

    this.portals = [];
    if (this.threadMode !== "off") this.drawThreads();
    this.drawLabels();
  }

  /** Due dots and the "eigene Einheit" corner mark, from a middling zoom on. */
  private drawMarks(cells: Cell[]): void {
    const ctx = this.ctx;
    const t = this.theme;
    const px = this.hexPx;
    if (px < 9) return;
    const alpha = smooth(px, 9, 16);
    ctx.globalAlpha = alpha;
    for (const c of cells) {
      const unit = c.unit;
      if (!unit) continue;
      const [sx, sy] = this.toScreen(c.x, c.y);
      if (unit.own) {
        // A folded corner at the upper left: own, not published (Decision 2).
        const r = px;
        const ax = sx + CORNERS[4][0] * r;
        const ay = sy + CORNERS[4][1] * r;
        // Light with an ink rim, so it reads on vivid and on dark land.
        const k = Math.max(5, px * 0.36);
        ctx.fillStyle = DISC_FILL;
        ctx.strokeStyle = DISC_INK;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + k * 0.87, ay - k * 0.5);
        ctx.lineTo(ax, ay + k);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      if (unit.due > 0) {
        ctx.fillStyle = t.due;
        ctx.strokeStyle = t.halo;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          sx + px * 0.55,
          sy - px * 0.55,
          Math.max(3, px * 0.09),
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawHighlight(
    sel: Selection,
    color: string,
    fill: boolean,
    width = 3,
  ): void {
    const layout = this.layout;
    if (!layout) return;
    const ctx = this.ctx;
    const id = `${sel.kind}:${sel.key}`;
    let segs = this.outlines.get(id);
    if (!segs) {
      if (sel.kind === "unit") {
        const cell = layout.unitCell.get(sel.key);
        segs = cell ? outline([cell], layout.byKey, () => false) : [];
      } else {
        const geom = layout.geoms.get(sel.key);
        const level = layout.regions.get(sel.key)?.level ?? 0;
        segs = geom
          ? outline(
              geom.cells,
              layout.byKey,
              (a, b) => this.regionAt(a, level) === this.regionAt(b, level),
            )
          : [];
      }
      this.outlines.set(id, segs);
    }
    if (fill) {
      const cells =
        sel.kind === "unit"
          ? [layout.unitCell.get(sel.key)].filter((c): c is Cell => !!c)
          : (layout.geoms.get(sel.key)?.cells ?? []);
      const p = new Path2D();
      for (const c of cells) this.hexPath(p, c);
      ctx.fillStyle = this.theme.accentFill;
      ctx.fill(p);
    }
    this.strokeSegments(segs, width + 3, this.theme.halo);
    this.strokeSegments(segs, width, color);
  }

  private drawUnits(cells: Cell[], alpha: number): void {
    const ctx = this.ctx;
    const t = this.theme;
    const px = this.hexPx;
    const layout = this.layout;
    for (const c of cells) {
      const unit = c.unit;
      if (!unit || !layout) continue;
      const [sx, sy] = this.toScreen(c.x, c.y);
      // A Sinnbild stands for the unit; its title joins once there is room.
      const emblem = emblemOf(layout, "unit", unit.key);
      const image = emblem ? this.image(emblem.svg) : null;
      const withTitle = !image || px >= UNIT_TITLE_PX;
      if (image) {
        const cy = withTitle ? sy - px * 0.2 : sy;
        const radius = px * (withTitle ? 0.36 : 0.5);
        // A sketched unit's Sinnbild is pencil-faint, like its title.
        ctx.globalAlpha = alpha * (unit.inReach ? 0.5 : 1);
        this.drawImageDisc(image, sx, cy, radius);
      }
      if (!withTitle) continue;
      ctx.globalAlpha = alpha;
      const size = Math.min(13, Math.max(10, px * 0.13));
      ctx.font = `600 ${size}px ${this.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = image ? "top" : "middle";
      const lines = wrap(ctx, shortTitle(unit.title), px * 1.55, image ? 2 : 3);
      const y0 = image
        ? sy + px * 0.22
        : sy - ((lines.length - 1) * (size + 2)) / 2;
      const ink = unit.inReach ? t.pencil : t.ink;
      lines.forEach((line, i) => {
        const y = y0 + i * (size + 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = t.halo;
        ctx.strokeText(line, sx, y);
        ctx.fillStyle = ink;
        ctx.fillText(line, sx, y);
      });
    }
    ctx.globalAlpha = 1;
  }

  /** A loaded Sinnbild image, or null while it loads (a redraw follows). */
  private image(svg: string): HTMLImageElement | null {
    let img = this.images.get(svg);
    if (!img) {
      img = new Image();
      img.decoding = "async";
      img.onload = () => this.requestDraw();
      img.src = emblemDataUrl(svg);
      this.images.set(svg, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  /** A light disc with a Sinnbild inside, in both themes. */
  private drawImageDisc(
    image: HTMLImageElement,
    x: number,
    y: number,
    radius: number,
    ring?: string,
  ): void {
    const ctx = this.ctx;
    ctx.fillStyle = DISC_FILL;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (ring) {
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = ring;
      ctx.stroke();
    } else {
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(29,43,79,0.25)";
      ctx.stroke();
    }
    const s = radius * 1.45;
    ctx.drawImage(image, x - s / 2, y - s / 2, s, s);
  }

  // ── Threads ───────────────────────────────────────────────────────────────

  private endAt(unitKey: string, level: number): End | null {
    const layout = this.layout;
    const cell = layout?.unitCell.get(unitKey);
    if (!layout || !cell) return null;
    if (level >= layout.depth) return { key: unitKey, x: cell.x, y: cell.y };
    const key = this.regionAt(cell, level);
    if (level === 0) {
      const island = layout.islands.get(key);
      if (island) return { key, x: island.x, y: island.y };
    }
    const g = layout.geoms.get(key);
    return g ? { key, x: g.labelX, y: g.labelY } : null;
  }

  /**
   * A portal for a thread's end on the other planet. Up close it sits right
   * beside the unit, once per unit; further out once per island, on its
   * lower left coast, where every thread of the island to that planet
   * meets. A click opens the unit of the first thread drawn to it.
   */
  private portalEnd(
    local: End,
    localUnit: string,
    otherUnit: string,
    level: number,
  ): End | null {
    const layout = this.layout;
    const far = layout?.view.portals?.[otherUnit];
    const cell = layout?.unitCell.get(localUnit);
    if (!layout || !far || !cell) return null;
    const island = layout.islands.get(cell.path[0]);
    if (!island) return null;
    const portal = { planet: far.planet, unit: otherUnit, title: far.title };
    if (level >= layout.depth) {
      // Away from the island's middle, towards its coast.
      let dx = local.x - island.x;
      let dy = local.y - island.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.5) [dx, dy] = PORTAL_BEARING;
      else [dx, dy] = [dx / d, dy / d];
      return {
        key: `portal:${far.planet}:${localUnit}`,
        x: local.x + dx * 1.7,
        y: local.y + dy * 1.7 - 0.6,
        portal,
      };
    }
    const reach = island.radius + 1.6;
    return {
      key: `portal:${far.planet}:${cell.path[0]}`,
      x: island.x + PORTAL_BEARING[0] * reach,
      y: island.y + PORTAL_BEARING[1] * reach,
      portal,
    };
  }

  private touches(unitKeys: [string, string], sel: Selection | null): boolean {
    if (!sel || !this.layout) return false;
    if (sel.kind === "unit") return unitKeys.includes(sel.key);
    return unitKeys.some((key) => {
      const cell = this.layout?.unitCell.get(key);
      return cell ? cell.path.includes(sel.key) : false;
    });
  }

  /** Threads bundled to the level in view: one string per pair of places. */
  private bundledThreads(): Bundle[] {
    const layout = this.layout;
    if (!layout) return [];
    const level = this.focusLevel();
    const pairs = new Map<string, Bundle>();
    for (const thread of layout.view.threads) {
      const keys: [string, string] = [thread.from, thread.to];
      const lit =
        this.touches(keys, this.selection) ||
        (this.hover?.kind === "unit" && this.touches(keys, this.hover));
      if (this.threadMode === "selection" && !lit) continue;
      const fromHere = layout.unitCell.has(thread.from);
      const toHere = layout.unitCell.has(thread.to);
      // Up close, a string per prerequisite would be spaghetti: only around the focus.
      if (
        level >= layout.depth - 1 &&
        !lit &&
        thread.kind === "voraussetzung" &&
        fromHere &&
        toHere
      ) {
        continue;
      }
      let a = fromHere ? this.endAt(thread.from, level) : null;
      let b = toHere ? this.endAt(thread.to, level) : null;
      if (a && !toHere) b = this.portalEnd(a, thread.from, thread.to, level);
      if (b && !fromHere) a = this.portalEnd(b, thread.to, thread.from, level);
      if (!a || !b || a.key === b.key) continue;
      const id = a.key < b.key ? `${a.key}|${b.key}` : `${b.key}|${a.key}`;
      const entry = pairs.get(id);
      if (entry) {
        entry.threads.push(thread);
        entry.lit ||= lit;
      } else pairs.set(id, { a, b, threads: [thread], lit });
    }
    return [...pairs.values()];
  }

  /** Does a bundle's end stand for this unit at the level in view? */
  private isEnd(end: End, unitKey: string): boolean {
    const layout = this.layout;
    if (!layout) return false;
    // A bundle has at most one portal end: the unit not on this map.
    if (end.portal) return !layout.unitCell.has(unitKey);
    const cell = layout.unitCell.get(unitKey);
    if (!cell) return false;
    const level = this.focusLevel();
    return (
      end.key === (level >= layout.depth ? unitKey : this.regionAt(cell, level))
    );
  }

  private drawThreads(): void {
    const ctx = this.ctx;
    const t = this.theme;
    const layout = this.layout;
    if (!layout) return;
    const bundles = this.bundledThreads();
    const anyLit = this.selection !== null && bundles.some((b) => b.lit);
    const close = this.focusLevel() >= layout.depth;
    const pins = new Map<
      string,
      { x: number; y: number; lit: boolean; portal?: End["portal"] }
    >();
    const notes: Array<{ x: number; y: number; text: string }> = [];
    for (const bundle of bundles) {
      const [ax, ay] = this.toScreen(bundle.a.x, bundle.a.y);
      const [bx, by] = this.toScreen(bundle.b.x, bundle.b.y);
      const off = (x: number, y: number) =>
        x < -200 || x > this.width + 200 || y < -200 || y > this.height + 200;
      if (off(ax, ay) && off(bx, by)) continue;
      const len = Math.hypot(bx - ax, by - ay);
      const sag = Math.min(70, len * 0.18);
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2 + sag;
      const kind =
        KIND_PRIORITY.find((k) => bundle.threads.some((x) => x.kind === k)) ??
        "voraussetzung";
      const lead =
        bundle.threads.find((x) => x.kind === kind) ?? bundle.threads[0];
      // The ends follow the leading thread: its `from` may be this bundle's b end.
      const flipped = this.isEnd(bundle.b, lead.from);
      const prerequisite = kind === "voraussetzung";
      const count = bundle.threads.length;
      const width = (prerequisite ? 1.5 : 2.4) + Math.log2(count) * 0.9;
      const color = prerequisite ? t.thread : t.threadLink;
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
      // A «use» dependency is dashed, as in UML.
      if (kind === "nutzt") ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(mx, my, bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      // UML-style ends, set back from the pins so both stay visible.
      const endA = endPoint(ax, ay, mx, my, bundle.a.portal ? 17 : 9);
      const endB = endPoint(bx, by, mx, my, bundle.b.portal ? 17 : 9);
      const [from, to] = flipped ? [endB, endA] : [endA, endB];
      this.drawMarkers(kind, from, to, color);
      const cx = 0.25 * ax + 0.5 * mx + 0.25 * bx;
      const cy = 0.25 * ay + 0.5 * my + 0.25 * by;
      // The kind in words, up close and on lit strings (Decision 7).
      const words = close || bundle.lit ? this.words.kinds[kind] : "";
      if (dim === 1 && (words || count > 1)) {
        const label =
          words && count > 1 ? `${words} · ${count}` : words || String(count);
        ctx.font = `700 11px ${this.font}`;
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
      // A note only on a lit single thread: a selected region would bury the map in paper.
      const note = count === 1 && bundle.lit ? bundle.threads[0].note : "";
      if (note) notes.push({ x: cx, y: cy, text: note });
      for (const [end, sx, sy] of [
        [bundle.a, ax, ay],
        [bundle.b, bx, by],
      ] as const) {
        const prev = pins.get(end.key);
        pins.set(end.key, {
          x: sx,
          y: sy,
          lit: (prev?.lit ?? false) || bundle.lit || !anyLit,
          portal: end.portal,
        });
      }
    }
    for (const pin of pins.values()) {
      ctx.globalAlpha = pin.lit ? 1 : 0.3;
      if (pin.portal) this.drawPortal(pin.x, pin.y, pin.portal);
      else this.drawPin(pin.x, pin.y);
    }
    ctx.globalAlpha = 1;
    for (const note of notes.slice(0, 12)) {
      this.drawNote(note.x, note.y, note.text);
    }
  }

  /**
   * UML-style ends (Decision 7). Every head sits at the end depended upon,
   * `to`: an arrowhead at the foundation, an open head at what is used, a
   * hollow triangle at the general case, and the ball at the interface's
   * provider, with the socket at its consumer.
   */
  private drawMarkers(
    kind: AtlasThreadKindWire,
    from: EndPoint,
    to: EndPoint,
    color: string,
  ): void {
    const ctx = this.ctx;
    const head = (p: EndPoint, size: number, fill: string | null) => {
      const nx = -p.uy;
      const ny = p.ux;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(
        p.x - p.ux * size + nx * size * 0.55,
        p.y - p.uy * size + ny * size * 0.55,
      );
      if (fill === null) {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(
          p.x - p.ux * size - nx * size * 0.55,
          p.y - p.uy * size - ny * size * 0.55,
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        return;
      }
      ctx.lineTo(
        p.x - p.ux * size - nx * size * 0.55,
        p.y - p.uy * size - ny * size * 0.55,
      );
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    switch (kind) {
      case "voraussetzung":
        head(to, 10, color);
        break;
      case "nutzt":
        head(to, 11, null);
        break;
      case "ist-ein":
        head(to, 13, this.theme.surface);
        break;
      case "schnittstelle": {
        ctx.fillStyle = this.theme.surface;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(to.x, to.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        const angle = Math.atan2(from.uy, from.ux);
        ctx.beginPath();
        ctx.arc(
          from.x + from.ux * 2,
          from.y + from.uy * 2,
          8,
          angle + Math.PI / 2,
          angle + (3 * Math.PI) / 2,
        );
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

  private portalAt(
    sx: number,
    sy: number,
  ): { planet: AtlasPlanetWire; unit: string } | null {
    return (
      this.portals.find((p) => Math.hypot(p.x - sx, p.y - sy) <= p.r + 3) ??
      null
    );
  }

  /**
   * A thread leaving for the other planet: a small globe in that planet's
   * sea colour (the product has no planet Sinnbilder). A click goes there.
   */
  private drawPortal(
    x: number,
    y: number,
    portal: NonNullable<End["portal"]>,
  ): void {
    const ctx = this.ctx;
    const t = this.theme;
    const r = 13;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.arc(x + 2, y + 3, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.sea[portal.planet];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = `rgba(${t.inkRgb},0.55)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.45, r, 0, 0, Math.PI * 2);
    ctx.moveTo(x - r, y);
    ctx.lineTo(x + r, y);
    ctx.moveTo(x - r, y - r * 0.5);
    ctx.quadraticCurveTo(x, y - r * 0.3, x + r, y - r * 0.5);
    ctx.moveTo(x - r, y + r * 0.5);
    ctx.quadraticCurveTo(x, y + r * 0.7, x + r, y + r * 0.5);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = t.threadLink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    this.portals.push({ x, y, r, planet: portal.planet, unit: portal.unit });
    if (this.hexPx >= 26 || this.selection) {
      ctx.font = `600 11px ${this.font}`;
      // One line: a long title ends in an ellipsis.
      const [label] = wrap(
        ctx,
        `${this.words.planets[portal.planet]}: ${shortTitle(portal.title)}`,
        200,
        1,
      );
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.lineWidth = 3;
      ctx.strokeStyle = t.halo;
      ctx.strokeText(label, x, y + r + 3);
      ctx.fillStyle = t.ink;
      ctx.fillText(label, x, y + r + 3);
    }
  }

  /** A thread's note on a slip of paper. Untrusted text, drawn as text only. */
  private drawNote(x: number, y: number, text: string): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y + 14);
    ctx.rotate(-0.035);
    ctx.font = `italic 500 12px ${this.font}`;
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
    lines.forEach((l, i) => {
      ctx.fillText(l, -w / 2 + 8, 6 + i * 15);
    });
    ctx.restore();
  }

  // ── Labels ────────────────────────────────────────────────────────────────

  private drawLabels(): void {
    const layout = this.layout;
    if (!layout) return;
    const ctx = this.ctx;
    const t = this.theme;
    const placed: LabelBox[] = [];
    const free = (box: LabelBox) =>
      !placed.some(
        (p) =>
          box.x < p.x + p.w &&
          box.x + box.w > p.x &&
          box.y < p.y + p.h &&
          box.y + box.h > p.y,
      );
    const scale = this.cam.scale;
    const px = this.hexPx;
    const depth = layout.depth;

    // Islands: titles in the sea above each one. Where many small islands
    // crowd together, the larger ones keep their title; the others show
    // theirs closer in.
    const islandsBySize = [...layout.roots].sort(
      (a, b) =>
        (layout.geoms.get(b)?.cells.length ?? 0) -
        (layout.geoms.get(a)?.cells.length ?? 0),
    );
    for (const key of islandsBySize) {
      const g = layout.geoms.get(key);
      const region = layout.regions.get(key);
      if (!g || !region) continue;
      const alpha = 1 - smooth(g.radius * scale, 500, 800);
      if (alpha <= 0.02) continue;
      const [sx, sy] = this.toScreen((g.minX + g.maxX) / 2, g.minY - 0.9);
      const name = spaced(region.name.toUpperCase());
      ctx.font = `800 15px ${this.font}`;
      const tw = ctx.measureText(name).width;
      const e = 30;
      const x0 = sx - (tw + e + 8) / 2;
      const box = { x: x0, y: sy - 22, w: tw + e + 8, h: 32 };
      if (!free(box)) continue;
      ctx.globalAlpha = alpha;
      this.drawDisc(key, x0 + e / 2, sy - 6, e / 2, this.regionColor(key));
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 5;
      ctx.strokeStyle = t.halo;
      ctx.strokeText(name, x0 + e + 8, sy - 6);
      ctx.fillStyle = t.ink;
      ctx.fillText(name, x0 + e + 8, sy - 6);
      placed.push(box);
      ctx.globalAlpha = 1;
    }

    // Big, faint names over the land once a region fills the view.
    for (const g of layout.geoms.values()) {
      if (g.level < 1 || g.level >= depth - 1) continue;
      const R = g.radius * scale;
      const start = g.level === 1 ? 150 : 170;
      const alpha =
        smooth(R, start, start * 1.4) * (1 - smooth(R, 700, 1100)) * 0.32;
      if (alpha <= 0.02) continue;
      const [sx, sy] = this.toScreen(g.labelX, g.labelY);
      const size = Math.max(16, Math.min(46, R * 0.13));
      ctx.globalAlpha = alpha;
      ctx.font = `800 ${size}px ${this.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = t.ink;
      ctx.fillText(
        spaced((layout.regions.get(g.key)?.name ?? "").toUpperCase()),
        sx,
        sy + (g.level === 1 ? -size * 0.6 : size * 0.6),
      );
      ctx.globalAlpha = 1;
    }

    // Disc labels: shallow levels first, larger places first.
    const geoms = [...layout.geoms.values()]
      .filter((g) => g.level >= 1 && g.level < depth)
      .sort((a, b) => a.level - b.level || b.radius - a.radius);
    for (const g of geoms) {
      const R = g.radius * scale;
      let alpha: number;
      if (g.level === depth - 1) alpha = smooth(R, 30, 46);
      else if (g.level === 1) {
        alpha = smooth(R, 18, 30) * (1 - smooth(R, 120, 165));
      } else alpha = smooth(R, 30, 44) * (1 - smooth(R, 135, 185));
      // Once units are the focus, their own titles speak; a small island's
      // region discs would cover them.
      alpha *= 1 - smooth(px, UNIT_PX - 4, UNIT_PX + 10);
      if (alpha <= 0.05) continue;
      const [sx, sy] = this.toScreen(g.labelX, g.labelY);
      if (
        sx < -100 ||
        sy < -100 ||
        sx > this.width + 100 ||
        sy > this.height + 100
      ) {
        continue;
      }
      const leaf = g.level === depth - 1;
      const e = Math.max(
        18,
        Math.min(g.level === 1 ? 30 : leaf ? 22 : 26, R * 0.36),
      );
      const region = layout.regions.get(g.key);
      if (!region) continue;
      const size = g.level === 1 ? 14 : leaf ? 11.5 : 12.5;
      ctx.font = `${leaf ? 600 : 700} ${size}px ${this.font}`;
      const lines = wrap(
        ctx,
        region.name,
        Math.max(90, Math.min(170, R * 1.5)),
        2,
      );
      const tw = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const box = {
        x: sx - Math.max(tw, e * 2) / 2 - 2,
        y: sy - e - 2,
        w: Math.max(tw, e * 2) + 4,
        h: e * 2 + lines.length * (size + 2) + 6,
      };
      if (!free(box)) continue;
      placed.push(box);
      ctx.globalAlpha = alpha;
      this.drawDisc(
        g.key,
        sx,
        sy - e * 0.35,
        e * 0.62 + 4,
        this.regionColor(g.key),
      );
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

  /**
   * A region's disc: light in both themes, ringed in its colour, with its
   * Sinnbild (Decision 6), or its initials while it has none.
   */
  private drawDisc(
    key: string,
    x: number,
    y: number,
    radius: number,
    ring: string,
  ): void {
    const ctx = this.ctx;
    const emblem = this.layout ? emblemOf(this.layout, "region", key) : null;
    const image = emblem ? this.image(emblem.svg) : null;
    if (image) {
      this.drawImageDisc(image, x, y, radius, ring);
      return;
    }
    ctx.fillStyle = DISC_FILL;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = ring;
    ctx.stroke();
    const text = initials(this.layout?.regions.get(key)?.name ?? "");
    const size = Math.max(9, radius * 0.8);
    ctx.font = `700 ${size}px ${this.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = DISC_INK;
    ctx.fillText(text, x, y + 1);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function sameSelection(
  a: Selection | null,
  b: Selection | null,
): boolean {
  return a?.kind === b?.kind && a?.key === b?.key;
}

function spaced(text: string): string {
  return text.split("").join(" ");
}

export function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 || /\p{Lu}/u.test(w));
  return (
    words
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || name.slice(0, 2)
  );
}

/** "Satz des Pythagoras: a² + b² = c²" → "Satz des Pythagoras"; a short head keeps the whole title. */
export function shortTitle(title: string): string {
  const head = title.split(/[:(]/)[0].trim();
  return head.length >= 14 ? head : title;
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  maxLines: number,
): string[] {
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
    while (ctx.measureText(`${last}…`).width > width && last.length > 1) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

/** A point `back` px from an end along the curve, and the direction into the end. */
function endPoint(
  x: number,
  y: number,
  cx: number,
  cy: number,
  back: number,
): EndPoint {
  let ux = x - cx;
  let uy = y - cy;
  const d = Math.hypot(ux, uy) || 1;
  ux /= d;
  uy /= d;
  return { x: x - ux * back, y: y - uy * back, ux, uy };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
