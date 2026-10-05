import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { rememberDisplay, setShown } from "../../desktop/src/visibility.js";

/** Just enough of an element: the attribute, the inline style, the dataset. */
function fakeElement(display = "") {
  return {
    hidden: false,
    style: { display },
    dataset: {} as Record<string, string>,
  } as unknown as HTMLElement;
}

describe("setShown", () => {
  it("hides an inline-flex section, which the hidden attribute alone cannot", () => {
    const section = fakeElement("flex");
    rememberDisplay(section);
    setShown(section, false);
    expect(section.hidden).toBe(true);
    expect(section.style.display).toBe("none");
    setShown(section, true);
    expect(section.hidden).toBe(false);
    expect(section.style.display).toBe("flex");
  });

  it("gives an element without inline display back to its stylesheet", () => {
    const button = fakeElement();
    rememberDisplay(button);
    setShown(button, false);
    setShown(button, true);
    expect(button.style.display).toBe("");
  });

  it("is used for the import dialogs' flex sections and the waiting banner", () => {
    const read = (name: string) =>
      readFileSync(join(process.cwd(), "desktop", "src", name), "utf8");
    const review = read("material-review.ts");
    expect(review).toContain("setShown(banner, text !== null);");
    expect(review).toContain("setShown(parts.preview, review.files.length > 0);");
    const start = read("material-import-start.ts");
    expect(start).toContain("setShown(dialog.noHarness, !hasHarness);");
    expect(start).not.toMatch(/\.(noHarness|builtIn|pagesRow)\.hidden =/);
  });
});
