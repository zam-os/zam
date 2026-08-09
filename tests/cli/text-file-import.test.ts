import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateRawSync, gunzipSync } from "node:zlib";
import BetterSqlite3 from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { loadApkgDocument } from "../../src/cli/import/apkg.js";
import {
  loadDelimitedDocument,
  parseDelimitedText,
} from "../../src/cli/import/delimited.js";
import { selectAnkiCollectionDatabase } from "../../src/cli/import/safe-zip.js";
import { sanitizeImportedText } from "../../src/cli/import/text-sanitizer.js";

const TRUNCATED_ANKI_COLLECTION = Buffer.from("not a SQLite database");

const ANKI_COLLECTION = gunzipSync(
  Buffer.from(
    "H4sIAAAAAAACE+1UQW/TMBS2u63bQIjDDj1w6Ju5bCKsTdkp6jq6UtBEQaOtBBMMyXXcNpqTlNgdG5EPExK/g9/CT9h/2H1HjshJ16VIk+AAh2mfFCf+rC/Pz8/v67xpeYpDP4x8quAJyiGM0VMAlGIBXWF+8lwCoz/EPYTQHDpH+AfeQ+fo/8ObWywUCvjUVrQnOKORK5NhvtFu1rtN6NZ3Wk1IKFjzXNh93W2+aLZhr737qt7eh5fNfQuCqwUL3OwkjKaT9VEuDbWdhApCxWUyzM2ESqjrQw3Gngvd5ruuBX42kKIDOeH7wk0/16s4X1hZwTTNLRQsFLnZvEIBa37ocnEpdjk7nKhNbTA+Q/gM3eJG4KvE899iHRO7XCZOTALqc+KQHSo9RiyiTkacOGWL9IXpb1P/HBYIf8fi9uz+LSq5PFrFD+qmvR8zEX7hHJIXdIccaCA/8wg8CXHMbMfph+NI6494Ea3ih6f3E1HPFNE1PmCboQJvh1QZSQUeQWW7uFkcKjWSTqnEj6k/EnxDcalKPlXDYt2l0AqPuKCMFxsN2NmHzY1yWv8LhH/ii9sK3Xzk7y4gvLyUy99ZQMt4KWc4VxLn/dQonkdhoIi2Ms7BDrPzTjiOGM8y9bEahlGWaXmMB5ITfWAR5Y/ETIQGjVywiUXCyE2s6FPfV8QhVckib6RqVPBIrdnr1dKEqPZqcZzsS+tqqVerev4AZMS2PpDpfT/yRHrZjzdGweADqRGL0PS/E23Hc7nW1WEEnruVdlstjk12WhN9oC1il+2MYzZMa04d0zaOOXtSXX6srslwIv0twThO2t0xQq2zG5zh9YE29p3ZyjPep2NhqkIqGbrDPB4w7jh7wxPpMUm0/tv78AtDEjRnAAoAAA==",
    "base64",
  ),
);

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop() as string, { recursive: true, force: true });
  }
});

function tempFile(name: string, data: Uint8Array): string {
  const directory = mkdtempSync(join(tmpdir(), "zam-file-import-"));
  tempDirs.push(directory);
  const path = join(directory, name);
  writeFileSync(path, data);
  return path;
}

