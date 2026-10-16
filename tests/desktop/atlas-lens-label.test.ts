import { describe, expect, it } from "vitest";
import { lensLabel } from "../../desktop/src/atlas/outline.js";
import { LENSES } from "../../src/kernel/atlas/lenses.js";

/**
 * The lens buttons of the Studio, the MCP Apps panel and Mobile: a built-in
 * lens in the learner's language, a custom lens under its library's name
 * (ADR 2026-10-13, Decision 3).
 */

const t = (key: string) => `[${key}]`;

describe("lens labels", () => {
  it("translates every built-in lens of the kernel", () => {
    for (const lens of Object.values(LENSES)) {
      expect(lensLabel({ t }, lens)).toBe(`[atlas_lens_${lens.kind}]`);
    }
  });

  it("shows a custom lens under the name its library gave it", () => {
    expect(lensLabel({ t }, { kind: "aspekte", name: "Aspekte" })).toBe(
      "Aspekte",
    );
  });
});
