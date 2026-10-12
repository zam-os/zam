/**
 * First-person walking: WASD / arrow keys to move, drag to look around.
 * Collision is a circle against axis-aligned walls on the current floor.
 */
import type * as THREE from "three";
import { EYE } from "./layout.ts";
import type { AABB, Spawn } from "./layout.ts";

const RADIUS = 0.3;

export class Player {
  x = 0;
  y = 0;
  z = 0;
  yaw = 0;
  pitch = -0.08;
  private keys = new Set<string>();
  walls: AABB[] = [];

  constructor(private camera: THREE.PerspectiveCamera) {
    camera.rotation.order = "YXZ";
  }

  press(code: string, down: boolean): void {
    if (down) this.keys.add(code);
    else this.keys.delete(code);
  }

  releaseAll(): void {
    this.keys.clear();
  }

  look(dx: number, dy: number): void {
    this.yaw -= dx * 0.0042;
    this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch - dy * 0.0042));
  }

  teleport(s: Spawn): void {
    this.x = s.x;
    this.y = s.y;
    this.z = s.z;
    this.yaw = s.yaw;
    this.pitch = -0.08;
  }

  update(dt: number): void {
    const k = this.keys;
    const fwd = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const side = (k.has("KeyD") ? 1 : 0) - (k.has("KeyA") ? 1 : 0);
    const turn = (k.has("ArrowLeft") ? 1 : 0) - (k.has("ArrowRight") ? 1 : 0);
    this.yaw += turn * dt * 1.9;
    if (fwd !== 0 || side !== 0) {
      const speed = (k.has("ShiftLeft") || k.has("ShiftRight") ? 9 : 4.2) * dt;
      const len = Math.hypot(fwd, side);
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const dx = ((-sin * fwd + cos * side) / len) * speed;
      const dz = ((-cos * fwd - sin * side) / len) * speed;
      if (!this.blocked(this.x + dx, this.z)) this.x += dx;
      if (!this.blocked(this.x, this.z + dz)) this.z += dz;
    }
    this.camera.position.set(this.x, this.y + EYE, this.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  private blocked(x: number, z: number): boolean {
    const lo = this.y + 0.15;
    const hi = this.y + 1.7;
    for (const w of this.walls) {
      if (w.maxY <= lo || w.minY >= hi) continue;
      const cx = Math.max(w.minX, Math.min(x, w.maxX));
      const cz = Math.max(w.minZ, Math.min(z, w.maxZ));
      if ((x - cx) ** 2 + (z - cz) ** 2 < RADIUS * RADIUS) return true;
    }
    return false;
  }
}