function richAnkiCollection(): Buffer {
  const directory = mkdtempSync(join(tmpdir(), "zam-rich-apkg-db-"));
  tempDirs.push(directory);
  const path = join(directory, "collection.anki2");
  const sqlite = new BetterSqlite3(path);
  sqlite.exec(`
    CREATE TABLE col (models TEXT NOT NULL, decks TEXT NOT NULL);
    CREATE TABLE notes (
      id INTEGER PRIMARY KEY, guid TEXT NOT NULL, mid INTEGER NOT NULL,
      tags TEXT NOT NULL, flds TEXT NOT NULL
    );
    CREATE TABLE cards (
      id INTEGER PRIMARY KEY, nid INTEGER NOT NULL, did INTEGER NOT NULL,
      ord INTEGER NOT NULL
    );
  `);
  const models = {
    200: {
      name: "Media",
      type: 0,
      flds: [{ name: "Front" }, { name: "Back" }],
      tmpls: [
        {
          name: "Card 1",
          ord: 0,
          qfmt: '<img src="{{Front}}" alt="Map">',
          afmt: "{{Back}}[sound:answer.mp3]",
        },
      ],
    },
    201: {
      name: "Image Occlusion",
      type: 1,
      flds: [
        { name: "Image" },
        { name: "Occlusion" },
        { name: "Header" },
        { name: "Back Extra" },
      ],
      tmpls: [
        {
          name: "Image Occlusion",
          ord: 0,
          qfmt: "{{cloze:Occlusion}}",
          afmt: "{{Image}}",
        },
      ],
    },
  };
  sqlite
    .prepare("INSERT INTO col (models, decks) VALUES (?, ?)")
    .run(JSON.stringify(models), JSON.stringify({ 1: { name: "Biology" } }));
  sqlite
    .prepare(
      "INSERT INTO notes (id, guid, mid, tags, flds) VALUES (?, ?, ?, ?, ?)",
    )
    .run(1, "media-guid", 200, "media", "map.png\u001fBerlin");
  sqlite
    .prepare("INSERT INTO cards (id, nid, did, ord) VALUES (?, ?, ?, ?)")
    .run(1, 1, 1, 0);
  sqlite
    .prepare(
      "INSERT INTO notes (id, guid, mid, tags, flds) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      2,
      "occlusion-guid",
      201,
      "occlusion",
      [
        '<img src="cell.png" alt="Cell">',
        "{{c1::image-occlusion:rect:left=.2:top=.3:width=.1:height=.15:oi=1}}",
        "Cell anatomy",
        "Mitochondrion",
      ].join("\u001f"),
    );
  sqlite
    .prepare("INSERT INTO cards (id, nid, did, ord) VALUES (?, ?, ?, ?)")
    .run(2, 2, 1, 0);
  sqlite.close();
  return readFileSync(path);
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(
  entries: Array<{ name: string; data: Uint8Array; deflate?: boolean }>,
): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const source = Buffer.from(entry.data);
    const compressed = entry.deflate ? deflateRawSync(source) : source;
    const method = entry.deflate ? 8 : 0;
    const checksum = crc32(source);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(source.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, compressed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(source.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(localOffset, 42);
    centralParts.push(central, name);
    localOffset += local.length + name.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

describe("CSV and TSV text import", () => {
  it("parses quoted fields, stable ids, metadata, and embedded newlines", () => {
    const document = parseDelimitedText(
      [
        "id,front,back,deck,tags,author,license",
        'one,"Why, exactly?","Because\nit works",Logic,"one;two",Ada,"CC BY"',
      ].join("\n"),
      "csv",
      "logic.csv",
    );

    expect(document.cards).toHaveLength(1);
    expect(document.cards[0]).toMatchObject({
      question: "Why, exactly?",
      answer: "Because\nit works",
      deckPath: "Logic",
      tags: ["one", "two"],
      author: "Ada",
      license: "CC BY",
    });
    expect(document.cards[0].externalId).toMatch(/^csv:[a-f0-9]{24}:/);
    expect(document.warnings).toEqual([]);
  });

  it("sanitizes active HTML, reports omitted media, and skips Cloze rows", () => {
    const document = parseDelimitedText(
      [
        "question\tanswer",
        '<script>steal()</script><b>Safe</b><img src="https://evil.test/x">\t<strong>Answer</strong>',
        "{{c1::Hidden}}\tCloze answer",
      ].join("\n"),
      "tsv",
      "unsafe.tsv",
    );

    expect(document.cards).toHaveLength(1);
    expect(document.cards[0].question).toBe("Safe");
    expect(document.cards[0].warnings?.map((warning) => warning.code)).toEqual(
      expect.arrayContaining(["unsafe-html-removed", "media-unsupported"]),
    );
    expect(document.unsupported).toEqual([
      expect.objectContaining({ code: "cloze-unsupported" }),
    ]);
    expect(document.warnings).toEqual([
      expect.objectContaining({ code: "positional-identity" }),
    ]);
  });

  it("loads UTF-8 files and rejects malformed column counts", async () => {
    const goodPath = tempFile(
      "cards.csv",
      Buffer.from("id,question,answer\n1,Frage,Antwort", "utf8"),
    );
    const loaded = await loadDelimitedDocument(goodPath);
    expect(loaded.cards[0]).toMatchObject({
      question: "Frage",
      answer: "Antwort",
    });

    const malformed = parseDelimitedText(
      "id,question,answer\n1,Question,Answer,Unexpected",
      "csv",
      "bad.csv",
    );
    expect(malformed.cards).toHaveLength(0);
    expect(malformed.unsupported?.[0].code).toBe("column-count-mismatch");
  });

  it("rejects duplicate semantic headers and invalid UTF-8", async () => {
    expect(() =>
      parseDelimitedText(
        "front,question,answer\nA,B,C",
        "csv",
        "duplicate.csv",
      ),
    ).toThrow(/multiple question columns/i);

    const invalidPath = tempFile("invalid.tsv", Uint8Array.from([0xff, 0xfe]));
    await expect(loadDelimitedDocument(invalidPath)).rejects.toThrow(/UTF-8/i);
  });
});

describe("safe APKG text import", () => {
  it("reads basic and Cloze cards with provenance and decks", async () => {
    const path = tempFile(
      "science.apkg",
      zip([
        { name: "collection.anki2", data: ANKI_COLLECTION, deflate: true },
        { name: "media", data: Buffer.from('{"0":"image.png"}') },
      ]),
    );

    const document = await loadApkgDocument(path);
    expect(document.cards).toHaveLength(2);
    expect(document.cards[0]).toMatchObject({
      externalId: "anki:guid-basic:0",
      noteGuid: "guid-basic",
      cardOrdinal: 0,
      question: "What is 2 + 2?",
      answer: "4",
      deckPath: "Science::Physics",
      tags: ["tag1", "tag2"],
      source: "https://example.test/math",
      author: "Ada Lovelace",
      license: "CC BY 4.0",
    });
    expect(document.cards[0].warnings?.map((warning) => warning.code)).toEqual(
      expect.arrayContaining([
        "unsafe-html-removed",
        "media-reference-blocked",
      ]),
    );
    expect(document.cards[1]).toMatchObject({
      externalId: "anki:guid-cloze:0",
      question: "The answer is […]",
      answer: "The answer is four",
    });
    expect(document.unsupported).toEqual([]);
  });

  it("rejects path traversal before extracting the collection", () => {
    const archive = zip([
      { name: "../escape", data: Buffer.from("bad") },
      { name: "collection.anki2", data: ANKI_COLLECTION },
    ]);
    expect(() => selectAnkiCollectionDatabase(archive)).toThrow(
      /unsafe.*path/i,
    );
  });

  it("rejects corrupt entries and explicitly reports newer collections", () => {
    const corrupt = zip([{ name: "collection.anki2", data: ANKI_COLLECTION }]);
    corrupt[30 + Buffer.byteLength("collection.anki2") + 10] ^= 0xff;
    expect(() => selectAnkiCollectionDatabase(corrupt)).toThrow(/checksum/i);

    const newer = zip([
      { name: "collection.anki21b", data: Buffer.from("new format") },
    ]);
    expect(() => selectAnkiCollectionDatabase(newer)).toThrow(/anki21b/i);
  });

  it("rejects a malformed collection database before reading cards", async () => {
    const path = tempFile(
      "malformed.apkg",
      zip([{ name: "collection.anki2", data: TRUNCATED_ANKI_COLLECTION }]),
    );
    await expect(loadApkgDocument(path)).rejects.toThrow(
      /malformed|integrity|not a database/i,
    );
  });

  it("imports packaged images, audio, and native image-occlusion geometry", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    );
    const path = tempFile(
      "rich.apkg",
      zip([
        {
          name: "collection.anki2",
          data: richAnkiCollection(),
          deflate: true,
        },
        {
          name: "media",
          data: Buffer.from(
            JSON.stringify({
              0: "map.png",
              1: "answer.mp3",
              2: "cell.png",
            }),
          ),
        },
        { name: "0", data: png },
        { name: "1", data: Buffer.from("ID3\u0004\u0000\u0000", "binary") },
        { name: "2", data: png },
      ]),
    );

    const document = await loadApkgDocument(path);
    expect(document.assets).toHaveLength(3);
    expect(document.cards).toHaveLength(2);
    expect(document.cards[0]).toMatchObject({
      externalId: "anki:media-guid:0",
      question: "Identify the item shown.",
      answer: "Berlin",
    });
    expect(document.cards[0].media).toEqual([
      expect.objectContaining({
        assetName: "map.png",
        side: "question",
        kind: "image",
      }),
      expect.objectContaining({
        assetName: "answer.mp3",
        side: "answer",
        kind: "audio",
      }),
    ]);
    expect(document.cards[1]).toMatchObject({
      externalId: "anki:occlusion-guid:0",
      question: "Cell anatomy\nName the hidden part.",
      answer: "Compare your answer with the revealed image.\nMitochondrion",
    });
    expect(document.cards[1].media?.[0].occlusions).toEqual([
      {
        shape: "rect",
        left: 0.2,
        top: 0.3,
        width: 0.1,
        height: 0.15,
      },
    ]);
    expect(document.cards[1].media?.[1]).toMatchObject({
      assetName: "cell.png",
      side: "answer",
      occlusions: [],
    });
    expect(document.unsupported).toEqual([]);
  });
});

describe("plain-text sanitizer", () => {
  it("never leaves executable markup or remote resource tags", () => {
    const sanitized = sanitizeImportedText(
      '<iframe src="https://evil.test">payload</iframe><div onclick="x()">Keep &amp; learn</div>',
    );
    expect(sanitized.text).toBe("Keep & learn");
    expect(sanitized.text).not.toMatch(/iframe|onclick|https?:/i);
    expect(sanitized.warnings).toEqual([
      expect.objectContaining({ code: "unsafe-html-removed" }),
    ]);
  });
});
