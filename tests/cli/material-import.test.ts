import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  confirmMaterialImport,
  discardMaterialImport,
  listPendingMaterialImports,
  materialFileFromAgent,
  PREVIEW_MAX_BYTES,
  parseMaterialAreas,
  parseMaterialDecisions,
  previewMaterialImportFile,
  reviewMaterialImport,
} from "../../src/cli/material-import.js";
import {
  readStagedImport,
  stageMaterialImport,
} from "../../src/cli/material-staging.js";
import {
  createToken,
  type Database,
  getCard,
  openDatabase,
} from "../../src/kernel/index.js";

/**
 * The CLI side of a material import (ADR 2026-10-05): the staged batch, the
 * review the learner sees, and the confirm that applies their choices to
 * exactly those rows.
 */

const FIXTURE = JSON.parse(
  readFileSync(
    join(__dirname, "../fixtures/material-import/chemie-sinne.json"),
    "utf8",
  ),
) as unknown;
const USER = "learner";

describe("material import service", () => {
  let tempDir: string;
  let dir: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-material-service-"));
    dir = join(tempDir, "pending");
    db = await openDatabase({ dbPath: join(tempDir, "zam.db") });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("keeps the model that read a Studio batch, and every model it went to", async () => {
    const batch = await stageMaterialImport(
      {
        set: FIXTURE,
        origin: "studio",
        readBy: "Luna",
        sentTo: ["Gemma", "Luna"],
      },
      { dir },
    );
    expect(
      await reviewMaterialImport(db, USER, batch.id, { dir }),
    ).toMatchObject({
      origin: "studio",
      readBy: "Luna",
      sentTo: ["Gemma", "Luna"],
    });
  });

  it("stages, lists, reviews, confirms and retires a batch", async () => {
    const batch = await stageMaterialImport(
      { set: FIXTURE, origin: "harness", harness: "opencode" },
      { dir },
    );
    expect(await listPendingMaterialImports({ dir })).toEqual([
      {
        id: batch.id,
        title: "Stofferkennung mit den Sinnen",
        createdAt: batch.createdAt,
        origin: "harness",
        harness: "opencode",
        proposalCount: 4,
      },
    ]);

    const review = await reviewMaterialImport(db, USER, batch.id, { dir });
    expect(review.semantic).toBe(false);
    // A harness batch was not read here, so no model is named.
    expect(review).toMatchObject({ readBy: null, sentTo: [] });
    expect(review.areaGroups).toEqual([
      {
        area: "chemie/stoffe-und-eigenschaften",
        proposalIndexes: [0, 1, 2, 3],
      },
    ]);
    expect(review.rows.slice(0, 4).map((row) => row.preset)).toEqual([
      "yes",
      null,
      "bonus",
      null,
    ]);
    expect(review.reimports).toEqual([]);
    // The confirm applies decisions to the rows the learner saw.
    expect((await readStagedImport(batch.id, { dir }))?.rows).toEqual(
      review.rows,
    );

    const result = await confirmMaterialImport(
      db,
      USER,
      batch.id,
      { "p:0": "yes", "p:2": "bonus" },
      { "chemie/stoffe-und-eigenschaften": "chemie/stoffe" },
      { dir },
    );
    expect(result).toMatchObject({ cardsCreated: 1, bonusKept: 1 });
    expect(await listPendingMaterialImports({ dir })).toEqual([]);
    const token = (await db
      .prepare("SELECT id, domain FROM tokens WHERE question = ?")
      .get("Welche Eigenschaften eines Stoffes erkennt man am Aussehen?")) as {
      id: string;
      domain: string;
    };
    expect(token.domain).toBe("chemie/stoffe");
    expect(await getCard(db, token.id, USER)).toBeDefined();

    await expect(
      confirmMaterialImport(db, USER, batch.id, {}, {}, { dir }),
    ).rejects.toThrow(/not waiting any more/);

    // The same file again: the review says so.
    const again = await stageMaterialImport(
      { set: FIXTURE, origin: "studio" },
      { dir },
    );
    const second = await reviewMaterialImport(db, USER, again.id, { dir });
    expect(second.reimports).toEqual([
      expect.objectContaining({
        sourceId: result.sourceId,
        title: "Stofferkennung mit den Sinnen",
      }),
    ]);
  });

  it("matches at confirm time when the batch was never reviewed", async () => {
    await createToken(db, {
      slug: "stoffe-aussehen",
      concept:
        "Am Aussehen: Farbe, Aggregatzustand bei Raumtemperatur und metallischer Glanz",
      question: "Woran erkennt man Stoffe am Aussehen?",
      domain: "chemie",
    });
    const batch = await stageMaterialImport(
      { set: FIXTURE, origin: "studio" },
      { dir },
    );
    const result = await confirmMaterialImport(
      db,
      USER,
      batch.id,
      { "e:0": "yes" },
      {},
      { dir },
    );
    expect(result.cardsCreated).toBe(1);
  });

  it("discards without writing", async () => {
    const batch = await stageMaterialImport(
      { set: FIXTURE, origin: "studio" },
      { dir },
    );
    expect(await discardMaterialImport(batch.id, { dir })).toBe(true);
    const tokens = (await db
      .prepare("SELECT COUNT(*) AS n FROM tokens")
      .get()) as { n: number };
    expect(tokens.n).toBe(0);
  });

  it("validates decisions and areas", () => {
    expect(parseMaterialDecisions({ "p:0": "yes", "p:1": "no" })).toEqual({
      "p:0": "yes",
      "p:1": "no",
    });
    expect(() => parseMaterialDecisions({ "p:0": "maybe" })).toThrow(
      /decisions\.p:0/,
    );
    expect(() => parseMaterialDecisions(["yes"])).toThrow(/object/);
    expect(parseMaterialAreas(undefined)).toEqual({});
    expect(() => parseMaterialAreas({ chemie: "" })).toThrow(/areas\.chemie/);
  });

  it("previews only files the batch names, and only small images", async () => {
    const png = join(tempDir, "seite.png");
    writeFileSync(png, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const big = join(tempDir, "gross.jpg");
    writeFileSync(big, Buffer.alloc(PREVIEW_MAX_BYTES + 1));
    const set = structuredClone(FIXTURE) as Record<string, unknown>;
    set.files = [
      { name: "seite.png", sourceLink: `file://${png}` },
      {
        name: "gross.jpg",
        sourceLink: "photo:gross.jpg@2026-10-05",
        path: big,
      },
      { name: "blatt.pdf", sourceLink: `file://${join(tempDir, "blatt.pdf")}` },
      { name: "IMG_1.HEIC", sourceLink: "photo:IMG_1.HEIC@2026-10-05" },
    ];
    const batch = await stageMaterialImport({ set, origin: "studio" }, { dir });
    const image = await previewMaterialImportFile(batch.id, 0, { dir });
    expect(image).toMatchObject({ kind: "image", reason: "ok", path: png });
    expect(image.dataUrl).toBe("data:image/png;base64,iVBORw==");
    expect(await previewMaterialImportFile(batch.id, 1, { dir })).toMatchObject(
      { kind: "image", reason: "too-large", dataUrl: null },
    );
    expect(await previewMaterialImportFile(batch.id, 2, { dir })).toMatchObject(
      { kind: "pdf", reason: "missing" },
    );
    expect(await previewMaterialImportFile(batch.id, 3, { dir })).toMatchObject(
      { kind: "image", reason: "missing", path: null },
    );
    await expect(
      previewMaterialImportFile(batch.id, 9, { dir }),
    ).rejects.toThrow(/has no file 9/);
  });

  it("turns an agent's file reference into a link and a fingerprint", async () => {
    const path = join(tempDir, "Arbeitsblatt.pdf");
    writeFileSync(path, "%PDF-1.7");
    const now = new Date(2026, 9, 5, 12);
    // The file lies in an allowed root (ADR 2026-10-08b D1).
    const roots = [realpathSync.native(tempDir)];
    const fromDisk = await materialFileFromAgent(
      { name: "Arbeitsblatt.pdf", path, sha256: "not-a-hash" },
      now,
      roots,
    );
    expect(fromDisk.sourceLink).toMatch(/^file:\/\/.*Arbeitsblatt\.pdf$/);
    expect(fromDisk.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(fromDisk.path).toBe(realpathSync.native(path));

    // Outside every root, the path is ignored: no link, no fingerprint of a
    // file the learner did not open to ZAM.
    const outside = await materialFileFromAgent(
      { name: "Arbeitsblatt.pdf", path, sha256: "b".repeat(64) },
      now,
      [],
    );
    expect(outside).toEqual({
      name: "Arbeitsblatt.pdf",
      sourceLink: "photo:Arbeitsblatt.pdf@2026-10-05",
      sha256: "b".repeat(64),
    });

    expect(
      await materialFileFromAgent(
        { name: "IMG_1.HEIC", sha256: "A".repeat(64) },
        now,
      ),
    ).toEqual({
      name: "IMG_1.HEIC",
      sourceLink: "photo:IMG_1.HEIC@2026-10-05",
      sha256: "a".repeat(64),
    });
    // A malformed fingerprint is dropped, not fatal.
    expect(
      await materialFileFromAgent({ name: "x.jpg", sha256: "zz" }, now),
    ).toEqual({ name: "x.jpg", sourceLink: "photo:x.jpg@2026-10-05" });
  });
});
