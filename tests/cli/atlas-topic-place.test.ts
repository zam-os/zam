import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { atlasMovePlanet, placeImportedUnits } from "../../src/cli/atlas.js";
import {
  createToken,
  type Database,
  ensureCard,
  LEBEN_LENS,
  openDatabase,
  readAtlas,
  SCHULE_LENS,
  settleLens,
  WELTWISSEN_LENS,
} from "../../src/kernel/index.js";

/**
 * An import at a Fach that exists only by derivation (an own domain such as
 * `github/…`), as a topic import starts one: the units it creates land below
 * that Fach, and the map still reads in every lens (ADR 2026-10-13,
 * Decision 9).
 */
describe("topic import at a derived Fach", () => {
  let dir: string;
  let db: Database;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-atlas-topic-place-"));
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  async function ownToken(slug: string, domain: string): Promise<string> {
    const token = await createToken(db, { slug, concept: slug, domain });
    await ensureCard(db, token.id, "thomas");
    return token.id;
  }

  // No world rule covers `github/…`: such units start on the own planet
  // (Leben). Moved to world knowledge, they sit on Weltwissen's unsorted
  // island and Schule's "Außerhalb des Lehrplans" (ADR 2026-10-13, D2).
  for (const lens of [WELTWISSEN_LENS, SCHULE_LENS, LEBEN_LENS]) {
    it(`places new units below the Fach and still reads (${lens.kind})`, async () => {
      const existing = [
        await ownToken("github-pull-request", "github/pull-requests"),
        await ownToken("github-actions", "github/actions"),
      ];
      if (lens.planet === "welt") {
        await atlasMovePlanet(db, {
          planet: "welt",
          units: existing.map((id) => `token:${id}`),
        });
      }
      const lenses = [WELTWISSEN_LENS, SCHULE_LENS, LEBEN_LENS];
      for (const each of lenses) await settleLens(db, each);
      const before = await readAtlas(db, { userId: "thomas", lens });
      const fach = before.regions.find(
        (r) => r.level === lens.colourLevel && r.hueKey === "github",
      );
      expect(fach).toBeDefined();

      const created = [
        await ownToken("github-branch-protection", "github/sicherheit"),
        await ownToken("github-codeowners", "github/sicherheit"),
      ];
      const placed = await placeImportedUnits(db, {
        lens: lens.kind,
        region: fach?.key ?? "",
        units: created.map((tokenId) => ({
          tokenId,
          names: ["GitHub absichern", "Branch-Schutz"],
        })),
      });
      expect(placed).toBe(2);

      // Every lens reads, before and after the land is stored.
      for (const each of lenses) {
        await readAtlas(db, { userId: "thomas", lens: each });
        await settleLens(db, each);
        const after = await readAtlas(db, { userId: "thomas", lens: each });
        if (each.kind === lens.kind) {
          const units = after.units.filter((u) =>
            created.some((id) => u.key === `token:${id}`),
          );
          expect(units).toHaveLength(2);
          expect(units.every((u) => u.region.endsWith(".branch-schutz"))).toBe(
            true,
          );
          const hexes = after.land.filter((h) =>
            created.some((id) => h.unit === `token:${id}`),
          );
          expect(hexes).toHaveLength(2);
        }
      }
    });
  }
});
