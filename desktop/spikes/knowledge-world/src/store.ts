/**
 * Node-side persistence for the spike: one JSON file shared by the Vite dev
 * server (Studio side) and the agent CLI. Nothing here touches ~/.zam.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createStartWorld, tileKeyFromFileName } from "./model.ts";
import type { TileCatalog, TileJson, World } from "./model.ts";
import { SAMPLE_EMBLEMS } from "./sample-emblems.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const SPIKE_DIR = resolve(here, "..");
export const REPO_ROOT = resolve(SPIKE_DIR, "../../..");
export const WORLD_FILE = join(SPIKE_DIR, ".data", "world.json");
export const TILE_DIR = join(REPO_ROOT, "tests", "fixtures", "curriculum");

/** Realschule tiles of grades 7–9 — enough for Mathe 9, its foundations and a few neighbours. */
export function loadCatalog(): TileCatalog {
  const catalog: TileCatalog = {};
  for (const name of readdirSync(TILE_DIR).sort()) {
    if (!/^de-by-realschule-[789]-.*-kvt\.json$/.test(name)) continue;
    const key = tileKeyFromFileName(name);
    if (key) catalog[key] = JSON.parse(readFileSync(join(TILE_DIR, name), "utf8")) as TileJson;
  }
  return catalog;
}

export function readWorld(): World {
  if (!existsSync(WORLD_FILE)) {
    const world = createStartWorld(loadCatalog(), { history: true, emblems: SAMPLE_EMBLEMS });
    writeWorld(world);
    return world;
  }
  return JSON.parse(readFileSync(WORLD_FILE, "utf8")) as World;
}

/** Atomic write, so a watcher never reads half a file. */
export function writeWorld(world: World): void {
  mkdirSync(dirname(WORLD_FILE), { recursive: true });
  const tmp = `${WORLD_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(world, null, 2)}\n`);
  renameSync(tmp, WORLD_FILE);
}
