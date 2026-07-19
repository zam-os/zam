import { describe, expect, it } from "vitest";
import {
  areAllCurriculumPreviewItemsSelected,
  buildCurriculumCategoryPath,
  CurriculumWizardSession,
  resetCurriculumWizardTransientUi,
  setCurriculumPreviewSelection,
} from "../../desktop/src/curriculum-wizard-session.js";

describe("curriculum category path", () => {
  it("keeps only subject, grade, and topic", () => {
    expect(
      buildCurriculumCategoryPath({
        subject: "Mathematik",
        grade: "9",
        topic: "Kreis",
      }),
    ).toBe("Mathematik/9/Kreis");
  });

  it("keeps a slash in a label from creating another hierarchy level", () => {
    expect(
      buildCurriculumCategoryPath({
        subject: "Mathematik",
        grade: "9",
        topic: "Daten / Zufall",
      }),
    ).toBe("Mathematik/9/Daten ／ Zufall");
  });
});

describe("CurriculumWizardSession cancel guard", () => {
  it("treats completions as stale after invalidate (cancel/reopen)", () => {
    const session = new CurriculumWizardSession();
    const started = session.snapshot();
    session.begin();

    const inFlight = session.snapshot();
    expect(session.isStale(inFlight)).toBe(false);

    session.invalidate();
    expect(session.isStale(inFlight)).toBe(true);
    expect(session.isStale(started)).toBe(true);
  });

  it("begin also invalidates prior in-flight work", () => {
    const session = new CurriculumWizardSession();
    session.begin();
    const firstVisit = session.snapshot();

    session.begin();
    expect(session.isStale(firstVisit)).toBe(true);
  });
});

describe("curriculum wizard transient UI", () => {
  it("restores navigation after a stale successful import closes the wizard", () => {
    const buttons = [
      { disabled: true },
      { disabled: true },
      { disabled: true },
    ];
    const progressClasses = new Set<string>();
    const bodyClasses = new Set(["hidden"]);

    resetCurriculumWizardTransientUi({
      buttons,
      progressContainer: {
        classList: {
          add: (token) => progressClasses.add(token),
          remove: (token) => progressClasses.delete(token),
        },
      },
      stepBody: {
        classList: {
          add: (token) => bodyClasses.add(token),
          remove: (token) => bodyClasses.delete(token),
        },
      },
    });

    expect(buttons.every((button) => !button.disabled)).toBe(true);
    expect(progressClasses.has("hidden")).toBe(true);
    expect(bodyClasses.has("hidden")).toBe(false);
  });

  it("supports selecting and deselecting every preview card", () => {
    const items = [{ selected: false }, { selected: true }];

    setCurriculumPreviewSelection(items, true);
    expect(areAllCurriculumPreviewItemsSelected(items)).toBe(true);

    setCurriculumPreviewSelection(items, false);
    expect(items.every((item) => !item.selected)).toBe(true);
    expect(areAllCurriculumPreviewItemsSelected(items)).toBe(false);
  });
});
