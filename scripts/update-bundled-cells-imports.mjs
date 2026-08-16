import fs from "node:fs";
import path from "node:path";

const FIXTURES_DIR = path.resolve("tests/fixtures/curriculum");
const TARGET_FILE = path.resolve("src/kernel/library/bundled-cells.ts");

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
      `  [( tile${idx + 1}Raw as unknown as BundledTile).tile_id]: tile${idx + 1}Raw as unknown as BundledTile,`,
  )
  .join("\n");

const currentContent = fs.readFileSync(TARGET_FILE, "utf-8");

// Find where formatGradeLabel starts
const formatGradeLabelIndex = currentContent.indexOf(
  "function formatGradeLabel(",
);
if (formatGradeLabelIndex === -1) {
  throw new Error(
    "Could not find function formatGradeLabel in bundled-cells.ts",
  );
}

const restOfFile = currentContent.slice(formatGradeLabelIndex);

const newContent = `// Auto-generated bundled cells library
// Generated on: ${new Date().toISOString()}

import type { Database } from "../db/types.js";
import {
  installKvtTile,
  type KvtTile,
  materialiseKvtCards,
} from "./kvt-attach.js";

export interface BundledTile extends KvtTile {
  description?: string;
  published_at?: string;
  sources?: Array<{ uri: string; label?: string; checked?: string }>;
}

// --- Fixture Imports (${files.length} tiles) ---
${importStatements}

export interface BundledCellInfo {
  id: string;
  title: string;
  gradeLabel: string;
  description: string;
  publisher: string;
  publishedAt: string;
  atomCount: number;
  inScopeAtomIds: string[];
}

export interface BundledCellStatus extends BundledCellInfo {
  installed: boolean;
  enrolled: boolean;
  cardCount: number;
}

export interface BundledCellEnrolResult {
  success: boolean;
  cellId: string;
  installed: boolean;
  cardsCreated: number;
  cardsReused: number;
  alreadyEnrolled: boolean;
}

export const BUNDLED_TILES: Record<string, BundledTile> = {
${tileEntries}
};

${restOfFile}`;

fs.writeFileSync(TARGET_FILE, newContent, "utf-8");
console.log(`Successfully updated ${TARGET_FILE} with ${files.length} tiles.`);
