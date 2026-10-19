#!/usr/bin/env node
// Copies the published ZAM Academy cells into this repository's fixtures, so
// a release bundles them (ADR 2026-10-19 Decision 1, plan Phase 6).
//
//   npm run academy:sync
//
// - Reads https://academy.zam-os.org/catalog.json. Any redirect fails, like
//   ZAM's own catalog client.
// - Downloads each cell, checks its SHA-256, tile id and version against
//   the catalog, and writes the bytes unchanged to
//   tests/fixtures/curriculum/zam-academy-<app>-kvt.json.
// - Records what it copied in tests/fixtures/curriculum/zam-academy-cells.lock.json.
//   tests/kernel/academy-cells-lock.test.ts checks the fixtures against that
//   record, never against the live catalog, which moves weekly by design.
// - Appends a new cell to the fixture imports in bundled-cells.ts.
//
// The release PR runs this and commits the result.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { get } from "node:https";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://academy.zam-os.org";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = join(root, "tests", "fixtures", "curriculum");
const lockFile = join(fixtures, "zam-academy-cells.lock.json");
const MAX_BYTES = 2 * 1024 * 1024;
const APP = /^\/([a-z0-9][a-z0-9-]{0,31})\/$/;
const CELL = /^\/[a-z0-9][a-z0-9-]{0,31}\/cell\.json$/;
const VERSION = /^\d+(\.\d+)*$/;

function fetchBytes(url) {
  if (new URL(url).origin !== ORIGIN) throw new Error(`Not on ${ORIGIN}: ${url}`);
  return new Promise((resolveBytes, reject) => {
    const request = get(
      url,
      { headers: { Accept: "application/json", "User-Agent": "zam-academy-sync" } },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`${url}: HTTP ${response.statusCode} (redirects are refused)`));
          return;
        }
        const chunks = [];
        let size = 0;
        response.on("data", (chunk) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            request.destroy(new Error(`${url}: larger than ${MAX_BYTES} bytes`));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => resolveBytes(Buffer.concat(chunks)));
        response.on("error", reject);
      },
    );
    request.setTimeout(15_000, () => request.destroy(new Error(`${url}: timeout`)));
    request.on("error", reject);
  });
}

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const catalog = JSON.parse((await fetchBytes(`${ORIGIN}/catalog.json`)).toString("utf8"));
if (catalog?.schema !== 1 || !Array.isArray(catalog.cells)) {
  throw new Error("catalog.json: expected { schema: 1, cells: [...] }");
}

const lock = [];
let added = false;
for (const entry of catalog.cells) {
  const app = APP.exec(entry.app ?? "")?.[1];
  if (!app || !CELL.test(entry.cell ?? "") || !VERSION.test(entry.version ?? "")) {
    throw new Error(`catalog.json: malformed entry ${JSON.stringify(entry.id)}`);
  }
  const bytes = await fetchBytes(new URL(entry.cell, ORIGIN).href);
  const hash = sha256(bytes);
  if (hash !== entry.sha256) throw new Error(`${entry.id}: hash does not match the catalog`);
  const tile = JSON.parse(bytes.toString("utf8"));
  if (tile.tile_id !== entry.id || String(tile.version) !== entry.version) {
    throw new Error(`${entry.id}: the file is ${tile.tile_id} ${tile.version}, the catalog says ${entry.version}`);
  }
  const file = `zam-academy-${app}-kvt.json`;
  const path = join(fixtures, file);
  if (!existsSync(path)) added = true;
  const before = existsSync(path) ? sha256(readFileSync(path)) : null;
  writeFileSync(path, bytes);
  lock.push({ id: entry.id, version: entry.version, sha256: hash, file });
  console.log(`${before === hash ? "same   " : before ? "updated" : "added  "} ${file}  ${entry.id} ${entry.version}`);
}

lock.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(lockFile, `${JSON.stringify(lock, null, 2)}\n`);
console.log(`Wrote ${lockFile}`);

// A new cell is appended to the fixture imports, as tile<N+1>Raw. The full
// generator (scripts/update-bundled-cells-imports.mjs) would renumber all of
// them and rewrite hundreds of lines for one cell.
function appendFixtureImport(file) {
  const target = join(root, "src", "kernel", "library", "bundled-cells.ts");
  let source = readFileSync(target, "utf8");
  if (source.includes(`/curriculum/${file}"`)) return;
  const next =
    Math.max(0, ...[...source.matchAll(/tile(\d+)Raw\b/g)].map((m) => Number(m[1]))) + 1;
  const importEnd = "// --- end bundled-tile-imports ---";
  const mapEnd = "};\n// --- end bundled-tile-map ---";
  if (!source.includes(importEnd) || !source.includes(mapEnd)) {
    throw new Error("bundled-cells.ts: fixture markers not found");
  }
  source = source.replace(
    importEnd,
    `import tile${next}Raw from "../../../tests/fixtures/curriculum/${file}" with { type: "json" };\n${importEnd}`,
  );
  source = source.replace(
    mapEnd,
    `  [(tile${next}Raw as unknown as BundledTile).tile_id]: tile${next}Raw as unknown as BundledTile,\n${mapEnd}`,
  );
  source = source.replace(/\/\/ --- Fixture Imports \((\d+) tiles\) ---/, (_, n) =>
    `// --- Fixture Imports (${Number(n) + 1} tiles) ---`,
  );
  writeFileSync(target, source);
  console.log(`Added tile${next}Raw for ${file} to bundled-cells.ts`);
}

if (added) {
  for (const { file } of lock) appendFixtureImport(file);
  execFileSync("npx", ["biome", "check", "--write", "src/kernel/library/bundled-cells.ts"], {
    cwd: root,
    stdio: "inherit",
  });
}
