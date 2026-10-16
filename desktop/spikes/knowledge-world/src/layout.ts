/**
 * Where things stand in the world, in metres. Pure geometry shared by the
 * 3D scene, the walking player, the minimap and the big map.
 *
 * A building stands on a lot along the street (x axis). Its local frame:
 * lx runs along the street from the left end, lz runs from the front facade
 * into the building. Each floor: a stairwell (lx 0–4), a corridor along the
 * front (lz 0–2.4) and rooms of 6 × 6 m behind it.
 */
import type { Building, World } from "./model.ts";
import { HOME_ID } from "./model.ts";

export const FLOOR_H = 3.4;
export const WALL_T = 0.16;
export const STAIR_W = 4;
export const CORRIDOR_D = 2.4;
export const ROOM_W = 6;
export const ROOM_D = 6;
export const DEPTH = CORRIDOR_D + ROOM_D;
export const DOOR_W = 1.3;
export const DOOR_H = 2.3;
export const EYE = 1.6;
export const SETBACK = 7;
export const LOT_SPACING = 46;
export const ENTRANCE = { from: 1.2, to: 2.8 };

export const HOME = { minX: -4.5, maxX: 4.5, minZ: -16, maxZ: -7, height: 3.2, doorFrom: -0.9, doorTo: 0.9 };

/** Cabinet spots in room coordinates (rx along the room, rz from the door wall), facing into the room. */
export const CABINET_SPOTS: Array<{ rx: number; rz: number; face: [number, number] }> = [
  { rx: 1.2, rz: ROOM_D - 0.55, face: [0, -1] },
  { rx: 3.0, rz: ROOM_D - 0.55, face: [0, -1] },
  { rx: 4.8, rz: ROOM_D - 0.55, face: [0, -1] },
  { rx: 0.55, rz: 2.1, face: [1, 0] },
  { rx: 0.55, rz: 3.9, face: [1, 0] },
  { rx: ROOM_W - 0.55, rz: 2.1, face: [-1, 0] },
  { rx: ROOM_W - 0.55, rz: 3.9, face: [-1, 0] },
];

export interface Frame {
  x0: number;
  zFront: number;
  /** +1: the building extends towards +z (south side), −1 towards −z. */
  sz: 1 | -1;
  length: number;
}

export function roomSlots(b: Building): number {
  return Math.max(1, ...b.floors.map((f) => f.rooms.length));
}

export function buildingFrame(b: Building): Frame {
  const north = b.lot % 2 === 0;
  const k = Math.floor(b.lot / 2);
  return {
    x0: north ? 10 + k * LOT_SPACING : -20 + k * LOT_SPACING,
    zFront: north ? -SETBACK : SETBACK,
    sz: north ? -1 : 1,
    length: STAIR_W + roomSlots(b) * ROOM_W,
  };
}

export function toWorld(f: Frame, lx: number, lz: number): { x: number; z: number } {
  return { x: f.x0 + lx, z: f.zFront + f.sz * lz };
}

export function toLocal(f: Frame, x: number, z: number): { lx: number; lz: number } {
  return { lx: x - f.x0, lz: (z - f.zFront) * f.sz };
}

export interface AABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/** World-space box from a local rectangle. */
export function localBox(f: Frame, lx0: number, lx1: number, lz0: number, lz1: number, y0: number, y1: number): AABB {
  const a = toWorld(f, lx0, lz0);
  const b = toWorld(f, lx1, lz1);
  return {
    minX: Math.min(a.x, b.x),
    maxX: Math.max(a.x, b.x),
    minY: y0,
    maxY: y1,
    minZ: Math.min(a.z, b.z),
    maxZ: Math.max(a.z, b.z),
  };
}

/** Yaw (camera rotation.y) that looks along the world direction (dx, dz). */
export function yawFacing(dx: number, dz: number): number {
  return Math.atan2(-dx, -dz);
}

export type Where =
  | { kind: "outside" }
  | { kind: "home" }
  | {
      kind: "building";
      building: Building;
      floorIndex: number;
      area: "stairs" | "corridor" | "room" | "shell";
      roomIndex: number | null;
    };

export function locate(world: World, x: number, feetY: number, z: number): Where {
  if (x > HOME.minX && x < HOME.maxX && z > HOME.minZ && z < HOME.maxZ && feetY < 1) return { kind: "home" };
  for (const building of world.buildings) {
    const f = buildingFrame(building);
    const { lx, lz } = toLocal(f, x, z);
    if (lx < 0 || lx > f.length || lz < 0 || lz > DEPTH || building.floors.length === 0) continue;
    const floorIndex = Math.max(0, Math.min(building.floors.length - 1, Math.round(feetY / FLOOR_H)));
    if (lx < STAIR_W) return { kind: "building", building, floorIndex, area: "stairs", roomIndex: null };
    if (lz < CORRIDOR_D) return { kind: "building", building, floorIndex, area: "corridor", roomIndex: null };
    const slot = Math.floor((lx - STAIR_W) / ROOM_W);
    const exists = slot < building.floors[floorIndex].rooms.length;
    return { kind: "building", building, floorIndex, area: exists ? "room" : "shell", roomIndex: exists ? slot : null };
  }
  return { kind: "outside" };
}

