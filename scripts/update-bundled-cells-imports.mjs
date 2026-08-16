import fs from "node:fs";
import path from "node:path";

const FIXTURES_DIR = path.resolve("tests/fixtures/curriculum");
const TARGET_FILE = path.resolve("src/kernel/library/bundled-cells.ts");

const IMPORT_BEGIN = "// --- begin bundled-tile-imports ---";
const IMPORT_END = "// --- end bundled-tile-imports ---";
const MAP_BEGIN = "// --- begin bundled-tile-map ---";
const MAP_END = "// --- end bundled-tile-map ---";

const files = fs
  .readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith("-kvt.json"))
  .sort();

console.log(`Found ${files.length} curriculum KVT fixture files.`);

const importStatements = files
  .map(
    (file, idx) =>
      `import tile${idx + 1}Raw from "../../../tests/fixtures/curriculum/${file}" with { type: "json" };`,
  )
  .join("\n");

const tileEntries = files
  .map(
    (_, idx) =>
      `  [(tile${idx + 1}Raw as unknown as BundledTile).tile_id]: tile${idx + 1}Raw as unknown as BundledTile,`,
  )
  .join("\n");

const currentContent = fs.readFileSync(TARGET_FILE, "utf-8");

function replaceMarkedSection(source, begin, end, inner) {
  const start = source.indexOf(begin);
  const stop = source.indexOf(end);
  if (start === -1 || stop === -1 || stop < start) {
    throw new Error(
      `Missing markers ${begin} / ${end} in bundled-cells.ts. ` +
        `Do not regenerate this file by slicing at formatGradeLabel.`,
    );
  }
  return (
    source.slice(0, start) +
    `${begin}\n${inner}\n${end}` +
    source.slice(stop + end.length)
  );
}

const withImports = replaceMarkedSection(
  currentContent,
  IMPORT_BEGIN,
  IMPORT_END,
  `// --- Fixture Imports (${files.length} tiles) ---\n${importStatements}`,
);

const nextContent = replaceMarkedSection(
  withImports,
  MAP_BEGIN,
  MAP_END,
  `export const BUNDLED_TILES: Record<string, BundledTile> = {\n${tileEntries}\n};`,
);

fs.writeFileSync(TARGET_FILE, nextContent, "utf-8");
console.log(`Updated ${TARGET_FILE} with ${files.length} tiles.`);
