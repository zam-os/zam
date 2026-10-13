/**
 * Node-side persistence for the atlas spike: one JSON file shared by the
 * Vite dev server (Studio side) and the agent CLI. Nothing here touches ~/.zam.
 *
 * In the product the planets live in different places — world knowledge on
 * a central server, company knowledge on the company's server, private
 * knowledge on the device. The spike keeps them in one file but never mixes
 * their content: each planet holds only its own units and regions.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tileKeyFromFileName } from "../../knowledge-world/src/model.ts";
import { SAMPLE_EMBLEMS } from "../../knowledge-world/src/sample-emblems.ts";
import { createStartAtlas } from "./atlas.ts";
import type { Atlas, TileCatalog, TileJson } from "./atlas.ts";
import { settleAll } from "./layout.ts";
import { REGION_EMBLEMS } from "./sample-emblems.ts";
import { START_SAMPLES } from "./sample-planets.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const SPIKE_DIR = resolve(here, "..");
export const REPO_ROOT = resolve(SPIKE_DIR, "../../..");
export const ATLAS_FILE = join(SPIKE_DIR, ".data", "atlas.json");
export const TILE_DIR = join(REPO_ROOT, "tests", "fixtures", "curriculum");

/** Every bundled Bavarian tile — the start atlas uses Realschule 5–9, the rest can be imported. */
export function loadCatalog(): TileCatalog {
  const catalog: TileCatalog = {};
  for (const name of readdirSync(TILE_DIR).sort()) {
    const key = tileKeyFromFileName(name);
    if (key) catalog[key] = JSON.parse(readFileSync(join(TILE_DIR, name), "utf8")) as TileJson;
  }
  return catalog;
}

export function freshAtlas(opts: { history?: boolean; emblems?: boolean } = {}): Atlas {
  const emblems = opts.emblems ?? true;
  const atlas = createStartAtlas(loadCatalog(), START_SAMPLES, {
    history: opts.history ?? true,
    regionEmblems: emblems ? REGION_EMBLEMS : undefined,
    unitEmblems: emblems ? SAMPLE_EMBLEMS : undefined,
  });
  settleAll(atlas);
  return atlas;
}

export function readAtlas(): Atlas {
  if (existsSync(ATLAS_FILE)) {
    const atlas = JSON.parse(readFileSync(ATLAS_FILE, "utf8")) as Atlas;
    // The first spike version had no planets; start over rather than migrate a throwaway file.
    if (atlas.schema === "zam-knowledge-atlas-spike/2") return atlas;
  }
  const atlas = freshAtlas();
  writeAtlas(atlas);
  return atlas;
}

/** Atomic write, so a watcher never reads half a file. */
export function writeAtlas(atlas: Atlas): void {
  mkdirSync(dirname(ATLAS_FILE), { recursive: true });
  const tmp = `${ATLAS_FILE}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(atlas, null, 2)}\n`);
  renameSync(tmp, ATLAS_FILE);
}