export interface Spawn {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export function homeSpawn(): Spawn {
  return { x: 0, y: 0, z: HOME.maxZ - 1.2, yaw: yawFacing(0, -1) };
}

export function entranceSpawn(b: Building): Spawn {
  const f = buildingFrame(b);
  const p = toWorld(f, (ENTRANCE.from + ENTRANCE.to) / 2, -3.5);
  return { x: p.x, y: 0, z: p.z, yaw: yawFacing(0, f.sz) };
}

export function floorSpawn(b: Building, floorIndex: number): Spawn {
  const f = buildingFrame(b);
  const p = toWorld(f, 2.2, 1.2);
  return { x: p.x, y: floorIndex * FLOOR_H, z: p.z, yaw: yawFacing(1, 0) };
}

export function roomSpawn(world: World, roomId: string): Spawn | null {
  if (roomId === HOME_ID) return homeSpawn();
  for (const b of world.buildings) {
    for (const [fi, floor] of b.floors.entries()) {
      const ri = floor.rooms.findIndex((r) => r.id === roomId);
      if (ri < 0) continue;
      const f = buildingFrame(b);
      const p = toWorld(f, STAIR_W + ri * ROOM_W + ROOM_W / 2, CORRIDOR_D + 0.9);
      return { x: p.x, y: fi * FLOOR_H, z: p.z, yaw: yawFacing(0, f.sz) };
    }
  }
  return null;
}

/** Walls the player cannot walk through. */
export function colliders(world: World): AABB[] {
  const out: AABB[] = [];
  const h = HOME;
  const t = WALL_T;
  out.push(
    { minX: h.minX, maxX: h.minX + t, minY: 0, maxY: h.height, minZ: h.minZ, maxZ: h.maxZ },
    { minX: h.maxX - t, maxX: h.maxX, minY: 0, maxY: h.height, minZ: h.minZ, maxZ: h.maxZ },
    { minX: h.minX, maxX: h.maxX, minY: 0, maxY: h.height, minZ: h.minZ, maxZ: h.minZ + t },
    { minX: h.minX, maxX: h.doorFrom, minY: 0, maxY: h.height, minZ: h.maxZ - t, maxZ: h.maxZ },
    { minX: h.doorTo, maxX: h.maxX, minY: 0, maxY: h.height, minZ: h.maxZ - t, maxZ: h.maxZ },
  );
  for (const b of world.buildings) {
    const f = buildingFrame(b);
    const L = f.length;
    b.floors.forEach((floor, i) => {
      const y0 = i * FLOOR_H;
      const y1 = y0 + FLOOR_H;
      const wall = (lx0: number, lx1: number, lz0: number, lz1: number) => out.push(localBox(f, lx0, lx1, lz0, lz1, y0, y1));
      if (i === 0) {
        wall(0, ENTRANCE.from, 0, t);
        wall(ENTRANCE.to, L, 0, t);
      } else {
        wall(0, L, 0, t);
      }
      wall(0, L, DEPTH - t, DEPTH);
      wall(0, t, 0, DEPTH);
      wall(L - t, L, 0, DEPTH);
      wall(STAIR_W - t / 2, STAIR_W + t / 2, CORRIDOR_D, DEPTH);
      wall(0.35, 3.71, DEPTH - 2.5, DEPTH - 0.25);
      const slots = roomSlots(b);
      for (let s = 0; s < slots; s += 1) {
        const rx0 = STAIR_W + s * ROOM_W;
        if (s < floor.rooms.length) {
          const d0 = rx0 + (ROOM_W - DOOR_W) / 2;
          wall(rx0, d0, CORRIDOR_D - t / 2, CORRIDOR_D + t / 2);
          wall(d0 + DOOR_W, rx0 + ROOM_W, CORRIDOR_D - t / 2, CORRIDOR_D + t / 2);
          for (const cabinet of floor.rooms[s].cabinets) {
            const spot = CABINET_SPOTS[cabinet.spot];
            const along = spot.face[0] === 0;
            const hw = along ? 0.75 : 0.28;
            const hd = along ? 0.28 : 0.75;
            wall(rx0 + spot.rx - hw, rx0 + spot.rx + hw, CORRIDOR_D + spot.rz - hd, CORRIDOR_D + spot.rz + hd);
          }
        } else {
          wall(rx0, rx0 + ROOM_W, CORRIDOR_D - t / 2, CORRIDOR_D + t / 2);
        }
        if (s > 0) wall(rx0 - t / 2, rx0 + t / 2, CORRIDOR_D, DEPTH);
      }
    });
  }
  return out;
}
