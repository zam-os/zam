/**
 * ADR 2026-10-08b D5: the pairing code carries the database token, so it
 * appears only after an explicit action and hides after 60 seconds.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(__dirname, "..", "..", "desktop", "src", "mobile-pairing.ts"),
  "utf8",
);

describe("pairing code visibility", () => {
  it("hides the code after 60 seconds", () => {
    expect(source).toContain("PAIRING_QR_VISIBLE_MS = 60 * 1000");
    expect(source).toMatch(/setTimeout\([\s\S]*?PAIRING_QR_VISIBLE_MS\)/);
  });

  it("renders the code only from the generate action", () => {
    const renders = source.match(/render_pairing_qr/g) ?? [];
    expect(renders).toHaveLength(1);
    expect(source).toMatch(/const generate = async[\s\S]*render_pairing_qr/);
  });
});
