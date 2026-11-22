/**
 * Builds the 3D world from the model. Rebuilt whole after every change —
 * the spike's worlds are small, and a full rebuild keeps the code honest
 * about the world being derived from data.
 */
import * as THREE from "three";
import {
  CABINET_SPOTS,
  CORRIDOR_D,
  DEPTH,
  DOOR_H,
  DOOR_W,
  ENTRANCE,
  FLOOR_H,
  HOME,
  ROOM_D,
  ROOM_W,
  STAIR_W,
  WALL_T,
  buildingFrame,
  localBox,
  roomSlots,
  toWorld,
} from "./layout.ts";
import type { AABB, Frame } from "./layout.ts";
import {
  CONDITION_LABEL,
  HOME_ID,
  boxContents,
  cabinetSlots,
  cabinetContents,
  cardsOf,
  conceptsInBuilding,
  effectiveEmblem,
  conceptsInRoom,
  simNow,
  statsFor,
} from "./model.ts";
import type { Box, Building, Cabinet, Condition, Emblem, Room, Stats, World } from "./model.ts";

export type Pick =
  | { type: "concept"; id: string; label: string }
  | { type: "slot"; cabinetId: string; slot: number; label: string }
  | { type: "cabinet"; id: string; label: string }
  | { type: "box"; id: string; label: string }
  | { type: "room"; id: string; label: string }
  | { type: "building"; id: string; label: string };

export const CONDITION_COLOR: Record<Condition, string> = {
  leer: "#e7e4dc",
  rohbau: "#f0a23a",
  hell: "#ffd96a",
  staubig: "#c9b98f",
  dunkel: "#55606f",
  verfallen: "#8a6a50",
  nebel: "#c3ced9",
};

const SLAB = 0.18;
const WINDOW: Record<Condition, { color: string; emissive: string; intensity: number }> = {
  leer: { color: "#a9bccd", emissive: "#000000", intensity: 0 },
  rohbau: { color: "#7b7f84", emissive: "#000000", intensity: 0 },
  hell: { color: "#fff1c1", emissive: "#ffd97a", intensity: 0.95 },
  staubig: { color: "#d9cfae", emissive: "#b89d5c", intensity: 0.35 },
  dunkel: { color: "#323946", emissive: "#000000", intensity: 0 },
  verfallen: { color: "#4e3d31", emissive: "#000000", intensity: 0 },
  nebel: { color: "#e3e9ee", emissive: "#c9d3dd", intensity: 0.3 },
};

// ── Shared procedural textures (built once, never disposed) ────────────────

let crackTex: THREE.Texture | null = null;
let cloudTex: THREE.Texture | null = null;
let dotTex: THREE.Texture | null = null;

function dotTexture(): THREE.Texture {
  if (dotTex) return dotTex;
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  dotTex = new THREE.CanvasTexture(c);
  return dotTex;
}

