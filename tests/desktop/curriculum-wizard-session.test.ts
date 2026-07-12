import { describe, expect, it } from "vitest";
import { CurriculumWizardSession } from "../../desktop/src/curriculum-wizard-session.js";

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