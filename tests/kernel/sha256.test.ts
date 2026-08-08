/**
 * The kernel's SHA-256 must stay byte-identical to `node:crypto`.
 *
 * This is not a purity test. `computeContentHash` decides whether a stored
 * embedding is stale, so a digest that differs by one bit would silently
 * re-embed every library in the fleet the next time anyone searches — and on a
 * shared Turso database, repeatedly.
 */

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256Hex, sha256HexBytes } from "../../src/kernel/util/sha256.js";

const nodeSha = (text: string): string =>
  createHash("sha256").update(text, "utf8").digest("hex");

describe("sha256Hex", () => {
  it("matches the published test vectors", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(
      sha256Hex(
        "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
      ),
    ).toBe("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
  });

  it("agrees with node:crypto on content ZAM actually hashes", () => {
    const corpus = [
      "",
      "a",
      "Mitose",
      "title: none | text: Was beschreibt der Satz des Pythagoras?",
      // Umlauts, sharp s and an emoji: multi-byte UTF-8 is where a hand-rolled
      // digest that hashes UTF-16 code units would diverge.
      "Größenordnung — Übung macht den Meister 🇩🇪",
      "日本語のトークン",
      "line one\nline two\r\nline three\t tabbed",
      JSON.stringify({ concept: "FSRS", bloom: 3, domain: "zam/kernel" }),
    ];
    for (const text of corpus) {
      expect(sha256Hex(text), `mismatch for ${JSON.stringify(text)}`).toBe(
        nodeSha(text),
      );
    }
  });

  it("agrees across every block-boundary length", () => {
    // 55/56/57 and 63/64/65 are the padding edge cases: a message that just
    // fits, one that forces an extra block, and one that starts a new block.
    const filler = "x".repeat(200);
    for (let length = 0; length <= 200; length++) {
      const text = filler.slice(0, length);
      expect(sha256Hex(text), `mismatch at length ${length}`).toBe(
        nodeSha(text),
      );
    }
  });

  it("agrees on input larger than a single chunk", () => {
    const large = "Wissensbaustein ".repeat(5000);
    expect(sha256Hex(large)).toBe(nodeSha(large));
  });

  it("hashes raw bytes identically", () => {
    const bytes = new Uint8Array([0, 1, 2, 128, 255, 254]);
    expect(sha256HexBytes(bytes)).toBe(
      createHash("sha256").update(Buffer.from(bytes)).digest("hex"),
    );
  });
});
