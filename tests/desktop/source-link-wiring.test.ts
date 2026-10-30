import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

// ADR 2026-10-19 Decision 6: every surface that shows a card's source labels
// and opens it through the one helper.
describe("web source links are wired on every surface", () => {
  it("Studio review opens a web source in the system browser", () => {
    const main = file("desktop/src/main.ts");
    expect(main).toContain("webSourceLink(activeCard.sourceLink");
    expect(main).toMatch(
      /event\.preventDefault\(\);\s*void openUrl\(web\.href\)/,
    );
  });

  it("the card editor offers „Öffnen ↗“ for a web source", () => {
    expect(file("desktop/index.html")).toContain('id="btn-editor-open-source"');
    const content = file("desktop/src/learning-content.ts");
    expect(content).toContain("function syncEditorSourceOpen()");
    expect(content).toContain("externalOpener?.(web.href)");
  });

  it("the MCP recall panel opens it only through the host", () => {
    const panel = file("desktop/src/panel/recall.ts");
    expect(panel).toContain("appendSourceLink(reveal, card.sourceLink)");
    expect(panel).toContain("app.getHostCapabilities()?.openLinks");
    expect(panel).toContain("app.openLink({ url: web.href })");
  });

  it("Mobile labels the link with the same helper", () => {
    expect(file("mobile/src/main.ts")).toContain(
      'webSourceLink(prompt.sourceLink, t("source_open_lesson"))',
    );
    // A data-i18n attribute would overwrite the label on a language switch.
    expect(file("mobile/index.html")).not.toMatch(
      /id="review-source"[^>]*data-i18n/,
    );
  });

  // zam-os/zam#438: after a missed Academy card, every surface offers the
  // lesson before the next card, opened only on a click.
  it("Studio offers the lesson after a missed card", () => {
    const main = file("desktop/src/main.ts");
    expect(main).toContain(
      "academyPracticeLink(\n        activeCard.sourceLink,",
    );
    expect(main).toMatch(/showAcademyPracticeOffer\(practice\);\s*return;/);
    expect(main).toContain("void openUrl(lesson.href)");
  });

  it("the MCP recall panel offers it only when the host opens links", () => {
    const panel = file("desktop/src/panel/recall.ts");
    expect(panel).toMatch(
      /app\.getHostCapabilities\(\)\?\.openLinks\s*\?\s*academyPracticeLink\(card\.sourceLink, rating/,
    );
    expect(panel).toContain("app.openLink({ url: href })");
  });

  it("Mobile offers it with the booked rating", () => {
    const main = file("mobile/src/main.ts");
    expect(main).toContain(
      'academyPracticeLink(sourceLink, result.rating, t("source_open_lesson"))',
    );
    expect(main).toContain('open.rel = "noreferrer"');
  });
});
