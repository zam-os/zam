/**
 * Corner minimap: the neighbourhood when outside, the floor plan when inside
 * a building. A click opens the big map (Lageplan) to jump anywhere.
 */
import { CONDITION_COLOR } from "./scene.ts";
import {
  CORRIDOR_D,
  DEPTH,
  HOME,
  ROOM_W,
  STAIR_W,
  buildingFrame,
  toLocal,
} from "./layout.ts";
import type { Where } from "./layout.ts";
import { cardsOf, conceptsInBuilding, conceptsInRoom, simNow, statsFor } from "./model.ts";
import type { World } from "./model.ts";

export interface Viewer {
  x: number;
  z: number;
  yaw: number;
}

const SIZE = 210;

export function drawMinimap(canvas: HTMLCanvasElement, world: World, me: Viewer, where: Where): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== SIZE * dpr) {
    canvas.width = canvas.height = SIZE * dpr;
    canvas.style.width = canvas.style.height = `${SIZE}px`;
  }
  const g = canvas.getContext("2d") as CanvasRenderingContext2D;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, SIZE, SIZE);
  g.fillStyle = "#f6f8fa";
  g.fillRect(0, 0, SIZE, SIZE);
  g.font = '600 11px "Atkinson Hyperlegible Next Variable", system-ui, sans-serif';
  const now = simNow(world);

  if (where.kind === "building") {
    const b = where.building;
    const f = buildingFrame(b);
    const floor = b.floors[where.floorIndex];
    const scale = Math.min((SIZE - 24) / f.length, (SIZE - 56) / DEPTH);
    const ox = (SIZE - f.length * scale) / 2;
    const base = SIZE - 16;
    const px = (lx: number) => ox + lx * scale;
    const py = (lz: number) => base - lz * scale;
    g.fillStyle = "#d9d5cb";
    g.fillRect(px(0), py(DEPTH), f.length * scale, DEPTH * scale);
    g.fillStyle = "#bdb7ab";
    g.fillRect(px(0), py(DEPTH), STAIR_W * scale, (DEPTH - CORRIDOR_D) * scale);
    floor.rooms.forEach((room, i) => {
      const st = statsFor(cardsOf(conceptsInRoom(world, room)), now);
      const x = px(STAIR_W + i * ROOM_W) + 1.5;
      const y = py(DEPTH) + 1.5;
      g.fillStyle = CONDITION_COLOR[st.label];
      g.fillRect(x, y, ROOM_W * scale - 3, (DEPTH - CORRIDOR_D) * scale - 3);
      g.fillStyle = st.label === "dunkel" || st.label === "verfallen" ? "#fff" : "#131a23";
      g.save();
      g.beginPath();
      g.rect(x, y, ROOM_W * scale - 3, (DEPTH - CORRIDOR_D) * scale - 3);
      g.clip();
      g.fillText(room.name, x + 3, y + 13);
      g.restore();
    });
    g.fillStyle = "#131a23";
    g.fillText(`${b.name} › ${floor.label}`, 8, 16);
    g.fillStyle = "#5a6675";
    g.fillText(`Etage ${where.floorIndex + 1} von ${b.floors.length}`, 8, 30);
    const { lx, lz } = toLocal(f, me.x, me.z);
    arrow(g, px(lx), py(lz), -Math.sin(me.yaw), Math.cos(me.yaw) * f.sz);
    return;
  }

  const scale = 2.1;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const sx = (x: number) => cx + (x - me.x) * scale;
  const sy = (z: number) => cy + (z - me.z) * scale;
  g.fillStyle = "#cfd8c2";
  g.fillRect(0, 0, SIZE, SIZE);
  g.fillStyle = "#8c9198";
  g.fillRect(0, sy(-3.5), SIZE, 7 * scale);
  g.fillStyle = "#e9b98f";
  g.fillRect(sx(HOME.minX), sy(HOME.minZ), (HOME.maxX - HOME.minX) * scale, (HOME.maxZ - HOME.minZ) * scale);
  for (const b of world.buildings) {
    const f = buildingFrame(b);
    const st = statsFor(cardsOf(conceptsInBuilding(world, b)), now);
    const z0 = Math.min(f.zFront, f.zFront + f.sz * DEPTH);
    const x = sx(f.x0);
    const y = sy(z0);
    g.fillStyle = b.floors.length === 0 ? "#b9b5ad" : `hsl(${b.hue} 35% 60%)`;
    g.fillRect(x, y, f.length * scale, DEPTH * scale);
    g.fillStyle = CONDITION_COLOR[st.label];
    g.fillRect(x, y + DEPTH * scale - 4, f.length * scale, 4);
    if (st.fog > 0.05) {
      g.fillStyle = `rgba(240,244,248,${Math.min(0.85, st.fog)})`;
      g.fillRect(x - 3, y - 3, f.length * scale + 6, DEPTH * scale + 6);
    }
    g.fillStyle = "#131a23";
    g.fillText(b.name, x + 2, y - 4);
  }
  arrow(g, cx, cy, -Math.sin(me.yaw), -Math.cos(me.yaw));
  g.fillStyle = "#384454";
  g.fillText(where.kind === "home" ? "Dein Zimmer" : "Draußen", 8, 16);
}

function arrow(g: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number): void {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  g.fillStyle = "#2340b5";
  g.strokeStyle = "#ffffff";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x + ux * 9, y + uy * 9);
  g.lineTo(x - ux * 6 - uy * 6, y - uy * 6 + ux * 6);
  g.lineTo(x - ux * 6 + uy * 6, y - uy * 6 - ux * 6);
  g.closePath();
  g.stroke();
  g.fill();
}
