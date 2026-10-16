import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  confirmCardSplit,
  type Database,
  ensureCard,
  getTokenById,
  getTokenMedia,
  inlineImageIssue,
  installKvtTile,
  type KvtTile,
  MAX_INLINE_IMAGE_BYTES,
  openDatabase,
  sniffInlineImageType,
} from "../../src/kernel/index.js";

/**
 * Images inside card text (ADR 2026-10-14b, Decision 5; plan Phase 8):
 * recognised by their bytes, capped at 256 KB, shipped by a tile beside
 * itself and stored as `inline` media rows. Synthetic bytes and tiles.
 */

const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const SVG = new TextEncoder().encode(
  "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>",
);
const sha = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

function tileWithImage(hash: string, type = "image/png"): KvtTile {
  return {
    tile_id: "test:bilder",
    version: "2026.10.1",
    title: "Bilder",
    atoms: [
      {
        id: "01K9TEST000000000000000A11",
        title: "Schaltzeichen",
        domain: "physik/elektrizitaet",
        practice_items: [
          {
            id: "01K9TEST000000000000000J11",
            language: "de",
            tier: "tier2_synthesis",
            bloom_level: 1,
            question_segments: [
              { type: "text", text: "Wofür steht dieses Schaltzeichen? " },
              { type: "image", media: hash, alt: "Zwei parallele Striche" },
            ],
            concept: "Für einen Kondensator.",
            materiality: "cosmetic",
          },
        ],
      },
    ],
    media: [{ sha256: hash, type }],
  };
}

describe("inline image bytes", () => {
  it("recognises the four formats by their magic bytes, never by name", () => {
    expect(sniffInlineImageType(PNG)).toBe("image/png");
    expect(
      sniffInlineImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])),
    ).toBe("image/jpeg");
    expect(sniffInlineImageType(new TextEncoder().encode("GIF89a..."))).toBe(
      "image/gif",
    );
    expect(
      sniffInlineImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ")),
    ).toBe("image/webp");
    expect(sniffInlineImageType(SVG)).toBeNull();
  });

  it("refuses a renamed SVG and an oversize image", () => {
    expect(inlineImageIssue(SVG, "image/png")).toMatch(/none of them/);
    const big = new Uint8Array(MAX_INLINE_IMAGE_BYTES + 1);
    big.set(PNG);
    expect(inlineImageIssue(big, "image/png")).toMatch(/at most 256 KB/);
    expect(inlineImageIssue(PNG, "image/jpeg")).toMatch(/claims to be/);
    expect(inlineImageIssue(PNG, "image/png")).toBeNull();
  });
});

describe("a tile that ships an image", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-inline-images-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("installs it as an inline media row, checked", async () => {
    const hash = sha(PNG);
    await installKvtTile(db, tileWithImage(hash), {
      media: (wanted) => (wanted === hash ? PNG : null),
    });
    const media = await getTokenMedia(db, "01K9TEST000000000000000J11");
    expect(media).toHaveLength(1);
    expect(media[0]).toMatchObject({
      assetHash: hash,
      side: "question",
      placement: "inline",
      altText: "Zwei parallele Striche",
    });
  });

  it("drops the inline rows when a split rewrites the question as plain text", async () => {
    const hash = sha(PNG);
    await installKvtTile(db, tileWithImage(hash), {
      media: (wanted) => (wanted === hash ? PNG : null),
    });
    const itemId = "01K9TEST000000000000000J11";
    const token = await getTokenById(db, itemId);
    if (!token) throw new Error("token missing");
    await ensureCard(db, itemId, "learner");
    await confirmCardSplit(
      db,
      "learner",
      token.slug,
      "block",
      "Welches Bauteil hat das Schaltzeichen mit zwei Strichen?",
      token.concept,
      [
        {
          question: "Was speichert ein Kondensator?",
          concept: "Ladung.",
          domain: "physik",
        },
        {
          question: "Wovon hängt die Kapazität ab?",
          concept: "Fläche und Abstand.",
          domain: "physik",
        },
      ],
    );
    expect(await getTokenMedia(db, itemId)).toEqual([]);
    expect((await getTokenById(db, itemId))?.question_segments).toBeNull();
  });

  it("refuses a renamed SVG, a wrong hash and an image it does not ship", async () => {
    const svgHash = sha(SVG);
    await expect(
      installKvtTile(db, tileWithImage(svgHash), { media: () => SVG }),
    ).rejects.toThrow(/none of them/);
    await expect(
      installKvtTile(db, tileWithImage(sha(PNG)), { media: () => SVG }),
    ).rejects.toThrow(/does not match its hash/);
    await expect(installKvtTile(db, tileWithImage(sha(PNG)))).rejects.toThrow(
      /does not ship it/,
    );
    expect(await getTokenMedia(db, "01K9TEST000000000000000J11")).toEqual([]);
  });
});
