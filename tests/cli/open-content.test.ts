import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getOpenContentCatalogItem,
  listOpenContentCatalog,
  OPEN_CONTENT_CATALOG,
  type OpenContentCatalogItem,
  validateOpenContentCatalog,
} from "../../src/cli/open-content/catalog.js";
import {
  downloadOpenContentArtifact,
  getOpenContentCachePath,
} from "../../src/cli/open-content/download.js";
import {
  applyOpenContentMetadata,
  confirmOpenContentImport,
  previewOpenContentImport,
} from "../../src/cli/open-content/service.js";
import type { TextImportDocument } from "../../src/kernel/index.js";
import { openDatabase } from "../../src/kernel/index.js";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop() as string, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "zam-open-content-"));
  tempDirs.push(directory);
  return directory;
}

function digest(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function downloadFixture(payload: Uint8Array): OpenContentCatalogItem {
  const item = structuredClone(OPEN_CONTENT_CATALOG[0]);
  item.id = "verified-test-deck";
  item.title = "Verified test deck";
  item.artifact.fileName = "verified.apkg";
  item.artifact.downloadUrl =
    "https://raw.githubusercontent.com/example/project/revision/verified.apkg";
  item.artifact.byteSize = payload.byteLength;
  item.artifact.sha256 = digest(payload);
  item.artifact.expectedCards = 1;
  return item;
}

describe("curated open-content catalog", () => {
  it("ships only complete licensed entries and supports discovery filters", () => {
    expect(() =>
      validateOpenContentCatalog(OPEN_CONTENT_CATALOG),
    ).not.toThrow();

    const objectOriented = listOpenContentCatalog({ query: "object oriented" });
    expect(objectOriented.items.map((item) => item.id)).toEqual([
      "system-design-primer-object-oriented-exercises",
    ]);
    expect(
      listOpenContentCatalog({
        language: "EN",
        subject: "Software Architecture",
      }).items,
    ).toHaveLength(2);
    expect(objectOriented.filters).toEqual({
      languages: ["en"],
      subjects: [
        "Computer Science",
        "Software Architecture",
        "Software Design",
      ],
    });
  });

  it("rejects missing attribution, incompatible licenses, and unsafe hosts", () => {
    const missingAttribution = structuredClone(OPEN_CONTENT_CATALOG[0]);
    missingAttribution.attribution = "";
    expect(() => validateOpenContentCatalog([missingAttribution])).toThrow(
      /attribution/i,
    );

    const incompatible = structuredClone(OPEN_CONTENT_CATALOG[0]) as any;
    incompatible.license.id = "LicenseRef-Proprietary";
    expect(() => validateOpenContentCatalog([incompatible])).toThrow(
      /incompatible license/i,
    );

    const unsafeHost = structuredClone(OPEN_CONTENT_CATALOG[0]);
    unsafeHost.artifact.downloadUrl = "https://unreviewed.example/deck.apkg";
    expect(() => validateOpenContentCatalog([unsafeHost])).toThrow(
      /download host/i,
    );
  });

  it("overrides package metadata with reviewed provenance", () => {
    const item = getOpenContentCatalogItem("system-design-primer-fundamentals");
    const document = applyOpenContentMetadata(
      {
        format: "apkg",
        sourceName: "download.tmp",
        cards: [
          {
            externalId: "anki:test:0",
            question: "Question",
            answer: "Answer",
            source: "https://untrusted.example",
            author: "Unknown",
            license: null,
            tags: ["original"],
          },
        ],
      },
      item,
    );

    expect(document.sourceName).toBe("System Design.apkg");
    expect(document.cards[0]).toMatchObject({
      source: item.sourceUrl,
      author: "Donne Martin",
      license: `CC-BY-4.0 (${item.license.url})`,
      tags: [
        "original",
        "zam-open-content",
        "open-content:system-design-primer-fundamentals",
      ],
    });
  });
});

describe("verified open-content downloads", () => {
  it("bounds, hashes, caches, and re-verifies an exact artifact", async () => {
    const payload = Buffer.from("verified deck bytes");
    const item = downloadFixture(payload);
    const cacheDir = tempDir();
    const fetchImpl = vi.fn(async () =>
      Promise.resolve(
        new Response(payload, {
          status: 200,
          headers: { "content-length": String(payload.byteLength) },
        }),
      ),
    );

    const first = await downloadOpenContentArtifact(item, {
      cacheDir,
      fetchImpl,
    });
    expect(first.cached).toBe(false);
    expect(readFileSync(first.path)).toEqual(payload);

    const second = await downloadOpenContentArtifact(item, {
      cacheDir,
      fetchImpl,
    });
    expect(second.cached).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    writeFileSync(first.path, "tampered");
    const repaired = await downloadOpenContentArtifact(item, {
      cacheDir,
      fetchImpl,
    });
    expect(repaired.cached).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("rejects size, checksum, and redirect-host mismatches", async () => {
    const payload = Buffer.from("expected");
    const item = downloadFixture(payload);

    await expect(
      downloadOpenContentArtifact(item, {
        cacheDir: tempDir(),
        fetchImpl: async () =>
          new Response("definitely too long", {
            headers: {
              "content-length": String("definitely too long".length),
            },
          }),
      }),
    ).rejects.toThrow(/size mismatch/i);

    const wrongHash = structuredClone(item);
    wrongHash.artifact.sha256 = "0".repeat(64);
    await expect(
      downloadOpenContentArtifact(wrongHash, {
        cacheDir: tempDir(),
        fetchImpl: async () =>
          new Response(payload, {
            headers: { "content-length": String(payload.byteLength) },
          }),
      }),
    ).rejects.toThrow(/integrity check/i);

    const redirected = new Response(payload, {
      headers: { "content-length": String(payload.byteLength) },
    });
    Object.defineProperty(redirected, "url", {
      value: "https://unreviewed.example/deck.apkg",
    });
    await expect(
      downloadOpenContentArtifact(item, {
        cacheDir: tempDir(),
        fetchImpl: async () => redirected,
      }),
    ).rejects.toThrow(/untrusted host/i);
  });

  it("constructs cache paths only from reviewed IDs and digests", () => {
    const item = downloadFixture(Buffer.from("deck"));
    expect(getOpenContentCachePath(item, "/safe/cache")).toBe(
      join("/safe/cache", `verified-test-deck-${item.artifact.sha256}.apkg`),
    );
  });
});

describe("open-content import service", () => {
  it("uses the normal preview/confirm contract and persists attribution", async () => {
    const directory = tempDir();
    const db = await openDatabase({
      dbPath: join(directory, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    const item = getOpenContentCatalogItem("system-design-primer-fundamentals");
    const document: TextImportDocument = {
      format: "apkg",
      sourceName: "cached.apkg",
      cards: Array.from(
        { length: item.artifact.expectedCards },
        (_, index) => ({
          externalId: `anki:catalog-note-${index}:0`,
          question: `Question ${index}`,
          answer: `Answer ${index}`,
          deckPath: "System Design",
        }),
      ),
      warnings: [],
      unsupported: [],
    };
    const dependencies = {
      downloadArtifact: async () => ({
        path: "/verified/catalog.apkg",
        cached: true,
        sha256: item.artifact.sha256,
        byteSize: item.artifact.byteSize,
      }),
      readImportFile: async () => structuredClone(document),
    };

    try {
      const preview = await previewOpenContentImport(
        db,
        "alice",
        item.id,
        dependencies,
      );
      expect(preview.counts).toMatchObject({
        create: item.artifact.expectedCards,
        cardsToCreate: item.artifact.expectedCards,
      });

      const result = await confirmOpenContentImport(
        db,
        "alice",
        item.id,
        preview.planHash,
        dependencies,
      );
      expect(result.cardsCreated).toBe(item.artifact.expectedCards);

      const row = (await db
        .prepare(
          `SELECT b.author, b.license, b.source, t.source_link
             FROM imported_card_bindings b
             JOIN tokens t ON t.id = b.token_id
            WHERE b.external_id = ?`,
        )
        .get("anki:catalog-note-0:0")) as Record<string, string>;
      expect(row).toEqual({
        author: "Donne Martin",
        license: `CC-BY-4.0 (${item.license.url})`,
        source: item.sourceUrl,
        source_link: item.sourceUrl,
      });
    } finally {
      await db.close();
    }
  });
});
