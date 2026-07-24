import { describe, expect, it } from "vitest";
import {
  CONTENT_PATHS,
  orderContentPaths,
} from "../../desktop/src/onboarding.js";
import { PERSONA_DESCRIPTORS } from "../../src/kernel/index.js";

// Plan Phase 8 (ADR 2026-07-24 §2): the persona routes to a default import
// path but locks nothing — every path stays offered for every persona.
describe("persona content routing", () => {
  it("covers every persona default with a content-path row", () => {
    const pathIds = new Set(CONTENT_PATHS.map((path) => path.id));
    for (const persona of PERSONA_DESCRIPTORS) {
      expect(pathIds.has(persona.defaultImportPath)).toBe(true);
    }
  });

  it("routes each persona's default first while keeping all paths", () => {
    for (const persona of PERSONA_DESCRIPTORS) {
      const ordered = orderContentPaths(persona.defaultImportPath);
      expect(ordered[0].id).toBe(persona.defaultImportPath);
      expect(ordered.map((path) => path.id).sort()).toEqual(
        CONTENT_PATHS.map((path) => path.id).sort(),
      );
    }
  });

  it("falls back to the canonical order for an unknown default", () => {
    expect(orderContentPaths("nonsense")).toEqual(CONTENT_PATHS);
  });

  it("wires actions to existing entry points, never new import machinery", () => {
    for (const path of CONTENT_PATHS) {
      if (path.action.kind === "entry") {
        expect(["curriculum", "free-import"]).toContain(path.action.entry);
      } else {
        // Step targets must exist in the flow (agent page, goal page).
        expect(["agent", "goal"]).toContain(path.action.step);
      }
    }
  });
});
