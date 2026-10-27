import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cellImportProgressState,
  createCellImportProgress,
} from "../../desktop/src/cell-import-progress.js";
import { setCurrentLocale, tf } from "../../desktop/src/i18n.js";

afterEach(() => {
  vi.unstubAllGlobals();
  setCurrentLocale("en");
});

describe("cell import progress on Desktop and Mobile", () => {
  it("starts indeterminate and advances through both counted passes without claiming success", () => {
    expect(cellImportProgressState(null)).toMatchObject({
      value: null,
      key: "academy_import_preparing",
    });
    const values = [];
    for (const phase of ["installing", "enrolling"] as const) {
      for (let done = 0; done <= 26; done++) {
        const state = cellImportProgressState({ phase, done, total: 26 });
        values.push(state.value);
        expect(state.value).toBeLessThan(1);
        expect(state.key).not.toBe("academy_import_complete");
      }
    }
    expect(values).toEqual([...values].sort((a, b) => a! - b!));
    expect(
      cellImportProgressState({ phase: "enrolling", done: 0, total: 0 }),
    ).toMatchObject({ key: "academy_import_saving", value: 0.99 });
    expect(cellImportProgressState(null, true)).toMatchObject({
      value: 1,
      key: "academy_import_complete",
    });
  });

  it("renders accessible counts and fills the native progress bar only when finished", () => {
    class Element {
      style = {};
      attributes = new Map<string, string>();
      children: Element[] = [];
      textContent = "";
      value = 0;
      max = 1;
      removed = false;
      append(...children: Element[]) {
        this.children.push(...children);
      }
      setAttribute(key: string, value: string) {
        this.attributes.set(key, value);
      }
      removeAttribute(key: string) {
        this.attributes.delete(key);
      }
      remove() {
        this.removed = true;
      }
    }
    vi.stubGlobal("document", { createElement: () => new Element() });
    setCurrentLocale("de");
    const view = createCellImportProgress((key, counts) => tf(key, counts));
    const element = view.element as unknown as Element;
    const [label, bar] = element.children;
    expect(bar.attributes.has("value")).toBe(false);
    expect(label.attributes.get("role")).toBe("status");
    expect(bar.attributes.get("aria-busy")).toBe("true");
    view.update({ phase: "installing", done: 7, total: 26 });
    expect(label.textContent).toBe("7 von 26 Karten vorbereitet …");
    expect(bar.attributes.get("aria-label")).toBe(label.textContent);
    view.update({ phase: "enrolling", done: 26, total: 26 });
    expect(bar.value).toBeLessThan(bar.max);
    expect(label.textContent).toBe("Import wird gespeichert …");
    view.finish();
    expect(bar.value).toBe(bar.max);
    expect(bar.attributes.get("aria-busy")).toBe("false");
    view.remove();
    expect(element.removed).toBe(true);
  });
});