function crackTexture(): THREE.Texture {
  if (crackTex) return crackTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i += 1) {
    g.fillStyle = `rgba(90,70,50,${Math.random() * 0.12})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 3 + Math.random() * 6, 3 + Math.random() * 6);
  }
  g.strokeStyle = "rgba(55,40,30,0.55)";
  for (let k = 0; k < 7; k += 1) {
    let x = Math.random() * 256;
    let y = Math.random() * 256;
    g.lineWidth = 0.6 + Math.random() * 0.8;
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < 9; s += 1) {
      x += (Math.random() - 0.5) * 50;
      y += Math.random() * 30;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  crackTex = new THREE.CanvasTexture(c);
  crackTex.colorSpace = THREE.SRGBColorSpace;
  crackTex.wrapS = crackTex.wrapT = THREE.RepeatWrapping;
  return crackTex;
}

function cloudTexture(): THREE.Texture {
  if (cloudTex) return cloudTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  for (let i = 0; i < 6; i += 1) {
    const x = 40 + Math.random() * 48;
    const y = 44 + Math.random() * 40;
    const r = 30 + Math.random() * 24;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, "rgba(255,255,255,0.55)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  }
  cloudTex = new THREE.CanvasTexture(c);
  cloudTex.colorSpace = THREE.SRGBColorSpace;
  return cloudTex;
}

/**
 * A concept's sinnbild as a texture: the agent's SVG on a white card with
 * its glyph underneath. The SVG is drawn through an <img>, where it can
 * run no script and load nothing — and it passed `validateEmblemSvg` before.
 */
const emblemCache = new Map<string, THREE.CanvasTexture>();

export function emblemDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function emblemTexture(emblem: Emblem): THREE.CanvasTexture {
  const key = `${emblem.svg ?? ""}|${emblem.glyph ?? ""}`;
  const cached = emblemCache.get(key);
  if (cached) return cached;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  emblemCache.set(key, tex);
  const paint = (img: HTMLImageElement | null) => {
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = "#fbfaf6";
    g.beginPath();
    g.roundRect(4, 4, 248, 248, 26);
    g.fill();
    const glyph = emblem.glyph ?? "";
    if (img) g.drawImage(img, 36, glyph ? 14 : 28, glyph ? 184 : 200, glyph ? 184 : 200);
    if (glyph) {
      g.fillStyle = "#1d2b4f";
      g.textAlign = "center";
      g.textBaseline = "middle";
      let size = img ? 40 : 70;
      g.font = `700 ${size}px "Atkinson Hyperlegible Next Variable", system-ui, sans-serif`;
      while (g.measureText(glyph).width > 232 && size > 16) {
        size -= 2;
        g.font = `700 ${size}px "Atkinson Hyperlegible Next Variable", system-ui, sans-serif`;
      }
      g.fillText(glyph, 128, img ? 224 : 128);
    }
    tex.needsUpdate = true;
  };
  paint(null);
  if (emblem.svg) {
    const img = new Image();
    img.onload = () => paint(img);
    img.src = emblemDataUrl(emblem.svg);
  }
  return tex;
}

function hsl(h: number, s: number, l: number): THREE.Color {
  return new THREE.Color().setHSL(h / 360, s, l);
}

/** How a room's surfaces look for its knowledge state. */
function surfaceColor(base: THREE.Color, stats: Stats): THREE.Color {
  const c = base.clone();
  if (stats.total === 0) return c;
  c.lerp(new THREE.Color("#b5b2aa"), stats.raw * 0.9);
  c.lerp(new THREE.Color("#7f624c"), Math.min(1, stats.decay * 0.9));
  c.lerp(new THREE.Color("#dfe5ea"), stats.fog * 0.5);
  return c.multiplyScalar(1 - 0.7 * stats.dark - 0.15 * stats.decay);
}

function conceptColor(label: Condition, hue: number): THREE.Color {
  switch (label) {
    case "hell":
      return hsl(hue, 0.7, 0.55);
    case "staubig":
      return hsl(hue, 0.18, 0.6);
    case "dunkel":
      return hsl(hue, 0.25, 0.25);
    case "verfallen":
      return new THREE.Color("#755640");
    case "nebel":
      return new THREE.Color("#d5dce3");
    default:
      return new THREE.Color("#f0a23a");
  }
}

export class WorldView {
  readonly root = new THREE.Group();
  pickables: THREE.Object3D[] = [];
  /** Fog and darkness shares per room id, for the air where the player stands. */
  readonly roomAir = new Map<string, { fog: number; dark: number }>();
  private tickers: Array<(t: number) => void> = [];
  private trash: Array<{ dispose(): void }> = [];

  constructor(scene: THREE.Scene) {
    scene.add(this.root);
  }

  tick(t: number): void {
    for (const f of this.tickers) f(t);
  }

  rebuild(world: World, carrying: string | null): void {
    this.clear();
    const now = simNow(world);
    this.buildHome(world);
    for (const b of world.buildings) this.buildBuilding(world, b, now, carrying);
  }

  private clear(): void {
    this.root.clear();
    for (const t of this.trash) t.dispose();
    this.trash = [];
    this.pickables = [];
    this.tickers = [];
    this.roomAir.clear();
  }

  // ── Primitives ──────────────────────────────────────────────────────────

  private mat(color: THREE.ColorRepresentation, extra: THREE.MeshLambertMaterialParameters = {}): THREE.MeshLambertMaterial {
    const m = new THREE.MeshLambertMaterial({ color, ...extra });
    this.trash.push(m);
    return m;
  }

  private box(b: AABB, material: THREE.Material, parent: THREE.Object3D = this.root): THREE.Mesh {
    const g = new THREE.BoxGeometry(b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ);
    this.trash.push(g);
    const mesh = new THREE.Mesh(g, material);
    mesh.position.set((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, (b.minZ + b.maxZ) / 2);
    parent.add(mesh);
    return mesh;
  }

  /** Box in a group's local coordinates, from centre and size. */
  private part(parent: THREE.Object3D, material: THREE.Material, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): THREE.Mesh {
    return this.box({ minX: cx - sx / 2, maxX: cx + sx / 2, minY: cy - sy / 2, maxY: cy + sy / 2, minZ: cz - sz / 2, maxZ: cz + sz / 2 }, material, parent);
  }

  private pickable(mesh: THREE.Object3D, pick: Pick): void {
    mesh.userData.pick = pick;
    this.pickables.push(mesh);
  }

  label(text: string, height: number, opts: { bg?: string; fg?: string; accent?: string } = {}): THREE.Sprite {
    const font = '600 44px "Atkinson Hyperlegible Next Variable", system-ui, sans-serif';
    const c = document.createElement("canvas");
    const g = c.getContext("2d") as CanvasRenderingContext2D;
    g.font = font;
    const lines = text.split("\n");
    const w = Math.ceil(Math.max(...lines.map((l) => g.measureText(l).width))) + 44;
    const h = 56 * lines.length + 20;
    c.width = w;
    c.height = h;
    g.font = font;
    g.fillStyle = opts.bg ?? "rgba(255,255,255,0.93)";
    g.beginPath();
    g.roundRect(2, 2, w - 4, h - 4, 14);
    g.fill();
    if (opts.accent) {
      g.fillStyle = opts.accent;
      g.fillRect(2, h - 12, w - 4, 10);
    }
    g.fillStyle = opts.fg ?? "#131a23";
    g.textBaseline = "middle";
    lines.forEach((l, i) => g.fillText(l, 22, 10 + 28 + i * 56));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true });
    this.trash.push(tex, m);
    const s = new THREE.Sprite(m);
    const lineH = height / lines.length;
    s.scale.set((lineH * w) / 56, (lineH * h) / 56, 1);
    return s;
  }

  // ── Dein Zimmer ─────────────────────────────────────────────────────────

  private buildHome(world: World): void {
    const h = HOME;
    const wall = this.mat("#f2ebde");
    const t = WALL_T;
    this.box({ minX: h.minX, maxX: h.maxX, minY: -0.05, maxY: 0.02, minZ: h.minZ, maxZ: h.maxZ }, this.mat("#cfae84"));
    this.box({ minX: h.minX, maxX: h.minX + t, minY: 0, maxY: h.height, minZ: h.minZ, maxZ: h.maxZ }, wall);
    this.box({ minX: h.maxX - t, maxX: h.maxX, minY: 0, maxY: h.height, minZ: h.minZ, maxZ: h.maxZ }, wall);
    this.box({ minX: h.minX, maxX: h.maxX, minY: 0, maxY: h.height, minZ: h.minZ, maxZ: h.minZ + t }, wall);
    this.box({ minX: h.minX, maxX: h.doorFrom, minY: 0, maxY: h.height, minZ: h.maxZ - t, maxZ: h.maxZ }, wall);
    this.box({ minX: h.doorTo, maxX: h.maxX, minY: 0, maxY: h.height, minZ: h.maxZ - t, maxZ: h.maxZ }, wall);
    this.box({ minX: h.doorFrom, maxX: h.doorTo, minY: DOOR_H, maxY: h.height, minZ: h.maxZ - t, maxZ: h.maxZ }, wall);
    this.box({ minX: h.minX - 0.4, maxX: h.maxX + 0.4, minY: h.height, maxY: h.height + 0.25, minZ: h.minZ - 0.4, maxZ: h.maxZ + 0.4 }, this.mat("#a4574a"));
    this.box({ minX: h.minX + t, maxX: h.maxX - t, minY: h.height - 0.03, maxY: h.height - 0.01, minZ: h.minZ + t, maxZ: h.maxZ - t }, this.mat("#f6f2ea", { emissive: "#f6f2ea", emissiveIntensity: 0.45 }));
    // A bed and a desk: this is somebody's room.
    this.box({ minX: h.minX + 0.3, maxX: h.minX + 1.3, minY: 0, maxY: 0.5, minZ: h.minZ + 0.3, maxZ: h.minZ + 2.3 }, this.mat("#6d8fb8"));
    this.box({ minX: h.maxX - 1.6, maxX: h.maxX - 0.3, minY: 0.72, maxY: 0.78, minZ: h.minZ + 0.3, maxZ: h.minZ + 1.0 }, this.mat("#9b7653"));
    const sign = this.label("Dein Zimmer", 0.5, { accent: "#2340b5" });
    sign.position.set(0, h.height + 0.75, h.maxZ + 0.2);
    this.root.add(sign);

    const boxes = world.boxes.filter((b) => b.roomId === HOME_ID);
    boxes.forEach((box, i) => {
      const layer = Math.floor(i / 9);
      const k = i % 9;
      const x = -2.8 + (k % 3) * 2.8;
      const z = h.minZ + 3.2 + Math.floor(k / 3) * 2.0;
      this.buildBox(world, box, x, layer * 0.46, z, 0.15 * ((i % 3) - 1));
    });
  }

  private buildBox(world: World, box: Box, x: number, y: number, z: number, yaw: number): void {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    this.root.add(group);
    const color = box.origin === "demolition" ? "#a77f55" : "#bd8f58";
    const body = this.part(group, this.mat(color), 0, 0.23, 0, 0.66, 0.46, 0.48);
    this.part(group, this.mat("#e4d3a6"), 0, 0.465, 0, 0.12, 0.012, 0.49);
    const n = boxContents(world, box.id).length;
    const name = box.label.length > 30 ? `${box.label.slice(0, 29)}…` : box.label;
    const lbl = this.label(`${name}\n${n} Begriff${n === 1 ? "" : "e"}`, 0.2, { accent: "#bd8f58" });
    lbl.position.set(0, 0.72, 0);
    group.add(lbl);
    this.pickable(body, { type: "box", id: box.id, label: `Umzugskarton „${box.label}“ – ${n} Begriffe` });
  }

  // ── Buildings ───────────────────────────────────────────────────────────

  private buildBuilding(world: World, b: Building, now: Date, carrying: string | null): void {
    const f = buildingFrame(b);
    const L = f.length;
    const facade = this.mat(hsl(b.hue, 0.3, 0.63));
    const inner = this.mat("#eceae4");
    const slab = this.mat("#d4cfc4");
    const t = WALL_T;

    if (b.floors.length === 0) {
      const lot = this.box(localBox(f, 0, L, 0, DEPTH, -0.05, 0.12), this.mat("#a9a69f"));
      this.pickable(lot, { type: "building", id: b.id, label: `Baugrund ${b.name}` });
      const sign = this.label(`Baugrund: ${b.name}\nnoch keine Etage`, 0.8, { accent: hsl(b.hue, 0.55, 0.45).getStyle() });
      const p = toWorld(f, L / 2, DEPTH / 2);
      sign.position.set(p.x, 1.4, p.z);
      this.root.add(sign);
      return;
    }

    const overall = statsFor(cardsOf(conceptsInBuilding(world, b)), now);
    b.floors.forEach((floor, i) => {
      const y0 = i * FLOOR_H;
      const top = y0 + FLOOR_H - SLAB;
      const wall = (lx0: number, lx1: number, lz0: number, lz1: number, m: THREE.Material, ya = y0, yb = top) =>
        this.box(localBox(f, lx0, lx1, lz0, lz1, ya, yb), m);
      const outer = (mesh: THREE.Mesh) => this.pickable(mesh, { type: "building", id: b.id, label: b.name });

      this.box(localBox(f, 0, L, 0, DEPTH, y0 - SLAB, y0 + 0.01), slab);
      this.box(localBox(f, 0, L, 0, CORRIDOR_D, y0, y0 + 0.02), this.mat("#d9d5cb"));
      this.box(localBox(f, 0, STAIR_W, CORRIDOR_D, DEPTH, y0, y0 + 0.02), this.mat("#d9d5cb"));
      if (i === 0) {
        outer(wall(0, ENTRANCE.from, 0, t, facade));
        outer(wall(ENTRANCE.to, L, 0, t, facade));
        outer(wall(ENTRANCE.from, ENTRANCE.to, 0, t, facade, y0 + DOOR_H, top));
      } else {
        outer(wall(0, L, 0, t, facade));
      }
      outer(wall(0, L, DEPTH - t, DEPTH, facade));
      outer(wall(0, t, 0, DEPTH, facade));
      outer(wall(L - t, L, 0, DEPTH, facade));
      wall(STAIR_W - t / 2, STAIR_W + t / 2, CORRIDOR_D, DEPTH, inner);

      // Stairs: decorative steps; E / Q change floors here.
      const stepMat = this.mat("#bdb7ab");
      for (let k = 0; k < 7; k += 1) {
        wall(0.35 + k * 0.48, 0.83 + k * 0.48, DEPTH - 2.5, DEPTH - 0.25, stepMat, y0, y0 + (k + 1) * 0.4);
      }
      const stairSign = this.label("Treppe\nE ▲   Q ▼", 0.55);
      const sp = toWorld(f, 2, DEPTH - 2.9);
      stairSign.position.set(sp.x, y0 + 2.3, sp.z);
      this.root.add(stairSign);

      const floorLabel = this.label(floor.label, 0.42, { accent: hsl(b.hue, 0.55, 0.45).getStyle() });
      const fp = toWorld(f, 2, -0.45);
      floorLabel.position.set(fp.x, y0 + 2.75, fp.z);
      this.root.add(floorLabel);

      const slots = roomSlots(b);
      for (let s = 0; s < slots; s += 1) {
        const rx0 = STAIR_W + s * ROOM_W;
        if (s > 0) wall(rx0 - t / 2, rx0 + t / 2, CORRIDOR_D, DEPTH, inner);
        const room = floor.rooms[s];
        if (room) {
          const d0 = rx0 + (ROOM_W - DOOR_W) / 2;
          wall(rx0, d0, CORRIDOR_D - t / 2, CORRIDOR_D + t / 2, inner);
          wall(d0 + DOOR_W, rx0 + ROOM_W, CORRIDOR_D - t / 2, CORRIDOR_D + t / 2, inner);
          wall(d0, d0 + DOOR_W, CORRIDOR_D - t / 2, CORRIDOR_D + t / 2, inner, y0 + DOOR_H, top);
          this.buildRoom(world, b, f, i, room, s, now, carrying);
        } else {
          wall(rx0, rx0 + ROOM_W, CORRIDOR_D - t / 2, CORRIDOR_D + t / 2, inner);
        }
      }
    });

    const roofY = b.floors.length * FLOOR_H - SLAB;
    this.box(localBox(f, -0.2, L + 0.2, -0.2, DEPTH + 0.2, roofY, roofY + 0.3), this.mat(hsl(b.hue, 0.25, 0.32)));
    const sign = this.label(b.name, 1.1, { accent: hsl(b.hue, 0.6, 0.45).getStyle() });
    const sp = toWorld(f, L / 2, 0);
    sign.position.set(sp.x, roofY + 1.3, sp.z);
    this.root.add(sign);

    // A building nobody visits sinks into fog as a whole.
    if (overall.fog > 0.3) this.clouds(localBox(f, -2, L + 2, -3, DEPTH + 3, 0.5, roofY + 2), Math.round(overall.fog * 14), overall.fog, 5, 9);
  }

  private buildRoom(world: World, b: Building, f: Frame, fi: number, room: Room, s: number, now: Date, carrying: string | null): void {
    const y0 = fi * FLOOR_H;
    const top = y0 + FLOOR_H - SLAB;
    const rx0 = STAIR_W + s * ROOM_W;
    const rz0 = CORRIDOR_D;
    const stats = statsFor(cardsOf(conceptsInRoom(world, room)), now);
    this.roomAir.set(room.id, { fog: stats.fog, dark: stats.dark });
    const brightness = 1 - 0.62 * stats.dark - 0.15 * stats.decay;

    const wallMat = this.mat(surfaceColor(hsl(b.hue, 0.28, 0.9), stats), stats.decay > 0.15 ? { map: crackTexture() } : {});
    const floorMat = this.mat(surfaceColor(new THREE.Color("#c8a47a"), stats));
    const inset = 0.1;
    const panel = (lx0: number, lx1: number, lz0: number, lz1: number, ya = y0, yb = top) =>
      this.box(localBox(f, lx0, lx1, lz0, lz1, ya, yb), wallMat);
    const xa = rx0 + inset;
    const xb = rx0 + ROOM_W - inset;
    const za = rz0 + inset;
    const zb = rz0 + ROOM_D - inset - WALL_T / 2;
    panel(xa, xb, zb - 0.02, zb);
    panel(xa, xa + 0.02, za, zb);
    panel(xb - 0.02, xb, za, zb);
    const d0 = rx0 + (ROOM_W - DOOR_W) / 2;
    panel(xa, d0, za, za + 0.02);
    panel(d0 + DOOR_W, xb, za, za + 0.02);
    panel(d0, d0 + DOOR_W, za, za + 0.02, y0 + DOOR_H, top);
    const ceiling = surfaceColor(new THREE.Color("#f4f1ea"), stats);
    this.box(localBox(f, rx0 + 0.08, rx0 + ROOM_W - 0.08, rz0 + 0.08, rz0 + ROOM_D - 0.08, top - 0.03, top - 0.01), this.mat(ceiling, { emissive: ceiling, emissiveIntensity: 0.45 }));
    const floorMesh = this.box(localBox(f, rx0 + 0.08, rx0 + ROOM_W - 0.08, rz0 + 0.08, rz0 + ROOM_D - 0.08, y0 + 0.01, y0 + 0.04), floorMat);
    this.pickable(floorMesh, { type: "room", id: room.id, label: `Raum ${room.name}` });

    const sign = this.label(`${room.name}`, 0.34, { accent: CONDITION_COLOR[stats.label] });
    const sp = toWorld(f, rx0 + ROOM_W / 2, rz0 - 0.14);
    sign.position.set(sp.x, y0 + DOOR_H + 0.42, sp.z);
    this.root.add(sign);

    for (const cabinet of room.cabinets) this.buildCabinet(world, b, f, y0, rx0, cabinet, now, carrying, brightness);
    world.boxes
      .filter((x) => x.roomId === room.id)
      .forEach((box, i) => {
        const spots = [0.9, 1.75, 4.25, 5.1];
        const p = toWorld(f, rx0 + spots[i % 4], rz0 + 0.75);
        this.buildBox(world, box, p.x, y0 + Math.floor(i / 4) * 0.46, p.z, 0);
      });

    const interior = localBox(f, rx0 + 0.5, rx0 + ROOM_W - 0.5, rz0 + 0.5, rz0 + ROOM_D - 0.5, y0 + 0.3, top - 0.3);
    if (stats.dust > 0) this.dust(interior, stats.dust);
    if (stats.fog > 0) this.clouds(interior, 2 + Math.round(stats.fog * 9), stats.fog, 2.5, 4.5);
    if (stats.decay > 0.2) {
      const rubble = this.mat("#7a6a5b");
      for (let k = 0; k < Math.round(stats.decay * 8); k += 1) {
        const p = toWorld(f, rx0 + 0.6 + Math.random() * (ROOM_W - 1.2), rz0 + 0.6 + Math.random() * (ROOM_D - 1.6));
        const m = this.part(this.root, rubble, p.x, y0 + 0.08, p.z, 0.15 + Math.random() * 0.25, 0.12, 0.12 + Math.random() * 0.2);
        m.rotation.y = Math.random() * Math.PI;
      }
    }

    // Outside: the facade ages with the room, windows show its light,
    // scaffolding marks a raw build.
    if (stats.total > 0) {
      const skin = this.mat(surfaceColor(hsl(b.hue, 0.3, 0.63), stats), stats.decay > 0.15 ? { map: crackTexture() } : {});
      this.box(localBox(f, rx0 + 0.03, rx0 + ROOM_W - 0.03, -0.035, -0.012, y0 + 0.02, top), skin);
      this.box(localBox(f, rx0 + 0.03, rx0 + ROOM_W - 0.03, DEPTH + 0.012, DEPTH + 0.035, y0 + 0.02, top), skin);
    }
    const w = WINDOW[stats.label];
    const glass = this.mat(w.color, { emissive: w.emissive, emissiveIntensity: w.intensity });
    this.box(localBox(f, rx0 + 1, rx0 + ROOM_W - 1, -0.06, -0.036, y0 + 1.0, y0 + 2.4), glass);
    this.box(localBox(f, rx0 + 1, rx0 + ROOM_W - 1, DEPTH + 0.036, DEPTH + 0.06, y0 + 1.0, y0 + 2.4), glass);
    if (stats.total > 0 && stats.raw >= 0.5) {
      const pole = this.mat("#cf8a2e");
      for (const lx of [0.3, ROOM_W / 2, ROOM_W - 0.3]) this.box(localBox(f, rx0 + lx - 0.05, rx0 + lx + 0.05, -0.75, -0.65, y0, y0 + FLOOR_H), pole);
      for (const yy of [1.1, 2.5]) this.box(localBox(f, rx0 + 0.2, rx0 + ROOM_W - 0.2, -0.95, -0.45, y0 + yy, y0 + yy + 0.06), pole);
    }
    if (stats.fog > 0.2) {
      this.clouds(localBox(f, rx0, rx0 + ROOM_W, -2.2, -0.6, y0 + 0.6, y0 + 3), Math.round(stats.fog * 4), stats.fog, 3, 5);
      this.clouds(localBox(f, rx0, rx0 + ROOM_W, DEPTH + 0.6, DEPTH + 2.2, y0 + 0.6, y0 + 3), Math.round(stats.fog * 4), stats.fog, 3, 5);
    }
  }

  private buildCabinet(world: World, b: Building, f: Frame, y0: number, rx0: number, cabinet: Cabinet, now: Date, carrying: string | null, brightness: number): void {
    const spot = CABINET_SPOTS[cabinet.spot];
    const p = toWorld(f, rx0 + spot.rx, CORRIDOR_D + spot.rz);
    const fx = spot.face[0];
    const fz = spot.face[1] * f.sz;
    const group = new THREE.Group();
    group.position.set(p.x, y0, p.z);
    group.rotation.y = Math.atan2(fx, fz);
    this.root.add(group);

    // A cabinet keeps its height; more compartments make the rows denser.
    const slots = cabinetSlots(cabinet);
    const rows = Math.ceil(slots / 2);
    const rowH = 1.9 / rows;
    const wood = this.mat(new THREE.Color("#a98258").multiplyScalar(Math.max(0.3, brightness)));
    const pick: Pick = { type: "cabinet", id: cabinet.id, label: `Schrank ${cabinet.name}` };
    for (const m of [
      this.part(group, wood, 0, 1.0, -0.25, 1.5, 2.0, 0.04),
      this.part(group, wood, -0.73, 1.0, 0, 0.04, 2.0, 0.54),
      this.part(group, wood, 0.73, 1.0, 0, 0.04, 2.0, 0.54),
      this.part(group, wood, 0, 1.98, 0, 1.5, 0.04, 0.54),
      this.part(group, wood, 0, 0.03, 0, 1.5, 0.06, 0.54),
    ]) this.pickable(m, pick);
    for (let k = 1; k < rows; k += 1) this.part(group, wood, 0, 0.06 + k * rowH, 0, 1.46, 0.03, 0.52);
    this.part(group, wood, 0, 1.0, 0, 0.03, 1.94, 0.52);

    const lbl = this.label(cabinet.name, 0.24);
    lbl.position.set(0, 2.25, 0);
    group.add(lbl);

    const blockH = Math.min(0.42, rowH * 0.7);
    const contents = new Map(cabinetContents(world, cabinet.id).map((x) => [x.slot, x.concept]));
    for (let s = 0; s < slots; s += 1) {
      const row = rows - 1 - Math.floor(s / 2);
      const cx = s % 2 === 0 ? -0.36 : 0.36;
      const cy = 0.06 + row * rowH;
      const concept = contents.get(s);
      if (concept) {
        const st = statsFor(concept.cards, now);
        const color = conceptColor(st.label, b.hue);
        const ghost = st.label === "rohbau" || st.label === "nebel";
        const m = this.mat(color, ghost ? { transparent: true, opacity: st.label === "nebel" ? 0.5 : 0.4 } : {});
        const block = this.part(group, m, cx, cy + blockH / 2 + 0.02, 0.02, 0.52, blockH, 0.36);
        if (st.label === "rohbau") {
          const edges = new THREE.EdgesGeometry(block.geometry);
          const lm = new THREE.LineBasicMaterial({ color: "#c97a12" });
          this.trash.push(edges, lm);
          block.add(new THREE.LineSegments(edges, lm));
        }
        const emblem = effectiveEmblem(world, concept)?.emblem;
        const glyph = emblem?.glyph ? ` · ${emblem.glyph}` : "";
        this.pickable(block, { type: "concept", id: concept.id, label: `${concept.title}${glyph} · ${CONDITION_LABEL[st.label]}` });
        if (emblem) {
          // The picture fades with the knowledge: dim when dark, faint in fog.
          const side = Math.min(0.46, blockH - 0.03);
          const fade = st.label === "nebel" ? 0.35 : st.label === "rohbau" ? 0.6 : 1;
          const tint = st.label === "dunkel" ? 0.5 : st.label === "verfallen" ? 0.7 : st.label === "staubig" ? 0.85 : 1;
          const em = this.mat(new THREE.Color(tint, tint, tint * (st.label === "verfallen" ? 0.85 : 1)), {
            map: emblemTexture(emblem),
            transparent: true,
            opacity: fade,
          });
          const g = new THREE.PlaneGeometry(side, side);
          this.trash.push(g);
          const face = new THREE.Mesh(g, em);
          face.position.set(cx, cy + blockH / 2 + 0.02, 0.203);
          face.userData.pick = { type: "concept", id: concept.id, label: `${concept.title}${glyph} · ${CONDITION_LABEL[st.label]}` };
          group.add(face);
          this.pickables.push(face);
        }
      } else {
        const free = carrying !== null;
        const hit = this.part(
          group,
          free ? this.mat("#3fbf6a", { transparent: true, opacity: 0.28 }) : this.mat("#000000", { visible: false }),
          cx, cy + rowH * 0.47, 0.02, 0.66, rowH * 0.88, 0.46,
        );
        this.pickable(hit, { type: "slot", cabinetId: cabinet.id, slot: s, label: `Freies Fach ${s + 1} · ${cabinet.name}` });
      }
    }
  }

  // ── Atmosphere ──────────────────────────────────────────────────────────

  private dust(b: AABB, share: number): void {
    const n = Math.round(30 + share * 220);
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    const cz = (b.minZ + b.maxZ) / 2;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * (b.maxX - b.minX);
      pos[i * 3 + 1] = (Math.random() - 0.5) * (b.maxY - b.minY);
      pos[i * 3 + 2] = (Math.random() - 0.5) * (b.maxZ - b.minZ);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color: "#f3e7c6", map: dotTexture(), size: 0.035, transparent: true, opacity: 0.9, depthWrite: false });
    this.trash.push(g, m);
    const points = new THREE.Points(g, m);
    points.position.set(cx, cy, cz);
    this.root.add(points);
    const phase = Math.random() * 10;
    this.tickers.push((t) => {
      points.rotation.y = Math.sin(t * 0.05 + phase) * 0.25;
      points.position.y = cy + Math.sin(t * 0.35 + phase) * 0.08;
    });
  }

  private clouds(b: AABB, count: number, share: number, minScale: number, maxScale: number): void {
    const m = new THREE.SpriteMaterial({ map: cloudTexture(), color: "#e2e8ee", transparent: true, opacity: Math.min(0.95, 0.45 + share * 0.6), depthWrite: false });
    this.trash.push(m);
    for (let i = 0; i < count; i += 1) {
      const s = new THREE.Sprite(m);
      const x = b.minX + Math.random() * (b.maxX - b.minX);
      const y = b.minY + Math.random() * (b.maxY - b.minY);
      const z = b.minZ + Math.random() * (b.maxZ - b.minZ);
      const k = minScale + Math.random() * (maxScale - minScale);
      s.scale.set(k, k * 0.7, 1);
      s.position.set(x, y, z);
      this.root.add(s);
      const phase = Math.random() * 10;
      this.tickers.push((t) => {
        s.position.x = x + Math.sin(t * 0.15 + phase) * 0.6;
        s.position.y = y + Math.sin(t * 0.11 + phase) * 0.2;
      });
    }
  }
}
