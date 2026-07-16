import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Structural/bundle coverage for the shared context bar (0.11.0 Phase 4):
 * asserts against the actual built `dist/ui/*.html` MCP Apps panels, the
 * same way tests/cli/mcp.test.ts already asserts on the built studio/recall
 * panel markers (`zam-recall-panel`, `zam-studio-panel`, …) — real DOM
 * behavior (collapse toggling, disabled options, confirm flow) is instead
 * covered without a DOM by tests/desktop/context-bar.test.ts's pure-function
 * suite, since this repo has no jsdom/happy-dom dependency to add (no new
 * deps allowed) and desktop panels are otherwise verified via a real build.
 *
 * Requires `npm run build:panel` (or `npm run build`) to have produced
 * dist/ui/*.html first — skips instead of failing on a checkout that never
 * built, matching the "CI builds before running tests" assumption already
 * documented in tests/cli/mcp.test.ts.
 */

const PANEL_FILES = [
  "studio-panel.html",
  "recall-panel.html",
  "graph-panel.html",
  "settings-panel.html",
] as const;

const distUi = (file: string) => join(process.cwd(), "dist", "ui", file);

const builtPanels = PANEL_FILES.filter((file) => existsSync(distUi(file)));
const describeIfBuilt = builtPanels.length === PANEL_FILES.length ? describe : describe.skip;

describeIfBuilt("shared context bar — built MCP Apps panels", () => {
  for (const file of PANEL_FILES) {
    describe(file, () => {
      const html = () => readFileSync(distUi(file), "utf-8");

      it("never renders the old permanent connection-status copy", () => {
        expect(html()).not.toContain("Connected to zam mcp");
      });

      it("never renders the old decorative connection dot", () => {
        expect(html()).not.toContain("status-dot");
      });

      it("mounts the shared context bar into a dedicated root", () => {
        expect(html()).toContain("zam-contextbar-root");
      });

      it("keeps an inline connection-notice slot as its own element", () => {
        // A sibling of #zam-contextbar-root in every panel's source HTML
        // (never nested inside the collapsible bar itself), so collapsing
        // the bar can never hide a connection/startup error.
        expect(html()).toContain('id="zam-connection-notice"');
      });

      it("ships the collapsed-state rule (collapse persists per surface)", () => {
        expect(html()).toContain(".zam-contextbar.collapsed");
      });

      it("ships a narrow-sidebar responsive rule", () => {
        expect(html()).toContain("max-width: 420px");
      });

      it("bundles the Agent/User pill vocabulary", () => {
        expect(html()).toContain("zam-pill-label");
        expect(html()).toContain("Agent");
        expect(html()).toContain("User");
      });

      it("bundles the honest quick-mode fallback label, never a bare host name", () => {
        expect(html()).toContain("Quick mode");
        // ADR 2026-07-16 §Decision 2/5: never a bare "VS Code" or bare
        // "Claude" standing in for a concrete provider/model.
        expect(html()).not.toMatch(/>VS Code<|"VS Code"/);
      });
    });
  }
});

describe("shared context bar build coverage", () => {
  it("built all four panels for the assertions above (build first if this fails)", () => {
    expect(builtPanels).toEqual(PANEL_FILES);
  });
});
