import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  graphReturnOrigin,
  rememberGraphOrigin,
} from "../../desktop/src/graph-return.js";
import { setCurrentLocale, t } from "../../desktop/src/i18n.js";
import {
  editorialStatusLabel,
  matchesLearningSearch,
  unchosenGroupLabel,
} from "../../desktop/src/learning-content.js";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const CONTROLS = [
  "btn-content-area-cards",
  "btn-content-area-sources",
  "content-cards-actions",
  "content-cards-area",
  "content-sources-area",
  "btn-content-segment-personal",
  "btn-content-segment-unchosen",
  "btn-content-segment-unpublished",
  "btn-content-open-graph",
  "btn-content-take-card",
];

afterEach(() => {
  setCurrentLocale("en");
  rememberGraphOrigin("dashboard-view");
});

describe("learning content segments", () => {
  it("names an empty source group and distinguishes a draft from a review", () => {
    setCurrentLocale("de");
    expect(unchosenGroupLabel({ name: "" })).toBe("Ohne Quelle");
    expect(unchosenGroupLabel({ name: "Container images" })).toBe(
      "Container images",
    );
    expect(editorialStatusLabel("draft")).toBe("Entwurf");
    expect(editorialStatusLabel("in_review")).toBe("In Prüfung");
    setCurrentLocale("en");
    expect(t("content_area_cards")).toBe("Learning cards");
    expect(t("content_segment_unchosen")).toBe("Not chosen");
    expect(t("btn_open_graph")).toBe("Knowledge Map (3D)");
  });

  it("filters a row by the same fields the list already searches", () => {
    expect(
      matchesLearningSearch(
        { concept: "Layers", domain: "containers", question: "What stacks?" },
        "stack",
      ),
    ).toBe(true);
    expect(
      matchesLearningSearch(
        {
          name: "Container images",
          key: "https://example/a.md",
          domain: "ops",
        },
        "example/a",
      ),
    ).toBe(true);
    expect(matchesLearningSearch({ concept: "Layers" }, "ports")).toBe(false);
  });

  it("puts the same controls in the desktop window and the studio panel", () => {
    const desktop = read("desktop/index.html");
    const panel = read("desktop/src/panel/studio-panel.html");
    for (const id of CONTROLS) {
      expect(desktop, id).toContain(`id="${id}"`);
      expect(panel, id).toContain(`id="${id}"`);
    }
    expect(desktop).toContain('id="btn-open-graph"');
  });

  it("sends the graph back to the view that opened it", () => {
    rememberGraphOrigin("dashboard-view");
    expect(graphReturnOrigin()).toBe("dashboard-view");
    rememberGraphOrigin("learning-content-view");
    expect(graphReturnOrigin()).toBe("learning-content-view");

    const main = read("desktop/src/main.ts");
    expect(main).toContain('rememberGraphOrigin("learning-content-view")');
    expect(main).toContain('rememberGraphOrigin("dashboard-view")');
    expect(main).toContain("const origin = graphReturnOrigin()");
    expect(main).toContain("switchView(origin)");
    const studio = read("desktop/src/learning-content.ts");
    expect(studio).toContain('"--published-only"');
    expect(studio).toContain('"unchosen-groups"');
    expect(studio).toContain('"unchosen-members"');
    expect(studio).toContain('"list-drafts"');
    expect(studio).toContain('"personal-card-ensure"');
    expect(studio).toContain("startLibraryTopic(key)");
  });
});
