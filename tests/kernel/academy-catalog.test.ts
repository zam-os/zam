import { describe, expect, it } from "vitest";
import {
  ACADEMY_ORIGIN,
  academyUrl,
  parseAcademyCatalog,
} from "../../src/kernel/index.js";

const entry = {
  id: "zam-academy:uml",
  title: "UML 2.5.1 (ZAM Academy)",
  description: "…",
  language: "de",
  version: "2026.10.1",
  items: 26,
  app: "/uml/",
  cell: "/uml/cell.json",
  sha256: "a".repeat(64),
};

describe("parseAcademyCatalog (ADR 2026-10-19 D2, D4)", () => {
  it("resolves paths against the one origin", () => {
    const catalog = parseAcademyCatalog({ schema: 1, cells: [entry] });
    expect(catalog.cells[0]).toMatchObject({
      id: "zam-academy:uml",
      version: "2026.10.1",
      items: 26,
      appUrl: `${ACADEMY_ORIGIN}/uml/`,
      cellUrl: `${ACADEMY_ORIGIN}/uml/cell.json`,
    });
  });

  it("never lets an entry name another host", () => {
    for (const cell of [
      "https://evil.example/cell.json",
      "//evil.example/cell.json",
      "/uml/../../cell.json",
      "/uml//cell.json",
      "\\\\evil.example\\cell.json",
      "/uml/cell.json?x=1",
      "/uml/cell.json#x",
      "/@evil.example/cell.json",
      "uml/cell.json",
      "",
      42,
    ]) {
      expect(
        () => parseAcademyCatalog({ schema: 1, cells: [{ ...entry, cell }] }),
        String(cell),
      ).toThrow(/plain path/);
    }
    expect(() => academyUrl("/a:b/cell.json")).toThrow(/plain path/);
  });

  it("refuses what it cannot trust", () => {
    const bad = (patch: object) =>
      parseAcademyCatalog({ schema: 1, cells: [{ ...entry, ...patch }] });
    expect(() => bad({ version: "2026.10.1-beta" })).toThrow(/dotted/);
    expect(() => bad({ sha256: "A".repeat(64) })).toThrow(/sha256/);
    expect(() => bad({ sha256: "abc" })).toThrow(/sha256/);
    expect(() => bad({ id: "no colon" })).toThrow(/id/);
    expect(() => bad({ items: -1 })).toThrow(/item count/);
    expect(() =>
      parseAcademyCatalog({ schema: 1, cells: [entry, entry] }),
    ).toThrow(/duplicate/);
    expect(() => parseAcademyCatalog({ schema: 2, cells: [] })).toThrow();
    expect(() => parseAcademyCatalog(null)).toThrow();
  });
});
