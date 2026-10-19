import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BUNDLED_TILES } from "../../src/kernel/index.js";

/**
 * ADR 2026-10-19 Decision 1, plan Phase 6: zam-os/zam-academy is the source
 * of academy cells, and ZAM bundles copies made by `npm run academy:sync`.
 * Each copy must be exactly what the catalog published at that version.
 * This checks against the recorded copy, never the live catalog, which
 * moves weekly by design.
 */

const FIXTURES = resolve(__dirname, "../fixtures/curriculum");

interface LockEntry {
  id: string;
  version: string;
  sha256: string;
  file: string;
}

const lock = JSON.parse(
  readFileSync(join(FIXTURES, "zam-academy-cells.lock.json"), "utf8"),
) as LockEntry[];

describe("bundled ZAM Academy cells", () => {
  it("are byte for byte the published version the lock records", () => {
    expect(lock.length).toBeGreaterThan(0);
    for (const entry of lock) {
      const bytes = readFileSync(join(FIXTURES, entry.file));
      expect(
        createHash("sha256").update(bytes).digest("hex"),
        `${entry.file} was edited here; change it in zam-os/zam-academy and run npm run academy:sync`,
      ).toBe(entry.sha256);
      const tile = JSON.parse(bytes.toString("utf8"));
      expect(tile.tile_id).toBe(entry.id);
      expect(String(tile.version)).toBe(entry.version);
      expect(BUNDLED_TILES[entry.id], `${entry.id} is bundled`).toBeDefined();
    }
  });

  it("has a lock entry for every academy fixture", () => {
    const fixtures = readdirSync(FIXTURES).filter(
      (file) => file.startsWith("zam-academy-") && file.endsWith("-kvt.json"),
    );
    expect(fixtures.sort()).toEqual(lock.map((entry) => entry.file).sort());
  });
});
